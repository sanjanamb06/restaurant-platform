# Restaurant Operations Intelligence Platform — Documentation

## Application Overview

This is a full-stack, AI-powered restaurant management system. It covers the complete lifecycle of a restaurant order — from a customer scanning a QR code at the table through to kitchen preparation, billing, inventory deduction, and post-sale analytics.

The system is built as three independent services: a React frontend, a Node.js backend, and a Python AI microservice. The Node.js backend handles all transactional operations and communicates with the AI service through a lightweight HTTP proxy. All three services share the same PostgreSQL database.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Material UI, Recharts, Socket.IO Client, Axios |
| Backend | Node.js, Express, Prisma ORM, PostgreSQL, JWT, bcrypt, Socket.IO |
| AI Microservice | Python, FastAPI, XGBoost, Scikit-Learn, Pandas, SQLAlchemy, Uvicorn |
| Infrastructure | Docker (PostgreSQL), Prisma Migrations |

---

## User Roles

| Role | Access Level |
|---|---|
| Admin | Full access — all features including employee management |
| Manager | Menu, inventory, analytics, AI forecast, orders |
| Cashier | Billing dashboard, order status visibility |
| Kitchen Staff | Kitchen dashboard — order queue and status updates |

---

## Feature Documentation

### Authentication and Authorization

Every user belongs to a restaurant and has a role. Access to each route is enforced at the API level using JWT middleware and a role-authorization guard.

- JWT access tokens expire in 15 minutes and are refreshed transparently using a 7-day refresh token.
- Passwords are hashed using bcrypt before storage.
- New staff accounts created by an Admin have a temporary password and are forced to change it on first login.

---

### Menu Management

Admins and Managers can create and manage the restaurant's menu through a category and item hierarchy.

- Items can be toggled available or unavailable without being deleted.
- Each menu item can have an ingredient recipe defined — a list of ingredients and the quantity of each consumed per serving. This recipe is used during billing to automatically deduct stock from inventory.

---

### QR Ordering

Each table in the restaurant has a unique QR code. When a customer scans it they are taken to a guest ordering page in their browser with no login required.

- The customer creates a session, browses the live menu, and places an order.
- The order appears immediately on the Kitchen Dashboard and the Order Management screen via Socket.IO real-time events.
- Only items marked as available are shown to the customer.

---

### Order Management

Managers and Kitchen Staff can view and update the status of all incoming orders.

- Orders flow through three statuses: Pending, Preparing, Ready, Cancelled.
- Status changes are pushed to all connected clients via Socket.IO, so the Kitchen and Cashier screens update without a page refresh.

---

### Billing and Payments

The Cashier Dashboard shows all orders with a Ready status that have not yet been billed.

- GST is applied at 5% (flat rate for standalone restaurants — Input Tax Credit not applicable).
- The cashier selects a payment method (Cash, Card, UPI) and confirms the bill.
- A printable invoice is generated with a unique receipt number, itemised breakdown, subtotal, GST amount, and grand total.
- The entire payment process is protected against duplicate submissions using an idempotency key. Paying the same order twice is safely rejected.

---

### Inventory Management

Inventory tracking is integrated into the billing flow. When a payment is confirmed, the system automatically deducts the consumed ingredients from stock. This deduction happens inside the same database transaction as the payment record, so a failed payment never causes incorrect stock changes.

The Inventory Dashboard (Manager and Admin only) has three tabs:

**Stock Overview**
A searchable table of all ingredients showing current stock level, minimum threshold, a visual progress bar, and a status chip (Healthy, Low Stock, or Out of Stock). Each row has an Adjust button to manually top up or deduct stock.

**Alerts**
Shows only ingredients currently below their low-stock threshold. Cards are colour-coded: red for out-of-stock, orange for low-stock. Each card shows the current quantity, the minimum threshold, and a direct Restock button.

**History**
A paginated audit log of every stock movement. Each row records the date, ingredient, change amount (negative for deductions, positive for top-ups), the reason (Order Deduction or Manual Adjustment), and a reference to the originating order where applicable.

**Real-time alerts**

When any payment causes an ingredient to fall below its threshold, the server emits an `inventory:lowStock` Socket.IO event to all connected manager and admin sessions. The Inventory Dashboard receives this event and shows a toast notification without requiring a page refresh.

---

### Analytics Dashboard

The Analytics Dashboard (Manager and Admin only) provides business performance data over a selectable timeframe of 7, 30, or 90 days.

**KPI Cards**

- Total Revenue: sum of all paid invoices in the period
- Total Orders: count of all non-cancelled orders in the period
- Average Order Value: Total Revenue divided by Total Orders

**Charts**

| Chart | Type | What it shows |
|---|---|---|
| Revenue Trend | Area chart | Daily revenue over the selected period. Missing days are filled with zero so the chart is continuous. |
| Order Volume | Bar chart | Daily order count over the selected period. |
| Top Menu Items | Pie chart | The five highest-selling menu items by total quantity ordered. |
| Ingredient Usage | Horizontal bar chart | The ten most consumed ingredients by total units deducted, sourced from the stock deduction history. |

---

### AI Demand Forecast

The AI Forecast tab is accessible within the Analytics Dashboard. It uses a machine learning model to predict how many units of each menu item will be ordered on each day of the selected forecast horizon.

The forecast is produced by a standalone FastAPI microservice that runs separately from the Node.js backend. The Node.js server proxies requests to it. If the AI service is offline the rest of the application continues to work normally and the Forecast tab shows a clear error with instructions to start the service.

#### Model

Algorithm: XGBoost (gradient boosted decision trees), regression objective.

A separate model is trained for each menu item in each restaurant. The model learns from historical daily order totals and uses the following features:

| Feature | What it represents |
|---|---|
| day_of_week | Day of the week (0 = Monday, 6 = Sunday) |
| day_of_month | Day of the month (1 to 31) |
| month | Month of the year (1 to 12) |
| is_weekend | Binary flag: 1 if Saturday or Sunday |
| lag_1 | Units sold the previous day |
| lag_7 | Units sold seven days ago (same day last week) |
| rolling_7d_avg | Average daily units sold over the preceding 7 days |
| rolling_14d_avg | Average daily units sold over the preceding 14 days |

Minimum training data required: 3 days of order history per menu item. Items below this threshold are skipped.

#### Understanding the Dashboard Metrics

**Total Forecast (Plates to Prepare)**

This is the total number of plates the AI expects customers to order over the selected time period.

Example: If you select a 7-day forecast for Butter Chicken, and the AI expects 10 orders each day, the Total Forecast is 70.

How to use it: Use this number to plan your ingredient purchasing before the week begins. If the forecast says 70, you know you need enough chicken and gravy to make 70 portions.

**Confidence (How Sure is the AI)**

Confidence simply tells you how much you can trust the prediction. The AI looks at your past sales to see if a dish sells steadily or unpredictably.

| Percentage | What it means | Example |
|---|---|---|
| **85% to 99% (Very Reliable)** | This dish sells very steadily day to day. You can trust this prediction strongly. | Your most popular burger that always gets 20-25 orders every day. |
| **65% to 84% (Fairly Reliable)** | Sales jump around a bit, perhaps higher on weekends. The prediction is a good estimate. | A family meal deal that gets busy only on weekends. |
| **50% to 64% (Use as a rough guide)** | Sales for this dish are unpredictable. Do not rely entirely on this number, keep a small safety buffer of stock. | A seasonal special or a new menu item with random sales. |

*Note: Confidence never drops below 50% because the AI always factors in basic trends like weekends vs weekdays. It never goes above 99% because the real world always has unpredictable events like rain or holidays.*

**Busiest Predicted Day (Stock Up Before)**

This shows the single upcoming day where the AI expects the biggest rush for this specific item. Use this date to schedule kitchen prep (e.g. marinating meat the night before) and to ensure suppliers deliver fresh ingredients in time.

#### Retraining

The Retrain AI button in the Forecast tab triggers a fresh training run using all available order data up to the current date. Run this after processing a significant number of new orders to keep predictions up to date.

---

### Employee Management

Available to Admins only. Provides the ability to create, view, and manage staff accounts, assign roles, reset passwords, and activate or deactivate accounts.

---

## Data Simulation

For development and demonstration purposes, a data simulator is provided in the `ai-service/` directory. See `SETUP.md` for instructions on running it.

The simulator generates realistic historical order patterns including:

- Weekend traffic increases of approximately 55% above the weekday baseline
- Friday evening demand peaks of approximately 35% above the weekday baseline
- Order times clustered around lunch (12:00 to 14:00) and dinner (18:00 to 21:00)
- Per-item popularity weights so some items naturally sell more than others
- Gaussian noise on quantities to reflect real-world variation
- Matching payment records so the Analytics revenue charts are also populated
- Full idempotency — safe to run multiple times without creating duplicate records

---

## Architecture Notes

- All real-time features (kitchen order updates, inventory low-stock alerts) use Socket.IO rooms scoped to the restaurant ID. Each connected client joins its restaurant room on login.
- Inventory deductions are executed inside the same Prisma database transaction as the payment record. Atomicity is guaranteed — no partial states are possible.
- The AI microservice is completely independent. It connects directly to the same PostgreSQL database using SQLAlchemy with read-only operations for training. It writes only to the local `models/` directory on disk.
- The Node.js backend uses Node's native `fetch` API (available from Node 18) to communicate with the AI service. No additional HTTP client library is required on the backend.
