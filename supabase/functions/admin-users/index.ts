// Lets the shop owner create staff logins for /admin. Uses the service role, so it checks the caller first.
const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (o: unknown, status = 200) => Response.json(o, { status, headers: cors });
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  const who = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${jwt}` } }).then((r) => (r.ok ? r.json() : null));
  if (!who?.id) return json({ error: 'Please sign in again.' }, 401);
  const owner = await fetch(`${URL_}/rest/v1/admins?select=role&user_id=eq.${who.id}`, { headers: H }).then((r) => r.json());
  if (!owner.length || owner[0].role !== 'owner') return json({ error: 'Only the owner can add logins.' }, 403);
  const { email, name, password } = await req.json().catch(() => ({}));
  if (!email || !password || String(password).length < 8) return json({ error: 'Enter an email and a password of 8+ characters.' }, 400);
  const u = await fetch(`${URL_}/auth/v1/admin/users`, { method: 'POST', headers: H, body: JSON.stringify({ email, password, email_confirm: true }) }).then((r) => r.json());
  if (!u?.id) return json({ error: u?.msg || u?.message || 'Could not create the login.' }, 400);
  await fetch(`${URL_}/rest/v1/admins`, { method: 'POST', headers: H, body: JSON.stringify({ user_id: u.id, email, name: name || null, role: 'staff' }) });
  return json({ ok: true });
});
