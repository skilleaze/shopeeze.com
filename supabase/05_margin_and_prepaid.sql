-- 25 Nov 2026: price = supplier cost + 30% margin (rounded up to the rupee); supplier fees are no longer added
-- to the price but are still recorded on orders for profit. DeoDap (cod_ok = false) products are prepaid only.
create or replace function sell_price(p_cost numeric, p_supplier text) returns numeric language sql stable set search_path = public as $fn$
  select case when p_cost is null or p_cost <= 0 then null
    else ceil(p_cost * (1 + (select margin_pct from settings where id = 1) / 100.0)) end
$fn$;
update products set cost = cost where supplier <> 'own';

create or replace function cod_blocked(p_ids text[]) returns text language sql stable security definer set search_path = public as $fn$
  select p.display_title from products p join suppliers s on s.id = p.supplier where p.id = any(p_ids) and not s.cod_ok limit 1
$fn$;
grant execute on function cod_blocked(text[]) to anon, authenticated;

create or replace function place_order_checked(p jsonb) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare t text;
begin
  if coalesce(p->>'pay', 'cod') = 'cod' then
    t := cod_blocked(array(select x->>'id' from jsonb_array_elements(coalesce(p->'items', '[]'::jsonb)) x));
    if t is not null then raise exception '% is prepaid only. Please choose Pay by UPI.', t; end if;
  end if;
  return null;
end $fn$;
revoke execute on function place_order_checked(jsonb) from public, anon, authenticated;
-- place_order calls place_order_checked(p) as its first step (added to the live function).

create or replace function bag_prices(ids text[]) returns jsonb language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'title', p.display_title, 'slug', p.slug, 'price', p.price, 'was', p.was,
    'img', p.images->>0, 'sub', p.sub, 'ok', (p.active and p.available and p.hidden_reason is null),
    'cod', coalesce((select s.cod_ok from suppliers s where s.id = p.supplier), true),
    'variants', (select coalesce(jsonb_agg(jsonb_build_object('id', v->>'id', 'title', v->>'title', 'price', variant_price(p, v), 'ok', coalesce((v->>'avail')::boolean, true))), '[]') from jsonb_array_elements(p.variants) v))), '[]')
  from products p where p.id = any(ids[1:60])
$fn$;

-- 25 Nov 2026: suppliers can be Shopify or WooCommerce; Seasonsway added (WooCommerce Store API)
alter table suppliers add column if not exists platform text not null default 'shopify';
insert into suppliers (id, name, base_url, fee, enabled, cod_ok, platform, notes) values
  ('seasonsway', 'Seasonsway', 'https://seasonsway.com', 0, true, true, 'woo', 'Women''s fashion (WooCommerce). Prices taken from their public site; shipping fee per order not confirmed yet.')
on conflict (id) do update set platform = 'woo';
