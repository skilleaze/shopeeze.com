// Bridge store product sync: reads every product in our bridge Shopify store (Dropdash / vFulfill push
// products there) through the Admin API and upserts them as supplier 'bridge'. The price set in the bridge
// store is our COST; Shopeiz adds the usual margin (sell_price trigger). Runs from pg_cron every 6 hours
// and from the admin "Sync now" button. Auth: x-sync-key.
const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const API = '2025-07';
const db = async (p: string, init: RequestInit = {}) => {
  const r = await fetch(`${URL_}/rest/v1/${p}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const t = await r.text(); if (!r.ok) throw new Error(`DB ${r.status} ${p.split('?')[0]}: ${t.slice(0, 200)}`); return t ? JSON.parse(t) : null;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function token(s: { id: string; base_url: string }) {
  const rows = await db(`private_config?select=k,v&k=like.bridge_${s.id}_*`);
  const cfg: Record<string, string> = Object.fromEntries(rows.map((r: { k: string; v: string }) => [r.k.replace(`bridge_${s.id}_`, ''), r.v]));
  if (cfg.token && Number(cfg.exp || 0) > Date.now() + 300e3) return cfg.token;
  if (!cfg.client_id || !cfg.client_secret) throw new Error('Bridge store keys are not saved yet (admin > Suppliers)');
  const r = await fetch(`${s.base_url.replace(/\/+$/, '')}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: cfg.client_id, client_secret: cfg.client_secret }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('Bridge store refused the keys: ' + r.status + ' ' + JSON.stringify(j).slice(0, 150));
  await db('rpc/bridge_cache_token', { method: 'POST', body: JSON.stringify({ p_supplier: s.id, p_token: j.access_token, p_exp: Date.now() + Number(j.expires_in || 86399) * 1000 }) });
  return j.access_token as string;
}

const clean = (t: string) => String(t || '').replace(/\s+/g, ' ').replace(/\b(dropdash|vfulfill|v fulfill)\b/gi, '').trim().slice(0, 160);
const cleanHtml = (h: string) => String(h || '').replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, '').replace(/<(\/?)([a-z0-9]+)\b[^>]*>/gi, (m, c, t) => (/^(p|br|ul|ol|li|b|strong|i|em|h3|h4|table|tr|td|th|tbody|thead)$/i.test(t) ? `<${c}${t.toLowerCase()}>` : ' ')).replace(/https?:\/\/\S+/g, '').trim().slice(0, 20000);

function map(sp: any, run: number) {
  const variants = (sp.variants || []).map((v: any) => ({
    id: String(v.id), title: v.title, sku: v.sku || null, cost: v.price != null ? Number(v.price) : null,
    mrp: Number(v.compare_at_price) > 0 ? Number(v.compare_at_price) : null,
    avail: !(v.inventory_management === 'shopify' && v.inventory_policy === 'deny' && Number(v.inventory_quantity) <= 0), grams: v.grams || null,
  }));
  const live = variants.filter((v: any) => v.avail && v.cost > 0);
  const pool = live.length ? live : variants.filter((v: any) => v.cost > 0);
  const cheapest = pool.slice().sort((a: any, b: any) => a.cost - b.cost)[0];
  const images = (sp.images || []).map((i: any) => String(i.src || '').split('?')[0]).filter(Boolean).slice(0, 10);
  const active = !sp.status || sp.status === 'active';
  const cost = cheapest ? cheapest.cost : null;
  return {
    id: 'br' + sp.id, supplier: 'bridge', src_id: String(sp.id), handle: sp.handle, title_src: sp.title, name: clean(sp.title),
    cat: 'home', sub: String(sp.product_type || '').trim().slice(0, 60) || null,
    tags: String(sp.tags || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 30),
    desc_html: cleanHtml(sp.body_html), images, variants, cost, mrp: cheapest ? cheapest.mrp : null,
    available: active && live.length > 0,
    hidden_reason: !cost ? 'zero price' : !images.length ? 'no photo' : !active ? 'not active in bridge store' : null,
    collections: [], rank: (live.length ? 12 : 0) + Math.min(images.length, 5) * 0.2,
    last_seen_run: run, synced_at: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  const [k] = await db('private_config?select=v&k=eq.sync_key');
  if (!k || req.headers.get('x-sync-key') !== k.v) return new Response('Forbidden', { status: 403 });
  const sups = await db('suppliers?select=id,base_url&platform=eq.shopify_admin&base_url=not.is.null');
  const res = [];
  for (const s of sups) {
    const run = (await db('sync_runs', { method: 'POST', body: JSON.stringify({ supplier: s.id }), headers: { Prefer: 'return=representation' } }))[0].id;
    let seen = 0;
    try {
      const tok = await token(s);
      let url: string | null = `${s.base_url.replace(/\/+$/, '')}/admin/api/${API}/products.json?limit=250`;
      while (url) {
        let r: Response | null = null;
        for (let i = 0; i < 4; i++) { r = await fetch(url, { headers: { 'X-Shopify-Access-Token': tok } }); if (r.status !== 429 && r.status < 500) break; await sleep(1500 * (i + 1)); }
        if (!r || !r.ok) throw new Error(`${r && r.status} from bridge store: ${r ? (await r.text()).slice(0, 200) : ''}`);
        const list = ((await r.json()).products || []).map((p: any) => map(p, run));
        for (let i = 0; i < list.length; i += 125) await db('products?on_conflict=id', { method: 'POST', body: JSON.stringify(list.slice(i, i + 125)), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
        seen += list.length;
        const next = ((r.headers.get('link') || '').match(/<([^>]+)>;\s*rel="next"/) || [])[1];
        url = next || null;
      }
      const fin = await db('rpc/sync_finish', { method: 'POST', body: JSON.stringify({ p_supplier: s.id, p_run: run }) });
      await db(`sync_runs?id=eq.${run}`, { method: 'PATCH', body: JSON.stringify({ products_seen: seen }), headers: { Prefer: 'return=minimal' } });
      await db('sync_state?on_conflict=supplier', { method: 'POST', body: JSON.stringify({ supplier: s.id, phase: 'idle', page: 1, run_id: run, finished_at: new Date().toISOString(), next_at: new Date(Date.now() + 6 * 3600e3).toISOString(), last_error: null, stats: { seen, ...fin } }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
      res.push({ supplier: s.id, seen, fin });
    } catch (e) {
      await db('sync_state?on_conflict=supplier', { method: 'POST', body: JSON.stringify({ supplier: s.id, phase: 'idle', page: 1, run_id: run, last_error: String((e as Error).message || e).slice(0, 400), next_at: new Date(Date.now() + 3600e3).toISOString(), stats: { seen } }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
      res.push({ supplier: s.id, error: String(e) });
    }
  }
  return Response.json({ ok: true, res });
});
