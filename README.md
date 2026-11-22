<<<<<<< HEAD
# OG WORLD — Phase 3: Live Product Catalogue

This version keeps the existing React/Vite storefront and Supabase authentication, and replaces the hard-coded demo product cards with live data from `public.products`.

## Run locally

1. Extract the ZIP.
2. Open the project folder in VS Code.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the localhost URL shown by Vite.

The `.env.local` file contains the project's Supabase URL and frontend publishable key. Never put a Supabase `service_role` or secret key in a browser app.

## Product catalogue behavior

- Reads only `is_active = true` rows; the existing RLS policy also restricts public reads to active products.
- Uses `name`, `description`, `category`, `image_urls`, `selling_price`, and `mrp` from Supabase.
- Search checks product name, category, and description.
- Category chips are generated from categories present in the database.
- The storefront subscribes to product table changes through Supabase Realtime. Realtime updates require the `products` table to be enabled in the Supabase Realtime publication; otherwise reload the page after adding a product.
- Supplier cost and supplier URL are intentionally not selected into the public storefront.
- The database is currently empty, so the storefront displays an empty-collection message until a product is added.

## Add a test product

Optional SQL is provided at `supabase/phase3-test-product.sql`. Run it once in Supabase SQL Editor to insert one clearly labelled test product. Then refresh the storefront. Remove the test row from Supabase Table Editor when finished.

The current phase does not yet include URL scraping/import, product administration, checkout, or supplier fulfilment. Those will be separate phases. Product image URLs should be direct, publicly accessible image URLs; future image upload support should use Supabase Storage.


## Phase 4 — Cart, addresses and checkout

1. Run `supabase/phase4-checkout.sql` once in Supabase SQL Editor.
2. Run `npm install` and `npm run dev`.
3. Sign in, add products to your bag, save/select an address and place an order.

The SQL adds a SECURITY INVOKER order function. It recalculates product prices from the database and creates the order and order items atomically. It adds customer-only INSERT policies for addresses, orders and order items. UPI/prepaid orders are saved as pending payment; payment collection/verification is a later phase. COD appears only when globally enabled and enabled for every product in the cart. This phase does not collect money or contact suppliers.


## Phase 4 — Cart, addresses and checkout

1. Run `supabase/phase4-checkout.sql` once in Supabase SQL Editor.
2. Run `npm install` and `npm run dev`.
3. Sign in, add products to your bag, save/select an address and place an order.

The SQL adds a SECURITY INVOKER order function. It recalculates product prices from the database and creates the order and order items atomically. It adds customer-only INSERT policies for addresses, orders and order items. UPI/prepaid orders are saved as pending payment; payment collection/verification is a later phase. COD appears only when globally enabled and enabled for every product in the cart. This phase does not collect money or contact suppliers.


## Phase 5 — Manual UPI payment

1. In Supabase SQL Editor, run `supabase/phase5-payment.sql`.
2. Confirm `payment_submissions` has its customer INSERT policy and admin UPDATE policy enabled (the Phase 3/4 setup created these).
3. Run `npm install` and `npm run dev`.
4. Place an order with UPI / Prepaid selected. The payment screen shows a QR for `9256259598@upi` with payee `OG WORLD`.
5. After paying, enter the UTR / transaction reference number and optionally upload a screenshot (maximum 5 MB). The screenshot is stored in a private `payment-proofs` bucket.

Customer payment details are submitted with status `submitted`; the order is not automatically marked paid. Verify the payment in Supabase before changing the payment/order statuses. Never mark an order paid based only on the customer's screenshot or UTR; confirm it in the UPI/bank account first. This build does not automatically collect or verify UPI payments.
=======
# og-world
>>>>>>> 8aa5190035114d2ff4fa8ec218a0808694f6f016
