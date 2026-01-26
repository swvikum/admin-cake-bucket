-- Run this in Supabase SQL Editor if "New inventory" save does nothing and you see no error.
-- It enables RLS and adds policies so authenticated users with a profile can manage inventory_items.

-- Enable RLS on inventory_items (if not already)
alter table public.inventory_items enable row level security;

-- Drop existing policies if you are re-running (optional)
-- drop policy if exists "inventory_items_select" on public.inventory_items;
-- drop policy if exists "inventory_items_insert" on public.inventory_items;
-- drop policy if exists "inventory_items_update" on public.inventory_items;
-- drop policy if exists "inventory_items_delete" on public.inventory_items;

-- Allow read for authenticated users who have a profile
create policy "inventory_items_select"
  on public.inventory_items for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

-- Allow insert for authenticated users who have a profile (admin/manager/employee)
create policy "inventory_items_insert"
  on public.inventory_items for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

-- Allow update for authenticated users who have a profile
create policy "inventory_items_update"
  on public.inventory_items for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

-- Optional: restrict delete to admin only
create policy "inventory_items_delete"
  on public.inventory_items for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
