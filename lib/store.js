/* Server-side product data. Loads every visible product from the database into catalog.P
   (refreshed every few minutes) so all pages can render synchronously. Falls back to our own
   stock in assets/catalog.js when the database is not configured or unreachable. */
const C = require('../assets/catalog.js');
const CFG = require('../assets/config.js');

const URL_ = process.env.SUPABASE_URL || CFG.url;
const KEY = process.env.SUPABASE_KEY || CFG.key;
const TTL = 5 * 60e3;
let loadedAt = 0, loading = null, settings = null;
const full = new Map();   // slug -> { at, row }

async function rest(path) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}
const own = new Map(C.OWN.map((p) => [p.id, p]));

function fromRow(r) {
  const o = own.get(r.id) || {};
  const imgs = Array.isArray(r.images) ? r.images : [];
  return {
    ...o,
    id: r.id, supplier: own.has(r.id) ? 'own' : 'partner', slug: r.slug, title: r.display_title, cat: r.category, sub: r.sub || o.sub || '',
    price: Number(r.price), was: r.was ? Number(r.was) : null,
    img: imgs[0] || o.img || '', images: imgs.length ? imgs : (o.img ? [o.img] : []),
    available: r.available !== false, featured: !!r.featured, rank: Number(r.rank || 0),
    days: r.days || (own.has(r.id) ? C.POLICY.ownMax : C.POLICY.maxDays),
    rating: r.rating_avg ? Number(r.rating_avg) : 0, reviews: Number(r.rating_count || 0),
    multi: false,
    cod: !/^dd\d/.test(r.id),
    desc: o.desc || '',
  };
}

async function loadAll() {
  let rows;
  try {
    // One request: [id, slug, title, category, sub, price, was, image, featured, rank, days]
    const r = await fetch(`${URL_}/rest/v1/rpc/catalog_list`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(String(r.status));
    rows = (await r.json()).map((x) => ({ id: x[0], slug: x[1], display_title: x[2], category: x[3], sub: x[4], price: x[5], was: x[6], images: x[7] ? [x[7]] : [], available: true, featured: x[8], rank: x[9], days: x[10], rating_avg: x[11], rating_count: x[12] }));
  } catch (e) {
    rows = [];
    for (let from = 0; ; from += 1000) {
      const part = await rest(`products?select=id,slug,display_title,category,sub,price,was,images,available,featured,rank,days&available=eq.true&price=not.is.null&order=featured.desc,rank.desc,id&offset=${from}&limit=1000`);
      rows.push(...part);
      if (part.length < 1000) break;
    }
  }
  const s = await rest('rpc/shop_settings').catch(() => null);
  return { rows, s };
}

function applySettings(s) {
  if (!s) return;
  settings = s;
  C.FREE_OVER = Number(s.free_over); C.STD_FEE = Number(s.std_fee); C.COD_FEE = Number(s.cod_fee);
  C.PROMO.code = s.promo_code || ''; C.PROMO.pct = Number(s.promo_pct || 0);
  C.POLICY.minDays = s.min_days; C.POLICY.maxDays = s.max_days; C.POLICY.replaceDays = s.replace_days;
}

/* Look-alikes: colour, size and model variants of the same item ("Saree (Red)", "Saree (Blue)",
   "Remote No. URC 116, Compatible With Samsung…"). Browsing shows one card per group; search still finds every item. */
const COLOURS = /\b(black|white|red|blue|green|yellow|pink|purple|orange|grey|gray|brown|beige|cream|maroon|navy|teal|olive|gold|golden|silver|multicolou?r|multi|peach|wine|mustard|mustrad|aqua|lavender|levender|magenta|rani|coffee|mehandi|mahendi|sea|sky|royal|dark|light|baby|off|bottle|bottel|rama|pista|pistachio|turquoise|coral|violet|burgundy|charcoal|khaki|tan|rose|mint|jamli|parrot|ivory|copper|bronze|lemon|indigo|cyan|fuchsia|nude|transparent|clear|assorted|random)\b/g;
function lookKey(p) {
  const k = String(p.title || '').toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/,?\s*compatible with .*$/, ' ')
    .replace(/\b[a-z]*\d[\w.\-_/]*/g, ' ')
    .replace(COLOURS, ' ')
    .replace(/\b(no|pcs?|pieces?|set|of|mtrs?|size|free|with|for|and|the|a|an|in)\b/g, ' ')
    .replace(/[^a-z]+/g, '');
  return k.length >= 6 ? p.cat + ':' + k : '';
}
function groupLookalikes(list) {
  const first = new Map();
  list.forEach((p) => { delete p.alt; delete p.alts; });
  list.forEach((p) => {
    const k = lookKey(p);
    if (!k) return;
    const rep = first.get(k);
    if (!rep) { first.set(k, p); p.gk = k; return; }
    p.alt = true; p.gk = k; rep.alts = (rep.alts || 0) + 1;
  });
}

async function ready() {
  if (!URL_ || !KEY) return false;
  if (Date.now() - loadedAt < TTL && C.P.length) return true;
  if (!loading) {
    loading = loadAll().then(({ rows, s }) => {
      if (rows.length) {
        const list = rows.map(fromRow);
        C.P.length = 0; C.P.push(...list);
        // keep our own stock visible even if it has not been added to the database yet
        C.OWN.forEach((p) => { if (p.available && !list.find((x) => x.id === p.id)) C.P.push(p); });
        groupLookalikes(C.P);
      }
      applySettings(s);
      loadedAt = Date.now();
    }).catch((e) => { console.error('store load failed', e.message); loadedAt = Date.now() - TTL + 30e3; })
      .finally(() => { loading = null; });
  }
  // First load waits; later refreshes happen in the background
  if (!loadedAt) await loading;
  return true;
}

/* Full details for one product page (description, all photos, options). Returns null if unknown. */
async function detail(slug) {
  if (!URL_ || !KEY) return null;
  const hit = full.get(slug);
  if (hit && Date.now() - hit.at < TTL) return hit.row;
  try {
    const rows = await rest(`products?select=id,slug,display_title,category,sub,price,was,images,available,featured,rank,days,desc_html,rating_avg,rating_count&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    if (!rows.length) { full.set(slug, { at: Date.now(), row: null }); return null; }
    const r = rows[0];
    const p = fromRow(r);
    p.desc_html = r.desc_html || '';
    // Options and their prices come from bag_prices (the public key cannot read supplier costs)
    const rpc = (fn, args) => fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args), signal: AbortSignal.timeout(6000) }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    const [bp, fam, rev] = await Promise.all([rpc('bag_prices', { ids: [r.id] }), rpc('product_family', { p_id: r.id }), rpc('product_reviews', { p_id: r.id })]);
    const vs = ((bp && bp[0] && bp[0].variants) || []).filter((v) => !/^default title$/i.test(v.title || ''));
    p.variants = vs.length > 1 || (vs.length === 1 && ((bp[0].variants || []).length > 1)) ? vs.map((v) => ({ id: String(v.id), title: v.title, ok: !!v.ok, price: Number(v.price) })) : [];
    const firstAll = bp && bp[0] && bp[0].variants && bp[0].variants[0];
    p.defaultVariant = firstAll ? String(firstAll.id) : '';
    const first = p.variants.find((v) => v.ok);
    if (first) p.defaultVariant = first.id;
    if (bp && bp[0]) p.cod = bp[0].cod !== false;
    p.family = Array.isArray(fam) ? fam : [];
    p.reviewData = rev || { avg: null, count: 0, items: [] };
    p.multi = p.variants.length > 1;
    full.set(slug, { at: Date.now(), row: p });
    if (full.size > 3000) full.delete(full.keys().next().value);
    return p;
  } catch (e) { console.error('detail failed', e.message); return null; }
}
module.exports = { groupLookalikes, lookKey, ready, detail, enabled: () => !!(URL_ && KEY), settings: () => settings };
