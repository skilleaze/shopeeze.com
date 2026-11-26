// Customer review photos. Only accepted from a delivered order's private review link,
// at most 20 photos per order, images up to 6 MB. Reviews (and their photos) still need admin approval.
const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const err = (m: string, s = 400) => Response.json({ error: m }, { status: s, headers: CORS });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return err('POST only', 405);
  const form = await req.formData().catch(() => null);
  if (!form) return err('Send the photo as a form upload.');
  const token = String(form.get('token') || '');
  const file = form.get('file');
  if (!/^[0-9a-f-]{36}$/.test(token)) return err('This review link is not valid.');
  if (!(file instanceof File)) return err('No photo received.');
  const ext = TYPES[file.type];
  if (!ext) return err('Please upload a JPG, PNG or WebP photo.');
  if (file.size > 6 * 1024 * 1024) return err('That photo is larger than 6 MB.');
  const r = await fetch(`${URL_}/rest/v1/orders?select=code,status&review_token=eq.${token}`, { headers: H });
  const o = (await r.json())[0];
  if (!o) return err('This review link is not valid.', 403);
  if (!['delivered', 'replaced'].includes(o.status)) return err('Photos can be added once your order is delivered.', 403);
  const folder = String(o.code).replace(/[^A-Za-z0-9]/g, '');
  const ls = await fetch(`${URL_}/storage/v1/object/list/review-photos`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: folder + '/', limit: 100 }) });
  const have = ls.ok ? (await ls.json()).length : 0;
  if (have >= 20) return err('You have reached the photo limit for this order.', 429);
  const name = `${folder}/${crypto.randomUUID()}.${ext}`;
  const up = await fetch(`${URL_}/storage/v1/object/review-photos/${name}`, { method: 'POST', headers: { ...H, 'Content-Type': file.type, 'cache-control': 'max-age=31536000' }, body: new Uint8Array(await file.arrayBuffer()) });
  if (!up.ok) return err('Upload failed. Please try again.', 502);
  return Response.json({ url: `${URL_}/storage/v1/object/public/review-photos/${name}` }, { headers: CORS });
});
