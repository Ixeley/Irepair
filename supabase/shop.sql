-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Products table
CREATE TABLE IF NOT EXISTS shop_products (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  description   text DEFAULT '',
  price         integer NOT NULL,
  original_price integer,
  category      text NOT NULL CHECK (category IN ('telefoni','macbooki','ipadi','ure','drugo')),
  condition     text NOT NULL CHECK (condition IN ('nov','odlicno','dobro','vidne_sledi')),
  images        text[] DEFAULT '{}',
  available     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

-- Public read (only available products)
CREATE POLICY "public_read" ON shop_products FOR SELECT USING (available = true);

-- Admin full access (no auth for now — restrict later by adding auth.uid() checks)
CREATE POLICY "admin_insert" ON shop_products FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_update" ON shop_products FOR UPDATE USING (true);
CREATE POLICY "admin_delete" ON shop_products FOR DELETE USING (true);

-- Admin: also allow reading unavailable products (needed for admin panel)
CREATE POLICY "admin_read_all" ON shop_products FOR SELECT USING (true);
-- Note: this conflicts with public_read; drop public_read and rely on admin_read_all
-- or use a separate admin client. For simplicity, drop the restrictive policy:
DROP POLICY IF EXISTS "public_read" ON shop_products;

-- Storage bucket for product images
-- Run these in Supabase Dashboard → Storage → New bucket: "product-images" (Public)
-- Then add policy: allow INSERT for anon role on bucket product-images

-- Insert this storage policy via Dashboard → Storage → product-images → Policies:
-- Policy name: allow_anon_upload
-- Operation: INSERT
-- Target roles: anon, authenticated
-- WITH CHECK: true
