-- Customer accounts: profiles, saved addresses, orders linked to the signed-in customer, order tracking.

-- Orders remember who placed them (null for guest checkout)
alter table orders add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete set null;
create index if not exists orders_user_idx on orders (user_id, created_at desc);

-- "Out for delivery" and other courier progress are order_events of kind 'update' (shown to the customer).

-- Profile
create table if not exists profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  name text, phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists profiles_own on profiles;
create policy profiles_own on profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select, insert, update on profiles to authenticated;

-- Saved addresses
create table if not exists addresses (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text, name text not null, phone text not null, addr text not null, city text not null, state text, pin text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on addresses (user_id);
alter table addresses enable row level security;
drop policy if exists addresses_own on addresses;
create policy addresses_own on addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on addresses to authenticated;

-- What a customer may see of an order
create or replace function order_public(o orders) returns jsonb language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'code', o.code, 'created_at', o.created_at, 'status', o.status, 'pay_method', o.pay_method, 'pay_status', o.pay_status,
    'name', o.name, 'phone', o.phone, 'email', o.email, 'addr', o.addr, 'city', o.city, 'state', o.state, 'pin', o.pin,
    'subtotal', o.subtotal, 'ship_fee', o.ship_fee, 'cod_fee', o.cod_fee, 'discount', o.discount, 'promo', o.promo, 'total', o.total,
    'courier', o.courier, 'tracking_no', o.tracking_no, 'tracking_url', o.tracking_url,
    'placed_at', o.placed_at, 'shipped_at', o.shipped_at, 'delivered_at', o.delivered_at,
    'mine', o.user_id is not null and o.user_id = auth.uid(),
    'items', coalesce((select jsonb_agg(jsonb_build_object('product_id', i.product_id, 'title', i.title, 'slug', i.slug, 'img', i.img, 'qty', i.qty, 'price', i.price, 'mrp', i.mrp, 'variant', i.variant_title) order by i.id) from order_items i where i.order_id = o.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('at', e.at, 'kind', e.kind, 'note', e.note) order by e.at) from order_events e where e.order_id = o.id and e.kind in ('status', 'tracking', 'update')), '[]'::jsonb)
  )
$fn$;
revoke all on function order_public(orders) from public, anon, authenticated;

-- The signed-in customer's orders, newest first
create or replace function my_orders() returns jsonb language plpgsql stable security definer set search_path = public as $fn$
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  return coalesce((select jsonb_agg(order_public(o) order by o.created_at desc) from orders o where o.user_id = auth.uid()), '[]'::jsonb);
end $fn$;

-- One order: for its owner, or for anyone with the order number and the mobile number used.
-- A signed-in customer who proves the order this way gets it added to their account.
create or replace function order_lookup(p_code text, p_phone text default null) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare o orders; ph text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  select * into o from orders where upper(code) = upper(trim(p_code));
  if not found then return null; end if;
  if o.user_id is not null and o.user_id = auth.uid() then return order_public(o); end if;
  if length(ph) = 10 and right(regexp_replace(o.phone, '\D', '', 'g'), 10) = ph then
    if auth.uid() is not null and o.user_id is null then update orders set user_id = auth.uid() where id = o.id; o.user_id := auth.uid(); end if;
    return order_public(o);
  end if;
  return null;
end $fn$;

-- Customers can cancel before the order is handed to the supplier
create or replace function cancel_my_order(p_code text, p_reason text default null) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare o orders;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  select * into o from orders where upper(code) = upper(trim(p_code)) and user_id = auth.uid();
  if not found then raise exception 'Order not found'; end if;
  if o.status not in ('new', 'confirmed') then raise exception 'This order has already been sent for delivery and can no longer be cancelled here. Please contact us.'; end if;
  update orders set status = 'cancelled', notes = trim(coalesce(notes, '') || E'\nCancelled by customer' || coalesce(': ' || left(p_reason, 300), '')) where id = o.id;
  select * into o from orders where id = o.id;
  return order_public(o);
end $fn$;

grant execute on function my_orders() to authenticated;
grant execute on function order_lookup(text, text) to anon, authenticated;
grant execute on function cancel_my_order(text, text) to authenticated;
