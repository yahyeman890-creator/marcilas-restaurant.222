import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aomfztqzqmvcspltwmnn.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbWZ6dHF6cW12Y3NwbHR3bW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDM1OTcsImV4cCI6MjEwMDQxOTU5N30.WMedfZ7HXcYlvSaK0mOC2lDXHvm9S553tWDpCn0bD2o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AUTH_FUNCTION_URL = `${supabaseUrl}/functions/v1/marcilas-auth`;
