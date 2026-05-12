-- Run in Supabase SQL Editor
ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS storage text[] DEFAULT '{}';
