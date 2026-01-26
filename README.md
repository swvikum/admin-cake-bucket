# Cake Bucket Admin

Employee dashboard for **orders**, **sales**, **inventory**, and **expenses**. Built with Next.js (App Router), TypeScript, Tailwind, and Supabase.

## Setup

### 1. Dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon/public key (JWT)

For **Amplify** (prod), add the same variables in the Amplify app environment.

### 3. Supabase

- **Auth**: Email/password enabled; turn off public signups (invite-only).
- **Tables** (in `public`): `profiles`, `orders`, `order_items`, `inventory_items`, `inventory_movements`, `expenses`.
- **RLS**: Recommended policies:
  - **Admin**: full access to all tables.
  - **Manager**: read/write orders and inventory; reports; expenses read-only or as you define.
  - **Employee**: only orders assigned to them (filter by `assigned_user_id`); inventory read/update as needed.
  - **Expenses**: restrict write/read to `admin` (e.g. via `profiles.role`).

### 4. Seed data

- Create an admin user in Supabase Auth, then insert a row in `profiles` with the same `id`, `role = 'admin'`, and `full_name`.
- Add sample inventory rows to `inventory_items` and sample orders to `orders` / `order_items` if you want to test the UI.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`.

## Features

| Area        | Description |
|------------|-------------|
| **Login**  | Email/password via Supabase Auth; role from `profiles`. |
| **Dashboard** | Week/month sales, confirmed count, upcoming orders, low-stock count, recent orders. |
| **Orders** | List, create, edit, view; status workflow (draft → confirmed → in_progress → ready → delivered → completed). |
| **Inventory** | CRUD items; record movements (purchase / usage / adjustment); reorder-point and low-stock highlighting. |
| **Expenses** | Admin-only CRUD; category, supplier, amount, tax. |
| **Reports** | Admin/manager: month sales, expenses, profit, order count and month-over-month change. |

## Roles

- **admin**: All pages (dashboard, orders, inventory, expenses, reports).
- **manager**: Dashboard, orders, inventory, reports (no expenses).
- **employee**: Dashboard, orders, inventory (and only orders assigned to them when RLS is applied).

## Branding

Logo and visuals are aligned with the main Cake Bucket customer site. Logo lives under `public/logo/` (e.g. `logo.png` from the cake-bucket project).

## Google Calendar sync (OAuth)

Orders can be imported from Google Calendar by a **daily sync job** using **OAuth** (Client ID + Secret; no API key). Full steps: **[docs/CALENDAR_SYNC.md](docs/CALENDAR_SYNC.md)**.

- **Google**: OAuth Client ID + Secret, Calendar API enabled, redirect URI `…/api/auth/google/callback`.
- **One-time**: Open `/api/auth/google` in the browser, sign in with the account that owns the orders calendar; tokens are stored in Supabase.
- **Supabase**: Run `supabase-migration-orders-calendar-source.sql` and `supabase-migration-google-calendar-tokens.sql` once; set `SUPABASE_SERVICE_ROLE_KEY`.
- **Cron**: Call `POST /api/sync/calendar` with `Authorization: Bearer YOUR_CALENDAR_SYNC_CRON_SECRET`.

## Deploy (AWS Amplify)

1. Connect the GitHub repo to an Amplify app.
2. Set build settings to use Node LTS and `npm run build` / `npm start` (or Amplify’s default Next.js support).
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Amplify environment variables.
