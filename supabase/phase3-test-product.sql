-- Optional: add one clearly labelled test item to verify the live catalogue.
-- Run once in Supabase SQL Editor. Change the image URL/name/price if desired.
INSERT INTO public.products (
  id,
  name,
  description,
  category,
  image_urls,
  source_name,
  source_url,
  source_cost,
  selling_price,
  mrp,
  variants,
  is_active,
  prepaid_enabled,
  cod_enabled,
  supplier_direct_delivery_verified
) VALUES (
  gen_random_uuid(),
  'OG WORLD Test Tote Bag',
  'Temporary test product to verify that the OG WORLD storefront reads products from Supabase.',
  'Fashion',
  ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85'],
  'Test Supplier',
  NULL,
  400,
  699,
  999,
  '{}'::jsonb,
  true,
  true,
  false,
  false
);
