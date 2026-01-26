# Google Calendar → Orders sync (OAuth)

This sync imports order-like events from Google Calendar into **orders** and **order_items**. It uses **OAuth (Client ID + Secret)** — there is no API key.

## 1. One-time: Connect Google Calendar

Tokens are stored in Supabase and used by the sync job.

### 1.1 Run migrations in Supabase

In Supabase **SQL Editor**, run (once each):

- `supabase-migration-orders-calendar-source.sql` — adds `source_calendar_event_id` to `orders`
- `supabase-migration-google-calendar-tokens.sql` — adds `google_calendar_tokens` for OAuth tokens

### 1.2 Google Cloud setup

1. [Google Cloud Console](https://console.cloud.google.com/) → your project.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **APIs & Services → Credentials** → **Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` (and your production URL, e.g. `https://your-app.amplifyapp.com/api/auth/google/callback`)
4. Copy **Client ID** and **Client secret**.

### 1.3 Env vars

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CALENDAR_ID` | Yes | `primary` (primary calendar of the account you’ll connect) or a specific calendar ID (e.g. `cakebucketsl@gmail.com`). |
| `GOOGLE_CLIENT_ID` | Yes | OAuth Client ID (`xxx.apps.googleusercontent.com`). |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth Client secret. |
| `GOOGLE_REDIRECT_URI` | Yes | Must match redirect URI in Google (e.g. `http://localhost:3000/api/auth/google/callback` or your production callback URL). |
| `CALENDAR_SYNC_CRON_SECRET` | Yes | Secret the cron job sends (Bearer token or `x-cron-secret`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service_role key (Project → Settings → API). |

### 1.4 Authorize and store tokens

1. Start the app (`npm run dev`).
2. In the browser, open:  
   **`http://localhost:3000/api/auth/google`**
3. Sign in with the Google account that owns the calendar you use for orders.
4. Approve the “See your calendar” scope.
5. You’ll be redirected to `/dashboard?calendar_auth=ok`. Tokens are saved in `google_calendar_tokens`.

Do this once per environment (local and production). For production, use your production app URL and add the same redirect URI in Google, then visit `https://your-app-url/api/auth/google`.

---

## 2. Running the sync

### Manual (for testing)

```bash
curl -X POST "http://localhost:3000/api/sync/calendar" \
  -H "Authorization: Bearer YOUR_CALENDAR_SYNC_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"daysBack": 30, "daysAhead": 365}'
```

- **daysBack** / **daysAhead**: event range (defaults 30 and 365).
- If you see `"No Google Calendar tokens"`, run the connect step above first.

### Daily cron

Call the same `POST /api/sync/calendar` from your scheduler (cron-job.org, GitHub Actions, etc.) with:

- **URL**: `https://your-admin-app-url/api/sync/calendar`
- **Headers**: `Authorization: Bearer YOUR_CALENDAR_SYNC_CRON_SECRET`, `Content-Type: application/json`
- **Body** (optional): `{"daysBack":30,"daysAhead":365}`

Use the same env vars (including `GOOGLE_*` and `SUPABASE_SERVICE_ROLE_KEY`) in the environment where the app runs (e.g. Amplify).

---

## 3. Event format

One calendar event → one order (+ order_items).

### Title (summary)

`Customer Name - Cake Type - YYYY-MM-DD`  
Example: `Rylee Johnson - Birthday Cake - 2026-01-31`

### Description (line-based)

Lines like `Label: value`. Recognised labels (case-insensitive):

| Label | Maps to |
|-------|--------|
| Customer Name | `orders.customer_name` |
| Phone Number / Phone | `orders.customer_phone` |
| Email / Customer Email | `orders.customer_email` |
| Event Date | `orders.due_at` |
| Request Summary | First order item name/notes |
| Cake Type | First order item name |
| Delivery Required / Delivery Address / Special Notes / Notes | Appended to `orders.notes` |

All synced orders are created with status **confirmed**. Money fields default to `0`.

---

## 4. Behaviour

- Events already linked (same `source_calendar_event_id`) are **skipped**.
- Events without at least **customer name** and **due date** are skipped.
- Tokens are stored in Supabase and refreshed when expired; the sync uses them in API routes only.
