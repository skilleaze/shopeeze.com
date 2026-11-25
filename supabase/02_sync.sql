-- Supplier sync helpers. Safe to run more than once.

-- Dropplier collections → Shopeiz categories. Lower priority number wins when a product is in several.
-- cat '__hide' hides the product (duplicates, ₹0 items).
insert into collection_map (supplier, handle, cat, priority) values
  ('dropplier', 'duplicate-products', '__hide', 1),
  ('dropplier', '0-products', '__hide', 2),
  ('dropplier', 'electronics-mobile-accessories', 'electronics', 10),
  ('dropplier', 'gaming-toys', 'kids', 12),
  ('dropplier', 'baby-kids-1', 'kids', 13),
  ('dropplier', 's-1', 'kids', 14),
  ('dropplier', 'car-bike-automotive', 'auto', 15),
  ('dropplier', 's', 'auto', 16),
  ('dropplier', 'hair-beauty', 'beauty', 18),
  ('dropplier', 'hair-accessories', 'beauty', 19),
  ('dropplier', 'fashion-accessories', 'fashion', 20),
  ('dropplier', 'm', 'fashion', 21),
  ('dropplier', 'office-stationery', 'office', 22),
  ('dropplier', 'a-1', 'office', 23),
  ('dropplier', 'sports-fitness-travel', 'sports', 24),
  ('dropplier', 'fitness-outdoors', 'sports', 25),
  ('dropplier', 'tools-hardware', 'tools', 26),
  ('dropplier', 'security', 'tools', 27),
  ('dropplier', 'festive-pooja-decor', 'festive', 28),
  ('dropplier', 'gifts-corporate', 'festive', 29),
  ('dropplier', 'kitchen-dining', 'kitchen', 30),
  ('dropplier', 'kitchen-finds', 'kitchen', 31),
  ('dropplier', 'bath-personal-health-care', 'beauty', 32),
  ('dropplier', 'health-personal-care', 'beauty', 33),
  ('dropplier', 'cleaning-household-supplies', 'cleaning', 34),
  ('dropplier', 'cleaning-essentials', 'cleaning', 35),
  ('dropplier', 'storage-organization', 'cleaning', 36),
  ('dropplier', 'storage-organiser', 'cleaning', 37),
  ('dropplier', 'garden-outdoor-1', 'sports', 38),
  ('dropplier', 'garden-outdoor', 'sports', 39),
  ('dropplier', 'lighting', 'home', 40),
  ('dropplier', 's-2', 'home', 41),
  ('dropplier', 'pet-supplies', 'home', 42),
  ('dropplier', 'furniture-home-improvement', 'home', 43),
  ('dropplier', 'home-improvement', 'home', 44)
on conflict (supplier, handle) do update set cat = excluded.cat, priority = excluded.priority;

-- Add a collection handle to products seen in a collection page
create or replace function sync_mark_collection(p_supplier text, p_handle text, p_ids text[]) returns int
language sql security definer set search_path = public as $fn$
  with u as (
    update products set collections = (select array_agg(distinct x) from unnest(coalesce(collections, '{}') || p_handle) x)
    where supplier = p_supplier and id = any(p_ids) returning 1)
  select count(*)::int from u
$fn$;

-- Matching keys for "the same product" across suppliers
create or replace function dup_key_sku(v jsonb) returns text language sql immutable set search_path = public as $fn$
  select nullif(lower(regexp_replace(coalesce(v->0->>'sku', ''), '[^a-zA-Z0-9]+', '', 'g')), '')
$fn$;
create or replace function dup_key_name(n text) returns text language sql immutable set search_path = public as $fn$
  select lower(regexp_replace(regexp_replace(regexp_replace(coalesce(n, ''), '\([^)]*\)', '', 'g'), '\m(\d+\s*(pc|pcs|piece|pieces|set|pack))\M', '', 'gi'), '[^a-zA-Z0-9]+', '', 'g'))
$fn$;

-- Finish a run: categories from collections, mark products that left the feed,
-- and where several suppliers sell the same item show only the best deal (in stock, lowest price)
create or replace function sync_finish(p_supplier text, p_run bigint) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_gone int; v_hidden int := 0; n int;
begin
  update products p set cat = m.cat
  from (
    select distinct on (p2.id) p2.id, cm.cat
    from products p2 join collection_map cm on cm.supplier = p2.supplier and cm.handle = any(p2.collections)
    where p2.supplier = p_supplier and p2.last_seen_run = p_run and cm.cat <> '__hide'
    order by p2.id, cm.priority
  ) m
  where p.id = m.id and p.cat is distinct from m.cat;

  update products p set hidden_reason = 'supplier list'
  where p.supplier = p_supplier and p.last_seen_run = p_run
    and exists (select 1 from collection_map cm where cm.supplier = p.supplier and cm.cat = '__hide' and cm.handle = any(p.collections));

  update products set available = false
  where supplier = p_supplier and (last_seen_run is distinct from p_run) and available;
  get diagnostics v_gone = row_count;

  update products set hidden_reason = null where hidden_reason = 'duplicate';

  with k as (
    select id, supplier, available, price, dup_key_sku(variants) sk from products where supplier <> 'own' and hidden_reason is null
  ), multi as (
    select sk from k where length(sk) >= 5 group by sk having count(distinct supplier) > 1
  ), ranked as (
    select k.id, row_number() over (partition by k.sk order by k.available desc, k.price nulls last, k.supplier) rn from k join multi using (sk)
  )
  update products p set hidden_reason = 'duplicate' from ranked r where p.id = r.id and r.rn > 1;
  get diagnostics n = row_count; v_hidden := v_hidden + n;

  with ranked as (
    select id, row_number() over (partition by dup_key_name(name) order by available desc, price nulls last, supplier) rn
    from products where supplier <> 'own' and hidden_reason is null and length(dup_key_name(name)) >= 8
  )
  update products p set hidden_reason = 'duplicate' from ranked r where p.id = r.id and r.rn > 1;
  get diagnostics n = row_count; v_hidden := v_hidden + n;

  update sync_runs set finished_at = now(), gone = v_gone where id = p_run;
  return jsonb_build_object('gone', v_gone, 'duplicates_hidden', v_hidden);
end $fn$;

revoke execute on function sync_mark_collection(text, text, text[]) from public, anon, authenticated;
revoke execute on function sync_finish(text, bigint) from public, anon, authenticated;

-- Baapstore and DeoDap switched on (25 Nov 2026)
update suppliers set enabled = true where id in ('baapstore', 'deodap');

-- Admin "Sync now": make a supplier due immediately
create or replace function sync_now(p_supplier text) returns void language plpgsql security definer set search_path = public as $fn$
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  insert into sync_state (supplier, next_at) values (p_supplier, now())
  on conflict (supplier) do update set next_at = now(), phase = case when sync_state.phase = 'idle' then 'idle' else sync_state.phase end, last_error = null;
end $fn$;
revoke all on function sync_now(text) from public, anon;
grant execute on function sync_now(text) to authenticated;
