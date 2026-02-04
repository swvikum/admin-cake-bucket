-- =============================================================================
-- CAKE BUCKET - COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor to create all tables, indexes, and RLS policies
-- =============================================================================

-- ============================================
-- 1. PROFILES TABLE (linked to auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'employee' check (role in ('admin', 'manager', 'employee')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles linked to Supabase Auth';

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles (simple, no recursion)
-- Users can read their own profile
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Allow insert for authenticated users (for auto-creation on signup)
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'employee');
  return new;
end;
$$;

-- Create trigger if not exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================
-- 2. ORDERS TABLE
-- ============================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text,
  customer_email text,
  due_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'pending_confirm', 'confirmed', 'in_progress', 'ready', 'delivered', 'completed', 'cancelled')),
  assigned_user_id uuid references public.profiles(id) on delete set null,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  deposit_paid numeric(10,2) not null default 0,
  balance_due numeric(10,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- For Google Calendar sync (avoid duplicates)
  source_calendar_event_id text
);

comment on table public.orders is 'Customer orders for cakes';
comment on column public.orders.source_calendar_event_id is 'Google Calendar event id; used by calendar sync to avoid duplicate orders';

-- Unique index for calendar event ID (only for non-null values)
create unique index if not exists idx_orders_source_calendar_event_id
  on public.orders (source_calendar_event_id)
  where source_calendar_event_id is not null;

-- Index for common queries
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_due_at on public.orders(due_at);
create index if not exists idx_orders_created_at on public.orders(created_at);

-- Enable RLS
alter table public.orders enable row level security;

-- Policies for orders (authenticated users with profile can access)
create policy "orders_select"
  on public.orders for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "orders_insert"
  on public.orders for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "orders_update"
  on public.orders for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "orders_delete"
  on public.orders for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ============================================
-- 3. ORDER_ITEMS TABLE
-- ============================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_name text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  line_total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.order_items is 'Line items for each order';

-- Index for order lookup
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- Enable RLS
alter table public.order_items enable row level security;

-- Policies for order_items (same as orders)
create policy "order_items_select"
  on public.order_items for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "order_items_insert"
  on public.order_items for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "order_items_update"
  on public.order_items for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "order_items_delete"
  on public.order_items for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );


-- ============================================
-- 4. INVENTORY_ITEMS TABLE
-- ============================================
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'pcs',
  stock_on_hand numeric(10,2) not null default 0,
  reorder_point numeric(10,2) not null default 0,
  cost_per_unit numeric(10,2) not null default 0,
  supplier_name text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.inventory_items is 'Inventory items for cake supplies';

-- Index for active items
create index if not exists idx_inventory_items_active on public.inventory_items(is_active);

-- Enable RLS
alter table public.inventory_items enable row level security;

-- Policies for inventory_items
create policy "inventory_items_select"
  on public.inventory_items for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "inventory_items_insert"
  on public.inventory_items for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "inventory_items_update"
  on public.inventory_items for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "inventory_items_delete"
  on public.inventory_items for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ============================================
-- 5. INVENTORY_MOVEMENTS TABLE
-- ============================================
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase', 'usage', 'adjustment')),
  quantity numeric(10,2) not null,
  reason text,
  ref_order_id uuid references public.orders(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.inventory_movements is 'Inventory movement history (purchases, usage, adjustments)';

-- Index for item lookup
create index if not exists idx_inventory_movements_item_id on public.inventory_movements(item_id);
create index if not exists idx_inventory_movements_created_at on public.inventory_movements(created_at);

-- Enable RLS
alter table public.inventory_movements enable row level security;

-- Policies for inventory_movements
create policy "inventory_movements_select"
  on public.inventory_movements for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );

create policy "inventory_movements_insert"
  on public.inventory_movements for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid())
  );


-- ============================================
-- 6. EXPENSES TABLE
-- ============================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  supplier_name text,
  category text not null,
  description text,
  amount numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  receipt_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.expenses is 'Business expenses tracking';

-- Index for date queries
create index if not exists idx_expenses_date on public.expenses(expense_date);
create index if not exists idx_expenses_category on public.expenses(category);

-- Enable RLS
alter table public.expenses enable row level security;

-- Policies for expenses (admin only for write, others can read based on role)
create policy "expenses_select"
  on public.expenses for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
  );

create policy "expenses_insert"
  on public.expenses for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "expenses_update"
  on public.expenses for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "expenses_delete"
  on public.expenses for delete
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ============================================
-- 7. INVOICES TABLE (for tracking invoice numbers)
-- ============================================
-- Create sequence starting from 200
create sequence if not exists invoice_number_seq start with 200;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number integer not null unique default nextval('invoice_number_seq'),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_name text not null,
  total numeric(10,2) not null default 0,
  balance_due numeric(10,2) not null default 0,
  event_date timestamptz,
  special_notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

comment on table public.invoices is 'Invoice records for tracking invoice numbers (starting from 200)';

-- Create indexes for faster lookups
create index if not exists idx_invoices_order_id on public.invoices(order_id);
create index if not exists idx_invoices_invoice_number on public.invoices(invoice_number);
create index if not exists idx_invoices_created_at on public.invoices(created_at desc);

-- Enable RLS
alter table public.invoices enable row level security;

-- RLS Policies for invoices (authenticated users can manage)
create policy "invoices_select_authenticated"
  on public.invoices for select
  to authenticated
  using (true);

create policy "invoices_insert_authenticated"
  on public.invoices for insert
  to authenticated
  with check (true);

create policy "invoices_update_authenticated"
  on public.invoices for update
  to authenticated
  using (true);

create policy "invoices_delete_authenticated"
  on public.invoices for delete
  to authenticated
  using (true);

-- Grant permissions
grant all on public.invoices to authenticated;
grant usage, select on sequence invoice_number_seq to authenticated;


-- ============================================
-- 8. GOOGLE_CALENDAR_TOKENS TABLE
-- ============================================
create table if not exists public.google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.google_calendar_tokens is 'OAuth tokens for Google Calendar API; used by sync job via service_role';

-- Enable RLS - no public access (service_role only)
alter table public.google_calendar_tokens enable row level security;

create policy "no_public_access"
  on public.google_calendar_tokens
  for all
  using (false)
  with check (false);


-- ============================================
-- DONE! Database setup complete.
-- ============================================
-- Next steps:
-- 1. Create an admin user in Supabase Auth (Authentication > Users > Add user)
-- 2. Insert admin profile manually:
--    INSERT INTO public.profiles (id, full_name, role)
--    VALUES ('YOUR-USER-UUID-HERE', 'Admin Name', 'admin');
-- 3. Update your .env.local with new Supabase credentials
-- 4. Connect Google Calendar via /api/auth/google
-- ============================================
