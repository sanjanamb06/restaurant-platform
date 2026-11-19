# Setup Guide

Follow these steps in order. Do not skip ahead.

---

## Prerequisites

| Tool | Minimum Version | Verify |
|---|---|---|
| Node.js | v20 LTS | `node -v` |
| Python | 3.10 | `python --version` |
| Docker Desktop | Latest | `docker -v` |

Open Docker Desktop and let it fully start before continuing.

---

## Step 1 — Start the Database

From the project root (the folder containing `docker-compose.yaml`):

```bash
docker compose up -d
```

Verify it is running:

```bash
docker ps
```

You should see a container named `restaurant_saas_db` with status `Up`. Keep Docker Desktop open whenever working on this project.

---

## Step 2 — Backend Server

Open a terminal in the `server/` directory.

### First time only

```bash
cp .env.example .env
```

Open `server/.env` and fill in the values:

```env
DATABASE_URL="postgresql://restaurant_admin:changeme_dev_password@localhost:55432/restaurant_saas?schema=public"
PORT=5000
JWT_ACCESS_SECRET=any_long_random_string_at_least_32_chars
JWT_REFRESH_SECRET=a_different_long_random_string_at_least_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
AI_SERVICE_URL=http://localhost:8000
```

```bash
npm install
npx prisma migrate deploy
```

### Start

```bash
npm run dev
```

The server runs on `http://localhost:5000`.

To browse the database visually:

```bash
npx prisma studio
```

Opens at `http://localhost:5555`.

---

## Step 3 — Frontend

Open a new terminal in the `client/` directory.

### First time only

```bash
cp .env.example .env
npm install
```

The `.env` file should contain:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Start

```bash
npm run dev
```

The app runs on `http://localhost:5173`.

---

## Step 4 — AI Microservice

Open a new terminal in the `ai-services/` directory.

### First time only

```bash
# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
.\.venv\Scripts\Activate.ps1 
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Start

```bash
python main.py
```

The AI service runs on `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

On startup the service automatically discovers all restaurants and trains forecasting models for any menu items with sufficient order history.

---

## Step 5 — First Time Using the App

1. Open `http://localhost:5173`
2. Click Register and create a restaurant account
3. Save the temporary staff passwords shown on the confirmation screen — they are shown only once
4. Log in with your Admin account
5. Go to Menu and add at least one Category and one Menu Item
6. Go to Menu > Ingredients, add ingredients, and map them to menu items to enable inventory tracking
7. To simulate a customer placing an order, use the QR order URL displayed on your dashboard

---

## Stopping Everything

```bash
# Stop frontend:        Ctrl+C in the client terminal
# Stop backend:         Ctrl+C in the server terminal
# Stop AI service:      Ctrl+C in the ai-service terminal

# Stop the database (optional):
docker compose down
```

Leaving the database container running between sessions is fine. If you restart your computer, open Docker Desktop first and run `docker compose up -d` again before starting the servers.

---

## Seeding Demo Data for AI Training

If you do not have enough real order history to train the AI model (minimum 3 days per menu item), use the data simulator:

```bash
cd ai-service
.\venv\Scripts\activate

# Preview without writing to the database
python seed_data.py --dry-run

# Seed 60 days of realistic historical orders
python seed_data.py --days 60
```

After seeding, restart the AI service and then click Retrain AI in Analytics > AI Forecast.

---

## Service Reference

| Service | URL | Purpose |
|---|---|---|
| Frontend | http://localhost:5173 | Main application UI |
| Backend API | http://localhost:5000/api | REST API and Socket.IO |
| AI Microservice | http://localhost:8000 | Demand forecasting (FastAPI) |
| Prisma Studio | http://localhost:5555 | Database browser |
| PostgreSQL | localhost:55432 | Primary database |

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| Cannot connect to database | Docker is not running | Open Docker Desktop, then run `docker compose up -d` |
| Port 5432 already in use | Local PostgreSQL installed | Change `5432:5432` to `5433:5432` in `docker-compose.yaml` and update `DATABASE_URL` to use port `5433` |
| Port 5000 already in use | Another process on that port | Set `PORT=5001` in `server/.env` and `VITE_API_BASE_URL=http://localhost:5001/api` in `client/.env` |
| Cannot find module 'axios' | Missing server dependency | Run `npm install axios` in the `server/` directory |
| AI Forecast shows service unavailable | AI service is not running | Run `python main.py` in the `ai-service/` directory |
| AI Forecast shows no forecast available | Insufficient order history | Run `python seed_data.py --days 60`, restart the AI service, then click Retrain AI |
| prisma migrate deploy fails | Database not running | Ensure Docker is running and `docker compose up -d` succeeded before this step |
| Module not found errors | npm install was skipped | Run `npm install` in the folder that produced the error |
