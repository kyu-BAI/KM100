-- ========================================================
-- PETC Inventory & Viewing System
-- Dedicated Database Tables for Scanned Receipt Storage
-- With Full OCR Metadata (Establishment, Date, Description, Amount)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vgiqeackhpxhmyozlcux/sql/new
-- ========================================================

-- 1. PETC Sales Receipts
CREATE TABLE IF NOT EXISTS public.petc_sales_receipts (
    id text PRIMARY KEY,
    or_number text NOT NULL,
    file_name text NOT NULL,
    title text,
    establishment text DEFAULT '',
    receipt_date text DEFAULT '',
    description text DEFAULT '',
    category text DEFAULT 'PETC Sales',
    sub_category text DEFAULT '',
    entity text DEFAULT 'PETC',
    year text DEFAULT '2026',
    month text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'PHP',
    status text DEFAULT 'Scanned & Verified',
    file_format text DEFAULT 'JPG',
    file_size text,
    file_path text,
    notes text,
    tags text[] DEFAULT '{}',
    preview_data jsonb,
    scanned_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.petc_sales_receipts ADD COLUMN IF NOT EXISTS establishment text DEFAULT '';
ALTER TABLE public.petc_sales_receipts ADD COLUMN IF NOT EXISTS receipt_date text DEFAULT '';
ALTER TABLE public.petc_sales_receipts ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.petc_sales_receipts ADD COLUMN IF NOT EXISTS sub_category text DEFAULT '';

-- 2. PETC CTPL Insurance Receipts
CREATE TABLE IF NOT EXISTS public.petc_insurance_receipts (
    id text PRIMARY KEY,
    or_number text NOT NULL,
    file_name text NOT NULL,
    title text,
    establishment text DEFAULT '',
    receipt_date text DEFAULT '',
    description text DEFAULT '',
    category text DEFAULT 'PETC Insurance',
    sub_category text DEFAULT '',
    entity text DEFAULT 'PETC',
    year text DEFAULT '2026',
    month text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'PHP',
    status text DEFAULT 'Scanned & Verified',
    file_format text DEFAULT 'JPG',
    file_size text,
    file_path text,
    notes text,
    tags text[] DEFAULT '{}',
    preview_data jsonb,
    scanned_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.petc_insurance_receipts ADD COLUMN IF NOT EXISTS establishment text DEFAULT '';
ALTER TABLE public.petc_insurance_receipts ADD COLUMN IF NOT EXISTS receipt_date text DEFAULT '';
ALTER TABLE public.petc_insurance_receipts ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.petc_insurance_receipts ADD COLUMN IF NOT EXISTS sub_category text DEFAULT '';

-- 3. PETC Operational Expense Receipts
CREATE TABLE IF NOT EXISTS public.petc_expense_receipts (
    id text PRIMARY KEY,
    or_number text NOT NULL,
    file_name text NOT NULL,
    title text,
    establishment text DEFAULT '',
    receipt_date text DEFAULT '',
    description text DEFAULT '',
    category text DEFAULT 'Expenses',
    sub_category text DEFAULT 'Expenses 2026 (PETC)',
    entity text DEFAULT 'PETC',
    year text DEFAULT '2026',
    month text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'PHP',
    status text DEFAULT 'Scanned & Verified',
    file_format text DEFAULT 'JPG',
    file_size text,
    file_path text,
    notes text,
    tags text[] DEFAULT '{}',
    preview_data jsonb,
    scanned_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.petc_expense_receipts ADD COLUMN IF NOT EXISTS establishment text DEFAULT '';
ALTER TABLE public.petc_expense_receipts ADD COLUMN IF NOT EXISTS receipt_date text DEFAULT '';
ALTER TABLE public.petc_expense_receipts ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- 4. Red Goose Branch Expense Receipts
CREATE TABLE IF NOT EXISTS public.red_goose_expense_receipts (
    id text PRIMARY KEY,
    or_number text NOT NULL,
    file_name text NOT NULL,
    title text,
    establishment text DEFAULT '',
    receipt_date text DEFAULT '',
    description text DEFAULT '',
    category text DEFAULT 'Expenses',
    sub_category text DEFAULT 'Red Goose Expenses 2026',
    entity text DEFAULT 'Red Goose',
    year text DEFAULT '2026',
    month text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'PHP',
    status text DEFAULT 'Scanned & Verified',
    file_format text DEFAULT 'JPG',
    file_size text,
    file_path text,
    notes text,
    tags text[] DEFAULT '{}',
    preview_data jsonb,
    scanned_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.red_goose_expense_receipts ADD COLUMN IF NOT EXISTS establishment text DEFAULT '';
ALTER TABLE public.red_goose_expense_receipts ADD COLUMN IF NOT EXISTS receipt_date text DEFAULT '';
ALTER TABLE public.red_goose_expense_receipts ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- 5. Knoah Mari Branch Expense Receipts
CREATE TABLE IF NOT EXISTS public.knoah_mari_expense_receipts (
    id text PRIMARY KEY,
    or_number text NOT NULL,
    file_name text NOT NULL,
    title text,
    establishment text DEFAULT '',
    receipt_date text DEFAULT '',
    description text DEFAULT '',
    category text DEFAULT 'Expenses',
    sub_category text DEFAULT 'Knoah Mari Expenses 2026',
    entity text DEFAULT 'Knoah Mari',
    year text DEFAULT '2026',
    month text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'PHP',
    status text DEFAULT 'Scanned & Verified',
    file_format text DEFAULT 'JPG',
    file_size text,
    file_path text,
    notes text,
    tags text[] DEFAULT '{}',
    preview_data jsonb,
    scanned_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.knoah_mari_expense_receipts ADD COLUMN IF NOT EXISTS establishment text DEFAULT '';
ALTER TABLE public.knoah_mari_expense_receipts ADD COLUMN IF NOT EXISTS receipt_date text DEFAULT '';
ALTER TABLE public.knoah_mari_expense_receipts ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- 6. Consumables Purchase Receipts
CREATE TABLE IF NOT EXISTS public.consumables_receipts (
    id text PRIMARY KEY,
    or_number text NOT NULL,
    file_name text NOT NULL,
    title text,
    establishment text DEFAULT '',
    receipt_date text DEFAULT '',
    description text DEFAULT '',
    category text DEFAULT 'Consumables',
    sub_category text DEFAULT 'Office supply',
    entity text DEFAULT 'General',
    year text DEFAULT '2026',
    month text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'PHP',
    status text DEFAULT 'Scanned & Verified',
    file_format text DEFAULT 'JPG',
    file_size text,
    file_path text,
    notes text,
    tags text[] DEFAULT '{}',
    preview_data jsonb,
    scanned_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.consumables_receipts ADD COLUMN IF NOT EXISTS establishment text DEFAULT '';
ALTER TABLE public.consumables_receipts ADD COLUMN IF NOT EXISTS receipt_date text DEFAULT '';
ALTER TABLE public.consumables_receipts ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- 7. Payment Voucher Receipts
CREATE TABLE IF NOT EXISTS public.voucher_receipts (
    id text PRIMARY KEY,
    or_number text NOT NULL,
    file_name text NOT NULL,
    title text,
    establishment text DEFAULT '',
    receipt_date text DEFAULT '',
    description text DEFAULT '',
    category text DEFAULT 'Vouchers',
    sub_category text DEFAULT 'PETC',
    entity text DEFAULT 'PETC',
    year text DEFAULT '2026',
    month text,
    amount numeric DEFAULT 0,
    currency text DEFAULT 'PHP',
    status text DEFAULT 'Scanned & Verified',
    file_format text DEFAULT 'JPG',
    file_size text,
    file_path text,
    notes text,
    tags text[] DEFAULT '{}',
    preview_data jsonb,
    scanned_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.voucher_receipts ADD COLUMN IF NOT EXISTS establishment text DEFAULT '';
ALTER TABLE public.voucher_receipts ADD COLUMN IF NOT EXISTS receipt_date text DEFAULT '';
ALTER TABLE public.voucher_receipts ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Master inventory_items table OCR metadata columns
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS establishment text DEFAULT '';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS receipt_date text DEFAULT '';
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- ========================================================
-- Enable Row Level Security (RLS) & Policies for all tables
-- ========================================================

ALTER TABLE public.petc_sales_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on petc_sales_receipts" ON public.petc_sales_receipts;
CREATE POLICY "Allow all on petc_sales_receipts" ON public.petc_sales_receipts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.petc_insurance_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on petc_insurance_receipts" ON public.petc_insurance_receipts;
CREATE POLICY "Allow all on petc_insurance_receipts" ON public.petc_insurance_receipts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.petc_expense_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on petc_expense_receipts" ON public.petc_expense_receipts;
CREATE POLICY "Allow all on petc_expense_receipts" ON public.petc_expense_receipts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.red_goose_expense_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on red_goose_expense_receipts" ON public.red_goose_expense_receipts;
CREATE POLICY "Allow all on red_goose_expense_receipts" ON public.red_goose_expense_receipts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.knoah_mari_expense_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on knoah_mari_expense_receipts" ON public.knoah_mari_expense_receipts;
CREATE POLICY "Allow all on knoah_mari_expense_receipts" ON public.knoah_mari_expense_receipts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.consumables_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on consumables_receipts" ON public.consumables_receipts;
CREATE POLICY "Allow all on consumables_receipts" ON public.consumables_receipts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.voucher_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on voucher_receipts" ON public.voucher_receipts;
CREATE POLICY "Allow all on voucher_receipts" ON public.voucher_receipts FOR ALL USING (true) WITH CHECK (true);
