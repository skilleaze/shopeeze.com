# Shopeiz database setup

The store runs on our own stock until this is done. After it, supplier products, live orders and /admin all work.

1. Create a Supabase project named `shopeiz` in region Mumbai (ap-south-1), in the Skilleze HQ organisation.
2. SQL Editor: run `01_schema.sql`, `02_sync.sql`, `03_own_products.sql` in that order.
3. Deploy the edge functions `supplier-sync` (JWT check off; it checks its own key) and `admin-users`.
4. Run `04_cron.sql` after replacing `PROJECT_REF` with the project reference.
5. Put the project URL and publishable key in `assets/config.js` and push to `main`.
6. Create the owner login (Authentication → Add user), then run:
   `insert into admins (user_id, email, name, role) select id, email, 'Owner', 'owner' from auth.users where email = '<owner email>';`
7. Open https://shopeiz.com/admin and sign in.

Pricing: supplier cost × 1.30 (margin set in Admin → Settings), rounded up to the rupee. Supplier fees count towards profit, not price. DeoDap products are prepaid only.
Baapstore and DeoDap are added but switched off; turn them on in Admin → Suppliers & sync once you have their plans.
