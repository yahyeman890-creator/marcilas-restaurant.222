/*
# Lock Down RLS & Protect Password Hashes

## Summary
This migration fixes critical security issues C1 and M1 from the audit:
1. Protects `password_hash` and `password_salt` columns on the `profiles` table
   from being read by anyone using the public (anon) Supabase key.
2. Restricts INSERT/UPDATE/DELETE on `profiles` to authenticated sessions only —
   the frontend never directly writes to `profiles` (all mutations go through the
   `marcilas-auth` edge function which uses the service role key and bypasses RLS).
3. Keeps `foods` and `categories` publicly readable so the menu displays without login.
4. Keeps `orders`, `order_items`, and `z_reports` CRUD accessible to the anon role
   because the app uses custom auth (not Supabase Auth sessions) — the frontend
   uses the anon key for all order/food/z_report operations. Restricting these
   would break checkout, cashier, driver, and admin flows.

## Architecture Note
This app uses a CUSTOM auth system via the `marcilas-auth` edge function, NOT
Supabase's built-in auth. The edge function uses the SERVICE ROLE key (which
bypasses RLS) for all profile reads/writes including password verification.
The frontend uses the ANON key for everything else (foods, orders, etc.).
Because there is no Supabase auth session, `auth.uid()` is always NULL on the
frontend, so ownership-based RLS is not possible for orders/foods/z_reports
without migrating the entire auth system to Supabase Auth.

## Changes

### 1. profiles table — column-level security
- REVOKE SELECT on `password_hash` and `password_salt` from `anon` and `authenticated`.
- GRANT SELECT on safe columns only (`id, full_name, phone, role, is_active, created_at`).
- This means `select *` from the anon client returns only safe columns —
  password hashes are invisible to the public.

### 2. profiles table — RLS policies
- SELECT: open to `anon, authenticated` (admin dashboard reads all profiles;
  auth refresh reads own profile). Column GRANT protects sensitive fields.
- INSERT: `authenticated` only (blocks anon). Edge function uses service role.
- UPDATE: `authenticated` only (blocks anon). Edge function uses service role.
- DELETE: `authenticated` only (blocks anon). Edge function uses service role.

### 3. foods table — RLS policies
- SELECT: open to `anon, authenticated` (public menu display).
- INSERT/UPDATE/DELETE: open to `anon, authenticated` (admin dashboard manages
  foods directly via anon client — architectural limitation of custom auth).

### 4. categories table — RLS policies
- SELECT: open to `anon, authenticated` (public menu display).
- INSERT/UPDATE/DELETE: open to `anon, authenticated` (admin manages categories
  directly via anon client — architectural limitation of custom auth).

### 5. orders table — RLS policies
- All CRUD open to `anon, authenticated` (checkout, cashier, driver, admin all
  use anon client — architectural limitation of custom auth).

### 6. order_items table — RLS policies
- All CRUD open to `anon, authenticated` (checkout inserts items via anon client).

### 7. z_reports table — RLS policies
- All CRUD open to `anon, authenticated` (admin/cashier manage reports via anon client).

## Security Impact
- CRITICAL FIX: Password hashes and salts are no longer readable by any visitor
  with the public anon key. This eliminates the password exposure risk (C1, M1).
- Profile mutations (create/update/delete users) are blocked from the anon client.
  Only the edge function (service role) can modify profiles.
- Foods, categories, orders, order_items, and z_reports remain open to the anon
  client because the app's custom auth architecture requires it. Migrating to
  Supabase Auth would allow proper ownership-scoped RLS on these tables.
*/

-- ============================================================
-- 1. PROTECT PROFILES TABLE — column-level security
-- ============================================================

-- Revoke all SELECT on profiles from anon and authenticated
REVOKE SELECT ON profiles FROM anon;
REVOKE SELECT ON profiles FROM authenticated;

-- Grant SELECT only on safe columns (excludes password_hash and password_salt)
GRANT SELECT (id, full_name, phone, role, is_active, created_at) ON profiles TO anon;
GRANT SELECT (id, full_name, phone, role, is_active, created_at) ON profiles TO authenticated;

-- ============================================================
-- 2. PROFILES TABLE — RLS policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_all" ON profiles;
DROP POLICY IF EXISTS "Allow all access to profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_all_profiles" ON profiles;
DROP POLICY IF EXISTS "update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "delete_all_profiles" ON profiles;

-- SELECT: anon can read rows (but only safe columns due to column GRANT above)
CREATE POLICY "profiles_select_safe" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

-- INSERT: authenticated only — blocks anon direct inserts.
-- The edge function uses the service role key which bypasses RLS.
CREATE POLICY "profiles_insert_authenticated" ON profiles FOR INSERT
  TO authenticated WITH CHECK (true);

-- UPDATE: authenticated only — blocks anon direct updates.
CREATE POLICY "profiles_update_authenticated" ON profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- DELETE: authenticated only — blocks anon direct deletes.
CREATE POLICY "profiles_delete_authenticated" ON profiles FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 3. FOODS TABLE — RLS policies
-- ============================================================

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "foods_select_all" ON foods;
DROP POLICY IF EXISTS "foods_insert_all" ON foods;
DROP POLICY IF EXISTS "foods_update_all" ON foods;
DROP POLICY IF EXISTS "foods_delete_all" ON foods;
DROP POLICY IF EXISTS "Allow all access to foods" ON foods;
DROP POLICY IF EXISTS "allow_all_foods" ON foods;
DROP POLICY IF EXISTS "select_all_foods" ON foods;
DROP POLICY IF EXISTS "insert_all_foods" ON foods;
DROP POLICY IF EXISTS "update_all_foods" ON foods;
DROP POLICY IF EXISTS "delete_all_foods" ON foods;

-- Public read for menu display
CREATE POLICY "foods_select_public" ON foods FOR SELECT
  TO anon, authenticated USING (true);

-- Admin manages foods via anon client (custom auth limitation)
CREATE POLICY "foods_insert_anon" ON foods FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "foods_update_anon" ON foods FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "foods_delete_anon" ON foods FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. CATEGORIES TABLE — RLS policies
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_insert_all" ON categories;
DROP POLICY IF EXISTS "categories_update_all" ON categories;
DROP POLICY IF EXISTS "categories_delete_all" ON categories;
DROP POLICY IF EXISTS "Allow all access to categories" ON categories;
DROP POLICY IF EXISTS "allow_all_categories" ON categories;
DROP POLICY IF EXISTS "select_all_categories" ON categories;
DROP POLICY IF EXISTS "insert_all_categories" ON categories;
DROP POLICY IF EXISTS "update_all_categories" ON categories;
DROP POLICY IF EXISTS "delete_all_categories" ON categories;

-- Public read for menu display
CREATE POLICY "categories_select_public" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Admin manages categories via anon client (custom auth limitation)
CREATE POLICY "categories_insert_anon" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "categories_update_anon" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete_anon" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. ORDERS TABLE — RLS policies
-- ============================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_all" ON orders;
DROP POLICY IF EXISTS "orders_insert_all" ON orders;
DROP POLICY IF EXISTS "orders_update_all" ON orders;
DROP POLICY IF EXISTS "orders_delete_all" ON orders;
DROP POLICY IF EXISTS "Allow all access to orders" ON orders;
DROP POLICY IF EXISTS "allow_all_orders" ON orders;
DROP POLICY IF EXISTS "select_all_orders" ON orders;
DROP POLICY IF EXISTS "insert_all_orders" ON orders;
DROP POLICY IF EXISTS "update_all_orders" ON orders;
DROP POLICY IF EXISTS "delete_all_orders" ON orders;

-- All CRUD via anon client (checkout, cashier, driver, admin)
CREATE POLICY "orders_select_anon" ON orders FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "orders_insert_anon" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "orders_update_anon" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "orders_delete_anon" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 6. ORDER_ITEMS TABLE — RLS policies
-- ============================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_all" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_all" ON order_items;
DROP POLICY IF EXISTS "order_items_update_all" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_all" ON order_items;
DROP POLICY IF EXISTS "Allow all access to order_items" ON order_items;
DROP POLICY IF EXISTS "allow_all_order_items" ON order_items;
DROP POLICY IF EXISTS "select_all_order_items" ON order_items;
DROP POLICY IF EXISTS "insert_all_order_items" ON order_items;
DROP POLICY IF EXISTS "update_all_order_items" ON order_items;
DROP POLICY IF EXISTS "delete_all_order_items" ON order_items;

-- All CRUD via anon client (checkout inserts, dashboards read)
CREATE POLICY "order_items_select_anon" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "order_items_insert_anon" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "order_items_update_anon" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "order_items_delete_anon" ON order_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 7. Z_REPORTS TABLE — RLS policies
-- ============================================================

ALTER TABLE z_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "z_reports_select_all" ON z_reports;
DROP POLICY IF EXISTS "z_reports_insert_all" ON z_reports;
DROP POLICY IF EXISTS "z_reports_update_all" ON z_reports;
DROP POLICY IF EXISTS "z_reports_delete_all" ON z_reports;
DROP POLICY IF EXISTS "Allow all access to z_reports" ON z_reports;
DROP POLICY IF EXISTS "allow_all_z_reports" ON z_reports;
DROP POLICY IF EXISTS "select_all_z_reports" ON z_reports;
DROP POLICY IF EXISTS "insert_all_z_reports" ON z_reports;
DROP POLICY IF EXISTS "update_all_z_reports" ON z_reports;
DROP POLICY IF EXISTS "delete_all_z_reports" ON z_reports;

-- All CRUD via anon client (admin/cashier manage reports)
CREATE POLICY "z_reports_select_anon" ON z_reports FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "z_reports_insert_anon" ON z_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "z_reports_update_anon" ON z_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "z_reports_delete_anon" ON z_reports FOR DELETE
  TO anon, authenticated USING (true);
