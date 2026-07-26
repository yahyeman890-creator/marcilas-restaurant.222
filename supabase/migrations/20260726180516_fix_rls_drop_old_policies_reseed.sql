/*
# Fix RLS Policies, Protect Password Columns & Clean Up

## Summary
1. Drops ALL old open `anon_*` RLS policies that were never removed by the
   previous migration (wrong names were used in DROP statements).
2. Also drops the duplicate policies created by the previous migration to
   avoid overlapping policy sets.
3. Re-applies clean, correctly-scoped RLS policies on all 6 tables.
4. Revokes INSERT and UPDATE on `password_hash` and `password_salt` from
   anon and authenticated so the public cannot write password columns.
5. Deletes test/hacker accounts inserted during security testing.

## RLS Policy Design
This app uses CUSTOM auth via an edge function (service role key, bypasses RLS)
— NOT Supabase's built-in auth. The frontend uses the anon key for all CRUD.
Therefore:
- `profiles`: SELECT open to anon (column GRANT protects password fields).
  INSERT/UPDATE/DELETE restricted to authenticated only (edge function uses
  service role key and bypasses RLS for all profile mutations).
- `foods`, `categories`: SELECT public (menu display). Write operations open
  to anon (admin manages foods/categories directly via anon client).
- `orders`, `order_items`, `z_reports`: All CRUD open to anon (checkout,
  cashier, driver, admin all use anon client — custom auth limitation).
*/

-- ============================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON EVERY TABLE
-- ============================================================

-- profiles: drop old anon_* policies + previous migration's policies
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_safe" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_update_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_authenticated" ON profiles;

-- foods: drop old anon_* policies + previous migration's policies
DROP POLICY IF EXISTS "anon_select_foods" ON foods;
DROP POLICY IF EXISTS "anon_insert_foods" ON foods;
DROP POLICY IF EXISTS "anon_update_foods" ON foods;
DROP POLICY IF EXISTS "anon_delete_foods" ON foods;
DROP POLICY IF EXISTS "foods_select_public" ON foods;
DROP POLICY IF EXISTS "foods_insert_anon" ON foods;
DROP POLICY IF EXISTS "foods_update_anon" ON foods;
DROP POLICY IF EXISTS "foods_delete_anon" ON foods;

-- categories: drop old anon_* policies + previous migration's policies
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
DROP POLICY IF EXISTS "categories_select_public" ON categories;
DROP POLICY IF EXISTS "categories_insert_anon" ON categories;
DROP POLICY IF EXISTS "categories_update_anon" ON categories;
DROP POLICY IF EXISTS "categories_delete_anon" ON categories;

-- orders: drop old anon_* policies + previous migration's policies
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
DROP POLICY IF EXISTS "orders_select_anon" ON orders;
DROP POLICY IF EXISTS "orders_insert_anon" ON orders;
DROP POLICY IF EXISTS "orders_update_anon" ON orders;
DROP POLICY IF EXISTS "orders_delete_anon" ON orders;

-- order_items: drop old anon_* policies + previous migration's policies
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
DROP POLICY IF EXISTS "order_items_select_anon" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_anon" ON order_items;
DROP POLICY IF EXISTS "order_items_update_anon" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_anon" ON order_items;

-- z_reports: drop old anon_* policies + previous migration's policies
DROP POLICY IF EXISTS "anon_select_z_reports" ON z_reports;
DROP POLICY IF EXISTS "anon_insert_z_reports" ON z_reports;
DROP POLICY IF EXISTS "anon_update_z_reports" ON z_reports;
DROP POLICY IF EXISTS "anon_delete_z_reports" ON z_reports;
DROP POLICY IF EXISTS "z_reports_select_anon" ON z_reports;
DROP POLICY IF EXISTS "z_reports_insert_anon" ON z_reports;
DROP POLICY IF EXISTS "z_reports_update_anon" ON z_reports;
DROP POLICY IF EXISTS "z_reports_delete_anon" ON z_reports;

-- ============================================================
-- STEP 2: REVOKE PASSWORD COLUMN WRITE PRIVILEGES
-- ============================================================

-- Revoke ALL privileges on password columns from anon and authenticated
REVOKE INSERT (password_hash) ON profiles FROM anon;
REVOKE INSERT (password_hash) ON profiles FROM authenticated;
REVOKE INSERT (password_salt) ON profiles FROM anon;
REVOKE INSERT (password_salt) ON profiles FROM authenticated;
REVOKE UPDATE (password_hash) ON profiles FROM anon;
REVOKE UPDATE (password_hash) ON profiles FROM authenticated;
REVOKE UPDATE (password_salt) ON profiles FROM anon;
REVOKE UPDATE (password_salt) ON profiles FROM authenticated;

-- ============================================================
-- STEP 3: RE-APPLY CLEAN RLS POLICIES
-- ============================================================

-- --- profiles ---
-- SELECT: open (column GRANT already protects password_hash/salt from SELECT)
CREATE POLICY "profiles_select_safe" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

-- INSERT/UPDATE/DELETE: authenticated only — blocks anon direct writes.
-- Edge function uses service role key (bypasses RLS) for all profile mutations.
CREATE POLICY "profiles_insert_authenticated" ON profiles FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "profiles_update_authenticated" ON profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "profiles_delete_authenticated" ON profiles FOR DELETE
  TO authenticated USING (true);

-- --- foods (public read, anon write — admin manages via anon client) ---
CREATE POLICY "foods_select_public" ON foods FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "foods_insert_anon" ON foods FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "foods_update_anon" ON foods FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "foods_delete_anon" ON foods FOR DELETE
  TO anon, authenticated USING (true);

-- --- categories (public read, anon write — admin manages via anon client) ---
CREATE POLICY "categories_select_public" ON categories FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "categories_insert_anon" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "categories_update_anon" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete_anon" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- --- orders (all CRUD via anon client — checkout, cashier, driver, admin) ---
CREATE POLICY "orders_select_anon" ON orders FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "orders_insert_anon" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "orders_update_anon" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "orders_delete_anon" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- --- order_items (all CRUD via anon client) ---
CREATE POLICY "order_items_select_anon" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "order_items_insert_anon" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "order_items_update_anon" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "order_items_delete_anon" ON order_items FOR DELETE
  TO anon, authenticated USING (true);

-- --- z_reports (all CRUD via anon client — admin/cashier) ---
CREATE POLICY "z_reports_select_anon" ON z_reports FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "z_reports_insert_anon" ON z_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "z_reports_update_anon" ON z_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "z_reports_delete_anon" ON z_reports FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- STEP 4: DELETE TEST/HACKER ACCOUNTS
-- ============================================================

DELETE FROM profiles WHERE phone = '+251977777777';
DELETE FROM profiles WHERE phone = '+251999999999';
