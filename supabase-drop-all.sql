-- =============================================================================
-- CAKE BUCKET - DROP ALL TABLES (DESTRUCTIVE!)
-- Run this in Supabase SQL Editor to completely remove all tables
-- WARNING: This will delete ALL data permanently!
-- =============================================================================

-- Drop trigger first
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop tables in correct order (respecting foreign key constraints)
-- Children tables first, then parent tables

-- 1. Drop google_calendar_tokens (no dependencies)
drop policy if exists "no_public_access" on public.google_calendar_tokens;
drop table if exists public.google_calendar_tokens cascade;

-- 2. Drop expenses (depends on profiles)
drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_delete" on public.expenses;
drop table if exists public.expenses cascade;

-- 3. Drop inventory_movements (depends on inventory_items, orders, profiles)
drop policy if exists "inventory_movements_select" on public.inventory_movements;
drop policy if exists "inventory_movements_insert" on public.inventory_movements;
drop table if exists public.inventory_movements cascade;

-- 4. Drop inventory_items (no dependencies)
drop policy if exists "inventory_items_select" on public.inventory_items;
drop policy if exists "inventory_items_insert" on public.inventory_items;
drop policy if exists "inventory_items_update" on public.inventory_items;
drop policy if exists "inventory_items_delete" on public.inventory_items;
drop table if exists public.inventory_items cascade;

-- 5. Drop order_items (depends on orders)
drop policy if exists "order_items_select" on public.order_items;
drop policy if exists "order_items_insert" on public.order_items;
drop policy if exists "order_items_update" on public.order_items;
drop policy if exists "order_items_delete" on public.order_items;
drop table if exists public.order_items cascade;

-- 6. Drop orders (depends on profiles)
drop policy if exists "orders_select" on public.orders;
drop policy if exists "orders_insert" on public.orders;
drop policy if exists "orders_update" on public.orders;
drop policy if exists "orders_delete" on public.orders;
drop table if exists public.orders cascade;

-- 7. Drop profiles (depends on auth.users - drop last)
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop table if exists public.profiles cascade;

-- =============================================================================
-- All tables dropped. 
-- Note: Users in auth.users are NOT deleted (managed by Supabase Auth).
-- You can delete them manually in Supabase Dashboard > Authentication > Users
-- =============================================================================
