-- Product categories (applied live 26 Nov 2026).
-- Every partner product is filed by what it actually is, on insert and whenever the sync
-- changes its name, sub-category or category. Our own products ('own') are never touched,
-- and products.cat_override (set from admin) still wins over everything.
--
-- The keyword rules live in the table cat_rules (prio, cat, strong, re, note):
--   strong rules = words that name the product type ("induction", "saree", "drone", "mop")
--   weak rules   = generic words used only when nothing else matched ("bottle", "box", "light")
-- Edit a rule:   update cat_rules set re = '...' where prio = 50;
-- Re-file all:   update products set cat = cat where supplier <> 'own';   (run in parts if slow)

create table if not exists cat_rules (prio int primary key, cat text not null, re text not null, note text, strong boolean not null default true);
alter table cat_rules enable row level security;

create or replace function cat_vague(s text) returns boolean language sql immutable as $$
  select s is null or lower(s) ~ '^(home( &| and)? (kitchen|improvement|decor|accessories|appliances)|household|kitchenware|other (products|items)|accessories|fashion|women|men|kids|sale|brand|gift|gifts?|health( &| and)? (beauty|personal care)|beauty and accessories|industrial & scientific|electronics?|office|travel|women new deals|wooden expression|ambaji|twisa|trendz apparels|tanu electronics|singer|reebok|grocery.*|foods?|toys & games|sports, fitness & outdoors|garden & outdoors|car & motorbike|automotive|keychain & murti|.*new deals)$'
$$;

create or replace function cat_from(t text) returns text language sql stable set search_path = public as $$
  select r.cat from cat_rules r where lower(t) ~ r.re order by r.strong desc, r.prio limit 1
$$;

-- name + supplier sub-category → category, or null when unsure (the current category then stays)
create or replace function classify_product(p_name text, p_sub text, p_cur text) returns text language plpgsql stable set search_path = public as $$
declare t text; head text; c text;
begin
  t := lower(coalesce(p_name, ''));
  t := regexp_replace(t, '\m(baby (pink|blue|yellow|green)|rose gold|cream,|cream colou?red|cream &)', ' ', 'g');
  t := regexp_replace(t, '((no|without|zero)[- ]drill(ing)?|drill[- ]free|(anti|non)[- ]rust|rust[- ]?(proof|resistant|free)|water[- ]?(proof|resistant)|stain[- ]?(proof|resistant))', ' ', 'g');
  if t ~ '\mdrone' and t ~ '\m(lights?|strobe|lamp|propeller guard|landing pad)\M' then t := regexp_replace(t, '\mdrones?\M', ' ', 'g'); end if;
  if lower(coalesce(p_sub, '')) in ('tops', 'top') then return case when p_cur = 'kids' then 'kids' else 'fashion' end; end if;
  head := split_part(split_part(split_part(split_part(split_part(t, ' - ', 1), ' | ', 1), ' compatible', 1), ' for ', 1), ' with ', 1);
  c := (select r.cat from cat_rules r where r.strong and head ~ r.re order by r.prio limit 1);
  if c is null and not cat_vague(p_sub) then c := cat_from(p_sub); end if;
  if c is null then c := (select r.cat from cat_rules r where r.strong and t ~ r.re order by r.prio limit 1); end if;
  if c is null then c := (select r.cat from cat_rules r where not r.strong and head ~ r.re order by r.prio limit 1); end if;
  if c is null then return null; end if;
  if c = 'fashion' and p_cur = 'kids' and t !~ '\m(earrings?|jhumkas?|necklaces?|bangles?|jewell?ery)\M' then return 'kids'; end if;
  if c = 'kitchen' and p_cur in ('sports', 'kids') and t ~ '\m(bottles?|mugs?|lunch ?box|flasks?)\M' then return p_cur; end if;
  return c;
end $$;

create or replace function products_fix_cat() returns trigger language plpgsql set search_path = public as $$
begin
  if new.supplier is distinct from 'own' then
    new.cat := coalesce(classify_product(coalesce(new.display_title, new.name), new.sub, coalesce(new.cat, 'home')), new.cat);
  end if;
  return new;
end $$;
drop trigger if exists products_fix_cat on products;
create trigger products_fix_cat before insert or update of cat, name, display_title, sub on products
  for each row execute function products_fix_cat();
