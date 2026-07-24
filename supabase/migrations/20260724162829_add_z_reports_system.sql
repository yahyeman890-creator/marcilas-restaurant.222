/*
# Add Z Report (Daily Closing) System

## Overview
Adds a Z Report / daily closing system to Marcilas Restaurant. Admins and cashiers
can generate a Z Report at the end of each business day, which snapshots all
open (unclosed) orders, archives them by linking them to the report, and stores
aggregate totals. Historical data is never deleted — orders are tagged with a
z_report_id so they are excluded from future reports.

## New Tables

### z_reports
Stores each generated Z Report (daily closing report).
- id (uuid, PK)
- report_number (int) — sequential number for human-readable reference
- business_date (date) — the calendar date this report covers
- total_orders (int) — count of all orders in the report
- completed_orders (int) — orders with status 'delivered'
- cancelled_orders (int) — orders with status 'cancelled'
- total_revenue (numeric) — sum of totals from paid orders (cash on delivery)
- total_discounts (numeric) — discounts applied (currently 0, reserved for future)
- order_snapshot (jsonb) — full snapshot of all orders + items at time of closing
- generated_at (timestamptz) — when the report was generated
- generated_by (uuid, FK -> profiles) — who generated it
- generated_by_name (text) — name of the person (denormalized for history)
- notes (text, nullable) — optional notes

## Modified Tables

### orders
- Added `business_date` (date, default current_date) — the business day the order belongs to.
  New orders automatically get today's date.
- Added `z_report_id` (uuid, nullable, FK -> z_reports ON DELETE SET NULL) — when set,
  the order is "closed/archived" and excluded from future Z Reports.

## Security
- RLS enabled on z_reports with anon+authenticated CRUD (same pattern as all other tables
  in this custom-auth app where all requests arrive as the anon role).
- Existing order management, authentication, and role-based access remain unchanged.

## Important Notes
1. Orders are never deleted when a Z Report is generated — they are tagged with z_report_id.
2. New orders automatically get business_date = current_date and z_report_id = NULL,
   so they belong to the next reporting period.
3. The order_snapshot jsonb column stores a complete copy of all orders and their items
   at the time of closing, so historical reports remain accurate even if orders are
   later modified or deleted.
4. Only admin and cashier roles can generate/view Z Reports (enforced in the frontend
   by ProtectedRoute role checks, same as all other staff features).
*/

-- ============ Z_REPORTS TABLE ============
CREATE TABLE IF NOT EXISTS z_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number int NOT NULL,
  business_date date NOT NULL,
  total_orders int NOT NULL DEFAULT 0,
  completed_orders int NOT NULL DEFAULT 0,
  cancelled_orders int NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  total_discounts numeric NOT NULL DEFAULT 0,
  order_snapshot jsonb NOT NULL DEFAULT '[]',
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  generated_by_name text NOT NULL,
  notes text
);

ALTER TABLE z_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_z_reports" ON z_reports;
CREATE POLICY "anon_select_z_reports" ON z_reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_z_reports" ON z_reports;
CREATE POLICY "anon_insert_z_reports" ON z_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_z_reports" ON z_reports;
CREATE POLICY "anon_update_z_reports" ON z_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_z_reports" ON z_reports;
CREATE POLICY "anon_delete_z_reports" ON z_reports FOR DELETE
  TO anon, authenticated USING (true);

-- ============ ADD COLUMNS TO ORDERS ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'business_date') THEN
    ALTER TABLE orders ADD COLUMN business_date date NOT NULL DEFAULT current_date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'z_report_id') THEN
    ALTER TABLE orders ADD COLUMN z_report_id uuid REFERENCES z_reports(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_orders_business_date ON orders(business_date);
CREATE INDEX IF NOT EXISTS idx_orders_z_report_id ON orders(z_report_id);
CREATE INDEX IF NOT EXISTS idx_z_reports_business_date ON z_reports(business_date);
CREATE INDEX IF NOT EXISTS idx_z_reports_generated_at ON z_reports(generated_at);
