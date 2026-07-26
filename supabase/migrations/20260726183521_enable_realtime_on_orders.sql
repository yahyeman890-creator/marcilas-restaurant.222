-- Enable Supabase Realtime on the orders table so INSERT/UPDATE events
-- are broadcast to subscribed clients (e.g. the Cashier Dashboard).
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
