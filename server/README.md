# Restaurant SaaS Server

Authentication, authorization, employee management, and menu management API for the
multi-tenant restaurant platform.

## Prerequisites

- Node.js 20 or newer
- PostgreSQL (the repository Docker Compose setup can be used)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values. Use long, independent
   random strings (at least 32 characters) for both JWT secrets.

3. Create and apply the initial database migration:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

The API defaults to `http://localhost:5000`. Check it with `GET /health`.

## Other commands

```bash
npm run build
npm start
npm run prisma:generate
npm run prisma:studio
```

Run `npm run build` before `npm start`; production output is written to `dist/`.

## Authentication flow

- Register with `POST /api/auth/register-restaurant`. Save the returned temporary
  employee credentials immediately; plaintext passwords are never stored.
- Log in with the returned restaurant `slug`, username, and password at
  `POST /api/auth/login`.
- Send access tokens as `Authorization: Bearer <token>`.
- Temporary-password users may only access `/api/auth/change-password`,
  `/api/auth/logout`, and `/api/auth/me` until their password is changed.
- Employee management under `/api/employees` requires the `ADMIN` role.

## Menu management (Feature 2)

All endpoints below require authentication. `ADMIN` and `MANAGER` can create, update,
and delete; `CHEF` and `CASHIER` have read-only access.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:id` | Get one category |
| POST | `/api/categories` | Create category |
| PATCH | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Soft-delete category |
| GET | `/api/menu` | List menu items (`?search`, `?categoryId`, `?available`) |
| GET | `/api/menu/:id` | Get one menu item with recipe |
| POST | `/api/menu` | Create menu item |
| PATCH | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Soft-delete menu item |
| GET | `/api/ingredients` | List ingredients |
| GET | `/api/ingredients/:id` | Get one ingredient |
| POST | `/api/ingredients` | Create ingredient |
| PATCH | `/api/ingredients/:id` | Update ingredient |
| DELETE | `/api/ingredients/:id` | Soft-delete ingredient |
| GET | `/api/menu/:id/ingredients` | List recipe ingredients for a menu item |
| POST | `/api/menu/:id/ingredients` | Add ingredient to recipe |
| PATCH | `/api/menu/:id/ingredients/:ingredientId` | Update recipe quantity |
| DELETE | `/api/menu/:id/ingredients/:ingredientId` | Remove ingredient from recipe |

## QR ordering (Feature 3)

The `/api/public` endpoints are intentionally public and do not use the authentication
middleware. Customers ordering from a QR code should not need staff credentials. Every
public request is still scoped by `restaurantId` in the URL and returns `404` if that
restaurant does not exist.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/public/:restaurantId/menu` | Customer menu grouped by category; available, non-deleted items only |
| GET | `/api/public/:restaurantId/tables` | List known table numbers for the restaurant |
| POST | `/api/public/:restaurantId/check-table` | Find/create a table and report any active order |
| POST | `/api/public/:restaurantId/orders` | Place a new pending customer order |
| POST | `/api/public/:restaurantId/orders/:orderId/join` | Add more items to an active order |
| GET | `/api/public/:restaurantId/orders/:orderId` | Read the current customer order state |

Order creation and join requests accept an optional `idempotencyKey` so clients can
safely retry duplicate submissions. They also use a lightweight in-memory rate limit
for single-instance deployments: one new order action per session or table every 10
seconds.

## Order management (Feature 4)

All endpoints require authentication (`Authorization: Bearer <token>`).

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/orders` | List orders (`?status`, `?search`) |
| GET | `/api/orders/:id` | Get a single order with full item detail |
| PATCH | `/api/orders/:id/status` | Transition an order's status |

**Role visibility rules**

| Role | Can see CANCELLED? | Can mutate status? |
| --- | --- | --- |
| ADMIN | ✅ | PENDING→PREPARING, PREPARING→READY, PENDING→CANCELLED |
| MANAGER | ✅ | PENDING→CANCELLED only |
| CHEF | ❌ (filtered out) | PENDING→PREPARING, PREPARING→READY only |
| CASHIER | ✅ | Read-only |

Invalid transitions are rejected with `400`. Role-permission mismatches are rejected with `403`.

## Socket.IO (active since Feature 4)

Socket.IO is active on the **same port as Express** (`http://localhost:5000`). No separate
port is needed.

**Joining a restaurant room (client side)**

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
socket.emit("join", { restaurantId: "<your-restaurant-id>" });
```

**Events emitted by the server**

| Event | Payload | Trigger |
| --- | --- | --- |
| `order:new` | `{ order }` | Customer places a new order via the public API |
| `order:statusUpdated` | `{ orderId, orderNumber, status, updatedAt }` | Staff updates an order's status |

