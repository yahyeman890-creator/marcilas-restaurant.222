-- Enable Supabase Realtime on profiles, foods, and z_reports so the
-- Admin Dashboard receives live INSERT/UPDATE/DELETE events for those
-- tables (not just orders).
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE foods;
ALTER PUBLICATION supabase_realtime ADD TABLE z_reports;
