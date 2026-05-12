-- Run this in Supabase SQL Editor to add new columns
-- (If you haven't run shop.sql yet, run that first)

ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS colors       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stock_status text    DEFAULT 'na_zalogi'
    CHECK (stock_status IN ('na_zalogi', 'ni_zalogi', 'po_narocilu')),
  ADD COLUMN IF NOT EXISTS delivery_days integer;
