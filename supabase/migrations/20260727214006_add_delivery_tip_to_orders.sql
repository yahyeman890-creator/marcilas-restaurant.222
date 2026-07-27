/*
# Add Delivery Tip to Orders

## Summary
Adds a `delivery_tip` column to the `orders` table to store the customer's
optional tip for the delivery driver. The tip is kept SEPARATE from the
order `total` so that:
- Driver tips are NOT included in restaurant sales totals.
- Driver tips are NOT included in the cashier Z Report revenue calculation.
- The Z Report continues to calculate only restaurant transactions (order totals).

## Changes
- `orders.delivery_tip` (numeric, NOT NULL, default 0) — the tip amount in ETB
  the customer chose at checkout. 0 means no tip. Stored separately from
  `total` so Z Report revenue (which sums `total`) is unaffected.

## Security
- No RLS policy changes. The existing `orders_*_anon` policies already allow
  anon CRUD on all columns of `orders`, so the new column is accessible to
  the frontend without additional grants.

## Important Notes
1. The tip is NOT added to `orders.total`. The `total` column continues to
   hold only subtotal + delivery fee, so Z Report revenue is unchanged.
2. Existing orders get a default of 0 (no tip), preserving backward compatibility.
3. The driver dashboard sums `delivery_tip` separately for tip stats.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_tip numeric NOT NULL DEFAULT 0;
