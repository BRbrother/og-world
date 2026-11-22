-- OG WORLD Phase 9: allow admins to manage catalogue products.
-- RLS stays enabled. Customers retain the existing active-product read policy.
GRANT SELECT, INSERT, UPDATE ON TABLE public.products TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='products'
      AND policyname='Admins can manage products'
  ) THEN
    CREATE POLICY "Admins can manage products"
      ON public.products
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;
