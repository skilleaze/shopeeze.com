// Imports brand images (hero, category covers) from licensed stock download links into the public
// "brand" storage bucket. Protected with the same sync key as supplier-sync.
const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

Deno.serve(async (req: Request) => {
  const given = req.headers.get('x-sync-key') || '';
  const r = await fetch(URL_ + '/rest/v1/private_config?select=v&k=eq.sync_key', { headers: H });
  const rows = await r.json();
  if (!rows.length || given !== rows[0].v) return new Response('Forbidden', { status: 403 });
  const { items = [] } = await req.json().catch(() => ({}));
  // Make sure the public bucket exists
  await fetch(URL_ + '/storage/v1/bucket', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'brand', name: 'brand', public: true }) });
  const out: unknown[] = [];
  for (const it of items) {
    try {
      const src = await fetch(it.url);
      if (!src.ok) { out.push({ name: it.name, error: 'download ' + src.status }); continue; }
      const buf = new Uint8Array(await src.arrayBuffer());
      const up = await fetch(URL_ + '/storage/v1/object/brand/' + it.name, { method: 'POST', headers: { ...H, 'Content-Type': src.headers.get('content-type') || 'image/jpeg', 'x-upsert': 'true', 'cache-control': 'max-age=31536000' }, body: buf });
      out.push({ name: it.name, bytes: buf.length, status: up.status });
    } catch (e) { out.push({ name: it.name, error: String(e) }); }
  }
  return Response.json({ ok: true, out });
});
