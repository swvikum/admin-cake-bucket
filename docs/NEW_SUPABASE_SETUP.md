# Complete Guide: Setting Up New Supabase Database

This guide walks you through creating a fresh Supabase project and connecting it to your Cake Bucket Admin app.

---

## Step 1: Create New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `cake-bucket` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)` for Australia)
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to initialize

---

## Step 2: Get Your New Credentials

Once the project is ready:

1. Go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 3: Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase-create-all.sql` and paste it
4. Click **"Run"** (or press Ctrl/Cmd + Enter)
5. You should see "Success. No rows returned" - this is normal for CREATE statements

### Verify Tables Created

Go to **Table Editor** (left sidebar) - you should see:
- `profiles`
- `orders`
- `order_items`
- `inventory_items`
- `inventory_movements`
- `expenses`
- `google_calendar_tokens`

---

## Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Go to **Authentication** → **Settings**
4. Under "User Signups":
   - For production: **Disable** "Enable email confirmations" if you want instant login
   - Or keep enabled for email verification
5. (Optional) Disable "Enable new user signups" if you want invite-only access

---

## Step 5: Create Admin User

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - Email: Your admin email
   - Password: Strong password
4. Click **"Create user"**
5. Copy the **User UID** (you'll need it next)

### Set Admin Role in Profiles

1. Go to **SQL Editor**
2. Run this query (replace the UUID with your actual user ID):

```sql
INSERT INTO public.profiles (id, full_name, role, is_active)
VALUES (
  'YOUR-USER-UUID-HERE',  -- Replace with actual UUID from step 5
  'Your Admin Name',
  'admin',
  true
);
```

---

## Step 6: Update Local Environment

Update your `.env.local` file with the new credentials:

```env
# Supabase (NEW PROJECT)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-NEW-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-new-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-new-service-role-key...

# Calendar sync (keep existing Google OAuth credentials)
GOOGLE_CALENDAR_ID=primary
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
CALENDAR_SYNC_CRON_SECRET=your-calendar-sync-secret
```

---

## Step 7: Test Locally

```bash
npm run dev
```

1. Open http://localhost:3000
2. Log in with your admin credentials
3. Check:
   - Dashboard loads without errors
   - You can create/view orders
   - Inventory page works
   - Expenses page works (admin only)

---

## Step 8: Connect Google Calendar (OAuth)

This stores OAuth tokens in your new Supabase database.

1. Make sure your app is running locally (`npm run dev`)
2. Open in browser: **http://localhost:3000/api/auth/google**
3. Sign in with the Google account that owns your calendar
4. Approve the "See your calendar" permission
5. You'll be redirected to `/dashboard?calendar_auth=ok`

### Verify Token Saved

In Supabase **Table Editor** → `google_calendar_tokens`:
- You should see 1 row with `refresh_token` populated

---

## Step 9: Update AWS Amplify

### 9.1 Update Environment Variables

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app → **Hosting** → **Environment variables**
3. Update/Add these variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your NEW Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your NEW anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your NEW service_role key |
| `GOOGLE_CALENDAR_ID` | `primary` (or specific calendar ID) |
| `GOOGLE_CLIENT_ID` | Keep existing |
| `GOOGLE_CLIENT_SECRET` | Keep existing |
| `GOOGLE_REDIRECT_URI` | `https://YOUR-AMPLIFY-URL.amplifyapp.com/api/auth/google/callback` |
| `CALENDAR_SYNC_CRON_SECRET` | Keep existing (or generate new) |

### 9.2 Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", ensure you have:
   - `http://localhost:3000/api/auth/google/callback` (local)
   - `https://YOUR-AMPLIFY-URL.amplifyapp.com/api/auth/google/callback` (production)

### 9.3 Trigger Redeploy

1. In Amplify Console, go to your app
2. Click **"Redeploy this version"** or push a commit to trigger build
3. Wait for deployment to complete

### 9.4 Connect Google Calendar in Production

After deployment:
1. Visit: `https://YOUR-AMPLIFY-URL.amplifyapp.com/api/auth/google`
2. Complete OAuth flow
3. Tokens will be saved to your NEW Supabase database

---

## Step 10: Update GitHub Actions

Update the secrets for calendar sync cron job:

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Update these repository secrets:

| Secret | Value |
|--------|-------|
| `CALENDAR_SYNC_CRON_SECRET` | Same as your app's `CALENDAR_SYNC_CRON_SECRET` |
| `SYNC_APP_URL` | Your Amplify app URL (e.g., `https://main.d1234567890.amplifyapp.com`) |

### Test GitHub Action

1. Go to **Actions** tab in your repo
2. Select **"Calendar sync"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
4. Check the run completes successfully

---

## Summary Checklist

- [ ] Created new Supabase project
- [ ] Ran `supabase-create-all.sql` to create tables
- [ ] Created admin user in Supabase Auth
- [ ] Inserted admin profile with `role = 'admin'`
- [ ] Updated `.env.local` with new credentials
- [ ] Tested app locally
- [ ] Connected Google Calendar locally (tokens saved)
- [ ] Updated Amplify environment variables
- [ ] Updated Google OAuth redirect URIs
- [ ] Redeployed Amplify app
- [ ] Connected Google Calendar in production
- [ ] Updated GitHub Actions secrets
- [ ] Tested GitHub Actions calendar sync

---

## Troubleshooting

### "Invalid API key" or "JWT expired"
- Double-check your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Make sure you copied the full key (they're very long)

### "new row violates row-level security policy"
- Make sure you have a profile for your user
- Check the user's `role` is appropriate for the action

### Calendar sync fails with "No Google Calendar tokens"
- You need to complete the OAuth flow: visit `/api/auth/google`
- Check `google_calendar_tokens` table has a row

### Profile not created automatically
- The trigger should create profiles on signup
- If missing, manually insert via SQL Editor

---

## If You Need to Start Over

Run `supabase-drop-all.sql` in SQL Editor to remove all tables, then run `supabase-create-all.sql` again.

**Warning**: This deletes ALL data permanently!
