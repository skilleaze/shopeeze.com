// Sends a confirmed Shopeiz order to the bridge Shopify store, where the Dropdash / vFulfill apps pick it
// up and ship it. Called by pg_cron (orders that reached "confirmed") and by the admin "Send to bridge" button.
// Auth: x-sync-key header (same key as supplier-sync).
const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const API = '2025-07';
const get = async (p: string) => { const r = await fetch(`${URL_}/rest/v1/${p}`, { headers: H }); if (!r.ok) throw new Error(`DB ${r.status} ${await r.text()}`); return r.json(); };
const patch = (p: string, b: unknown) => fetch(`${URL_}/rest/v1/${p}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(b) });
const post = (p: string, b: unknown) => fetch(`${URL_}/rest/v1/${p}`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(b) });

async function token(s: { id: string; base_url: string }) {
  const rows = await get(`private_config?select=k,v&k=like.bridge_${s.id}_*`);
  const cfg: Record<string, string> = Object.fromEntries(rows.map((r: { k: string; v: string }) => [r.k.replace(`bridge_${s.id}_`, ''), r.v]));
  if (cfg.token && Number(cfg.exp || 0) > Date.now() + 300e3) return cfg.token;
  if (!cfg.client_id || !cfg.client_secret) throw new Error('Bridge store keys are not saved yet');
  const r = await fetch(`${s.base_url.replace(/\/+$/, '')}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: cfg.client_id, client_secret: cfg.client_secret }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('Bridge store refused the keys: ' + r.status);
  await fetch(`${URL_}/rest/v1/rpc/bridge_cache_token`, { method: 'POST', headers: H, body: JSON.stringify({ p_supplier: s.id, p_token: j.access_token, p_exp: Date.now() + Number(j.expires_in || 86399) * 1000 }) });
  return j.access_token as string;
}

async function sendOrder(id: number) {
  const [o] = await get(`orders?select=*&id=eq.${id}`);
  if (!o) return { id, error: 'order not found' };
  if (o.supplier_order) return { id, skipped: 'already sent: ' + o.supplier_order };
  const items = await get(`order_items?select=*&order_id=eq.${id}`);
  const sups = await get(`suppliers?select=id,base_url,platform&platform=eq.shopify_admin`);
  const out: unknown[] = [];
  const refs: string[] = [];
  for (const s of sups) {
    const mine = items.filter((i: { supplier: string }) => i.supplier === s.id);
    if (!mine.length) continue;
    let tok: string;
    try { tok = await token(s); } catch (e) { out.push({ supplier: s.id, error: String(e) }); continue; }
    const [first, ...rest] = String(o.name || '').trim().split(/\s+/);
    const addr = { first_name: first || 'Customer', last_name: rest.join(' ') || '.', address1: o.addr, city: o.city, province: o.state || undefined, zip: o.pin, country: 'India', country_code: 'IN', phone: '+91' + o.phone };
    const cod = o.pay_method === 'cod';
    // amount the courier must collect for these items on COD (their share of the Shopeiz total)
    const share = items.length === mine.length ? Number(o.total) : mine.reduce((a: number, i: { price: number; qty: number }) => a + Number(i.price) * i.qty, 0);
    const body = { order: {
      line_items: mine.map((i: { variant_id: string; src_id: string; qty: number; price: number; title: string }) => (i.variant_id ? { variant_id: Number(i.variant_id), quantity: i.qty, price: String(i.price) } : { title: i.title, quantity: i.qty, price: String(i.price) })),
      email: o.email || undefined, phone: '+91' + o.phone,
      shipping_address: addr, billing_address: addr,
      financial_status: cod && o.pay_status !== 'paid' ? 'pending' : 'paid',
      gateway: cod ? 'Cash on Delivery (COD)' : 'UPI',
      tags: `Shopeiz, ${o.code}, ${cod ? 'COD' : 'Prepaid'}`,
      note: `Shopeiz order ${o.code}. ${cod ? 'Cash on delivery: collect ₹' + share.toFixed(0) : 'Prepaid by UPI: collect nothing'}.`,
      send_receipt: false, send_fulfillment_receipt: false, inventory_behaviour: 'decrement_obeying_policy',
    } };
    const r = await fetch(`${s.base_url.replace(/\/+$/, '')}/admin/api/${API}/orders.json`, { method: 'POST', headers: { 'X-Shopify-Access-Token': tok, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { out.push({ supplier: s.id, error: `${r.status} ${JSON.stringify(j.errors || j).slice(0, 300)}` }); continue; }
    refs.push(`${s.id} ${j.order.name}`);
    out.push({ supplier: s.id, bridge_order: j.order.name });
  }
  const errs = out.filter((x) => (x as { error?: string }).error);
  if (refs.length) {
    await patch(`orders?id=eq.${id}`, { supplier_order: refs.join(', '), status: errs.length ? o.status : 'placed', placed_at: errs.length ? o.placed_at : new Date().toISOString() });
    await post('order_events', { order_id: id, kind: 'note', note: `Sent to bridge store: ${refs.join(', ')}` });
  }
  if (errs.length) await post('order_events', { order_id: id, kind: 'note', note: 'Bridge store error: ' + JSON.stringify(errs).slice(0, 500) });
  return { id, out };
}

Deno.serve(async (req: Request) => {
  const [k] = await get('private_config?select=v&k=eq.sync_key');
  if (!k || req.headers.get('x-sync-key') !== k.v) return new Response('Forbidden', { status: 403 });
  const body = await req.json().catch(() => ({}));
  let ids: number[] = body.id ? [Number(body.id)] : [];
  if (!ids.length) {
    // all confirmed orders with bridge items that were not sent yet
    const rows = await get(`rpc/bridge_pending`).catch(() => []);
    ids = (rows || []).map((r: { id: number }) => r.id);
  }
  const res = [];
  for (const id of ids.slice(0, 20)) { try { res.push(await sendOrder(id)); } catch (e) { res.push({ id, error: String(e) }); } }
  return Response.json({ ok: true, res });
});
