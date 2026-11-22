-- OG WORLD Phase 5: UPI payment submissions and private screenshot storage
-- Run once in Supabase SQL Editor.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON TABLE public.payment_submissions TO authenticated;
GRANT SELECT ON TABLE public.orders TO authenticated;

-- Private bucket: screenshots are not publicly accessible.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false, file_size_limit=5242880,
  allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS "customer_upload_own_payment_proof" ON storage.objects;
CREATE POLICY "customer_upload_own_payment_proof"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id='payment-proofs'
  AND (storage.foldername(name))[1]=auth.uid()::text
);

DROP POLICY IF EXISTS "customer_read_own_payment_proof" ON storage.objects;
CREATE POLICY "customer_read_own_payment_proof"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id='payment-proofs'
  AND (
    (storage.foldername(name))[1]=auth.uid()::text
    OR public.is_admin()
  )
);

-- Existing customer_insert_own_payment_submissions policy should remain enabled.
-- Existing admin UPDATE policies on payment_submissions and orders should remain enabled.
