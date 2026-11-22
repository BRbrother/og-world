-- OG WORLD Phase 6: admin dashboard privileges
-- RLS remains enabled. Existing admin policies using public.is_admin() control access.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.orders TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.payment_submissions TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- IMPORTANT: Run this separately after replacing the UUID with YOUR account's
-- id from Supabase Dashboard > Authentication > Users. Do not make customers admin.
-- UPDATE public.profiles SET role='admin' WHERE id='YOUR_AUTH_USER_UUID';
