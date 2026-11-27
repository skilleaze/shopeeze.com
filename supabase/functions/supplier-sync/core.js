// Shared supplier sync logic. Plain JavaScript so it runs in the Supabase Edge Function (Deno)
// and in Node for local tests. Reads public Shopify feeds (products.json) and WooCommerce Store API feeds.

const UA = 'Mozilla/5.0 (compatible; ShopeizSync/1.0; +https://shopeiz.com)';
export const PAGE = 250;
// Short id prefixes so product ids don't name the supplier
export const PREFIX = { dropplier: 'dp', baapstore: 'bs', deodap: 'dd', seasonsway: 'sw', bridge: 'br' };
export const pid = (supplier, id) => `${PREFIX[supplier] || supplier}${id}`;

/* ---------- Text clean-up ---------- */
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', hellip: '...', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', times: 'x' };
export const decode = (s) => String(s || '').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16))).replace(/&([a-z]+);/gi, (m, n) => (ENT[n.toLowerCase()] != null ? ENT[n.toLowerCase()] : m)).replace(/[\u2013\u2014]/g, '-');
const SUPPLIER_WORDS = /\b(dropplier|deodap|deo\s*dap|baap\s*store|baapstore|wukusy|wukuzy|seasonsway)\b/gi;
export function cleanTitle(t) {
  let s = decode(t).replace(/\s+/g, ' ').trim();
  // leading stock codes ("099 Square ...", "4023 ...", "0074c ..."), but keep real quantities ("360 Degree", "700 ML", "27 Pcs")
  if (!/^[1-9]\d{0,2}\s+(degree|ml|l|ltr|litre|liter|cm|mm|m|meter|metre|inch|inches|grid|pcs?|pieces?|pack|in|layers?|tiers?|w|watt|gb|kg|g|gms?|sheets?|compartments?|seater|steps?|holes?|slots?|sections?|cups?|colou?rs?|x|ft|feet|hooks?|modes?|speed|days?|tabs?|blades?)\b/i.test(s))
    s = s.replace(/^\(?\d{2,6}[a-zA-Z]?\)?[\s_\-:.]+(?=[A-Za-z])/, '');
  s = s.replace(/^[A-Z0-9]{2,}[_-][A-Za-z0-9_-]+\s+/, '');            // "0099_squr_gas ..."
  s = s.replace(SUPPLIER_WORDS, '').replace(/\s{2,}/g, ' ').replace(/^[\s\-|:,]+|[\s\-|:,]+$/g, '');
  if (s === s.toUpperCase() && /[A-Z]{4}/.test(s)) s = s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  return s.slice(0, 160);
}
export function cleanType(t) {
  const s = String(t || '').replace(SUPPLIER_WORDS, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s || /^(all products|default|product|products|test|goods|uncategori[sz]ed)$/i.test(s)) return '';
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase()).slice(0, 60);
}

const ALLOWED = new Set(['p', 'br', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'h3', 'h4', 'table', 'thead', 'tbody', 'tr', 'td', 'th']);
export function cleanHtml(html) {
  let s = String(html || '');
  s = s.replace(/<(script|style|iframe|video|object|svg|noscript)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<\/?h[12]\b/gi, (m) => m.replace(/h[12]/i, 'h3'));
  s = s.replace(/<\/?h[56]\b/gi, (m) => m.replace(/h[56]/i, 'h4'));
  s = s.replace(/<div\b[^>]*>/gi, '<p>').replace(/<\/div>/gi, '</p>');
  s = s.replace(/<(\/?)([a-z0-9]+)\b[^>]*>/gi, (m, close, tag) => (ALLOWED.has(tag.toLowerCase()) ? `<${close}${tag.toLowerCase()}>` : (tag.toLowerCase() === 'br' ? '<br>' : ' ')));
  s = s.replace(/&nbsp;/g, ' ');
  s = s.replace(SUPPLIER_WORDS, '');
  s = s.replace(/https?:\/\/[^\s<"']+/g, '').replace(/www\.[^\s<"']+/g, '').replace(/\b(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g, '');
  s = s.replace(/[^\S\n]{2,}/g, ' ');
  s = s.replace(/<p>\s*(<br>\s*)*<\/p>/g, '').replace(/(<br>\s*){3,}/g, '<br><br>');
  s = s.replace(/<(b|strong|i|em|li|td|th)>\s*<\/\1>/g, '');
  // Drop lines that talk about the supplier, wholesale or reselling
  s = s.replace(/<(p|li)>[^<]*(wholesale|reseller|dropship|whatsapp|contact us|our store|visit us)[^<]*<\/\1>/gi, '');
  return s.trim().slice(0, 20000);
}
export function textOf(html) { return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

/* ---------- Categories from words ---------- */
const RULES = [
  ['drones', /\bdrone|quadcopter\b/i],
  // clothing and jewellery words that are never anything else
  ['fashion', /\b(trackpants?|joggers?|jewels?|jewllery|jewell?ery|jhumkas?|shrugs?|sarees?|saris?|kurtis?|kurtas?|lehengas?|dupattas?|blouses?|palazzos?|skirts?|tunics?|nightwear|co-?ords?|jumpsuits?|leggings?|gowns?|earrings?|necklaces?|bangles?|bracelets?|ethnic wear|western wear)\b/i],
  ['cleaning', /\b(garbage|trash|dustbin|laundry) bags?\b/i],
  ['electronics', /\b(earphone|earbud|headphone|headset|speaker|bluetooth|charger|charging|cable|usb|power ?bank|mobile|smart ?watch|phone|tripod|selfie|ring light|led strip|remote|adapter|mic|microphone|keyboard|mouse|camera|projector|gadget|electronic|tws|neckband|smart)(?:s|es)?\b/i],
  ['kids', /\b(toy|kids?|baby|babies|child|children|infant|puzzle|doll|game|rc car|building blocks|school bag|teether|feeding bottle)(?:s|es)?\b/i],
  ['auto', /\b(car|bike|motorcycle|scooter|helmet|automotive|vehicle|dashboard|tyre|tire)(?:s|es)?\b/i],
  ['fashion', /\b(wear|jacket|hoodie|sweatshirt|trouser|pants|shorts|dress|shirt|t-?shirt|jeans|top|footwear|sandal|slipper|shoe|chappal|watch|wallet|handbag|purse|backpack|belt|sunglass|cap|sock|scarf|stole|suit)(?:s|es)?\b/i],
  ['beauty', /\b(beauty|makeup|make-up|lipstick|nail|hair|comb|brush|trimmer|shaver|massager|skin|face|facial|cosmetic|perfume|soap|shampoo|bath|personal care|health|wax|mirror|grooming|dental|tooth)(?:s|es)?\b/i],
  ['office', /\b(pen|pencil|notebook|diary|stationery|office|desk|file|folder|stapler|marker|calculator|sticky|craft|art|paint|colou?r)(?:s|es)?\b/i],
  ['sports', /\b(gym|yoga|fitness|exercise|sport|cricket|football|badminton|cycle|cycling|camping|travel|garden|plant|outdoor|skipping|dumbbell)(?:s|es)?\b/i],
  ['tools', /\b(tool|drill|screwdriver|plier|spanner|wrench|hammer|tape|glue|sealant|measuring|multimeter|lock|padlock|security|hardware|repair)(?:s|es)?\b/i],
  ['festive', /\b(pooja|puja|diya|rangoli|festival|festive|diwali|christmas|holi|rakhi|gift|idol|god|toran|decoration light|lantern)(?:s|es)?\b/i],
  ['kitchen', /\b(kitchen|cook|cooking|chopper|knife|knives|peeler|grater|slicer|cutter|spoon|ladle|pan|tawa|kadai|pot|container|lunch ?box|tiffin|bottle|jar|plate|bowl|cup|mug|glass|tray|strainer|whisk|spatula|mixer|blender|gas|stove|dining|spice|masala|roti|oil dispenser|kettle|flask)(?:s|es)?\b/i],
  ['cleaning', /\b(clean|cleaning|mop|broom|duster|dustbin|wiper|scrub|sponge|brush holder|storage|organi[sz]er|rack|shelf|shelves|hanger|hook|basket|box|drawer|closet|wardrobe|laundry|bathroom|toilet|sink|drain)(?:s|es)?\b/i],
  ['fashion', /\b(bag|ring)(?:s)?\b/i],
  ['home', /\b(home|decor|curtain|bedsheet|pillow|cushion|carpet|mat|rug|lamp|light|clock|wall|sticker|frame|furniture|chair|table|sofa|bed|door|window|vase|plant|fan|heater)(?:s|es)?\b/i],
];
export function guessCat(title, type, tags) {
  // colour names like "baby pink" are not baby products
  const t = `${type || ''} ${title || ''}`.replace(/\bbaby (pink|blue|yellow|green)\b/gi, '$1');
  for (const [cat, re] of RULES) if (re.test(t)) return cat;
  const tg = (tags || []).join(' ');
  for (const [cat, re] of RULES) if (re.test(tg)) return cat;
  return 'home';
}

/* ---------- Map one Shopify product ---------- */
export function mapProduct(supplier, sp, runId) {
  const variants = (sp.variants || []).map((v) => ({
    id: String(v.id), title: v.title, sku: v.sku || null,
    cost: v.price != null ? Number(v.price) : null,
    mrp: v.compare_at_price != null && Number(v.compare_at_price) > 0 ? Number(v.compare_at_price) : null,
    avail: v.available !== false, grams: v.grams || null,
  }));
  const live = variants.filter((v) => v.avail && v.cost > 0);
  const pool = live.length ? live : variants.filter((v) => v.cost > 0);
  const cheapest = pool.slice().sort((a, b) => a.cost - b.cost)[0];
  const images = (sp.images || []).map((i) => String(i.src || '').split('?')[0]).filter(Boolean).slice(0, 10);
  const tags = Array.isArray(sp.tags) ? sp.tags : String(sp.tags || '').split(',').map((x) => x.trim()).filter(Boolean);
  const name = cleanTitle(sp.title) || String(sp.title || '').trim();
  const sub = cleanType(sp.product_type);
  const cost = cheapest ? cheapest.cost : null;
  const mrp = cheapest ? cheapest.mrp : null;
  const available = live.length > 0;
  return {
    id: pid(supplier, sp.id),
    supplier,
    src_id: String(sp.id),
    handle: sp.handle,
    title_src: sp.title,
    name,
    cat: guessCat(name, sp.product_type, tags),
    sub: sub || null,
    tags: tags.slice(0, 30),
    desc_html: cleanHtml(sp.body_html),
    images,
    variants,
    cost,
    mrp,
    available,
    hidden_reason: !cost ? 'zero price' : !images.length ? 'no photo' : null,
    collections: [],
    rank: (available ? 10 : 0) + (mrp && cost && mrp > cost * 2 ? 2 : 0) + Math.min(images.length, 5) * 0.2,
    last_seen_run: runId,
    synced_at: new Date().toISOString(),
  };
}

/* ---------- Bridge store (our own Shopify store, read through the Admin API) ----------
   Dropdash / vFulfill push products into the bridge store. The price set there is treated as our COST
   (set it to the supplier's sourcing price); Shopeiz then adds the usual margin. */
export function mapAdmin(supplier, sp, runId) {
  const vs = (sp.variants || []).map((v) => ({ ...v, available: !(v.inventory_management === 'shopify' && v.inventory_policy === 'deny' && Number(v.inventory_quantity) <= 0) }));
  const row = mapProduct(supplier, { ...sp, variants: vs, images: (sp.images || []).map((i) => ({ src: i.src })) }, runId);
  if (sp.status && sp.status !== 'active') { row.available = false; row.hidden_reason = row.hidden_reason || 'not active in bridge store'; }
  return row;
}
export async function getAdmin(url, token) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': token, Accept: 'application/json' } });
    if (r.status === 429 || r.status >= 500) { await sleep(1500 * (i + 1)); continue; }
    if (!r.ok) throw new Error(`${r.status} from bridge store: ${(await r.text()).slice(0, 200)}`);
    const next = ((r.headers.get('link') || '').match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/) || [])[1] || null;
    return { json: await r.json(), next };
  }
  throw new Error('Bridge store is busy, will retry');
}
export const ADMIN_API = '2025-07';
// Dev Dashboard apps get short-lived tokens with the client credentials grant; cache them in private_config
export async function bridgeToken(D, sup) {
  const cfg = Object.fromEntries((await D.get(`private_config?select=k,v&k=like.bridge_${sup.id}_*`)).map((r) => [r.k.replace(`bridge_${sup.id}_`, ''), r.v]));
  if (cfg.token && Number(cfg.exp || 0) > Date.now() + 300e3) return cfg.token;
  if (!cfg.client_id || !cfg.client_secret) throw new Error('Bridge store keys are not saved yet (admin > Suppliers)');
  const r = await fetch(`${sup.base_url.replace(/\/+$/, '')}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: cfg.client_id, client_secret: cfg.client_secret }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('Bridge store refused the keys: ' + r.status + ' ' + JSON.stringify(j).slice(0, 200));
  await D.rpc('bridge_cache_token', { p_supplier: sup.id, p_token: j.access_token, p_exp: Date.now() + Number(j.expires_in || 86399) * 1000 });
  return j.access_token;
}

/* ---------- Map one WooCommerce Store API product ---------- */
export function mapWoo(supplier, wp, runId) {
  const pr = wp.prices || {};
  const unit = Math.pow(10, Number(pr.currency_minor_unit == null ? 2 : pr.currency_minor_unit));
  const money = (x) => (x == null || x === '' ? null : Number(x) / unit);
  const range = pr.price_range;
  // When options cost different amounts we price every option at the highest one, so we never undercharge
  const cost = range && range.max_amount ? money(range.max_amount) : money(pr.price);
  const reg = money(pr.regular_price);
  const mrp = reg && cost && reg > cost ? reg : null;
  const available = wp.is_in_stock !== false && wp.is_purchasable !== false && cost > 0;
  const vars = (wp.variations || []).map((v) => ({ id: String(v.id), title: (v.attributes || []).map((a) => decode(a.value)).filter(Boolean).join(' / ') || 'Option', sku: null, cost, mrp, avail: true, grams: null }));
  const variants = vars.length ? vars : [{ id: String(wp.id), title: 'Default Title', sku: wp.sku || null, cost, mrp, avail: available, grams: null }];
  const cats = (wp.categories || []).map((c) => decode(c.name));
  const name = cleanTitle(wp.name);
  const images = (wp.images || []).map((i) => i.src).filter(Boolean).slice(0, 10);
  const html = cleanHtml(decode(wp.description || '') ? wp.description : wp.short_description);
  return {
    id: pid(supplier, wp.id), supplier, src_id: String(wp.id), handle: wp.slug, title_src: decode(wp.name), name,
    cat: guessCat(name, cats.join(' '), cats), sub: cleanType(cats[cats.length - 1] || '') || null, tags: cats.slice(0, 30),
    desc_html: html, images, variants, cost, mrp, available,
    hidden_reason: !cost ? 'zero price' : !images.length ? 'no photo' : null,
    collections: [],
    rank: (available ? 10 : 0) + (mrp && cost && mrp > cost * 1.5 ? 2 : 0) + Math.min(images.length, 5) * 0.2,
    last_seen_run: runId, synced_at: new Date().toISOString(),
  };
}

/* ---------- HTTP ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function getJson(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (r.status === 429 || r.status >= 500) { last = new Error(`${r.status} from ${url}`); await sleep(1500 * (i + 1)); continue; }
      if (!r.ok) throw new Error(`${r.status} from ${url}`);
      return await r.json();
    } catch (e) { last = e; if (/ 40\d from /.test(e.message)) throw e; await sleep(800 * (i + 1)); }
  }
  throw last;
}

/* ---------- Database via PostgREST ---------- */
export function db(base, key) {
  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const call = async (path, opts = {}) => {
    const r = await fetch(`${base}/rest/v1/${path}`, { ...opts, headers: { ...h, ...(opts.headers || {}) } });
    const t = await r.text();
    if (!r.ok) throw new Error(`DB ${r.status} ${path.split('?')[0]}: ${t.slice(0, 300)}`);
    return t ? JSON.parse(t) : null;
  };
  return {
    get: (path) => call(path),
    rpc: (fn, args) => call(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }),
    upsert: (table, rows) => call(`${table}?on_conflict=id`, { method: 'POST', body: JSON.stringify(rows), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } }),
    insert: (table, row) => call(table, { method: 'POST', body: JSON.stringify(row), headers: { Prefer: 'return=representation' } }),
    patch: (table, filter, row) => call(`${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(row), headers: { Prefer: 'return=minimal' } }),
    upsertState: (st) => call('sync_state?on_conflict=supplier', { method: 'POST', body: JSON.stringify({
      supplier: st.supplier, phase: st.phase, page: st.page, col_idx: st.col_idx || 0, run_id: st.run_id, next_at: st.next_at || new Date().toISOString(),
      started_at: st.started_at || null, finished_at: st.finished_at || null, last_error: st.last_error || null, stats: st.stats || {} }),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } }),
  };
}

/* ---------- One step of the sync (a few pages), so each call stays short ---------- */
export async function step(D, { force = false, pagesPerCall = 4, log = () => {} } = {}) {
  const suppliers = await D.get('suppliers?select=id,base_url,enabled,platform&enabled=eq.true&base_url=not.is.null&order=id');
  const states = await D.get('sync_state?select=*');
  const now = Date.now();
  let st = null, sup = null;
  // Continue a run in progress first, else start the supplier that is most overdue
  for (const s of suppliers) { const x = states.find((y) => y.supplier === s.id); if (x && x.phase !== 'idle') { st = x; sup = s; break; } }
  if (!st) {
    const due = suppliers.map((s) => ({ s, x: states.find((y) => y.supplier === s.id) }))
      .filter(({ x }) => force || !x || new Date(x.next_at).getTime() <= now)
      .sort((a, b) => new Date(a.x ? a.x.next_at : 0) - new Date(b.x ? b.x.next_at : 0));
    if (!due.length) return { idle: true };
    sup = due[0].s;
    const run = await D.insert('sync_runs', { supplier: sup.id });
    st = { supplier: sup.id, phase: 'products', page: 1, col_idx: 0, run_id: run[0].id, started_at: new Date().toISOString(), stats: { seen: 0 } };
    await D.upsertState(st);
  }
  const base = sup.base_url.replace(/\/+$/, '');
  const cols = st.phase === 'collections' ? await D.get(`collection_map?select=handle&supplier=eq.${sup.id}&order=priority,handle`) : [];
  let pages = 0;
  try {
    while (pages < pagesPerCall && st.phase !== 'idle') {
      if (st.phase === 'products') {
        if (sup.platform === 'shopify_admin') {
          const tok = await bridgeToken(D, sup);
          const cur = st.stats?.cursor;
          const { json, next } = await getAdmin(`${base}/admin/api/${ADMIN_API}/products.json?limit=250${cur ? '&page_info=' + cur : ''}`, tok);
          pages++;
          const list = json.products || [];
          if (list.length) {
            const rows = list.map((p) => mapAdmin(sup.id, p, st.run_id));
            for (let i = 0; i < rows.length; i += 125) await D.upsert('products', rows.slice(i, i + 125));
            st.stats = { ...(st.stats || {}), seen: (st.stats?.seen || 0) + rows.length };
            log(`${sup.id} bridge page ${st.page}: ${rows.length}`);
          }
          st.stats = { ...(st.stats || {}), cursor: next };
          if (!next || !list.length) { st.phase = 'finish'; st.page = 1; } else st.page++;
          continue;
        }
        const woo = sup.platform === 'woo';
        const j = woo ? await getJson(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${st.page}`).catch((e) => { if (/ 40\d from /.test(e.message)) return []; throw e; })
                      : await getJson(`${base}/products.json?limit=${PAGE}&page=${st.page}`);
        pages++;
        const list = woo ? (Array.isArray(j) ? j : []) : (j.products || []);
        if (!list.length) {
          const hasCols = (await D.get(`collection_map?select=handle&supplier=eq.${sup.id}&limit=1`)).length > 0;
          st.phase = hasCols ? 'collections' : 'finish'; st.page = 1; st.col_idx = 0;
          if (hasCols) cols.push(...(await D.get(`collection_map?select=handle&supplier=eq.${sup.id}&order=priority,handle`)));
          continue;
        }
        const rows = list.map((p) => (woo ? mapWoo(sup.id, p, st.run_id) : mapProduct(sup.id, p, st.run_id)));
        for (let i = 0; i < rows.length; i += 125) await D.upsert('products', rows.slice(i, i + 125));
        if (woo) pages -= 0.5; // Woo pages hold 100 products: allow twice as many per call
        st.stats = { ...(st.stats || {}), seen: (st.stats?.seen || 0) + rows.length };
        log(`${sup.id} products page ${st.page}: ${rows.length}`);
        st.page++;
      } else if (st.phase === 'collections') {
        if (st.col_idx >= cols.length) { st.phase = 'finish'; continue; }
        const h = cols[st.col_idx].handle;
        let list = [];
        try { list = (await getJson(`${base}/collections/${encodeURIComponent(h)}/products.json?limit=${PAGE}&page=${st.page}`)).products || []; }
        catch (e) { log(`collection ${h} failed: ${e.message}`); list = []; }
        pages++;
        if (list.length) await D.rpc('sync_mark_collection', { p_supplier: sup.id, p_handle: h, p_ids: list.map((p) => pid(sup.id, p.id)) });
        log(`${sup.id} collection ${h} page ${st.page}: ${list.length}`);
        if (list.length < PAGE) { st.col_idx++; st.page = 1; } else st.page++;
      } else if (st.phase === 'finish') {
        const r = await D.rpc('sync_finish', { p_supplier: sup.id, p_run: st.run_id });
        await D.patch('sync_runs', `id=eq.${st.run_id}`, { products_seen: st.stats?.seen || 0 });
        st.stats = { ...(st.stats || {}), ...r };
        st.phase = 'idle'; st.finished_at = new Date().toISOString();
        st.next_at = new Date(Date.now() + 6 * 3600e3).toISOString();
        st.last_error = null;
        log(`${sup.id} finished`, r);
      }
    }
  } catch (e) {
    st.last_error = String(e.message || e).slice(0, 500);
    await D.upsertState(st);
    throw e;
  }
  await D.upsertState(st);
  return { supplier: sup.id, phase: st.phase, page: st.page, col_idx: st.col_idx, stats: st.stats };
}
