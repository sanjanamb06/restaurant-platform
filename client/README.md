# Gather client

React and TypeScript frontend for restaurant authentication, employee management,
and menu management.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment example:

   ```bash
   cp .env.example .env
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Set the backend API URL in `.env`:

   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   Vite prints the local URL, normally `http://localhost:5173`.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Pages

- `/dashboard` — home workspace for all roles
- `/menu` — browse and manage the restaurant menu (read-only for Chef and Cashier)
- `/ingredients` — ingredient master list used in recipes
- `/employees` — employee management (Admin only)

## Customer QR ordering

Feature 3 adds a standalone customer ordering experience at `/order/:restaurantId`.
It is intentionally separate from the staff dashboard: no navbar, no dashboard layout,
no protected route, and no auth token. Customers enter their name and table, browse
available menu items, place a new order, or add items to an existing active table
order.

To test locally:

1. Start the backend and client.
2. Use a real `restaurantId` from your local database.
3. Open:

   ```text
   http://localhost:5173/order/<restaurantId>
   ```

The flow stores a guest session in localStorage under `guestSession:<restaurantId>`
so sessions from different restaurants do not mix.

## Backend and CORS

The backend must allow requests from the Vite development origin
(`http://localhost:5173`). Do not work around CORS in the browser. Configure the
server's CORS middleware with the allowed frontend origins before production.
