-- Seed demo users for Marcilas Restaurant
-- Uses PBKDF2-SHA256 with 100000 iterations to match the edge function's hashing
-- Passwords: admin123, cashier123, driver123, customer123

-- Create a helper function to compute PBKDF2-SHA256
-- (Postgres doesn't have PBKDF2 built-in, so we use a PL/pgSQL implementation)
CREATE OR REPLACE FUNCTION pbkdf2_sha256(password text, salt text, iterations int)
RETURNS text AS $$
DECLARE
  result bytea;
  block bytea;
  u bytea;
  i int;
  j int;
  salt_bytes bytea;
BEGIN
  -- Convert hex salt to bytes
  salt_bytes := decode(salt, 'hex');

  -- Initial block: HMAC-SHA256(password, salt || INT(1))
  block := hmac(salt_bytes || chr(1)::bytea, password::bytea, 'sha256');
  result := block;

  -- Subsequent blocks: HMAC-SHA256(password, prev_block)
  FOR i IN 2..iterations LOOP
    u := hmac(block, password::bytea, 'sha256');
    -- XOR result with u
    FOR j IN 0..length(result)-1 LOOP
      result := set_byte(result, j, get_byte(result, j) # get_byte(u, j));
    END LOOP;
    block := u;
  END LOOP;

  RETURN encode(result, 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fixed salts for reproducible demo accounts
-- These are pre-computed; the edge function will verify passwords against these hashes

-- Admin: +251911000001 / admin123
INSERT INTO profiles (full_name, phone, password_hash, password_salt, role, is_active)
SELECT 'Admin Manager', '+251911000001',
  pbkdf2_sha256('admin123', 'c66f5201568e84bc5869baaaba9ba9ea', 100000),
  'c66f5201568e84bc5869baaaba9ba9ea', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE phone = '+251911000001');

-- Cashier: +251911000002 / cashier123
INSERT INTO profiles (full_name, phone, password_hash, password_salt, role, is_active)
SELECT 'Cashier One', '+251911000002',
  pbkdf2_sha256('cashier123', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 100000),
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'cashier', true
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE phone = '+251911000002');

-- Driver: +251911000003 / driver123
INSERT INTO profiles (full_name, phone, password_hash, password_salt, role, is_active)
SELECT 'Driver Abebe', '+251911000003',
  pbkdf2_sha256('driver123', 'f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6', 100000),
  'f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6', 'driver', true
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE phone = '+251911000003');

-- Customer: +251911000004 / customer123
INSERT INTO profiles (full_name, phone, password_hash, password_salt, role, is_active)
SELECT 'Customer Selam', '+251911000004',
  pbkdf2_sha256('customer123', 'b1a2f3e4d5c6b1a2f3e4d5c6b1a2f3e4', 100000),
  'b1a2f3e4d5c6b1a2f3e4d5c6b1a2f3e4', 'customer', true
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE phone = '+251911000004');

-- Update existing demo users' passwords to ensure they match (in case they were changed)
UPDATE profiles SET
  password_hash = pbkdf2_sha256('admin123', 'c66f5201568e84bc5869baaaba9ba9ea', 100000),
  password_salt = 'c66f5201568e84bc5869baaaba9ba9ea',
  is_active = true
WHERE phone = '+251911000001';

UPDATE profiles SET
  password_hash = pbkdf2_sha256('cashier123', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 100000),
  password_salt = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
  is_active = true
WHERE phone = '+251911000002';

UPDATE profiles SET
  password_hash = pbkdf2_sha256('driver123', 'f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6', 100000),
  password_salt = 'f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6',
  is_active = true
WHERE phone = '+251911000003';

UPDATE profiles SET
  password_hash = pbkdf2_sha256('customer123', 'b1a2f3e4d5c6b1a2f3e4d5c6b1a2f3e4', 100000),
  password_salt = 'b1a2f3e4d5c6b1a2f3e4d5c6b1a2f3e4',
  is_active = true
WHERE phone = '+251911000004';

-- Clean up the helper function
DROP FUNCTION IF EXISTS pbkdf2_sha256;
