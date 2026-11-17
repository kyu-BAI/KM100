-- ========================================================
-- PETC Inventory & Document Viewing System
-- Supabase PostgreSQL Schema Setup
-- ========================================================

-- 1. Create the inventory_items table
create table if not exists public.inventory_items (
    id text primary key,
    file_name text not null,
    title text,
    category text not null,
    category_id text,
    sub_category text,
    sub_category_id text,
    entity text,
    year text,
    month text,
    amount numeric default 0,
    currency text default 'PHP',
    quantity numeric default 1,
    unit text,
    status text default 'Active',
    file_format text default 'PDF',
    file_size text default '0 KB',
    file_path text,
    notes text,
    tags text[] default '{}',
    preview_data jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Create indexes for quick filtering
create index if not exists idx_inventory_category on public.inventory_items(category_id);
create index if not exists idx_inventory_year_month on public.inventory_items(year, month);
create index if not exists idx_inventory_entity on public.inventory_items(entity);

-- 3. Enable Row Level Security (RLS) and allow public read/write
alter table public.inventory_items enable row level security;

-- Policy to allow full access (read, insert, update, delete)
drop policy if exists "Allow public access to inventory_items" on public.inventory_items;
create policy "Allow public access to inventory_items"
    on public.inventory_items
    for all
    using (true)
    with check (true);

-- ========================================================
-- Optional: Storage Bucket Setup for Document Files / Receipts
-- (You can also create this in Supabase Dashboard -> Storage)
-- ========================================================
insert into storage.buckets (id, name, public)
values ('inventory-files', 'inventory-files', true)
on conflict (id) do nothing;

drop policy if exists "Allow public storage upload" on storage.objects;
create policy "Allow public storage upload"
    on storage.objects
    for all
    using (bucket_id = 'inventory-files')
    with check (bucket_id = 'inventory-files');
