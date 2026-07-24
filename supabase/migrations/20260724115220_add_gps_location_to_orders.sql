/*
# Add GPS location columns to orders

## Overview
Adds latitude and longitude columns to the orders table so customer GPS location
can be captured at checkout time and displayed on the driver's delivery map.

## Changes
### orders table (modified)
- delivery_lat (double precision, nullable) — customer's GPS latitude
- delivery_lng (double precision, nullable) — customer's GPS longitude

## Notes
- delivery_address remains as a fallback (reverse-geocoded text or "GPS location")
- Both columns are nullable so existing orders are not affected
- RLS policies are unchanged (orders already has full anon CRUD policies)
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_lat double precision,
  ADD COLUMN IF NOT EXISTS delivery_lng double precision;
