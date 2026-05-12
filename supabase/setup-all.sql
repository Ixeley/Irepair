-- Run this ENTIRE script in Supabase SQL Editor
-- It creates the table (if not yet done) and configures all needed policies

-- 1. Products table
CREATE TABLE IF NOT EXISTS shop_products (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name           text NOT NULL,
  description    text DEFAULT '',
  price          integer NOT NULL,
  original_price integer,
  category       text NOT NULL DEFAULT 'telefoni',
  condition      text NOT NULL DEFAULT 'odlicno',
  images         text[]  DEFAULT '{}',
  colors         text[]  DEFAULT '{}',
  storage        text[]  DEFAULT '{}',
  stock_status   text    DEFAULT 'na_zalogi',
  delivery_days  integer,
  available      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- 2. Add columns that might be missing (safe to re-run)
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS colors        text[]  DEFAULT '{}';
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS storage       text[]  DEFAULT '{}';
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS stock_status  text    DEFAULT 'na_zalogi';
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS delivery_days integer;

-- 3. Disable RLS (simplest for no-auth admin)
ALTER TABLE shop_products DISABLE ROW LEVEL SECURITY;

-- 4. Create public storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Storage policies — allow everyone to read and write (no auth needed)
DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;

CREATE POLICY "product_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');
