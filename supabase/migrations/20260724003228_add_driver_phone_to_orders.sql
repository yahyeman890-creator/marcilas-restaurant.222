/*
# Add driver phone to orders

## Overview
When a driver accepts a delivery, their phone number is stored on the order
so customers can call the driver directly from the order tracking screen.

## Changes
- Add `driver_phone` column to the `orders` table (nullable text).
  Populated when a driver accepts the order.
- No data loss: column is nullable, existing rows get NULL.
- No RLS policy changes needed — existing policies already cover the new column.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS driver_phone text;
