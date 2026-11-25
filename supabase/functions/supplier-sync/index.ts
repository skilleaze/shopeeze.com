// Supplier sync: called every 2 minutes by pg_cron. Each call handles a few pages of one supplier's
// public Shopify feed, so a full sync of thousands of products is spread over many short calls.
import { db, step } from './core.js';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  const D = db(URL_, KEY);
  const given = req.headers.get('x-sync-key') || '';
  const rows = await D.get('private_config?select=v&k=eq.sync_key');
  if (!rows.length || given !== rows[0].v) return new Response('Forbidden', { status: 403 });
  const body = await req.json().catch(() => ({}));
  const logs: string[] = [];
  try {
    const out = await step(D, { force: !!body.force, pagesPerCall: Number(body.pages) || 4, log: (...a: unknown[]) => logs.push(a.map(String).join(' ')) });
    return Response.json({ ok: true, ...out, logs });
  } catch (e) {
    return Response.json({ ok: false, error: String((e as Error).message || e), logs }, { status: 500 });
  }
});
