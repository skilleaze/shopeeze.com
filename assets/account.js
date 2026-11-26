/* Shopeiz customer accounts: log in (email or Google), orders, delivery tracking, addresses and profile.
   The Supabase auth library is loaded only when it is needed; the header reads the saved session directly. */
(function () {
  if (typeof document === 'undefined') return;
  const SZ = window.SZ || {};
  const CFG = SZ.CFG || {};
  const { fmt, esc, ic, url, imgUrl } = SZ;
  const REF = (CFG.url || '').replace(/^https:\/\//, '').split('.')[0];
  const LS = 'sb-' + REF + '-auth-token';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const VIEW = document.body.dataset.view || '';

  /* ---------- Session ---------- */
  let sbP = null;
  function sb() {
    if (sbP) return sbP;
    sbP = new Promise((res, rej) => {
      if (window.supabase && window.supabase.createClient) return res();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = res; s.onerror = () => rej(new Error('Could not load sign-in. Check your connection and try again.'));
      document.head.appendChild(s);
    }).then(() => window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: LS } }));
    return sbP;
  }
  const stored = () => { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } };
  const user = () => { const s = stored(); return (s && s.user) || null; };
  const firstName = (u) => { const m = (u && u.user_metadata) || {}; const n = m.full_name || m.name || ''; return (n.split(' ')[0] || (u && u.email ? u.email.split('@')[0] : '')).slice(0, 18); };
  // A fresh access token for database calls, or null for guests
  async function token() {
    const s = stored();
    if (!s || !s.access_token) return null;
    if (s.expires_at && s.expires_at * 1000 > Date.now() + 60000) return s.access_token;
    try { const c = await sb(); const { data } = await c.auth.getSession(); return data.session ? data.session.access_token : null; } catch (e) { return null; }
  }
  async function rpc(fn, args) {
    const t = await token();
    const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CFG.key, Authorization: `Bearer ${t || CFG.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) });
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && (j.message || j.hint)) || 'Something went wrong. Please try again.');
    return j;
  }

  /* ---------- Header and tab bar ---------- */
  function paintHeader() {
    const u = user();
    $$('[data-acct]').forEach((a) => {
      a.href = u ? '/account' : '/login';
      const l = a.querySelector('[data-acct-l]');
      if (l) l.textContent = u ? (a.dataset.acct === 'tab' ? 'Account' : 'Hi, ' + firstName(u)) : a.dataset.acct === 'tab' ? 'Account' : 'Log in';
    });
  }
  paintHeader();
  window.addEventListener('storage', (e) => { if (e.key === LS) paintHeader(); });

  /* ---------- Shared pieces ---------- */
  const STEP_LABEL = { ordered: 'Ordered', confirmed: 'Confirmed', shipped: 'Shipped', ofd: 'Out for delivery', delivered: 'Delivered' };
  const STATUS = {
    new: ['Order placed', 'blue'], confirmed: ['Confirmed', 'blue'], placed: ['Being packed', 'blue'], shipped: ['Shipped', 'amber'],
    delivered: ['Delivered', 'green'], cancelled: ['Cancelled', 'red'], rto: ['Returned to us', 'red'], replaced: ['Replaced', 'green'],
  };
  const when = (d, time) => d ? new Date(d).toLocaleString('en-IN', time ? { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' } : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const ofd = (o) => (o.events || []).find((e) => e.kind === 'update' && /out for delivery/i.test(e.note || ''));
  const firstStatus = (o, re) => (o.events || []).find((e) => e.kind === 'status' && re.test(e.note || ''));
  function steps(o) {
    const done = { ordered: o.created_at };
    const conf = firstStatus(o, /→ (confirmed|placed)$/);
    if (conf || ['placed', 'shipped', 'delivered', 'replaced'].includes(o.status)) done.confirmed = (conf && conf.at) || o.placed_at || o.created_at;
    if (o.shipped_at || ['shipped', 'delivered', 'replaced'].includes(o.status)) done.shipped = o.shipped_at || '';
    const od = ofd(o);
    if (od || ['delivered', 'replaced'].includes(o.status)) done.ofd = (od && od.at) || '';
    if (o.delivered_at || ['delivered', 'replaced'].includes(o.status)) done.delivered = o.delivered_at || '';
    return done;
  }
  const pill = (s) => { const [l, c] = STATUS[s] || [s, 'blue']; return `<span class="st-pill ${c}">${esc(l)}</span>`; };
  const expected = (o) => { const d = new Date(o.created_at); let k = 0; const n = o.items.some((i) => (i.product_id || '').length <= 4) && o.items.every((i) => (i.product_id || '').length <= 4) ? 5 : (window.SZ_SET && window.SZ_SET.max) || 10; while (k < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) k++; } return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); };
  const snapOf = (i) => esc(JSON.stringify({ id: i.product_id, t: i.title, p: Number(i.price), w: Number(i.mrp) > Number(i.price) ? Number(i.mrp) : 0, i: i.img || '', s: i.slug || '', u: '', v: '' }));

  function timeline(o) {
    if (o.status === 'cancelled' || o.status === 'rto') {
      const ev = firstStatus(o, /→ (cancelled|rto)$/);
      return `<div class="tl-stop">${ic('i-x')}<div><b>${o.status === 'cancelled' ? 'This order was cancelled' : 'This order was returned to us'}</b><span>${ev ? when(ev.at, true) : ''}${o.pay_method !== 'cod' && o.pay_status === 'paid' ? ' · Your refund is being processed to your original payment method.' : ''}</span></div></div>`;
    }
    const d = steps(o);
    const keys = ['ordered', 'confirmed', 'shipped', 'ofd', 'delivered'];
    const cur = keys.reduce((a, k, i) => (d[k] !== undefined ? i : a), 0);
    return `<ol class="tl">${keys.map((k, i) => `<li class="${i <= cur ? 'on' : ''} ${i === cur ? 'cur' : ''}"><i>${i <= cur ? ic('i-check') : ''}</i><b>${STEP_LABEL[k]}</b><span>${d[k] ? when(d[k], true) : i === keys.length - 1 && o.status !== 'delivered' ? 'Expected by ' + expected(o) : ''}</span></li>`).join('')}</ol>`;
  }
  function orderDetail(o, opts = {}) {
    const ups = (o.events || []).filter((e) => e.kind === 'update' || e.kind === 'tracking').slice().reverse();
    const canCancel = o.mine && ['new', 'confirmed'].includes(o.status);
    return `<div class="od">
      <div class="od-top">
        <div><h2>Order ${esc(o.code)}</h2><p>Placed on ${when(o.created_at)} · ${o.items.reduce((a, i) => a + i.qty, 0)} item${o.items.reduce((a, i) => a + i.qty, 0) === 1 ? '' : 's'}</p></div>
        ${pill(o.status)}
      </div>
      <section class="od-card"><h3>Delivery tracking</h3>${timeline(o)}
        ${o.tracking_no ? `<div class="od-awb"><div><small>Courier</small><b>${esc(o.courier || 'Courier partner')}</b></div><div><small>Tracking number</small><b>${esc(o.tracking_no)}</b></div>${o.tracking_url ? `<a class="pdx-cta" href="${esc(o.tracking_url)}" target="_blank" rel="noopener">Track with courier ${ic('i-arrow')}</a>` : ''}</div>` : ['new', 'confirmed', 'placed'].includes(o.status) ? `<p class="od-note">${ic('i-truck')} Tracking details appear here as soon as your order ships. We also send them to ${esc(o.phone)}.</p>` : ''}
        ${ups.length ? `<div class="od-ups"><h4>Updates</h4>${ups.map((e) => `<div><span>${when(e.at, true)}</span><b>${esc(e.kind === 'tracking' ? 'Shipped with ' + e.note : e.note)}</b></div>`).join('')}</div>` : ''}
      </section>
      <section class="od-card"><h3>Items</h3>${o.items.map((i) => `<div class="od-item">
          <a class="od-img" href="${i.slug ? '/products/' + esc(i.slug) : '#'}">${i.img ? `<img src="${esc(imgUrl(i.img, 200))}" alt="" loading="lazy">` : ''}</a>
          <div><a href="${i.slug ? '/products/' + esc(i.slug) : '#'}"><b>${esc(i.title)}</b></a>${i.variant ? `<small>${esc(i.variant)}</small>` : ''}<span>Qty ${i.qty} · ${fmt(Number(i.price))}</span></div>
          ${['delivered', 'replaced', 'cancelled'].includes(o.status) && i.slug ? `<button class="od-again" data-act="add" data-id="${esc(i.product_id)}" data-snap="${snapOf(i)}">Buy again</button>` : ''}
        </div>`).join('')}</section>
      <div class="od-two">
        <section class="od-card"><h3>Delivery address</h3><p class="od-addr"><b>${esc(o.name)}</b><br>${esc(o.addr)}<br>${esc(o.city)}${o.state ? ', ' + esc(o.state) : ''} ${esc(o.pin)}<br>${esc(o.phone)}</p></section>
        <section class="od-card"><h3>Payment</h3>
          <div class="sum-row"><span>Items</span><span>${fmt(Number(o.subtotal))}</span></div>
          ${Number(o.discount) ? `<div class="sum-row"><span>Discount${o.promo ? ' (' + esc(o.promo) + ')' : ''}</span><span>−${fmt(Number(o.discount))}</span></div>` : ''}
          <div class="sum-row"><span>Delivery</span><span>${Number(o.ship_fee) ? fmt(Number(o.ship_fee)) : 'Free'}</span></div>
          ${Number(o.cod_fee) ? `<div class="sum-row"><span>Cash on delivery fee</span><span>${fmt(Number(o.cod_fee))}</span></div>` : ''}
          <div class="sum-row total"><span>Total</span><span>${fmt(Number(o.total))}</span></div>
          <p class="od-pay">${o.pay_method === 'cod' ? (o.pay_status === 'paid' ? 'Paid in cash on delivery' : 'Pay in cash on delivery') : o.pay_status === 'paid' ? 'Paid by UPI' : 'UPI payment pending: we send a payment link to ' + esc(o.phone)}</p>
        </section>
      </div>
      <div class="od-actions">
        ${canCancel ? `<button class="pdx-cta line" data-acc="cancel" data-code="${esc(o.code)}">Cancel order</button>` : ''}
        <a class="pdx-cta line" href="/help/returns">Damaged or wrong item?</a>
        <a class="pdx-cta line" href="/help/contact">Need help with this order</a>
      </div>
      ${opts.claim ? '' : ''}
    </div>`;
  }

  /* ---------- Pages ---------- */
  const shell = (active, body, title) => {
    const u = user();
    const nav = [['orders', 'Orders', 'i-bag', '/account'], ['addresses', 'Addresses', 'i-pin', '/account/addresses'], ['profile', 'Profile', 'i-user', '/account/profile'], ['wishlist', 'Wishlist', 'i-heart', '/wishlist'], ['track', 'Track an order', 'i-truck', '/track']];
    return `<div class="wrap2 acc">
      <aside class="acc-side">
        <div class="acc-hi"><span class="acc-av">${esc((firstName(u) || 'S')[0].toUpperCase())}</span><div><small>Hala!</small><b>${esc(firstName(u) || 'Welcome')}</b><span>${esc((u && u.email) || '')}</span></div></div>
        <nav>${nav.map(([k, l, i, h]) => `<a href="${h}" class="${active === k ? 'on' : ''}">${ic(i)}<span>${l}</span>${ic('i-down', 'i rot')}</a>`).join('')}
          <button data-acc="logout">${ic('i-return')}<span>Log out</span></button></nav>
      </aside>
      <div class="acc-main">${title ? `<h1 class="acc-h">${title}</h1>` : ''}${body}</div>
    </div>`;
  };
  const loading = '<div class="acc-load"><span></span></div>';
  const app = () => $('#app');
  const next = () => new URLSearchParams(location.search).get('next') || '/account';

  async function needUser() {
    if (user()) { try { const c = await sb(); const { data } = await c.auth.getSession(); if (data.session) return data.session.user; } catch (e) {} }
    location.replace('/login?next=' + encodeURIComponent(location.pathname + location.search));
    return null;
  }

  // Log in / create account
  function vLogin(mode = 'in', msg = '') {
    const google = `<button class="g-btn" data-acc="google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continue with Google</button>`;
    const forms = {
      in: `<form data-acc-form="in" novalidate>
          <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required minlength="6"></div>
          <button type="button" class="lnk" data-acc="mode" data-m="forgot">Forgot password?</button>
          <button class="pdx-cta" type="submit">Log in</button></form>`,
      up: `<form data-acc-form="up" novalidate>
          <div class="field"><label>Full name</label><input name="name" autocomplete="name" required maxlength="80"></div>
          <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label>Mobile number (for delivery updates)</label><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="14"></div>
          <div class="field"><label>Password (at least 8 characters)</label><input name="password" type="password" autocomplete="new-password" required minlength="8"></div>
          <button class="pdx-cta" type="submit">Create account</button></form>`,
      forgot: `<form data-acc-form="forgot" novalidate><p class="acc-p">Enter the email you signed up with and we'll send you a link to set a new password.</p>
          <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div>
          <button class="pdx-cta" type="submit">Send reset link</button>
          <button type="button" class="lnk" data-acc="mode" data-m="in">Back to log in</button></form>`,
    };
    return `<div class="auth"><div class="auth-card">
      <a class="auth-logo" href="/"><svg viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono"/></svg><span>Shopeiz</span></a>
      ${mode === 'forgot' ? '<h1>Reset your password</h1>' : `<div class="auth-tabs"><button class="${mode === 'in' ? 'on' : ''}" data-acc="mode" data-m="in">Log in</button><button class="${mode === 'up' ? 'on' : ''}" data-acc="mode" data-m="up">Sign up</button></div>`}
      ${msg ? `<p class="auth-msg ${/^✓/.test(msg) ? 'ok' : ''}">${esc(msg.replace(/^✓\s*/, ''))}</p>` : ''}
      ${mode === 'forgot' ? '' : google + '<div class="auth-or"><span>or</span></div>'}
      ${forms[mode]}
      <p class="auth-fine">Ordering without an account? You can still <a href="/track">track your order</a> with its number and your mobile.</p>
    </div></div>`;
  }

  function vReset(msg = '') {
    return `<div class="auth"><div class="auth-card"><a class="auth-logo" href="/"><svg viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono"/></svg><span>Shopeiz</span></a>
      <h1>Set a new password</h1>${msg ? `<p class="auth-msg">${esc(msg)}</p>` : ''}
      <form data-acc-form="reset" novalidate><div class="field"><label>New password (at least 8 characters)</label><input name="password" type="password" autocomplete="new-password" required minlength="8"></div>
      <button class="pdx-cta" type="submit">Save password</button></form></div></div>`;
  }

  async function pageOrders() {
    app().innerHTML = shell('orders', loading, 'Orders');
    if (!(await needUser())) return;
    let list = [];
    try { list = await rpc('my_orders'); } catch (e) { $('.acc-main').innerHTML = `<h1 class="acc-h">Orders</h1><p class="auth-msg">${esc(e.message)}</p>`; return; }
    const body = list.length ? list.map((o) => `<a class="ol" href="/account/orders/${encodeURIComponent(o.code)}">
        <div class="ol-head"><div><b>Order ${esc(o.code)}</b><span>${when(o.created_at)}</span></div>${pill(o.status)}</div>
        <div class="ol-imgs">${o.items.slice(0, 4).map((i) => `<span>${i.img ? `<img src="${esc(imgUrl(i.img, 160))}" alt="" loading="lazy">` : ''}</span>`).join('')}${o.items.length > 4 ? `<em>+${o.items.length - 4}</em>` : ''}
          <div class="ol-t"><b>${esc(o.items[0] ? o.items[0].title : '')}</b>${o.items.length > 1 ? `<span>and ${o.items.length - 1} more</span>` : ''}</div></div>
        <div class="ol-foot"><span>${o.status === 'delivered' ? 'Delivered ' + when(o.delivered_at) : o.status === 'cancelled' ? 'Cancelled' : o.status === 'shipped' ? 'On the way · arriving by ' + expected(o) : 'Arriving by ' + expected(o)}</span><b>${fmt(Number(o.total))}</b></div>
      </a>`).join('') : `<div class="acc-empty">${ic('i-bag')}<h2>No orders yet</h2><p>When you order while logged in, it shows up here with live delivery tracking.</p><a class="pdx-cta" href="/shop" style="max-width:260px">Start shopping</a>
        <p class="acc-p" style="margin-top:18px">Ordered as a guest? <a href="/track">Find it with your order number</a> and it will be added to your account.</p></div>`;
    $('.acc-main').innerHTML = `<h1 class="acc-h">Orders</h1>${body}`;
  }
  async function pageOrder(code) {
    app().innerHTML = shell('orders', loading);
    if (!(await needUser())) return;
    try {
      const o = await rpc('order_lookup', { p_code: code });
      $('.acc-main').innerHTML = o ? `<a class="acc-back" href="/account">${ic('i-arrow', 'i flip')} All orders</a>${orderDetail(o)}` : `<div class="acc-empty"><h2>Order not found</h2><p>This order isn't linked to your account. <a href="/track">Find it with your order number and mobile</a>.</p></div>`;
    } catch (e) { $('.acc-main').innerHTML = `<p class="auth-msg">${esc(e.message)}</p>`; }
  }
  async function pageAddresses(editId) {
    app().innerHTML = shell('addresses', loading, 'Addresses');
    if (!(await needUser())) return;
    const c = await sb();
    const { data, error } = await c.from('addresses').select('*').order('is_default', { ascending: false }).order('id');
    if (error) { $('.acc-main').innerHTML = `<h1 class="acc-h">Addresses</h1><p class="auth-msg">${esc(error.message)}</p>`; return; }
    const ed = editId === 'new' ? {} : (data || []).find((a) => String(a.id) === String(editId));
    const f = (n, l, v = '', x = '') => `<div class="field ${/addr/.test(n) ? 'full' : ''}"><label>${l}</label><input name="${n}" value="${esc(v || '')}" ${x}></div>`;
    $('.acc-main').innerHTML = `<div class="acc-row"><h1 class="acc-h">Addresses</h1>${ed ? '' : `<button class="pdx-cta" data-acc="addr-new" style="width:auto;padding:0 18px;height:42px">${ic('i-plus')} Add address</button>`}</div>
      ${ed ? `<form class="od-card" data-acc-form="addr" data-id="${ed.id || ''}"><h3>${ed.id ? 'Edit address' : 'New address'}</h3><div class="fields">
          ${f('name', 'Full name', ed.name, 'required autocomplete="name"')}${f('phone', 'Mobile number', ed.phone, 'required inputmode="numeric" autocomplete="tel"')}
          ${f('addr', 'House no., building, street, area, landmark', ed.addr, 'required autocomplete="street-address"')}
          ${f('city', 'City or town', ed.city, 'required')}${f('pin', 'PIN code', ed.pin, 'required inputmode="numeric" maxlength="6"')}${f('state', 'State', ed.state, 'required')}${f('label', 'Label (Home, Work…)', ed.label)}
        </div><label class="chk"><input type="checkbox" name="is_default" ${ed.is_default || !data.length ? 'checked' : ''}> Use as my default address</label>
        <div class="od-actions"><button class="pdx-cta" type="submit">Save address</button><a class="pdx-cta line" href="/account/addresses">Cancel</a></div></form>`
      : (data.length ? `<div class="ad-grid">${data.map((a) => `<div class="od-card ad">${a.is_default ? '<span class="st-pill green">Default</span>' : ''}<b>${esc(a.label || a.name)}</b><p>${esc(a.name)}<br>${esc(a.addr)}<br>${esc(a.city)}${a.state ? ', ' + esc(a.state) : ''} ${esc(a.pin)}<br>${esc(a.phone)}</p>
          <div class="ad-act"><a href="/account/addresses?edit=${a.id}">Edit</a>${a.is_default ? '' : `<button data-acc="addr-def" data-id="${a.id}">Make default</button>`}<button data-acc="addr-del" data-id="${a.id}">Remove</button></div></div>`).join('')}</div>`
        : `<div class="acc-empty">${ic('i-pin')}<h2>No saved addresses</h2><p>Save an address to check out faster. Addresses you use at checkout are saved here too.</p></div>`)}`;
  }
  async function pageProfile(msg = '') {
    app().innerHTML = shell('profile', loading, 'Profile');
    const u = await needUser(); if (!u) return;
    const c = await sb();
    const { data } = await c.from('profiles').select('*').eq('id', u.id).maybeSingle();
    const p = data || {}; const m = u.user_metadata || {};
    const google = (u.app_metadata && (u.app_metadata.providers || [u.app_metadata.provider])).includes('google');
    $('.acc-main').innerHTML = `<h1 class="acc-h">Profile</h1>${msg ? `<p class="auth-msg ok">${esc(msg)}</p>` : ''}
      <form class="od-card" data-acc-form="profile"><h3>Your details</h3><div class="fields">
        <div class="field"><label>Full name</label><input name="name" value="${esc(p.name || m.full_name || m.name || '')}" autocomplete="name"></div>
        <div class="field"><label>Mobile number</label><input name="phone" value="${esc(p.phone || m.phone || '')}" inputmode="numeric" autocomplete="tel"></div>
        <div class="field full"><label>Email</label><input value="${esc(u.email || '')}" disabled></div></div>
        <div class="od-actions"><button class="pdx-cta" type="submit">Save</button></div></form>
      ${google ? '<p class="acc-p">You log in with Google, so there is no separate Shopeiz password.</p>' : `<form class="od-card" data-acc-form="password"><h3>Change password</h3><div class="fields"><div class="field"><label>New password (at least 8 characters)</label><input name="password" type="password" autocomplete="new-password" minlength="8" required></div></div><div class="od-actions"><button class="pdx-cta line" type="submit">Update password</button></div></form>`}`;
  }
  function pageTrack(o, msg) {
    const q = new URLSearchParams(location.search);
    const u = user();
    app().innerHTML = `<div class="wrap2 trk">
      <div class="trk-form od-card"><h1>Track your order</h1><p class="acc-p">Enter your order number (for example SZ10001) and the mobile number you ordered with.</p>
        <form data-acc-form="track" class="trk-f"><div class="field"><label>Order number</label><input name="code" value="${esc(q.get('code') || '')}" required placeholder="SZ10001" autocapitalize="characters"></div>
        <div class="field"><label>Mobile number</label><input name="phone" value="${esc(q.get('phone') || '')}" required inputmode="numeric" placeholder="10-digit mobile"></div>
        <button class="pdx-cta" type="submit">Track order</button></form>
        ${msg ? `<p class="auth-msg">${esc(msg)}</p>` : ''}
        ${u ? '' : '<p class="auth-fine"><a href="/login">Log in</a> to see all your orders in one place.</p>'}
      </div>
      ${o ? `<div class="trk-res">${orderDetail(o)}</div>` : ''}
    </div>`;
    if (!o && q.get('code') && q.get('phone') && !msg) doTrack(q.get('code'), q.get('phone'));
  }
  async function doTrack(code, phone) {
    try {
      const o = await rpc('order_lookup', { p_code: code, p_phone: phone });
      if (!o) return pageTrack(null, "We couldn't find an order with that number and mobile. Please check both and try again.");
      history.replaceState(null, '', '/track?code=' + encodeURIComponent(code) + '&phone=' + encodeURIComponent(phone));
      pageTrack(o);
    } catch (e) { pageTrack(null, e.message); }
  }

  function route() {
    const p = location.pathname.replace(/\/+$/, '');
    const q = new URLSearchParams(location.search);
    if (VIEW === 'login') {
      if (user()) { location.replace(next()); return; }
      app().innerHTML = vLogin(q.get('m') || 'in');
      return;
    }
    if (VIEW === 'track') return pageTrack(null);
    if (VIEW !== 'account') return;
    // Arriving back from Google or an email link: let the library finish the sign-in first
    if (q.get('code') || /access_token|type=recovery/.test(location.hash)) {
      app().innerHTML = '<div class="auth"><div class="auth-card"><div class="acc-load"><span></span></div><p class="acc-p" style="text-align:center">Signing you in…</p></div></div>';
      sb().then((c) => {
        c.auth.onAuthStateChange((ev, session) => {
          if (ev === 'PASSWORD_RECOVERY') { app().innerHTML = vReset(); return; }
          if (session) { paintHeader(); ensureProfile(session.user); const nx = q.get('next'); if (nx && nx !== '/account' && p !== '/account/reset') { location.replace(nx); return; } history.replaceState(null, '', p === '/account/reset' ? '/account/reset' : p || '/account'); if (p !== '/account/reset') route2(p); else app().innerHTML = vReset(); }
        });
      });
      return;
    }
    route2(p);
  }
  function route2(p) {
    const q = new URLSearchParams(location.search);
    const m = /^\/account\/orders\/([^/]+)$/.exec(p);
    if (m) return pageOrder(decodeURIComponent(m[1]));
    if (p === '/account/addresses') return pageAddresses(q.get('edit') || '');
    if (p === '/account/profile') return pageProfile();
    if (p === '/account/reset') { app().innerHTML = vReset(); return; }
    return pageOrders();
  }

  async function ensureProfile(u) {
    try {
      const c = await sb(); const m = u.user_metadata || {};
      const { data } = await c.from('profiles').select('id').eq('id', u.id).maybeSingle();
      if (!data) await c.from('profiles').insert({ id: u.id, name: m.full_name || m.name || null, phone: m.phone || null });
    } catch (e) {}
  }

  /* ---------- Actions ---------- */
  const busy = (f, on) => { const b = f.querySelector('[type="submit"]'); if (b) { b.disabled = on; b.dataset.l = b.dataset.l || b.textContent; b.textContent = on ? 'Please wait…' : b.dataset.l; } };
  const friendly = (m) => /Invalid login/i.test(m) ? 'Email or password is not right. Try again or reset your password.' : /already registered|already been registered/i.test(m) ? 'An account with this email already exists. Log in instead.' : /Email not confirmed/i.test(m) ? 'Please confirm your email first: open the link we sent you.' : /provider is not enabled/i.test(m) ? 'Google sign-in is being set up. Please use email for now.' : m;

  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-acc]');
    if (!el) return;
    const a = el.dataset.acc;
    if (a === 'mode') { e.preventDefault(); app().innerHTML = vLogin(el.dataset.m); return; }
    if (a === 'google') {
      e.preventDefault();
      try { const c = await sb(); const { error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/account?next=' + encodeURIComponent(next()) } }); if (error) throw error; }
      catch (err) { app().innerHTML = vLogin('in', friendly(err.message)); }
      return;
    }
    if (a === 'logout') { e.preventDefault(); try { const c = await sb(); await c.auth.signOut(); } catch (err) {} try { localStorage.removeItem(LS); } catch (err) {} location.href = '/'; return; }
    if (a === 'cancel') {
      if (!confirm('Cancel order ' + el.dataset.code + '?')) return;
      el.disabled = true;
      try { const o = await rpc('cancel_my_order', { p_code: el.dataset.code }); $('.acc-main').innerHTML = `<a class="acc-back" href="/account">${ic('i-arrow', 'i flip')} All orders</a>${orderDetail(o)}`; }
      catch (err) { alert(err.message); el.disabled = false; }
      return;
    }
    if (a === 'addr-new') { location.href = '/account/addresses?edit=new'; return; }
    if (a === 'addr-del') { if (!confirm('Remove this address?')) return; const c = await sb(); await c.from('addresses').delete().eq('id', el.dataset.id); pageAddresses(); return; }
    if (a === 'addr-def') { const c = await sb(); await c.from('addresses').update({ is_default: false }).neq('id', el.dataset.id); await c.from('addresses').update({ is_default: true }).eq('id', el.dataset.id); pageAddresses(); return; }
  });

  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-acc-form]');
    if (!f) return;
    e.preventDefault();
    const kind = f.dataset.accForm;
    const v = Object.fromEntries(new FormData(f).entries());
    const fail = (m, mode) => { if (mode) app().innerHTML = vLogin(mode, friendly(m)); else { let p = f.querySelector('.auth-msg'); if (!p) { p = document.createElement('p'); p.className = 'auth-msg'; f.prepend(p); } p.textContent = friendly(m); busy(f, false); } };
    if (!f.checkValidity()) { fail('Please fill in the highlighted fields.'); f.reportValidity(); return; }
    busy(f, true);
    try {
      if (kind === 'track') return doTrack(v.code.trim(), v.phone.trim());
      const c = await sb();
      if (kind === 'in') {
        const { error } = await c.auth.signInWithPassword({ email: v.email.trim(), password: v.password });
        if (error) return fail(error.message, 'in');
        location.href = next(); return;
      }
      if (kind === 'up') {
        const ph = (v.phone || '').replace(/\D/g, '').slice(-10);
        const { data, error } = await c.auth.signUp({ email: v.email.trim(), password: v.password, options: { data: { full_name: v.name.trim(), phone: ph }, emailRedirectTo: location.origin + '/account' } });
        if (error) return fail(error.message, 'up');
        if (data.session) { await ensureProfile(data.user); location.href = next(); return; }
        app().innerHTML = vLogin('in', '✓ Almost done: we sent a confirmation link to ' + v.email.trim() + '. Open it to activate your account.');
        return;
      }
      if (kind === 'forgot') {
        const { error } = await c.auth.resetPasswordForEmail(v.email.trim(), { redirectTo: location.origin + '/account/reset' });
        if (error) return fail(error.message);
        app().innerHTML = vLogin('in', '✓ If an account exists for ' + v.email.trim() + ', a reset link is on its way.');
        return;
      }
      if (kind === 'reset' || kind === 'password') {
        const { error } = await c.auth.updateUser({ password: v.password });
        if (error) return fail(error.message);
        if (kind === 'reset') { location.href = '/account'; return; }
        return pageProfile('Password updated.');
      }
      if (kind === 'profile') {
        const u = (await c.auth.getUser()).data.user;
        const { error } = await c.from('profiles').upsert({ id: u.id, name: v.name.trim() || null, phone: (v.phone || '').replace(/\D/g, '').slice(-10) || null, updated_at: new Date().toISOString() });
        if (error) return fail(error.message);
        await c.auth.updateUser({ data: { full_name: v.name.trim() } });
        paintHeader();
        return pageProfile('Saved.');
      }
      if (kind === 'addr') {
        const row = { label: v.label || null, name: v.name.trim(), phone: v.phone.replace(/\D/g, '').slice(-10), addr: v.addr.trim(), city: v.city.trim(), pin: v.pin.trim(), state: v.state.trim(), is_default: !!v.is_default };
        if (!/^[1-9]\d{5}$/.test(row.pin)) return fail('Please enter a valid 6-digit PIN code.');
        if (row.phone.length !== 10) return fail('Please enter a 10-digit mobile number.');
        if (row.is_default) await c.from('addresses').update({ is_default: false }).neq('id', f.dataset.id || 0);
        const { error } = f.dataset.id ? await c.from('addresses').update(row).eq('id', f.dataset.id) : await c.from('addresses').insert(row);
        if (error) return fail(error.message);
        location.href = '/account/addresses'; return;
      }
    } catch (err) { fail(err.message); }
  }, true);

  /* ---------- For checkout ---------- */
  window.SZAUTH = {
    user, token, paintHeader,
    async addresses() { try { const c = await sb(); const { data } = await c.from('addresses').select('label,name,city,pin,is_default').order('is_default', { ascending: false }).order('id', { ascending: false }).limit(6); return data || []; } catch (e) { return []; } },
    async savePin(v) { try { const c = await sb(); const u = user(); if (u) await c.from('profiles').upsert({ id: u.id, pin: v.pin, pin_city: v.city || null, pin_state: v.state || null, updated_at: new Date().toISOString() }); } catch (e) {} },
    // Default saved address (or profile) to fill the checkout form
    async prefill() {
      const u = user(); if (!u) return null;
      try {
        const c = await sb();
        const [{ data: ad }, { data: pr }] = await Promise.all([c.from('addresses').select('*').order('is_default', { ascending: false }).order('id', { ascending: false }).limit(1), c.from('profiles').select('*').eq('id', u.id).maybeSingle()]);
        const a = (ad && ad[0]) || {}; const m = u.user_metadata || {};
        return { name: a.name || (pr && pr.name) || m.full_name || '', phone: a.phone || (pr && pr.phone) || m.phone || '', email: u.email || '', addr: a.addr || '', city: a.city || '', pin: a.pin || '', state: a.state || '' };
      } catch (e) { return null; }
    },
    // After a logged-in order, keep its address for next time
    async rememberAddress(f) {
      if (!user()) return;
      try {
        const c = await sb();
        const { data } = await c.from('addresses').select('id,addr,pin').limit(50);
        const same = (data || []).some((a) => a.pin === f.pin && a.addr.trim().toLowerCase() === String(f.addr).trim().toLowerCase());
        if (!same) await c.from('addresses').insert({ name: f.name, phone: String(f.phone).replace(/\D/g, '').slice(-10), addr: f.addr, city: f.city, pin: f.pin, state: f.state || null, is_default: !(data || []).length });
      } catch (e) {}
    },
  };

  if (['login', 'account', 'track'].includes(VIEW)) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route); else route();
  }
})();
