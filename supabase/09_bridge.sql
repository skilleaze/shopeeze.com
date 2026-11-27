-- 27 Nov 2026: bridge Shopify store for Dropdash and vFulfill (both only connect to Shopify stores).
-- Products: supplier-sync reads the bridge store through the Admin API (platform 'shopify_admin').
--   The price set in the bridge store is our COST; Shopeiz adds the usual margin.
-- Orders: when an order with bridge items is "confirmed" (COD) or paid (UPI), pg_cron calls the
--   bridge-order edge function, which creates the same order in the bridge store; the Dropdash/vFulfill
--   app picks it up there. Admin can also press "Send to bridge store" (rpc bridge_send_now).
-- Setup: update suppliers set base_url = 'https://<store>.myshopify.com', enabled = true where id = 'bridge';
--        insert into private_config (k, v) values ('token_bridge', '<Admin API access token>');
insert into suppliers (id, name, base_url, fee, enabled, cod_ok, platform, notes) values
  ('bridge', 'Bridge store (Dropdash & vFulfill)', null, 0, false, true, 'shopify_admin', 'Our own Shopify store.')
on conflict (id) do update set platform = 'shopify_admin';
-- bridge_pending(), bridge_send_now(bigint) and cron job 'bridge-orders' (every 3 min): see live database.
