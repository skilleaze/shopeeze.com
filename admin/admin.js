/* Shopeiz Admin: orders, delivery, analytics, products, suppliers and settings.
   Talks to Supabase directly; row-level security only lets signed-in admins read or change anything. */
(function () {
  const CFG = (window.SZ && window.SZ.CFG) || {};
  const root = document.getElementById('root');
  if (!CFG.url || !CFG.key) { root.innerHTML = '<div class="login"><div class="card"><span class="wm">Shopeiz</span><p>The database is not connected yet. Add the Supabase URL and key in <code>assets/config.js</code>.</p></div></div>'; return; }
  const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true } });

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0) + '%';
  const ist = (d) => new Date(new Date(d).getTime() + 5.5 * 3600e3);
  const dt = (d) => (d ? ist(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) : '');
  const day = (d) => ist(d).toISOString().slice(0, 10);
  const today = () => day(Date.now());
  const ago = (d) => { const h = (Date.now() - new Date(d)) / 36e5; return h < 1 ? Math.max(1, Math.round(h * 60)) + ' min ago' : h < 48 ? Math.round(h) + ' h ago' : Math.round(h / 24) + ' days ago'; };
  const daysSince = (d) => Math.floor((Date.now() - new Date(d)) / 864e5);
  let toastT;
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); };
  const fail = (e) => { console.error(e); toast((e && e.message) || 'Something went wrong'); };
  async function q(p) { const r = await p; if (r.error) throw r.error; return r; }

  const STATUS = ['new', 'confirmed', 'placed', 'shipped', 'delivered', 'cancelled', 'rto', 'replaced'];
  const SLABEL = { new: 'New', confirmed: 'Confirmed', placed: 'Placed with supplier', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', rto: 'RTO (returned)', replaced: 'Replaced' };
  const NEXT = { new: ['confirmed', 'placed', 'cancelled'], confirmed: ['placed', 'cancelled'], placed: ['shipped', 'cancelled'], shipped: ['delivered', 'rto'], delivered: ['replaced'], rto: [], cancelled: ['new'], replaced: [] };
  const CATS = [['kitchen', 'Kitchen'], ['home', 'Home & Decor'], ['electronics', 'Electronics'], ['beauty', 'Beauty & Care'], ['fashion', 'Fashion'], ['kids', 'Toys & Kids'], ['drones', 'Drones'], ['cleaning', 'Cleaning & Storage'], ['auto', 'Car & Bike'], ['office', 'Office & Stationery'], ['sports', 'Sports & Outdoors'], ['tools', 'Tools & Hardware'], ['festive', 'Festive & Gifts']];
  const st = (s) => `<span class="st ${s}">${esc(SLABEL[s] || s)}</span>`;
  const profitOf = (o) => Number(o.total) - Number(o.cost_total) - Number(o.fee_total) - Number(o.extra_cost || 0);

  let me = null, suppliers = [], view = 'dashboard', newCount = 0;

  /* ---------- auth ---------- */
  async function boot() {
    const { data } = await sb.auth.getSession();
    if (!data.session) return loginView();
    const { data: a } = await sb.from('admins').select('*').eq('user_id', data.session.user.id).maybeSingle();
    if (!a) { root.innerHTML = `<div class="login"><div class="card"><span class="wm">Shopeiz</span><p>${esc(data.session.user.email)} is not an admin.</p><button class="btn" id="lo">Sign out</button></div></div>`; $('#lo').onclick = async () => { await sb.auth.signOut(); boot(); }; return; }
    me = a;
    suppliers = (await sb.from('suppliers').select('*').order('id')).data || [];
    shell();
    go(location.hash.slice(1) || 'dashboard');
    setInterval(pollNew, 60e3); pollNew();
  }
  function loginView() {
    root.innerHTML = `<div class="login"><div class="card"><span class="wm">Shopeiz</span> <b style="margin-left:6px">Admin</b>
      <form id="lf"><div class="f"><label>Username or email</label><input class="in" type="text" name="e" required autocomplete="username" autocapitalize="off"></div>
      <div class="f"><label>Password</label><input class="in" type="password" name="p" required autocomplete="current-password"></div>
      <p class="bad" id="le" style="margin:0;min-height:1em"></p><button class="btn pri">Sign in</button></form></div></div>`;
    $('#lf').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const u = f.e.value.trim().toLowerCase();
      const { error } = await sb.auth.signInWithPassword({ email: u.includes('@') ? u : u + '@shopeiz.com', password: f.p.value });
      if (error && /invalid/i.test(error.message)) { $('#le').textContent = 'Wrong username or password.'; return; }
      if (error) { $('#le').textContent = error.message; return; }
      boot();
    };
  }

  /* ---------- shell ---------- */
  const NAV = [['dashboard', 'Dashboard'], ['orders', 'Orders'], ['delivery', 'Delivery'], ['products', 'Products'], ['suppliers', 'Suppliers & sync'], ['settings', 'Settings']];
  function shell() {
    root.innerHTML = `<div class="mtop"><button class="btn sm" id="mb">Menu</button><span class="wm">Shopeiz</span></div>
    <div class="app"><aside id="side"><div class="brand"><span class="wm">Shopeiz</span><small>Admin</small></div>
      ${NAV.map(([k, l]) => `<a class="nav" href="#${k}" data-nav="${k}">${l}${k === 'orders' ? '<span class="pill" id="newpill" style="display:none"></span>' : ''}</a>`).join('')}
      <a class="nav" href="/" target="_blank">View store ↗</a>
      <div class="foot">${esc(me.email || '')}<br><a href="#" id="logout">Sign out</a></div></aside>
      <main id="main"></main></div>
    <div class="scrim" id="scrim"></div><div class="drawer" id="drawer"></div>`;
    $('#logout').onclick = async (e) => { e.preventDefault(); await sb.auth.signOut(); location.hash = ''; boot(); };
    $('#mb').onclick = () => $('#side').classList.toggle('on');
    $('#scrim').onclick = closeDrawer;
    window.addEventListener('hashchange', () => go(location.hash.slice(1)));
  }
  function go(v) {
    view = NAV.find((n) => n[0] === v) ? v : 'dashboard';
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === view));
    $('#side').classList.remove('on');
    const fn = { dashboard, orders, delivery, products, suppliersView, settings }[view === 'suppliers' ? 'suppliersView' : view];
    $('#main').innerHTML = '<div class="empty">Loading…</div>';
    fn().catch(fail);
  }
  async function pollNew() {
    const { count } = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new');
    newCount = count || 0;
    const p = $('#newpill'); if (p) { p.textContent = newCount; p.style.display = newCount ? '' : 'none'; }
    document.title = (newCount ? `(${newCount}) ` : '') + 'Shopeiz Admin';
  }
  function openDrawer(html) { const d = $('#drawer'); d.innerHTML = html; d.classList.add('on'); $('#scrim').classList.add('on'); d.scrollTop = 0; }
  function closeDrawer() { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); }

  /* ---------- dashboard ---------- */
  let range = '30';
  function rangeDates() {
    const t = today();
    const back = (n) => day(Date.now() - n * 864e5);
    if (range === 'today') return [t, t];
    if (range === 'month') return [t.slice(0, 8) + '01', t];
    return [back(Number(range) - 1), t];
  }
  async function dashboard() {
    const [d1, d2] = rangeDates();
    const { data: s } = await q(sb.rpc('admin_stats', { d1, d2 }));
    const m = s.money;
    const days = []; for (let t = new Date(d1); day(t) <= d2; t = new Date(t.getTime() + 864e5)) days.push(day(t));
    const byD = Object.fromEntries((s.daily || []).map((x) => [x.d, x]));
    const maxRev = Math.max(1, ...days.map((d) => Number((byD[d] || {}).revenue || 0)));
    const closed = m.closed_ship || 0;
    $('#main').innerHTML = `<div class="row"><div><h1>Dashboard</h1><p class="sub">${d1 === d2 ? d1 : d1 + ' to ' + d2} · India time</p></div><div class="sp"></div>
      <div class="tabs" id="rg">${[['today', 'Today'], ['7', '7 days'], ['30', '30 days'], ['month', 'This month'], ['90', '90 days']].map(([k, l]) => `<button data-r="${k}" class="${range === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    ${s.to_place || s.late ? `<div class="card" style="margin-bottom:14px;background:var(--warnbg);border-color:#EED9A8">${s.to_place ? `<b>${s.to_place}</b> order${s.to_place === 1 ? '' : 's'} waiting to be placed with the supplier. <a href="#orders">Open orders</a>. ` : ''}${s.late ? `<b>${s.late}</b> shipment${s.late === 1 ? ' is' : 's are'} over 10 days in transit. <a href="#delivery">Check delivery</a>.` : ''}</div>` : ''}
    <div class="grid k4">
      <div class="card kpi"><span>Orders</span><b>${m.orders}</b><small>${m.cancelled} cancelled</small></div>
      <div class="card kpi"><span>Revenue</span><b>${inr(m.revenue)}</b><small>excl. cancelled and RTO</small></div>
      <div class="card kpi"><span>Profit (delivered)</span><b class="${m.profit_delivered - m.rto_loss >= 0 ? 'ok' : 'bad'}">${inr(m.profit_delivered - m.rto_loss)}</b><small>+ ${inr(m.profit_pipeline)} on the way · RTO loss ${inr(m.rto_loss)}</small></div>
      <div class="card kpi"><span>Average order</span><b>${inr(s.aov)}</b><small>${m.orders ? pct(m.cod, m.orders) : '0%'} cash on delivery</small></div>
      <div class="card kpi"><span>Delivered</span><b>${m.delivered}</b><small>${inr(m.delivered_rev)} collected</small></div>
      <div class="card kpi"><span>RTO rate</span><b class="${closed && m.rto / closed > 0.2 ? 'bad' : ''}">${closed ? pct(m.rto, closed) : '–'}</b><small>${m.rto} returned of ${closed} completed</small></div>
      <div class="card kpi"><span>To place</span><b>${s.to_place}</b><small>new and confirmed</small></div>
      <div class="card kpi"><span>Live products</span><b>${Number(s.catalog.live).toLocaleString('en-IN')}</b><small>${Number(s.catalog.out).toLocaleString('en-IN')} out of stock · ${Number(s.catalog.hidden).toLocaleString('en-IN')} hidden</small></div>
    </div>
    <div class="card" style="margin-top:14px"><div class="row"><b>Revenue by day</b><span class="sp"></span><span class="muted">hover a bar for details</span></div>
      <div class="bars">${days.map((d) => { const x = byD[d] || { orders: 0, revenue: 0, profit: 0 }; return `<div style="height:${(Number(x.revenue) / maxRev) * 100}%" data-t="${d.slice(5)}: ${x.orders} orders · ${inr(x.revenue)} · profit ${inr(x.profit)}"></div>`; }).join('')}</div>
      <div class="bar-x"><span>${d1.slice(5)}</span><span>${d2.slice(5)}</span></div></div>
    <div class="grid k2" style="margin-top:14px">
      <div class="card"><b>Top products</b>${(s.top || []).length ? `<table style="margin-top:8px"><tr><th>Product</th><th class="num">Qty</th><th class="num">Revenue</th><th class="num">Margin</th></tr>${s.top.map((t) => `<tr><td><div class="row" style="flex-wrap:nowrap">${t.img ? `<img class="thumb" src="${esc(t.img)}${/shopify/.test(t.img) ? '?width=80' : ''}">` : ''}<a href="/products/${esc(t.slug)}" target="_blank">${esc(t.title)}</a></div></td><td class="num">${t.qty}</td><td class="num">${inr(t.revenue)}</td><td class="num">${inr(t.margin)}</td></tr>`).join('')}</table>` : '<div class="empty">No orders yet in this period.</div>'}</div>
      <div class="card"><b>Orders by status</b><div style="margin-top:10px">${STATUS.filter((x) => s.by_status[x]).map((x) => `<div class="row" style="margin:6px 0"><span style="width:150px">${st(x)}</span><div class="hbar sp"><i style="width:${(s.by_status[x] / Math.max(1, m.orders_all)) * 100}%"></i></div><b style="width:40px;text-align:right">${s.by_status[x]}</b></div>`).join('') || '<div class="empty">No orders yet.</div>'}</div>
        <b style="display:block;margin-top:20px">Top places</b>${(s.states || []).map((p) => `<div class="row" style="margin:6px 0"><span class="sp">${esc(p.place)}</span><span class="muted">${p.n} orders</span><b style="width:90px;text-align:right">${inr(p.revenue)}</b></div>`).join('') || '<p class="muted">No orders yet.</p>'}</div>
    </div>`;
    $$('#rg button').forEach((b) => (b.onclick = () => { range = b.dataset.r; dashboard().catch(fail); }));
  }

  /* ---------- orders ---------- */
  const OF = { status: 'open', q: '', page: 0 };
  const OPEN = ['new', 'confirmed', 'placed', 'shipped'];
  function orderQuery(sel = '*') {
    let r = sb.from('orders').select(sel, { count: 'exact' }).order('created_at', { ascending: false });
    if (OF.status === 'open') r = r.in('status', OPEN); else if (OF.status !== 'all') r = r.eq('status', OF.status);
    const t = OF.q.trim();
    if (t) { const d = t.replace(/[^0-9]/g, ''); r = r.or(`code.ilike.*${t.replace(/[,()*]/g, '')}*,name.ilike.*${t.replace(/[,()*]/g, '')}*${d.length >= 4 ? `,phone.ilike.*${d}*` : ''}`); }
    return r;
  }
  async function orders() {
    const counts = {};
    await Promise.all(STATUS.map(async (s) => { const { count } = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', s); counts[s] = count || 0; }));
    const { data, count } = await q(orderQuery('id,code,created_at,status,pay_method,pay_status,name,phone,city,pin,total,cost_total,fee_total,extra_cost,supplier_order,tracking_no').range(OF.page * 50, OF.page * 50 + 49));
    const open = OPEN.reduce((a, s) => a + counts[s], 0);
    $('#main').innerHTML = `<div class="row"><div><h1>Orders</h1><p class="sub">New orders: confirm by phone, place them with the supplier, then add tracking.</p></div><span class="sp"></span><button class="btn" id="csv">Export CSV</button></div>
    <div class="row" style="margin-bottom:12px"><input class="in" id="oq" placeholder="Search order no., name or phone" value="${esc(OF.q)}" style="width:min(340px,100%)"></div>
    <div class="tabs" id="ot">${[['open', 'Open', open], ...STATUS.map((s) => [s, SLABEL[s], counts[s]]), ['all', 'All', null]].map(([k, l, n]) => `<button data-s="${k}" class="${OF.status === k ? 'on' : ''}">${l}${n != null ? `<i>${n}</i>` : ''}</button>`).join('')}</div>
    <div class="tbl"><table><tr><th>Order</th><th>Placed</th><th>Customer</th><th class="hide-m">Place</th><th>Status</th><th>Payment</th><th class="num">Total</th><th class="num hide-m">Profit</th></tr>
    ${data.map((o) => `<tr class="click" data-id="${o.id}"><td><b>${esc(o.code)}</b>${o.supplier_order ? `<div class="muted" style="font-size:12px">Supplier ${esc(o.supplier_order)}</div>` : ''}</td><td>${dt(o.created_at)}<div class="muted" style="font-size:12px">${ago(o.created_at)}</div></td><td>${esc(o.name)}<div class="muted" style="font-size:12px">${esc(o.phone)}</div></td><td class="hide-m">${esc(o.city)} ${esc(o.pin)}</td><td>${st(o.status)}</td><td>${o.pay_method.toUpperCase()} ${st(o.pay_status)}</td><td class="num">${inr(o.total)}</td><td class="num hide-m">${inr(profitOf(o))}</td></tr>`).join('') || '<tr><td colspan="8"><div class="empty">No orders here.</div></td></tr>'}
    </table></div>
    <div class="row" style="margin-top:12px"><span class="muted">${count} order${count === 1 ? '' : 's'}</span><span class="sp"></span>${OF.page ? '<button class="btn sm" id="pp">Previous</button>' : ''}${(OF.page + 1) * 50 < count ? '<button class="btn sm" id="np">Next</button>' : ''}</div>`;
    $$('#ot button').forEach((b) => (b.onclick = () => { OF.status = b.dataset.s; OF.page = 0; orders().catch(fail); }));
    let t; $('#oq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { OF.q = e.target.value; OF.page = 0; orders().then(() => { const i = $('#oq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }).catch(fail); }, 350); };
    $$('tr.click').forEach((r) => (r.onclick = () => orderDetail(Number(r.dataset.id))));
    if ($('#pp')) $('#pp').onclick = () => { OF.page--; orders().catch(fail); };
    if ($('#np')) $('#np').onclick = () => { OF.page++; orders().catch(fail); };
    $('#csv').onclick = exportCsv;
  }
  async function exportCsv() {
    const { data } = await q(orderQuery('*, order_items(title,variant_title,sku,qty,price,cost,fee)').limit(5000));
    const cols = ['code', 'created_at', 'status', 'pay_method', 'pay_status', 'name', 'phone', 'email', 'addr', 'city', 'state', 'pin', 'subtotal', 'discount', 'ship_fee', 'cod_fee', 'total', 'cost_total', 'fee_total', 'extra_cost', 'profit', 'supplier_order', 'courier', 'tracking_no', 'items'];
    const rows = data.map((o) => ({ ...o, created_at: dt(o.created_at), profit: profitOf(o), items: o.order_items.map((i) => `${i.qty} x ${i.title}${i.variant_title ? ' (' + i.variant_title + ')' : ''}${i.sku ? ' [' + i.sku + ']' : ''}`).join('; ') }));
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => `"${String(r[c] == null ? '' : r[c]).replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = `shopeiz-orders-${today()}.csv`; a.click();
  }
  const supById = (id) => suppliers.find((s) => s.id === id) || {};
  async function orderDetail(id) {
    const [{ data: o }, { data: items }, { data: ev }] = await Promise.all([
      q(sb.from('orders').select('*').eq('id', id).single()),
      q(sb.from('order_items').select('*').eq('order_id', id).order('id')),
      q(sb.from('order_events').select('*').eq('order_id', id).order('at', { ascending: false })),
    ]);
    const address = `${o.name}\n${o.addr}\n${o.city}${o.state ? ', ' + o.state : ''} - ${o.pin}\nPhone: ${o.phone}`;
    const sups = [...new Set(items.map((i) => i.supplier))];
    const wa = `https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.name.split(' ')[0]}, this is Shopeiz about your order ${o.code} for ${inr(o.total)}. `)}`;
    openDrawer(`<div class="hd"><b style="font-size:18px">${esc(o.code)}</b>${st(o.status)}<span class="sp"></span><button class="btn sm" id="dc">Close</button></div>
    <div class="bd">
      <div class="sec"><h3>Move to</h3><div class="flow">${(NEXT[o.status] || []).map((s) => `<button class="btn ${['placed', 'shipped', 'delivered'].includes(s) ? 'pri' : ''}" data-to="${s}">${SLABEL[s]}</button>`).join('') || '<span class="muted">Final status.</span>'}
        <select class="in" id="anyst" style="margin-left:auto"><option value="">Set any status…</option>${STATUS.map((s) => `<option value="${s}">${SLABEL[s]}</option>`).join('')}</select></div></div>
      <div class="grid k2 sec">
        <div><h3>Customer</h3><dl class="kv"><dt>Name</dt><dd>${esc(o.name)}</dd><dt>Phone</dt><dd><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a> · <a href="${wa}" target="_blank">WhatsApp</a></dd>${o.email ? `<dt>Email</dt><dd>${esc(o.email)}</dd>` : ''}<dt>Address</dt><dd style="white-space:pre-line">${esc(o.addr)}\n${esc(o.city)}${o.state ? ', ' + esc(o.state) : ''} - ${esc(o.pin)}</dd></dl>
          <button class="btn sm" id="cpa" style="margin-top:8px">Copy address for supplier</button></div>
        <div><h3>Money</h3><dl class="kv"><dt>Subtotal</dt><dd>${inr(o.subtotal)}</dd>${Number(o.discount) ? `<dt>Promo ${esc(o.promo || '')}</dt><dd>−${inr(o.discount)}</dd>` : ''}<dt>Delivery</dt><dd>${inr(o.ship_fee)}</dd>${Number(o.cod_fee) ? `<dt>COD fee</dt><dd>${inr(o.cod_fee)}</dd>` : ''}<dt><b>Customer pays</b></dt><dd><b>${inr(o.total)}</b> · ${o.pay_method.toUpperCase()} ${st(o.pay_status)}</dd>
          <dt>Supplier cost</dt><dd>${inr(o.cost_total)} + ${inr(o.fee_total)} fees</dd><dt>Profit</dt><dd><b class="${profitOf(o) >= 0 ? 'ok' : 'bad'}">${inr(profitOf(o))}</b></dd></dl>
          <div class="row" style="margin-top:8px">${o.pay_status !== 'paid' ? '<button class="btn sm" data-pay="paid">Mark paid</button>' : ''}${o.pay_status === 'paid' ? '<button class="btn sm" data-pay="refunded">Mark refunded</button>' : ''}</div></div>
      </div>
      <div class="sec"><h3>Items · place these with ${sups.map((s) => esc(supById(s).name || s)).join(', ')}</h3>
        ${items.map((i) => { const sp = supById(i.supplier); const link = sp.base_url && i.handle ? `${sp.base_url}/products/${i.handle}${i.variant_id ? '?variant=' + i.variant_id : ''}` : ''; return `<div class="item">${i.img ? `<img class="thumb" src="${esc(i.img)}${/shopify/.test(i.img) ? '?width=100' : ''}">` : ''}<div class="sp"><b>${esc(i.title)}</b>${i.variant_title ? ` · ${esc(i.variant_title)}` : ''}<div class="meta">${esc(sp.name || i.supplier || '')}${i.sku ? ' · SKU ' + esc(i.sku) : ''} · cost ${inr(i.cost)} + fee ${inr(i.fee)} · sold at ${inr(i.price)}</div>
          <div class="row" style="margin-top:4px">${link ? `<a class="btn sm" href="${esc(link)}" target="_blank">Open on ${esc(sp.name)} ↗</a>` : ''}<a class="btn sm" href="/products/${esc(i.slug)}" target="_blank">Our page ↗</a></div></div><div style="text-align:right"><b>× ${i.qty}</b><div class="muted">${inr(i.price * i.qty)}</div></div></div>`; }).join('')}</div>
      <div class="sec"><h3>Supplier and tracking</h3><div class="fgrid">
        <div class="f"><label>Supplier order ID</label><input class="in" id="so" value="${esc(o.supplier_order || '')}"></div>
        <div class="f"><label>Courier</label><input class="in" id="cr" value="${esc(o.courier || '')}" placeholder="Delhivery, Xpressbees…"></div>
        <div class="f"><label>Tracking number (AWB)</label><input class="in" id="tn" value="${esc(o.tracking_no || '')}"></div>
        <div class="f" style="grid-column:1/-1"><label>Tracking link</label><input class="in" id="tu" value="${esc(o.tracking_url || '')}" placeholder="https://…"></div>
        <div class="f"><label>Extra cost (RTO, refund, re-ship)</label><input class="in" id="xc" type="number" value="${Number(o.extra_cost) || 0}"></div>
      </div>
      <div class="f" style="margin-top:12px"><label>Notes</label><textarea class="in" id="nt">${esc(o.notes || '')}</textarea></div>
      <div class="row" style="margin-top:10px"><button class="btn dark" id="sv">Save</button>${o.tracking_no ? `<button class="btn" id="sendtr">WhatsApp tracking to customer</button>` : ''}</div></div>
      <div class="sec"><h3>History</h3>${ev.map((e) => `<div class="ev"><span class="muted">${dt(e.at)}</span> · ${esc(e.note || e.kind)}${e.by_email ? ` <span class="muted">by ${esc(e.by_email)}</span>` : ''}</div>`).join('')}</div>
      <div class="muted" style="font-size:12px">${o.utm && Object.keys(o.utm).length ? 'Came from: ' + esc(Object.entries(o.utm).map(([k, v]) => k + '=' + v).join(' ')) : ''}</div>
    </div>`);
    const d = $('#drawer');
    $('#dc', d).onclick = closeDrawer;
    $('#cpa', d).onclick = () => { navigator.clipboard.writeText(address); toast('Address copied'); };
    const setStatus = async (s) => {
      const patch = { status: s };
      if (s === 'shipped' && !$('#tn', d).value.trim() && !confirm('No tracking number yet. Mark as shipped anyway?')) return;
      await q(sb.from('orders').update(patch).eq('id', id)); toast('Status: ' + SLABEL[s]); orderDetail(id); refresh();
    };
    $$('[data-to]', d).forEach((b) => (b.onclick = () => setStatus(b.dataset.to).catch(fail)));
    $('#anyst', d).onchange = (e) => e.target.value && setStatus(e.target.value).catch(fail);
    $$('[data-pay]', d).forEach((b) => (b.onclick = async () => { await q(sb.from('orders').update({ pay_status: b.dataset.pay }).eq('id', id)).catch(fail); orderDetail(id); refresh(); }));
    $('#sv', d).onclick = async () => {
      try {
        await q(sb.from('orders').update({ supplier_order: $('#so', d).value.trim() || null, courier: $('#cr', d).value.trim() || null, tracking_no: $('#tn', d).value.trim() || null, tracking_url: $('#tu', d).value.trim() || null, extra_cost: Number($('#xc', d).value) || 0, notes: $('#nt', d).value }).eq('id', id));
        const n = $('#nt', d).value.trim();
        if (n && n !== (o.notes || '').trim()) await sb.from('order_events').insert({ order_id: id, kind: 'note', note: n.slice(0, 300), by_email: me.email });
        toast('Saved'); orderDetail(id); refresh();
      } catch (e) { fail(e); }
    };
    if ($('#sendtr', d)) $('#sendtr', d).onclick = () => window.open(`https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.name.split(' ')[0]}, your Shopeiz order ${o.code} has shipped${o.courier ? ' with ' + o.courier : ''}. Tracking number: ${o.tracking_no}${o.tracking_url ? '\nTrack it here: ' + o.tracking_url : ''}`)}`, '_blank');
  }
  const refresh = () => { pollNew(); if (view === 'orders') orders().catch(fail); if (view === 'delivery') delivery().catch(fail); };

  /* ---------- delivery ---------- */
  async function delivery() {
    const { data } = await q(sb.from('orders').select('id,code,name,phone,city,pin,status,courier,tracking_no,tracking_url,placed_at,shipped_at,total,pay_method').in('status', ['placed', 'shipped']).order('shipped_at', { ascending: true, nullsFirst: true }).limit(500));
    const placed = data.filter((o) => o.status === 'placed'), shipped = data.filter((o) => o.status === 'shipped');
    const late = shipped.filter((o) => o.shipped_at && daysSince(o.shipped_at) > 10);
    const row = (o) => { const n = o.status === 'shipped' ? daysSince(o.shipped_at || o.placed_at) : daysSince(o.placed_at); return `<tr class="click" data-id="${o.id}"><td><b>${esc(o.code)}</b></td><td>${esc(o.name)}<div class="muted" style="font-size:12px">${esc(o.city)} ${esc(o.pin)}</div></td><td>${st(o.status)}</td><td>${o.tracking_no ? `${esc(o.courier || '')} ${o.tracking_url ? `<a href="${esc(o.tracking_url)}" target="_blank" onclick="event.stopPropagation()">${esc(o.tracking_no)} ↗</a>` : esc(o.tracking_no)}` : '<span class="bad">No tracking yet</span>'}</td><td class="num ${n > 10 ? 'bad' : n > 7 ? '' : 'ok'}"><b>${n}</b> days</td><td class="num">${o.pay_method === 'cod' ? 'COD ' + inr(o.total) : 'Prepaid'}</td><td>${o.status === 'shipped' ? `<button class="btn sm" data-d="${o.id}">Delivered</button> <button class="btn sm" data-r="${o.id}">RTO</button>` : ''}</td></tr>`; };
    $('#main').innerHTML = `<h1>Delivery</h1><p class="sub">Orders with the supplier or on the way. Promise to customers: 6 to 10 working days.</p>
    <div class="grid k4" style="margin-bottom:14px"><div class="card kpi"><span>Placed, not shipped</span><b>${placed.length}</b></div><div class="card kpi"><span>In transit</span><b>${shipped.length}</b></div><div class="card kpi"><span>Over 10 days</span><b class="${late.length ? 'bad' : ''}">${late.length}</b></div><div class="card kpi"><span>COD to collect</span><b>${inr(shipped.filter((o) => o.pay_method === 'cod').reduce((a, o) => a + Number(o.total), 0))}</b></div></div>
    <div class="tbl"><table><tr><th>Order</th><th>Customer</th><th>Status</th><th>Tracking</th><th class="num">Days</th><th class="num">Collect</th><th></th></tr>${data.map(row).join('') || '<tr><td colspan="7"><div class="empty">Nothing in transit.</div></td></tr>'}</table></div>`;
    $$('tr.click').forEach((r) => (r.onclick = (e) => { if (e.target.closest('button')) return; orderDetail(Number(r.dataset.id)); }));
    $$('[data-d]').forEach((b) => (b.onclick = async () => { await q(sb.from('orders').update({ status: 'delivered' }).eq('id', b.dataset.d)).catch(fail); toast('Marked delivered'); delivery(); }));
    $$('[data-r]').forEach((b) => (b.onclick = async () => { if (!confirm('Mark this order as returned to origin (RTO)?')) return; await q(sb.from('orders').update({ status: 'rto' }).eq('id', b.dataset.r)).catch(fail); toast('Marked RTO'); delivery(); }));
  }

  /* ---------- products ---------- */
  const PF = { q: '', cat: '', sup: '', state: 'live', sort: 'new', page: 0 };
  async function products() {
    let r = sb.from('products').select('id,supplier,display_title,slug,category,sub,cost,price,price_override,was,mrp,available,active,featured,hidden_reason,images,synced_at,handle', { count: 'exact' });
    if (PF.q.trim()) r = r.ilike('display_title', `%${PF.q.trim()}%`);
    if (PF.cat) r = r.eq('category', PF.cat);
    if (PF.sup) r = r.eq('supplier', PF.sup);
    if (PF.state === 'live') r = r.eq('active', true).eq('available', true).is('hidden_reason', null);
    if (PF.state === 'out') r = r.eq('available', false);
    if (PF.state === 'hidden') r = r.or('active.eq.false,hidden_reason.not.is.null');
    if (PF.state === 'featured') r = r.eq('featured', true);
    if (PF.state === 'override') r = r.not('price_override', 'is', null);
    r = PF.sort === 'price' ? r.order('price', { ascending: true }) : PF.sort === 'pricehi' ? r.order('price', { ascending: false }) : PF.sort === 'title' ? r.order('display_title') : r.order('created_at', { ascending: false });
    const { data, count } = await q(r.range(PF.page * 50, PF.page * 50 + 49));
    $('#main').innerHTML = `<div class="row"><div><h1>Products</h1><p class="sub">Price = supplier cost + your margin, rounded up to the rupee. Set a fixed price to override.</p></div><span class="sp"></span><button class="btn pri" id="addp">Add own product</button></div>
    <div class="row" style="margin-bottom:12px">
      <input class="in" id="pq" placeholder="Search products" value="${esc(PF.q)}" style="width:min(280px,100%)">
      <select class="in" id="pc"><option value="">All categories</option>${CATS.map(([k, l]) => `<option value="${k}" ${PF.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="in" id="ps"><option value="">All suppliers</option>${suppliers.map((s) => `<option value="${s.id}" ${PF.sup === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
      <select class="in" id="po">${[['new', 'Newest'], ['price', 'Price: low to high'], ['pricehi', 'Price: high to low'], ['title', 'Name']].map(([k, l]) => `<option value="${k}" ${PF.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
    </div>
    <div class="tabs" id="pt">${[['live', 'On the store'], ['out', 'Out of stock'], ['hidden', 'Hidden'], ['featured', 'Featured'], ['override', 'Fixed price'], ['all', 'All']].map(([k, l]) => `<button data-s="${k}" class="${PF.state === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="tbl"><table><tr><th>Product</th><th class="hide-m">Category</th><th class="hide-m">Supplier</th><th class="num">Cost</th><th class="num">Price</th><th class="num hide-m">Margin</th><th>On store</th><th>Featured</th></tr>
    ${data.map((p) => { const fee = Number(supById(p.supplier).fee || 0); const mg = p.cost ? Number(p.price) - Number(p.cost) - fee : null; const img = (p.images || [])[0]; return `<tr class="click" data-id="${esc(p.id)}"><td><div class="row" style="flex-wrap:nowrap">${img ? `<img class="thumb" src="${esc(img)}${/shopify/.test(img) ? '?width=80' : ''}" loading="lazy">` : '<span class="thumb"></span>'}<div><b>${esc(p.display_title)}</b><div class="muted" style="font-size:12px">${esc(p.sub || '')}${p.hidden_reason ? ` · <span class="bad">${esc(p.hidden_reason)}</span>` : ''}${!p.available ? ' · <span class="bad">out of stock</span>' : ''}</div></div></div></td>
      <td class="hide-m">${esc((CATS.find((c) => c[0] === p.category) || [0, p.category])[1])}</td><td class="hide-m">${esc(supById(p.supplier).name || p.supplier)}</td><td class="num">${p.cost ? inr(p.cost) : '–'}</td><td class="num"><b>${inr(p.price)}</b>${p.price_override ? '<div class="muted" style="font-size:11px">fixed</div>' : ''}${p.was ? `<div class="muted" style="font-size:11px"><s>${inr(p.was)}</s></div>` : ''}</td><td class="num hide-m">${mg != null ? inr(mg) : '–'}</td>
      <td><input type="checkbox" data-act="active" ${p.active ? 'checked' : ''}></td><td><input type="checkbox" data-act="featured" ${p.featured ? 'checked' : ''}></td></tr>`; }).join('') || '<tr><td colspan="8"><div class="empty">No products match.</div></td></tr>'}
    </table></div>
    <div class="row" style="margin-top:12px"><span class="muted">${(count || 0).toLocaleString('en-IN')} products</span><span class="sp"></span>${PF.page ? '<button class="btn sm" id="pp">Previous</button>' : ''}${(PF.page + 1) * 50 < count ? '<button class="btn sm" id="np">Next</button>' : ''}</div>`;
    const re = () => { PF.page = 0; products().catch(fail); };
    let t; $('#pq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { PF.q = e.target.value; products().then(() => { const i = $('#pq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }).catch(fail); }, 350); };
    $('#pc').onchange = (e) => { PF.cat = e.target.value; re(); };
    $('#ps').onchange = (e) => { PF.sup = e.target.value; re(); };
    $('#po').onchange = (e) => { PF.sort = e.target.value; re(); };
    $$('#pt button').forEach((b) => (b.onclick = () => { PF.state = b.dataset.s; re(); }));
    if ($('#pp')) $('#pp').onclick = () => { PF.page--; products().catch(fail); };
    if ($('#np')) $('#np').onclick = () => { PF.page++; products().catch(fail); };
    $$('tr.click').forEach((r) => (r.onclick = (e) => {
      const cb = e.target.closest('input[type=checkbox]');
      if (cb) { q(sb.from('products').update({ [cb.dataset.act]: cb.checked }).eq('id', r.dataset.id)).then(() => toast('Saved')).catch(fail); return; }
      productDetail(r.dataset.id);
    }));
    $('#addp').onclick = () => productDetail(null);
  }
  async function productDetail(id) {
    const p = id ? (await q(sb.from('products').select('*').eq('id', id).single())).data : { id: '', supplier: 'own', name: '', images: [], variants: [], active: true, available: true, category: 'home' };
    const sp = supById(p.supplier);
    const own = p.supplier === 'own';
    const link = sp.base_url && p.handle ? `${sp.base_url}/products/${p.handle}` : '';
    openDrawer(`<div class="hd"><b style="font-size:16px">${id ? esc(p.display_title) : 'New own product'}</b><span class="sp"></span>${id ? `<a class="btn sm" href="/products/${esc(p.slug)}" target="_blank">View ↗</a>` : ''}<button class="btn sm" id="dc">Close</button></div>
    <div class="bd">
      ${(p.images || []).length ? `<div class="row sec">${p.images.slice(0, 6).map((i) => `<img class="thumb" style="width:80px;height:80px;flex-basis:80px" src="${esc(i)}${/shopify/.test(i) ? '?width=160' : ''}">`).join('')}</div>` : ''}
      <div class="fgrid sec">
        ${!id ? `<div class="f"><label>Product ID (short, unique)</label><input class="in" id="fid" placeholder="s14"></div>` : ''}
        <div class="f" style="grid-column:1/-1"><label>Title shown on the store ${!own ? `(supplier: ${esc(p.title_src || '')})` : ''}</label><input class="in" id="ft" value="${esc(p.title || (own ? p.name : '') || '')}" placeholder="${esc(p.name || '')}"></div>
        <div class="f"><label>Category</label><select class="in" id="fc"><option value="">Automatic (${esc(p.cat || '')})</option>${CATS.map(([k, l]) => `<option value="${k}" ${p.cat_override === k || (own && p.cat === k) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="f"><label>Sub-category</label><input class="in" id="fs" value="${esc(p.sub || '')}"></div>
        <div class="f"><label>Delivery days (blank = default)</label><input class="in" id="fd" type="number" value="${p.days || ''}"></div>
        <div class="f"><label>Our cost ${own ? '' : '(from supplier)'}</label><input class="in" id="fco" type="number" value="${p.cost || ''}" ${own ? '' : 'disabled'}></div>
        <div class="f"><label>Fixed selling price ${own ? '' : '(blank = automatic)'}</label><input class="in" id="fp" type="number" value="${p.price_override || ''}"></div>
        <div class="f"><label>MRP shown struck through</label><input class="in" id="fm" type="number" value="${p.mrp || ''}" ${own ? '' : 'disabled'}></div>
        ${own ? `<div class="f" style="grid-column:1/-1"><label>Photo URLs (one per line)</label><textarea class="in" id="fi">${esc((p.images || []).join('\n'))}</textarea></div>
        <div class="f" style="grid-column:1/-1"><label>Description</label><textarea class="in" id="fdesc" style="min-height:120px">${esc(p.desc_html || '')}</textarea></div>` : ''}
      </div>
      <div class="row sec"><label><input type="checkbox" id="fa" ${p.active ? 'checked' : ''}> Show on store</label><label><input type="checkbox" id="ff" ${p.featured ? 'checked' : ''}> Featured</label>${own ? `<label><input type="checkbox" id="fav" ${p.available ? 'checked' : ''}> In stock</label>` : ''}</div>
      <button class="btn dark" id="fsave">Save</button>
      ${id ? `<div class="sec" style="margin-top:22px"><h3>Pricing</h3><dl class="kv"><dt>Supplier</dt><dd>${esc(sp.name || p.supplier)} ${link ? `· <a href="${esc(link)}" target="_blank">open ↗</a>` : ''}</dd><dt>Cost</dt><dd>${inr(p.cost)} + fee ${inr(sp.fee)}</dd><dt>Selling price</dt><dd><b>${inr(p.price)}</b>${p.price_override ? ' (fixed)' : ''}</dd><dt>Margin per unit</dt><dd>${inr(Number(p.price) - Number(p.cost || 0) - Number(sp.fee || 0))}</dd><dt>Supplier MRP</dt><dd>${p.mrp ? inr(p.mrp) : '–'}${p.was ? ' (shown)' : ''}</dd><dt>Last synced</dt><dd>${p.synced_at ? dt(p.synced_at) : '–'}</dd></dl></div>
      ${(p.variants || []).length > 1 ? `<div class="sec"><h3>Options</h3><table><tr><th>Option</th><th>SKU</th><th class="num">Cost</th><th>Stock</th></tr>${p.variants.map((v) => `<tr><td>${esc(v.title)}</td><td>${esc(v.sku || '')}</td><td class="num">${inr(v.cost)}</td><td>${v.avail ? '<span class="ok">In stock</span>' : '<span class="bad">Out</span>'}</td></tr>`).join('')}</table></div>` : ''}` : ''}
    </div>`);
    const d = $('#drawer');
    $('#dc', d).onclick = closeDrawer;
    $('#fsave', d).onclick = async () => {
      const num = (sel) => { const v = $(sel, d) && $(sel, d).value; return v === '' || v == null ? null : Number(v); };
      const row = { title: $('#ft', d).value.trim() || null, sub: $('#fs', d).value.trim() || null, days: num('#fd'), price_override: num('#fp'), active: $('#fa', d).checked, featured: $('#ff', d).checked };
      const cat = $('#fc', d).value;
      if (own) {
        Object.assign(row, { name: row.title || p.name || 'Product', cat: cat || p.cat || 'home', cost: num('#fco'), mrp: num('#fm'), available: $('#fav', d).checked, images: $('#fi', d).value.split('\n').map((x) => x.trim()).filter(Boolean), desc_html: $('#fdesc', d).value });
        if (!row.price_override) return toast('Own products need a selling price');
      } else row.cat_override = cat || null;
      try {
        if (id) await q(sb.from('products').update(row).eq('id', id));
        else {
          const nid = ($('#fid', d).value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
          if (!nid) return toast('Enter a product ID');
          await q(sb.from('products').insert({ ...row, id: nid, supplier: 'own' }));
        }
        toast('Saved. The store updates within 5 minutes.'); closeDrawer(); products().catch(fail);
      } catch (e) { fail(e); }
    };
  }

  /* ---------- suppliers & sync ---------- */
  async function suppliersView() {
    suppliers = (await q(sb.from('suppliers').select('*').order('id'))).data;
    const [{ data: states }, { data: runs }, counts] = await Promise.all([
      q(sb.from('sync_state').select('*')),
      q(sb.from('sync_runs').select('*').order('id', { ascending: false }).limit(12)),
      Promise.all(suppliers.map(async (s) => { const { count } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('supplier', s.id).eq('available', true).eq('active', true).is('hidden_reason', null); return [s.id, count || 0]; })),
    ]);
    const cnt = Object.fromEntries(counts);
    $('#main').innerHTML = `<h1>Suppliers & sync</h1><p class="sub">Products, prices and stock are pulled from each enabled supplier every 6 hours. The fee is what the supplier charges you per item (shipping); it is counted in profit, not added to the price.</p>
    <div class="tbl"><table><tr><th>Supplier</th><th class="num">Live products</th><th>Fee / item</th><th>Enabled</th><th>Sync status</th><th></th></tr>
    ${suppliers.map((s) => { const x = (states || []).find((y) => y.supplier === s.id); return `<tr><td><b>${esc(s.name)}</b>${s.base_url ? `<div class="muted" style="font-size:12px"><a href="${esc(s.base_url)}" target="_blank">${esc(s.base_url.replace('https://', ''))}</a></div>` : ''}<div class="muted" style="font-size:12px;max-width:360px">${esc(s.notes || '')}</div></td>
      <td class="num">${cnt[s.id].toLocaleString('en-IN')}</td><td><input class="in" type="number" style="width:80px" data-fee="${s.id}" value="${s.fee}"></td><td><input type="checkbox" data-en="${s.id}" ${s.enabled ? 'checked' : ''}></td>
      <td>${s.base_url ? (x ? `${x.phase === 'idle' ? `Done ${x.finished_at ? ago(x.finished_at) : ''}<div class="muted" style="font-size:12px">next ${dt(x.next_at)}</div>` : `<b>Running</b>: ${esc(x.phase)} page ${x.page}`}${x.last_error ? `<div class="bad" style="font-size:12px">${esc(x.last_error)}</div>` : ''}` : 'Not synced yet') : '<span class="muted">Manual</span>'}</td>
      <td>${s.base_url ? `<button class="btn sm" data-sync="${s.id}">Sync now</button>` : ''}</td></tr>`; }).join('')}</table></div>
    <div class="row" style="margin-top:12px"><button class="btn dark" id="savesup">Save fees and switches</button><span class="muted">Saving re-prices every product.</span></div>
    <h3 style="margin-top:30px">Recent sync runs</h3>
    <div class="tbl"><table><tr><th>Supplier</th><th>Started</th><th>Finished</th><th class="num">Products seen</th><th class="num">Went out of stock</th></tr>${(runs || []).map((r) => `<tr><td>${esc(r.supplier)}</td><td>${dt(r.started_at)}</td><td>${r.finished_at ? dt(r.finished_at) : '<span class="muted">running</span>'}</td><td class="num">${r.products_seen}</td><td class="num">${r.gone}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">No runs yet.</div></td></tr>'}</table></div>`;
    $$('[data-sync]').forEach((b) => (b.onclick = async () => { try { await q(sb.rpc('sync_now', { p_supplier: b.dataset.sync })); toast('Sync starts within 2 minutes'); suppliersView(); } catch (e) { fail(e); } }));
    $('#savesup').onclick = async () => {
      try {
        for (const s of suppliers) await q(sb.from('suppliers').update({ fee: Number($(`[data-fee="${s.id}"]`).value) || 0, enabled: $(`[data-en="${s.id}"]`).checked }).eq('id', s.id));
        const { data: n } = await q(sb.rpc('reprice_all'));
        toast(`Saved. ${n} products re-priced.`); suppliersView();
      } catch (e) { fail(e); }
    };
  }

  /* ---------- settings ---------- */
  async function settings() {
    const { data: s } = await q(sb.from('settings').select('*').eq('id', 1).single());
    const { data: team } = await q(sb.from('admins').select('*').order('created_at'));
    const f = (k, l, t = 'number') => `<div class="f"><label>${l}</label><input class="in" id="s_${k}" type="${t}" value="${esc(s[k] == null ? '' : s[k])}"></div>`;
    $('#main').innerHTML = `<h1>Settings</h1><p class="sub">Changes reach the store within 5 minutes.</p>
    <div class="card sec"><b>Pricing</b><div class="fgrid" style="margin-top:12px">${f('margin_pct', 'Margin on landed cost (%)')}</div><p class="muted" style="margin:8px 0 0">Example: supplier cost ₹100 → selling price ₹${Math.ceil(100 * (1 + Number(s.margin_pct) / 100))}. Supplier fees are not added to the price, but they are counted in your profit.</p></div>
    <div class="card sec"><b>Delivery and payment</b><div class="fgrid" style="margin-top:12px">${f('free_over', 'Free delivery above (₹)')}${f('std_fee', 'Delivery fee below that (₹)')}${f('cod_fee', 'Cash on delivery fee (₹)')}${f('min_days', 'Delivery promise: from (working days)')}${f('max_days', 'Delivery promise: to (working days)')}${f('replace_days', 'Replacement window (days)')}</div></div>
    <div class="card sec"><b>Welcome offer</b><div class="fgrid" style="margin-top:12px">${f('promo_code', 'Promo code', 'text')}${f('promo_pct', 'Discount (%)')}</div><p class="muted" style="margin:8px 0 0">One use per mobile number. Leave the code empty to switch the offer off.</p></div>
    <button class="btn dark" id="ss">Save settings</button>
    <div class="card" style="margin-top:26px"><b>Team</b><table style="margin-top:8px"><tr><th>Email</th><th>Name</th><th>Role</th></tr>${team.map((t) => `<tr><td>${esc(t.email)}</td><td>${esc(t.name || '')}</td><td>${esc(t.role)}</td></tr>`).join('')}</table>
      ${me.role === 'owner' ? `<div class="fgrid" style="margin-top:14px"><div class="f"><label>Username or email</label><input class="in" id="ne" type="text"></div><div class="f"><label>Name</label><input class="in" id="nn"></div><div class="f"><label>Temporary password</label><input class="in" id="np2" type="text"></div></div><button class="btn" id="addu" style="margin-top:10px">Add staff login</button>` : ''}</div>
    <div class="card" style="margin-top:14px"><b>Your password</b><div class="row" style="margin-top:10px"><input class="in" id="mypw" type="password" placeholder="New password (8+ characters)"><button class="btn" id="chpw">Change</button></div></div>`;
    $('#ss').onclick = async () => {
      const row = {}; ['margin_pct', 'free_over', 'std_fee', 'cod_fee', 'min_days', 'max_days', 'replace_days', 'promo_pct'].forEach((k) => (row[k] = Number($('#s_' + k).value)));
      row.promo_code = $('#s_promo_code').value.trim().toUpperCase() || null; row.updated_at = new Date().toISOString();
      try {
        await q(sb.from('settings').update(row).eq('id', 1));
        let msg = 'Saved';
        if (row.margin_pct !== Number(s.margin_pct)) { const { data: n } = await q(sb.rpc('reprice_all')); msg += `. ${n} products re-priced`; }
        toast(msg); settings();
      } catch (e) { fail(e); }
    };
    if ($('#addu')) $('#addu').onclick = async () => {
      const { data, error } = await sb.functions.invoke('admin-users', { body: { email: (($v) => ($v.includes('@') ? $v : $v + '@shopeiz.com'))($('#ne').value.trim().toLowerCase()), name: $('#nn').value.trim(), password: $('#np2').value } });
      if (error || (data && data.error)) return fail(error || new Error(data.error));
      toast('Login created'); settings();
    };
    $('#chpw').onclick = async () => { const pw = $('#mypw').value; if (pw.length < 8) return toast('Use at least 8 characters'); const { error } = await sb.auth.updateUser({ password: pw }); if (error) return fail(error); toast('Password changed'); $('#mypw').value = ''; };
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  boot().catch(fail);
})();
