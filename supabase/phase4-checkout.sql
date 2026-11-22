-- OG WORLD Phase 4: run once in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.ogw_place_order(p_address_id uuid,p_payment_method public.payment_method,p_customer_note text DEFAULT NULL,p_items jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_user_id uuid:=auth.uid(); v_address public.customer_addresses%ROWTYPE; v_settings public.store_settings%ROWTYPE; v_order_id uuid; v_order_number text; v_subtotal numeric(12,2):=0; v_delivery numeric(12,2):=0; v_cod_allowed boolean:=true; v_prepaid_allowed boolean:=true; v_item jsonb; v_product public.products%ROWTYPE; v_qty integer; v_count integer:=0;
BEGIN
 IF v_user_id IS NULL THEN RAISE EXCEPTION 'Please sign in before placing an order.'; END IF;
 IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'Your cart is empty.'; END IF;
 SELECT * INTO v_address FROM public.customer_addresses WHERE id=p_address_id AND user_id=v_user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Please select a valid delivery address.'; END IF;
 SELECT * INTO v_settings FROM public.store_settings WHERE id=true; v_delivery:=COALESCE(v_settings.default_delivery_fee,0);
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  v_qty:=(v_item->>'quantity')::integer; IF v_qty<1 OR v_qty>99 THEN RAISE EXCEPTION 'Invalid product quantity.'; END IF;
  SELECT * INTO v_product FROM public.products WHERE id=(v_item->>'product_id')::uuid AND is_active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'A product in your cart is no longer available.'; END IF;
  v_subtotal:=v_subtotal+(v_product.selling_price*v_qty); v_cod_allowed:=v_cod_allowed AND COALESCE(v_product.cod_enabled,false); v_prepaid_allowed:=v_prepaid_allowed AND COALESCE(v_product.prepaid_enabled,false); v_count:=v_count+1;
 END LOOP;
 IF p_payment_method='cod' AND NOT(COALESCE(v_settings.cod_enabled_globally,false) AND v_cod_allowed) THEN RAISE EXCEPTION 'Cash on Delivery is not enabled for this cart.'; END IF;
 IF p_payment_method='upi_manual' AND NOT v_prepaid_allowed THEN RAISE EXCEPTION 'Prepaid payment is not enabled for this cart.'; END IF;
 v_order_number:='OGW-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
 INSERT INTO public.orders(order_number,user_id,address_id,address_snapshot,payment_method,payment_status,order_status,subtotal,delivery_fee,total,customer_note)
 VALUES(v_order_number,v_user_id,p_address_id,to_jsonb(v_address),p_payment_method,'pending','pending_payment',v_subtotal,v_delivery,v_subtotal+v_delivery,p_customer_note) RETURNING id INTO v_order_id;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  v_qty:=(v_item->>'quantity')::integer; SELECT * INTO v_product FROM public.products WHERE id=(v_item->>'product_id')::uuid AND is_active=true;
  INSERT INTO public.order_items(order_id,product_id,product_name,image_url,quantity,unit_price,source_name,source_url)
  VALUES(v_order_id,v_product.id,v_product.name,CASE WHEN array_length(v_product.image_urls,1)>0 THEN v_product.image_urls[1] ELSE NULL END,v_qty,v_product.selling_price,v_product.source_name,v_product.source_url);
 END LOOP;
 RETURN jsonb_build_object('id',v_order_id,'order_number',v_order_number,'subtotal',v_subtotal,'delivery_fee',v_delivery,'total',v_subtotal+v_delivery,'items_count',v_count);
END; $$;
GRANT EXECUTE ON FUNCTION public.ogw_place_order(uuid,public.payment_method,text,jsonb) TO authenticated;
DROP POLICY IF EXISTS "customer_insert_own_addresses" ON public.customer_addresses;
CREATE POLICY "customer_insert_own_addresses" ON public.customer_addresses FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "customer_insert_own_orders" ON public.orders;
CREATE POLICY "customer_insert_own_orders" ON public.orders FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "customer_insert_items_own_orders" ON public.order_items;
CREATE POLICY "customer_insert_items_own_orders" ON public.order_items FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND o.user_id=auth.uid()));
