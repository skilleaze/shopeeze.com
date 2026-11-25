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
    multi: false,
    cod: !/^dd\d/.test(r.id),
    desc: o.desc || '',
  };
}

async function loadAll() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const part = await rest(`products?select=id,slug,display_title,category,sub,price,was,images,available,featured,rank,days&available=eq.true&price=not.is.null&order=featured.desc,rank.desc,id&offset=${from}&limit=1000`);
    rows.push(...part);
    if (part.length < 1000) break;
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
    const rows = await rest(`products?select=id,slug,display_title,category,sub,price,was,images,available,featured,rank,days,desc_html,variants&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    if (!rows.length) { full.set(slug, { at: Date.now(), row: null }); return null; }
    const r = rows[0];
    const p = fromRow(r);
    p.desc_html = r.desc_html || '';
    const all = r.variants || [];
    p.defaultVariant = all[0] ? String(all[0].id) : '';
    p.variants = [];
    if (all.length > 1) {
      const bp = await fetch(`${URL_}/rest/v1/rpc/bag_prices`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [r.id] }), signal: AbortSignal.timeout(8000) }).then((x) => x.json()).catch(() => []);
      const vs = (bp[0] && bp[0].variants) || [];
      p.variants = vs.map((v) => ({ id: String(v.id), title: v.title, ok: !!v.ok, price: Number(v.price) }));
      const first = p.variants.find((v) => v.ok);
      if (first) p.defaultVariant = first.id;
    }
    p.multi = p.variants.length > 1;
    full.set(slug, { at: Date.now(), row: p });
    if (full.size > 3000) full.delete(full.keys().next().value);
    return p;
  } catch (e) { console.error('detail failed', e.message); return null; }
}
module.exports = { ready, detail, enabled: () => !!(URL_ && KEY), settings: () => settings };
