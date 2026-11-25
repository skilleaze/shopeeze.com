-- Shopeiz store database: suppliers, products, orders, settings, sync and admins.
-- Safe to run more than once.

create extension if not exists pgcrypto;

-- ---------- Settings (one row) ----------
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  margin_pct numeric not null default 30,       -- our margin on top of landed cost
  free_over numeric not null default 499,       -- free standard delivery above this bag value
  std_fee numeric not null default 40,          -- delivery fee below free_over
  cod_fee numeric not null default 49,          -- cash on delivery fee
  promo_code text default 'SZWELCOME',
  promo_pct numeric not null default 10,
  min_days int not null default 6,              -- delivery promise, working days
  max_days int not null default 10,
  replace_days int not null default 7,          -- replacement window for damaged / wrong items
  updated_at timestamptz not null default now()
);
insert into settings (id) values (1) on conflict do nothing;

-- ---------- Suppliers ----------
create table if not exists suppliers (
  id text primary key,                          -- dropplier, baapstore, deodap, own
  name text not null,
  base_url text,                                -- Shopify store, e.g. https://dropplier.in
  fee numeric not null default 0,               -- supplier charge added per item before margin (shipping etc.)
  enabled boolean not null default true,        -- include in sync and on the store
  cod_ok boolean not null default true,         -- supplier itself accepts COD orders
  notes text,
  created_at timestamptz not null default now()
);
insert into suppliers (id, name, base_url, fee, enabled, cod_ok, notes) values
  ('own', 'Shopeiz own stock', null, 0, true, true, 'Products we stock or price by hand (drones).'),
  ('dropplier', 'Dropplier', 'https://dropplier.in', 50, true, true, 'Basic plan: ₹50 delivery per order. Dispatch 1 to 3 days, shipping 5 to 7 days. RTO: product value refunded, shipping deducted.'),
  ('baapstore', 'Baapstore', 'https://baapstore.com', 69, false, true, 'Pro plan ₹9,999/year. ₹69 shipping per product, ₹99 per return or RTO.'),
  ('deodap', 'DeoDap', 'https://deodap.in', 70, false, false, 'Prepaid only (no COD to us). Free shipping above ₹599. Damaged/wrong items: report within 48 h with unboxing video.')
on conflict (id) do nothing;

-- ---------- Products ----------
create table if not exists products (
  id text primary key,                          -- '<supplier>-<shopify id>' or own id (d1..d4)
  supplier text not null references suppliers(id),
  src_id text,                                  -- supplier product id
  handle text,                                  -- supplier product handle
  title_src text,                               -- title exactly as the supplier has it
  name text not null,                           -- cleaned title from the sync
  title text,                                   -- admin override
  display_title text generated always as (coalesce(nullif(title, ''), name)) stored,
  slug text unique,
  cat text,                                     -- category from the sync
  cat_override text,                            -- admin override
  category text generated always as (coalesce(nullif(cat_override, ''), cat, 'home')) stored,
  sub text,                                     -- product type, shown as subcategory
  tags text[] default '{}',
  desc_html text,
  images jsonb not null default '[]',           -- array of image URLs
  variants jsonb not null default '[]',         -- [{id,title,sku,cost,mrp,avail,grams}]
  cost numeric,                                 -- lowest variant cost from the supplier
  mrp numeric,                                  -- supplier compare-at price
  price numeric,                                -- our selling price (computed by trigger)
  price_override numeric,                       -- admin fixed price
  was numeric,                                  -- strike-through price shown (computed)
  available boolean not null default true,
  active boolean not null default true,         -- admin can hide a product
  hidden_reason text,                           -- duplicate, zero price, etc. (set by sync)
  featured boolean not null default false,
  rank numeric not null default 0,
  collections text[] default '{}',
  days int,                                     -- override delivery days
  last_seen_run bigint,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_cat_idx on products (category) where active and hidden_reason is null;
create index if not exists products_supplier_idx on products (supplier);
create index if not exists products_avail_idx on products (available, active);

create or replace function ceil9(v numeric) returns numeric language sql immutable as $fn$
  select (ceil((ceil(v) + 1) / 10.0) * 10 - 1)::numeric
$fn$;

-- Selling price for a supplier cost: (cost + supplier fee) x (1 + margin), rounded up to end in 9
create or replace function sell_price(p_cost numeric, p_supplier text) returns numeric language sql stable as $fn$
  select case when p_cost is null or p_cost <= 0 then null
    else ceil9((p_cost + coalesce((select fee from suppliers where id = p_supplier), 0)) * (1 + (select margin_pct from settings where id = 1) / 100.0)) end
$fn$;

create or replace function slugify(t text) returns text language sql immutable as $fn$
  select trim(both '-' from regexp_replace(replace(lower(coalesce(t, '')), '&', ' and '), '[^a-z0-9]+', '-', 'g'))
$fn$;

create or replace function products_before() returns trigger language plpgsql as $fn$
declare base text; s text; n int := 1;
begin
  if new.slug is null or new.slug = '' then
    base := left(slugify(coalesce(nullif(new.title, ''), new.name)), 80);
    base := trim(both '-' from base);
    if base = '' then base := 'product'; end if;
    s := base;
    while exists (select 1 from products where slug = s and id <> new.id) loop
      n := n + 1; s := base || '-' || n;
    end loop;
    new.slug := s;
  end if;
  new.price := coalesce(new.price_override, sell_price(new.cost, new.supplier), new.price);
  new.was := case when new.mrp is not null and new.price is not null and new.mrp >= new.price * 1.05 then new.mrp else null end;
  new.updated_at := now();
  return new;
end $fn$;
drop trigger if exists trg_products_before on products;
create trigger trg_products_before before insert or update on products for each row execute function products_before();

-- Price for one variant (used at checkout)
create or replace function variant_price(p products, v jsonb) returns numeric language sql stable as $fn$
  select coalesce(p.price_override, sell_price((v->>'cost')::numeric, p.supplier), p.price)
$fn$;

-- Re-price every product after the margin or a supplier fee changes
create or replace function reprice_all() returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  update products set cost = cost;
  get diagnostics n = row_count;
  return n;
end $fn$;

-- ---------- Admins ----------
create table if not exists admins (
  user_id uuid primary key,
  email text,
  name text,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);
create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from admins where user_id = auth.uid())
$fn$;
create or replace function is_owner() returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from admins where user_id = auth.uid() and role = 'owner')
$fn$;

-- ---------- Orders ----------
create sequence if not exists order_no start 10001;
create table if not exists orders (
  id bigint generated always as identity primary key,
  code text unique not null default ('SZ' || nextval('order_no')),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'confirmed', 'placed', 'shipped', 'delivered', 'cancelled', 'rto', 'replaced')),
  pay_method text not null default 'cod' check (pay_method in ('cod', 'upi')),
  pay_status text not null default 'pending' check (pay_status in ('pending', 'paid', 'refunded', 'failed')),
  name text not null, phone text not null, email text,
  addr text not null, city text not null, pin text not null, state text,
  subtotal numeric not null, ship_fee numeric not null default 0, cod_fee numeric not null default 0,
  discount numeric not null default 0, promo text, total numeric not null,
  cost_total numeric not null default 0,       -- supplier product cost (snapshot)
  fee_total numeric not null default 0,        -- supplier shipping fees (snapshot)
  extra_cost numeric not null default 0,       -- anything else (RTO charges, refunds), entered by admin
  supplier_order text,                         -- order id on Dropplier / supplier
  courier text, tracking_no text, tracking_url text,
  placed_at timestamptz, shipped_at timestamptz, delivered_at timestamptz,
  notes text,
  utm jsonb, user_agent text,
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_phone_idx on orders (phone);

create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_id text references products(id) on delete set null,
  supplier text, src_id text, handle text, variant_id text, variant_title text, sku text,
  title text not null, slug text, img text,
  qty int not null check (qty between 1 and 20),
  price numeric not null, cost numeric, fee numeric, mrp numeric
);
create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists order_items_product_idx on order_items (product_id);

create table if not exists order_events (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  at timestamptz not null default now(),
  by_email text,
  kind text not null,          -- status, note, payment, tracking
  note text
);
create index if not exists order_events_order_idx on order_events (order_id);

create or replace function orders_before_update() returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    if new.status = 'placed' and new.placed_at is null then new.placed_at := now(); end if;
    if new.status = 'shipped' and new.shipped_at is null then new.shipped_at := now(); end if;
    if new.status = 'delivered' then
      if new.delivered_at is null then new.delivered_at := now(); end if;
      if new.pay_method = 'cod' and new.pay_status = 'pending' then new.pay_status := 'paid'; end if;
    end if;
    insert into order_events (order_id, by_email, kind, note)
      values (new.id, auth.jwt()->>'email', 'status', old.status || ' → ' || new.status);
  end if;
  if new.pay_status is distinct from old.pay_status then
    insert into order_events (order_id, by_email, kind, note) values (new.id, auth.jwt()->>'email', 'payment', old.pay_status || ' → ' || new.pay_status);
  end if;
  if new.tracking_no is distinct from old.tracking_no and coalesce(new.tracking_no, '') <> '' then
    insert into order_events (order_id, by_email, kind, note) values (new.id, auth.jwt()->>'email', 'tracking', coalesce(new.courier || ' ', '') || new.tracking_no);
  end if;
  return new;
end $fn$;
drop trigger if exists trg_orders_before_update on orders;
create trigger trg_orders_before_update before update on orders for each row execute function orders_before_update();

-- ---------- Public: settings the storefront needs ----------
create or replace function shop_settings() returns jsonb language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object('free_over', free_over, 'std_fee', std_fee, 'cod_fee', cod_fee, 'promo_code', promo_code, 'promo_pct', promo_pct,
    'min_days', min_days, 'max_days', max_days, 'replace_days', replace_days) from settings where id = 1
$fn$;

-- ---------- Public: place an order. Prices are always taken from the database ----------
create or replace function place_order(p jsonb) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  s settings; it jsonb; pr products; v jsonb; q int; unit numeric;
  sub numeric := 0; cost_t numeric := 0; fee_t numeric := 0; disc numeric := 0; ship numeric; cod numeric; tot numeric;
  lines jsonb := '[]'; ph text; o orders; v_fee numeric; v_promo text;
begin
  select * into s from settings where id = 1;
  ph := regexp_replace(coalesce(p->>'phone', ''), '[^0-9]', '', 'g');
  if length(ph) = 12 and left(ph, 2) = '91' then ph := right(ph, 10); end if;
  if length(ph) <> 10 then raise exception 'Please enter a 10-digit mobile number.'; end if;
  if length(trim(coalesce(p->>'name', ''))) < 2 then raise exception 'Please enter your name.'; end if;
  if length(trim(coalesce(p->>'addr', ''))) < 5 then raise exception 'Please enter your full address.'; end if;
  if length(trim(coalesce(p->>'city', ''))) < 2 then raise exception 'Please enter your city.'; end if;
  if coalesce(p->>'pin', '') !~ '^[1-9][0-9]{5}$' then raise exception 'Please enter a valid 6-digit PIN code.'; end if;
  if coalesce(p->>'pay', 'cod') not in ('cod', 'upi') then raise exception 'Unknown payment method.'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then raise exception 'Your bag is empty.'; end if;
  if jsonb_array_length(p->'items') > 20 then raise exception 'Too many items in one order.'; end if;
  if (select count(*) from orders where orders.phone = ph and orders.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many orders from this number in the last hour. Please call us.'; end if;

  for it in select * from jsonb_array_elements(p->'items') loop
    q := greatest(1, least(10, coalesce((it->>'qty')::int, 1)));
    select * into pr from products where id = it->>'id' and active and hidden_reason is null;
    if not found then raise exception 'One of the items in your bag is no longer available. Please remove it and try again.'; end if;
    if not pr.available then raise exception '% is out of stock. Please remove it and try again.', pr.display_title; end if;
    v := null;
    if jsonb_array_length(pr.variants) > 0 then
      select x into v from jsonb_array_elements(pr.variants) x
        where (x->>'id') = coalesce(nullif(it->>'v', ''), x->>'id') and coalesce((x->>'avail')::boolean, true)
        order by (x->>'cost')::numeric nulls last limit 1;
      if v is null then raise exception '% (that option) is out of stock.', pr.display_title; end if;
      unit := variant_price(pr, v);
    else
      unit := pr.price;
    end if;
    if unit is null or unit <= 0 then raise exception '% cannot be ordered right now.', pr.display_title; end if;
    v_fee := coalesce((select sp.fee from suppliers sp where sp.id = pr.supplier), 0);
    sub := sub + unit * q;
    cost_t := cost_t + coalesce((v->>'cost')::numeric, pr.cost, 0) * q;
    fee_t := fee_t + v_fee * q;
    lines := lines || jsonb_build_object('product_id', pr.id, 'supplier', pr.supplier, 'src_id', pr.src_id, 'handle', pr.handle,
      'variant_id', v->>'id', 'variant_title', nullif(v->>'title', 'Default Title'), 'sku', v->>'sku', 'title', pr.display_title, 'slug', pr.slug,
      'img', pr.images->>0, 'qty', q, 'price', unit, 'cost', coalesce((v->>'cost')::numeric, pr.cost), 'fee', v_fee, 'mrp', coalesce((v->>'mrp')::numeric, pr.was));
  end loop;

  v_promo := upper(trim(coalesce(p->>'promo', '')));
  if v_promo <> '' and v_promo = upper(coalesce(s.promo_code, '')) and s.promo_pct > 0 then
    if exists (select 1 from orders where orders.phone = ph and orders.promo = s.promo_code and status <> 'cancelled') then v_promo := '';
    else disc := round(sub * s.promo_pct / 100); end if;
  else v_promo := ''; end if;
  ship := case when sub >= s.free_over then 0 else s.std_fee end;
  cod := case when coalesce(p->>'pay', 'cod') = 'cod' then s.cod_fee else 0 end;
  tot := sub - disc + ship + cod;

  insert into orders (pay_method, name, phone, email, addr, city, pin, state, subtotal, ship_fee, cod_fee, discount, promo, total, cost_total, fee_total, utm, user_agent)
  values (coalesce(p->>'pay', 'cod'), left(trim(p->>'name'), 120), ph, nullif(left(trim(coalesce(p->>'email', '')), 160), ''),
    left(trim(p->>'addr'), 400), left(trim(p->>'city'), 80), p->>'pin', nullif(left(trim(coalesce(p->>'state', '')), 60), ''),
    sub, ship, cod, disc, nullif(v_promo, ''), tot, cost_t, fee_t, p->'utm', left(coalesce(p->>'ua', ''), 300))
  returning * into o;

  insert into order_items (order_id, product_id, supplier, src_id, handle, variant_id, variant_title, sku, title, slug, img, qty, price, cost, fee, mrp)
  select o.id, x->>'product_id', x->>'supplier', x->>'src_id', x->>'handle', x->>'variant_id', x->>'variant_title', x->>'sku', x->>'title', x->>'slug', x->>'img',
    (x->>'qty')::int, (x->>'price')::numeric, (x->>'cost')::numeric, (x->>'fee')::numeric, (x->>'mrp')::numeric
  from jsonb_array_elements(lines) x;
  insert into order_events (order_id, kind, note) values (o.id, 'status', 'Order placed on the website (' || o.pay_method || ')');

  return jsonb_build_object('code', o.code, 'total', o.total, 'subtotal', sub, 'discount', disc, 'ship', ship, 'cod', cod,
    'pay', o.pay_method, 'promo', nullif(v_promo, ''), 'lines', (select jsonb_agg(jsonb_build_object('t', x->>'title', 'q', (x->>'qty')::int, 'v', (x->>'price')::numeric * (x->>'qty')::int)) from jsonb_array_elements(lines) x));
end $fn$;

-- Public: current prices for items in a bag (so carts never show stale prices)
create or replace function bag_prices(ids text[]) returns jsonb language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'title', p.display_title, 'slug', p.slug, 'price', p.price, 'was', p.was,
    'img', p.images->>0, 'sub', p.sub, 'ok', (p.active and p.available and p.hidden_reason is null),
    'variants', (select coalesce(jsonb_agg(jsonb_build_object('id', v->>'id', 'title', v->>'title', 'price', variant_price(p, v), 'ok', coalesce((v->>'avail')::boolean, true))), '[]') from jsonb_array_elements(p.variants) v))), '[]')
  from products p where p.id = any(ids[1:60])
$fn$;

-- ---------- Sync bookkeeping ----------
create table if not exists sync_state (
  supplier text primary key references suppliers(id),
  phase text not null default 'idle',          -- idle, products, collections, finish
  page int not null default 1,
  col_idx int not null default 0,
  run_id bigint,
  next_at timestamptz not null default now(),
  started_at timestamptz, finished_at timestamptz,
  last_error text,
  stats jsonb default '{}'
);
create table if not exists sync_runs (
  id bigint generated always as identity primary key,
  supplier text, started_at timestamptz default now(), finished_at timestamptz,
  products_seen int default 0, created int default 0, updated int default 0, gone int default 0, error text
);
create table if not exists collection_map (
  supplier text not null, handle text not null, cat text, priority int not null default 50,
  primary key (supplier, handle)
);
-- Private secret the scheduled job sends to the sync function
create table if not exists private_config (k text primary key, v text not null);
insert into private_config (k, v) values ('sync_key', encode(gen_random_bytes(24), 'hex')) on conflict do nothing;

-- ---------- Admin analytics ----------
create or replace function admin_stats(d1 date, d2 date) returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare r jsonb;
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  with o as (
    select * from orders where (created_at at time zone 'Asia/Kolkata')::date between d1 and d2
  ), live as (select * from o where status not in ('cancelled')),
  money as (
    select
      count(*) filter (where true) as orders_all,
      count(*) filter (where status <> 'cancelled') as orders,
      coalesce(sum(total) filter (where status not in ('cancelled', 'rto')), 0) as revenue,
      coalesce(sum(total) filter (where status = 'delivered'), 0) as delivered_rev,
      coalesce(sum(total - cost_total - fee_total - extra_cost) filter (where status = 'delivered'), 0) as profit_delivered,
      coalesce(sum(total - cost_total - fee_total - extra_cost) filter (where status not in ('cancelled', 'rto', 'delivered')), 0) as profit_pipeline,
      coalesce(sum(fee_total * 1.5 + extra_cost) filter (where status = 'rto'), 0) as rto_loss,
      count(*) filter (where status = 'rto') as rto,
      count(*) filter (where status = 'delivered') as delivered,
      count(*) filter (where status in ('delivered', 'rto')) as closed_ship,
      count(*) filter (where pay_method = 'cod' and status <> 'cancelled') as cod,
      count(*) filter (where status = 'cancelled') as cancelled
    from o)
  select jsonb_build_object(
    'money', (select to_jsonb(money) from money),
    'aov', (select case when count(*) > 0 then round(avg(total)) else 0 end from live),
    'by_status', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from o group by status) t),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'orders', n, 'revenue', rev, 'profit', pf) order by d), '[]') from (
        select (created_at at time zone 'Asia/Kolkata')::date d, count(*) n, sum(total) rev, sum(total - cost_total - fee_total - extra_cost) pf
        from live group by 1) t),
    'top', (select coalesce(jsonb_agg(t order by t.revenue desc), '[]') from (
        select i.product_id, max(i.title) title, max(i.slug) slug, max(i.img) img, sum(i.qty) qty, sum(i.qty * i.price) revenue,
          sum(i.qty * (i.price - coalesce(i.cost, 0) - coalesce(i.fee, 0))) margin
        from order_items i join live on live.id = i.order_id group by i.product_id order by revenue desc limit 10) t),
    'states', (select coalesce(jsonb_agg(t order by t.n desc), '[]') from (select coalesce(nullif(state, ''), city) place, count(*) n, sum(total) revenue from live group by 1 order by 2 desc limit 10) t),
    'late', (select count(*) from orders where status = 'shipped' and shipped_at < now() - interval '10 days'),
    'to_place', (select count(*) from orders where status in ('new', 'confirmed')),
    'catalog', (select jsonb_build_object('total', count(*), 'live', count(*) filter (where active and available and hidden_reason is null),
        'out', count(*) filter (where not available), 'hidden', count(*) filter (where not active or hidden_reason is not null)) from products)
  ) into r;
  return r;
end $fn$;

-- ---------- Row-level security ----------
alter table settings enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table admins enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table sync_state enable row level security;
alter table sync_runs enable row level security;
alter table collection_map enable row level security;
alter table private_config enable row level security;

drop policy if exists products_public on products;
create policy products_public on products for select to anon, authenticated using (active and hidden_reason is null);
drop policy if exists products_admin on products;
create policy products_admin on products for all to authenticated using ((select is_admin())) with check ((select is_admin()));

do $do$
declare t text;
begin
  foreach t in array array['settings', 'suppliers', 'orders', 'order_items', 'order_events', 'sync_state', 'sync_runs', 'collection_map'] loop
    execute format('drop policy if exists %I on %I', t || '_admin', t);
    execute format('create policy %I on %I for all to authenticated using ((select is_admin())) with check ((select is_admin()))', t || '_admin', t);
  end loop;
end $do$;
drop policy if exists admins_read on admins;
create policy admins_read on admins for select to authenticated using ((select is_admin()));
drop policy if exists admins_owner on admins;
create policy admins_owner on admins for all to authenticated using ((select is_owner())) with check ((select is_owner()));
-- private_config: no policies, so only the service role can read it

revoke all on function place_order(jsonb) from public;
grant execute on function place_order(jsonb) to anon, authenticated;
grant execute on function bag_prices(text[]) to anon, authenticated;
grant execute on function shop_settings() to anon, authenticated;
revoke all on function admin_stats(date, date) from public, anon;
grant execute on function admin_stats(date, date) to authenticated;
revoke all on function reprice_all() from public, anon;
grant execute on function reprice_all() to authenticated;

-- The public key may read only what the shop shows: never costs, supplier details or variants.
revoke all on products from anon;
grant select (id, slug, display_title, category, sub, price, was, images, available, featured, rank, days, desc_html, active, hidden_reason) on products to anon;
revoke all on settings, suppliers, admins, orders, order_items, order_events, sync_state, sync_runs, collection_map, private_config from anon;
revoke all on private_config from authenticated;
