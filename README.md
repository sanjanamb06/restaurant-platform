# AI-Powered Restaurant Management System

A full-stack restaurant management system with QR-based ordering, real-time order tracking, sales analytics, and AI-powered demand forecasting.

## Features

- Role-based access for Admin, Manager, Chef, and Cashier
- QR-based customer ordering
- Real-time order updates using Socket.IO
- Menu and billing management
- Sales analytics dashboard
- AI demand forecasting using FastAPI and XGBoost

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** Node.js, Express.js, REST APIs, Socket.IO
- **Database:** PostgreSQL, Prisma ORM
- **AI Service:** Python, FastAPI, XGBoost
- **Tools:** Docker, Git, npm

## Project Structure

```text
├── client/        # React frontend
├── server/        # Express backend
├── ai-services/   # AI forecasting service
└── docker-compose.yaml
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- Docker Desktop

### 1. Clone the repository

```bash
git clone https://github.com/sanjanamb06/restaurant-platform.git
cd https://github.com/sanjanamb06/restaurant-platform.git
```

### 2. Configure environment variables

Create `.env` files for the root, `server/`, `client/`, and `ai-services/` using the provided example files where available.

For the server, configure:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Use your local PostgreSQL credentials and generate secure JWT secrets of at least 32 characters. Do not commit `.env` files.

### 3. Start the database

From the project root:

```bash
docker compose up -d
```

### 4. Start the backend

```bash
cd server
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

Backend: `http://localhost:5000`

### 5. Start the frontend

In a new terminal:

```bash
cd client
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### 6. Start the AI service

In a new terminal:

```bash
cd ai-services
python -m venv venv
```

Activate the virtual environment:

**Windows**
```powershell
venv\Scripts\Activate.ps1
```

** macOS / Linux**
```bash
source venv/bin/activate
```

Then install dependencies and run:

```bash
pip install -r requirements.txt
python main.py
```

AI service: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

## Using the Application

1. Open `http://localhost:5173/register` and create a restaurant account.
2. Add menu categories and menu items.
3. Log in and access the staff dashboard.
4. Share the restaurant QR code or customer ordering link to place orders.

## AI Demand Forecasting

The forecasting service uses historical order data to train an XGBoost model. To generate sample historical data, run:

```bash
cd ai-services
python seed_data.py --days 60
```

This creates simulated data for development and testing; it is not real sales data. The AI service trains when it starts. You can also retrain from **Analytics → AI Forecast**.

## Contributors

Team capstone project. The AI forecasting service using FastAPI and XGBoost was contributed by teammates.
