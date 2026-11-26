/* Shopeiz browser code: bag, wishlist, checkout and small interactions.
   Pages arrive fully built from the server; this file adds the interactive parts. */
(function () {
  const SZ = window.SZ;
  const { HERO, fmt, esc, ic, byId, dateIn, url, media, gridOf, crumbs, card } = SZ;
  const SET = window.SZ_SET || {};
  const FREE_OVER = SET.free_over != null ? SET.free_over : SZ.FREE_OVER, STD_FEE = SET.std_fee != null ? SET.std_fee : SZ.STD_FEE, COD_FEE = SET.cod_fee != null ? SET.cod_fee : SZ.COD_FEE;
  const PROMO = { code: SET.promo_code != null ? SET.promo_code : SZ.PROMO.code, pct: SET.promo_pct != null ? SET.promo_pct : SZ.PROMO.pct };
  const MAXD = SET.max || 10, MIND = SET.min || 6, REP = SET.rep || 7;
  const CFG = SZ.CFG || {};
  const live = !!(CFG.url && CFG.key);
  // Bag lines and wishlist entries carry a snapshot of the product: {id, t, p, w, i, s, u, v}
  const asP = (x) => ({ id: x.id, title: x.t, price: x.p, was: x.w || 0, img: x.i, slug: x.s, sub: x.u, cat: '' });
  const key = (l) => l.id + (l.v ? ':' + l.v : '');
  const readSnap = (el) => { try { return JSON.parse(el.dataset.snap || 'null'); } catch (e) { return null; } };
  const fromOwn = (id) => { const p = byId(id); return p ? { id: p.id, t: p.title, p: p.price, w: p.was || 0, i: p.img || '', s: p.slug, u: p.sub || '', v: '' } : null; };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const VIEW = document.body.dataset.view || '';

  /* ---------- Old #/ links from the previous site ---------- */
  if (location.hash.startsWith('#/')) {
    const h = decodeURIComponent(location.hash.slice(2)).split('/');
    const p = h[0] === 'p' && byId(h[1]);
    const to = p ? url.product(p) : h[0] === 'c' ? url.cat(h[1] || 'all') : h[0] === 'search' ? url.search(h.slice(1).join('/')) : h[0] === 'help' ? url.help(h[1]) : h[0] === 'done' ? '/' : ['cart', 'checkout', 'wishlist'].includes(h[0]) ? '/' + h[0] : '/';
    location.replace(to);
    return;
  }

  /* ---------- State ---------- */
  const store = (() => {
    let s = { cart: [], wish: [], promo: false };
    try { s = Object.assign(s, JSON.parse(localStorage.getItem('shopeiz') || '{}')); } catch (e) {}
    // Older bags stored only ids: rebuild their snapshot from our own stock
    s.cart = (s.cart || []).map((l) => (l.t ? l : Object.assign(fromOwn(l.id) || {}, { qty: l.qty }))).filter((l) => l.id && l.t);
    s.wish = (s.wish || []).map((w) => (typeof w === 'string' ? fromOwn(w) : w)).filter((w) => w && w.id);
    return s;
  })();
  const save = () => { try { localStorage.setItem('shopeiz', JSON.stringify(store)); } catch (e) {} updateCounts(); };
  const ctx = () => ({ wish: store.wish.map((w) => w.id) });
  const wished = (id) => store.wish.some((w) => w.id === id);

  function totals(opts = {}) {
    const lines = store.cart.map((l) => ({ ...l, p: asP(l), total: l.p * l.qty }));
    const count = lines.reduce((a, l) => a + l.qty, 0);
    const sub = lines.reduce((a, l) => a + l.total, 0);
    const mrp = lines.reduce((a, l) => a + (l.p.was || l.p.price) * l.qty, 0);
    const ship = sub >= FREE_OVER || !sub ? 0 : STD_FEE;
    const disc = store.promo ? Math.round(sub * PROMO.pct / 100) : 0;
    const cod = opts.pay === 'cod' ? COD_FEE : 0;
    return { lines, count, sub, mrp, ship, disc, cod, total: sub + ship - disc + cod, saved: mrp - sub + disc };
  }

  /* ---------- Bag, checkout, wishlist views ---------- */
  function lineHtml(l, compact) {
    const k = key(l);
    return `<div class="line">
    <a class="media" href="${url.product(l.p)}">${media(l.p, '', 200)}</a>
    <div><h4><a href="${url.product(l.p)}">${esc(l.p.title)}</a></h4><div class="meta">${l.vt ? esc(l.vt) + ' · ' : l.p.sub ? esc(l.p.sub) + ' · ' : ''}${fmt(l.p.price)}${l.gone ? ' · <b style="color:var(--wine)">No longer available</b>' : ''}</div>
      <div class="qty sm"><button data-act="q" data-id="${esc(k)}" data-d="-1" aria-label="Decrease">${ic('i-minus')}</button><span>${l.qty}</span><button data-act="q" data-id="${esc(k)}" data-d="1" aria-label="Increase">${ic('i-plus')}</button></div></div>
    <div class="right"><b>${fmt(l.total)}</b><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">${compact ? '' : `<button class="rm" data-act="save" data-id="${esc(k)}">Save for later</button>`}<button class="rm" data-act="rm" data-id="${esc(k)}">Remove</button></div></div>
  </div>`;
  }
  function shipBar(sub) {
    const left = FREE_OVER - sub;
    return `<div class="ship-bar">${left > 0 ? `You're <b>${fmt(left)}</b> away from free delivery` : `${ic('i-check')} <b>You've unlocked free delivery</b>`}<div class="track"><i style="width:${Math.min(100, sub / FREE_OVER * 100)}%"></i></div></div>`;
  }
  function promoHtml() {
    if (!PROMO.code || !PROMO.pct) return '';
    return store.promo
      ? `<p class="msg ok" style="margin:16px 0 4px">${ic('i-check')} ${PROMO.code} applied. ${PROMO.pct}% off. <button class="rm" data-act="unpromo">Remove</button></p>`
      : `<div class="promo"><label class="sr" for="pc">Promo code</label><input id="pc" placeholder="Promo code" autocomplete="off" data-promo><button type="button" data-act="promo">Apply</button></div><p class="msg err" id="promoMsg"></p>`;
  }
  function summaryRows(t) {
    return `<div class="sum-row"><span>Subtotal (${t.count} item${t.count === 1 ? '' : 's'})</span><span>${fmt(t.sub)}</span></div>
    ${t.disc ? `<div class="sum-row"><span>Promo ${PROMO.code}</span><span class="ok">−${fmt(t.disc)}</span></div>` : ''}
    <div class="sum-row"><span>Delivery</span><span>${t.ship ? fmt(t.ship) : '<span class="ok">Free</span>'}</span></div>
    ${t.cod ? `<div class="sum-row"><span>Cash on delivery fee</span><span>${fmt(t.cod)}</span></div>` : ''}
    <div class="sum-row total"><span>Total <small style="font-weight:400;color:var(--muted)">incl. GST</small></span><span>${fmt(t.total)}</span></div>
    ${t.saved > 0 ? `<p class="msg ok" style="margin:-8px 0 16px">You're saving ${fmt(t.saved)} on this order</p>` : ''}`;
  }
  function vCart() {
    const t = totals();
    if (!t.count) return `<div class="wrap"><div class="empty" style="padding:120px 0"><h2>Your cart is empty</h2><p style="margin-bottom:28px">Let's find something you'll love.</p><a class="btn btn-dark" href="${url.shop}">Start shopping</a></div></div>`;
    return `<div class="wrap">
    <div class="page-head">${crumbs([['Home', '/'], ['Cart']])}<h1>Cart</h1></div>
    <div class="two">
      <div>${shipBar(t.sub)}${t.lines.map((l) => lineHtml(l)).join('')}</div>
      <div class="panel sticky"><h3>Order summary</h3>${promoHtml()}<div style="height:12px"></div>${summaryRows(t)}
        <a class="btn btn-wine btn-block" href="${url.checkout}">Checkout securely ${ic('i-lock')}</a>
        <p class="note">${ic('i-return')} ${REP}-day replacement · Cash on delivery available</p></div>
    </div>
  </div>`;
  }
  const co = { pay: 'cod', f: {}, busy: false, err: '' };
  // DeoDap items (ids starting dd) are prepaid only
  const prepaidOnly = (l) => l.np || /^dd\d/.test(l.id);
  function vCheckout() {
    const noCod = store.cart.filter(prepaidOnly);
    if (noCod.length && co.pay === 'cod') co.pay = 'upi';
    const t = totals(co);
    if (!t.count) return vCart();
    const field = (id, label, type = 'text', full = false, extra = '') => `<div class="field ${full ? 'full' : ''}"><label for="f-${id}">${label}</label><input id="f-${id}" name="${id}" type="${type}" value="${esc(co.f[id] || '')}" ${extra}><p class="msg err">Please fill this in.</p></div>`;
    const opt = (grp, v, title, sub, amt) => `<label class="opt ${co[grp] === v ? 'on' : ''}"><input type="radio" name="${grp}" value="${v}" ${co[grp] === v ? 'checked' : ''} data-act="opt"><span class="grow"><b>${title}</b><span>${sub}</span></span><span class="amt">${amt}</span></label>`;
    const maxDays = Math.max(...t.lines.map((l) => (l.id.length <= 4 ? 5 : MAXD)));
    return `<div class="wrap">
    <div class="page-head">${crumbs([['Home', '/'], ['Cart', url.cart], ['Checkout']])}<h1>Checkout</h1>
      <div class="steps"><b>Details</b><span>›</span><b>Address</b><span>›</span><b>Payment</b></div></div>
    <form class="two" data-form="checkout" novalidate>
      <div>
        ${window.SZAUTH ? (window.SZAUTH.user() ? `<p class="co-acct">${ic('i-user')} Ordering as <b>${esc(window.SZAUTH.user().email || '')}</b>. This order will appear in <a href="/account">your orders</a>.</p>` : `<p class="co-acct">${ic('i-user')} Have an account? <a href="/login?next=/checkout">Log in</a> for faster checkout and order tracking, or continue as a guest.</p>`) : ''}
        <fieldset><legend><span>01</span>Contact</legend><div class="fields">
          ${field('name', 'Full name', 'text', false, 'autocomplete="name" required')}
          ${field('phone', 'Mobile number', 'tel', false, 'autocomplete="tel" inputmode="numeric" required pattern="[0-9 +]{10,14}"')}
          ${field('email', 'Email (for your receipt, optional)', 'email', true, 'autocomplete="email"')}
        </div></fieldset>
        <fieldset><legend><span>02</span>Delivery address</legend><div class="fields">
          ${field('addr', 'House no., building, street, area, landmark', 'text', true, 'autocomplete="street-address" required')}
          ${field('city', 'City or town', 'text', false, 'autocomplete="address-level2" required')}
          ${field('pin', 'PIN code', 'text', false, 'autocomplete="postal-code" inputmode="numeric" required pattern="[1-9][0-9]{5}"')}
          ${field('state', 'State', 'text', true, 'autocomplete="address-level1" required')}
        </div>
        <p class="note" style="margin:14px 0 0">${ic('i-truck')} Delivered by ${dateIn(maxDays)} (${maxDays <= 5 ? '2 to 5' : MIND + ' to ' + maxDays} working days). ${t.sub >= FREE_OVER ? 'Free delivery.' : `Delivery ${fmt(STD_FEE)}, free over ${fmt(FREE_OVER)}.`}</p></fieldset>
        <fieldset><legend><span>03</span>Payment</legend><div class="opts">
          ${noCod.length ? `<p class="note" style="margin:0 0 6px">${ic('i-cash')} Cash on delivery isn't available for ${esc(noCod[0].t)}${noCod.length > 1 ? ` and ${noCod.length - 1} more item${noCod.length > 2 ? 's' : ''}` : ''}. Pay by UPI, or remove ${noCod.length > 1 ? 'them' : 'it'} to use cash on delivery.</p>` : opt('pay', 'cod', 'Cash on delivery', 'Pay in cash or UPI when it arrives', '+' + fmt(COD_FEE))}
          ${opt('pay', 'upi', 'Pay by UPI', 'We send a secure payment link to your mobile right after you order', 'No fee')}
        </div></fieldset>
      </div>
      <div class="panel sticky"><h3>Your order</h3>
        ${t.lines.map((l) => `<div class="mini"><div class="media">${media(l.p, '', 160)}<span class="q">${l.qty}</span></div><div><h4>${esc(l.p.title)}</h4><small>${esc(l.vt || l.p.sub || '')}</small></div><b style="font-size:14px">${fmt(l.total)}</b></div>`).join('')}
        ${promoHtml()}<div style="height:12px"></div>${summaryRows(t)}
        ${co.err ? `<p class="msg err" style="display:block;margin:0 0 12px">${esc(co.err)}</p>` : ''}
        <button class="btn btn-wine btn-block" type="submit" ${co.busy ? 'disabled' : ''}>${co.busy ? 'Placing your order…' : 'Place order · ' + fmt(t.total)} ${ic('i-lock')}</button>
        <p class="note">${ic('i-shield')} Your details are used only to deliver this order</p>
      </div>
    </form>
  </div>`;
  }
  function vDone() {
    let o = null;
    try { o = JSON.parse(sessionStorage.getItem('shopeiz-order') || 'null'); } catch (e) {}
    if (!o) return `<div class="wrap"><div class="empty" style="padding:110px 0"><h2>No recent order</h2><p style="margin-bottom:26px">Your cart is waiting.</p><a class="btn btn-dark" href="${url.shop}">Shop all</a></div></div>`;
    return `<div class="wrap"><div class="done">
    <svg class="mono" viewBox="0 0 206.04 235.47" width="58" style="margin:0 auto 26px" aria-hidden="true"><use href="#mono"/></svg>
    <span class="eyebrow">Order ${esc(o.id)}</span>
    <h1>Thank you, ${esc(o.name.split(' ')[0])}.</h1>
    <p style="color:var(--ink-2);font-size:16px">Your order is placed and should arrive by <b>${esc(o.arrives)}</b>. We'll send updates and tracking to ${esc(o.phone)}.</p>
    ${o.cod ? '' : `<div class="pay-note">${ic('i-shield')} <b>Next step:</b> we'll send a UPI payment link to ${esc(o.phone)} shortly. Your order ships once payment is received.</div>`}
    <div class="panel" style="text-align:left;margin:36px 0">${o.lines.map((l) => `<div class="sum-row"><span>${esc(l.t)} × ${l.q}</span><span>${fmt(l.v)}</span></div>`).join('')}<div class="sum-row total" style="margin-bottom:0"><span>${o.cod ? 'To pay on delivery' : 'To pay by UPI'}</span><span>${fmt(o.total)}</span></div></div>
    <div class="done-act">
      <a class="pdx-cta" href="${window.SZAUTH && window.SZAUTH.user() ? '/account/orders/' + encodeURIComponent(o.id) : '/track?code=' + encodeURIComponent(o.id) + '&phone=' + encodeURIComponent(o.phone)}">${ic('i-truck')} Track this order</a>
      <a class="pdx-cta line" href="/">Continue shopping</a>
    </div>
    ${window.SZAUTH && !window.SZAUTH.user() ? `<p class="note" style="margin-top:16px"><a href="/login?m=up" style="color:var(--brand);font-weight:700">Create an account</a> to see all your orders and their delivery status in one place.</p>` : ''}
  </div></div>`;
  }
  function vWish() {
    const list = store.wish.map(asP);
    return `<div class="wrap"><div class="page-head">${crumbs([['Home', '/'], ['Wishlist']])}<h1>Wishlist</h1><p>${list.length ? 'Saved for later.' : ''}</p></div>
    <div style="padding:36px 0 110px">${list.length ? gridOf(list, ctx()) : `<div class="empty"><h2>Nothing saved yet</h2><p style="margin-bottom:26px">Tap the heart on anything you like to keep it here.</p><a class="btn btn-dark" href="${url.shop}">Browse the collection</a></div>`}</div></div>`;
  }
  const CLIENT = { cart: vCart, checkout: vCheckout, done: vDone, wishlist: vWish };
  function renderClient() {
    if (!CLIENT[VIEW]) return;
    const y = window.scrollY;
    $('#app').innerHTML = CLIENT[VIEW]();
    window.scrollTo(0, y);
    observe();
  }

  /* ---------- Keep bag prices current ---------- */
  async function api(fn, args) {
    // Signed-in customers send their own token, so their orders are saved to their account
    const tok = fn === 'place_order' && window.SZAUTH ? await window.SZAUTH.token() : null;
    const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CFG.key, Authorization: `Bearer ${tok || CFG.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && (j.message || j.hint)) || 'Something went wrong. Please try again.');
    return j;
  }
  async function refreshPrices() {
    if (!live || !store.cart.length) return;
    try {
      const rows = await api('bag_prices', { ids: [...new Set(store.cart.map((l) => l.id))] });
      let changed = false;
      store.cart.forEach((l) => {
        const r = rows.find((x) => x.id === l.id);
        if (!r) return;
        const v = l.v && r.variants.find((x) => x.id === l.v);
        const price = Number(v ? v.price : r.price);
        const ok = r.ok && (!v || v.ok);
        if (price && price !== l.p) { l.p = price; changed = true; }
        if (!ok !== !!l.gone) { l.gone = !ok; changed = true; }
        if (r.cod === false && !l.np) { l.np = 1; changed = true; }
      });
      if (changed) { save(); renderClient(); if ($('#bag').classList.contains('on')) renderBag(); }
    } catch (e) {}
  }

  /* ---------- Chrome ---------- */
  function updateCounts() {
    const t = totals();
    $$('[data-count="bag"]').forEach((e) => (e.textContent = t.count || ''));
    $$('[data-count="wish"]').forEach((e) => (e.textContent = store.wish.length || ''));
  }
  function syncWish() {
    $$('[data-act="wish"]').forEach((b) => { const on = wished(b.dataset.id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }
  function renderBag() {
    const t = totals();
    $('#bag').innerHTML = `<div class="dhead"><h3>Cart ${t.count ? `<small style="font-family:var(--sans);font-size:13px;color:var(--muted)">(${t.count})</small>` : ''}</h3><button class="icon-btn" data-act="close" aria-label="Close">${ic('i-x')}</button></div>
    ${t.count ? shipBar(t.sub) : ''}
    <div class="dbody">${t.count ? t.lines.map((l) => lineHtml(l, true)).join('') : `<div class="empty" style="padding:70px 0"><h2 style="font-size:30px">Your cart is empty</h2><p style="margin-bottom:24px">Your next favourite thing is waiting.</p><a class="btn btn-dark" href="${url.shop}">Start shopping</a></div>`}</div>
    ${t.count ? `<div class="dfoot"><div class="sum-row" style="font-size:16px;font-weight:600;margin:0 0 4px"><span>Subtotal</span><span>${fmt(t.sub)}</span></div><p style="font-size:12px;color:var(--muted);margin:0 0 16px">GST included. Delivery and promo codes applied at checkout.</p>
      <a class="btn btn-wine btn-block" href="${url.checkout}">Checkout ${ic('i-lock')}</a>
      <a class="btn btn-block" href="${url.cart}" style="height:44px;margin-top:6px">View cart</a></div>` : ''}`;
  }
  function renderMenu() {
    const cats = SZ.CATS;
    $('#menu').innerHTML = `<div class="dhead mh"><a class="mh-logo" href="/" aria-label="Shopeiz home"><svg viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono"/></svg><span>Shopeiz</span></a><button class="icon-btn" data-act="close" aria-label="Close">${ic('i-x')}</button></div>
    <div class="dbody mn">
      <h4>Shop by category</h4>
      <div class="mn-grid">
        <a href="${url.deals}" class="mn-deal"><span class="mn-img"><b>Deals</b></span><span>Deals</span></a>
        ${cats.map((c) => `<a href="${url.cat(c.id)}"><span class="mn-img">${c.cover ? `<img src="${SZ.imgUrl(c.cover, 200)}" alt="" loading="lazy">` : ''}</span><span>${c.label}</span></a>`).join('')}
      </div>
      <div class="mn-links">
        <a href="${url.shop}">Shop all products ${ic('i-arrow')}</a>
        <a href="${url.wishlist}">Wishlist ${store.wish.length ? `<em>${store.wish.length}</em>` : ''} ${ic('i-arrow')}</a>
        <a href="${url.help('delivery')}">Delivery ${ic('i-arrow')}</a>
        <a href="${url.help('returns')}">Replacements &amp; refunds ${ic('i-arrow')}</a>
        <a href="${url.help('contact')}">Help &amp; contact ${ic('i-arrow')}</a>
      </div>
    </div>`;
  }
  function openDrawer(id) {
    if (id === 'bag') renderBag(); else renderMenu();
    $('#' + id).classList.add('on'); $('#' + id).setAttribute('aria-hidden', 'false');
    $('#scrim').classList.add('on'); document.body.style.overflow = 'hidden';
    if (id === 'menu') setTimeout(() => $('#menu input') && $('#menu input').focus(), 350);
  }
  function closeDrawers() {
    $$('.drawer').forEach((d) => { d.classList.remove('on'); d.setAttribute('aria-hidden', 'true'); });
    $('#scrim').classList.remove('on'); document.body.style.overflow = '';
  }
  let toastT;
  function toast(msg, action) {
    const el = $('#toast');
    el.innerHTML = `<span>${msg}</span>${action || ''}`;
    el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3200);
  }

  /* ---------- Actions ---------- */
  let pdpQty = 1;
  function addToCart(sn, qty = 1, open = true) {
    if (!sn) return;
    const l = store.cart.find((x) => key(x) === key(sn));
    if (l) { l.qty = Math.min(10, l.qty + qty); Object.assign(l, sn, { qty: l.qty }); } else store.cart.push(Object.assign({}, sn, { qty }));
    save();
    if (open) openDrawer('bag');
  }
  function saveFields() { $$('[data-form="checkout"] input:not([type="radio"])').forEach((i) => { if (i.id.startsWith('f-')) co.f[i.name] = i.value; }); }
  function applyPromo() {
    if (PROMO.code && (($('#pc') || {}).value || '').trim().toUpperCase() === PROMO.code.toUpperCase()) { saveFields(); store.promo = true; save(); toast(`Promo applied. ${PROMO.pct}% off.`); renderClient(); }
    else $('#promoMsg').textContent = "We don't recognise that code. Check the spelling?";
  }
  const pdpSnap = () => { const b = $('#pdpAdd'); return b ? readSnap(b) : null; };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const a = el.dataset.act, id = el.dataset.id;
    if (a === 'opt' || a === 'sort') return;
    if (a === 'close') { closeDrawers(); return; }
    if (a === 'menu') { e.preventDefault(); openDrawer('menu'); return; }
    if (a === 'bag') { openDrawer('bag'); return; }
    if (a === 'add') { e.preventDefault(); const pd = el.dataset.qty && pdpSnap(); addToCart(pd || readSnap(el) || fromOwn(id), el.dataset.qty ? pdpQty : 1); return; }
    if (a === 'buynow') { addToCart(pdpSnap() || fromOwn(id), pdpQty, false); location.href = url.checkout; return; }
    if (a === 'pq') {
      pdpQty = Math.max(1, Math.min(10, pdpQty + Number(el.dataset.d)));
      $('#pq').textContent = pdpQty;
      const b = $('#pdpAdd'); b.textContent = "Add to cart";
      return;
    }
    if (a === 'pimg') {
      const m = $('#pmain'); if (m) m.scrollTo({ left: m.clientWidth * Number(el.dataset.k), behavior: 'smooth' });
      return;
    }
    if (a === 'zoom') { lbOpen(Number(el.dataset.k)); return; }
    if (a === 'lbclose') { $('#lb').hidden = true; document.body.style.overflow = ''; return; }
    if (a === 'lbnav') { lbOpen(lbK + Number(el.dataset.d)); return; }
    if (a === 'rvopen') { const f = $('[data-form="review"]'); f.hidden = false; f.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (a === 'pvar') {
      $$('.vars button').forEach((b) => b.classList.toggle('on', b === el));
      const b = $('#pdpAdd'), sn = readSnap(b), price = Number(el.dataset.price);
      sn.v = el.dataset.v; sn.vt = el.textContent.trim(); sn.p = price;
      b.dataset.snap = JSON.stringify(sn); b.dataset.price = price;
      b.textContent = 'Add to cart';
      const pr = $('#pprice strong'); if (pr) pr.textContent = Math.round(price).toLocaleString('en-IN');
      return;
    }
    if (a === 'wish') {
      const i = store.wish.findIndex((w) => w.id === id);
      if (i > -1) { store.wish.splice(i, 1); toast('Removed from your wishlist'); }
      else { const sn = readSnap(el) || fromOwn(id); if (sn) { delete sn.v; store.wish.push(sn); } toast('Saved to your wishlist', `<a href="${url.wishlist}">View</a>`); }
      save(); syncWish();
      if (VIEW === 'wishlist') renderClient();
      return;
    }
    if (a === 'q' || a === 'rm' || a === 'save') {
      const l = store.cart.find((x) => key(x) === id);
      if (a === 'q' && l) { l.qty += Number(el.dataset.d); if (l.qty < 1) store.cart = store.cart.filter((x) => x !== l); if (l.qty > 10) l.qty = 10; }
      if (a === 'rm') store.cart = store.cart.filter((x) => key(x) !== id);
      if (a === 'save' && l) { store.cart = store.cart.filter((x) => x !== l); if (!wished(l.id)) { const w = Object.assign({}, l); delete w.qty; delete w.v; delete w.vt; store.wish.push(w); } toast('Moved to your wishlist'); }
      save();
      if ($('#bag').classList.contains('on')) renderBag();
      if (VIEW === 'cart' || VIEW === 'checkout') { saveFields(); renderClient(); }
      return;
    }
    if (a === 'promo') { applyPromo(); return; }
    if (a === 'unpromo') { saveFields(); store.promo = false; save(); renderClient(); return; }
    if (a === 'filters') { const f = $('#filters'); if (f) f.classList.toggle('open'); return; }
    if (a === 'rail') { const r = el.parentElement.querySelector('.rail-in'); r.scrollBy({ left: Number(el.dataset.d) * r.clientWidth * 0.9, behavior: 'smooth' }); return; }
    if (a === 'slide') { heroGo(Number(el.dataset.k)); if (heroTimer) heroStart(); return; }
    if (a === 'copy') { try { navigator.clipboard.writeText(PROMO.code); } catch (err) {} toast(`Code ${PROMO.code} copied`); return; }
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.act === 'sort') { const u = new URL(location.href); u.searchParams.delete('page'); if (el.value === 'pop') u.searchParams.delete('sort'); else u.searchParams.set('sort', el.value); location.href = u.pathname + u.search; }
    if (el.dataset.act === 'opt') { saveFields(); co[el.name] = el.value; renderClient(); }
  });
  document.addEventListener('input', (e) => { if (e.target.closest('[data-form="checkout"]') && e.target.id && e.target.id.startsWith('f-')) { co.f[e.target.name] = e.target.value; const f = e.target.closest('.field'); if (f) f.classList.remove('bad'); } });
  document.addEventListener('submit', async (e) => {
    const f = e.target, kind = f.dataset.form;
    if (!kind) return;
    e.preventDefault();
    if (kind === 'review') {
      const fd = Object.fromEntries(new FormData(f).entries());
      const err = $('[data-rverr]', f);
      if (!fd.rating) { err.textContent = 'Please choose a star rating.'; return; }
      if (!live) { err.textContent = 'Reviews are not available right now.'; return; }
      const btn = f.querySelector('button[type=submit]'); btn.disabled = true; err.textContent = '';
      try {
        const r = await api('submit_review', { p: fd });
        f.innerHTML = `<p class="msg ok" style="margin:0">${ic('i-check')} Thank you${r.verified ? ', verified buyer' : ''}! Your review will appear after a quick check.</p>`;
      } catch (e2) { err.textContent = e2.message; btn.disabled = false; }
      return;
    }
    if (kind === 'news') { f.innerHTML = `<p style="margin:0;padding:16px 0;color:var(--gold-2)">${ic('i-check')} Thank you. You're on the list.</p>`; return; }
    if (kind === 'checkout') {
      saveFields();
      let first = null;
      $$('input[required]', f).forEach((i) => { const bad = !i.checkValidity() || !i.value.trim(); i.closest('.field').classList.toggle('bad', bad); if (bad && !first) first = i; });
      if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      if (co.busy) return;
      const t = totals(co);
      if (t.lines.some((l) => l.gone)) { co.err = 'Please remove the items that are no longer available.'; renderClient(); return; }
      const maxDays = Math.max(...t.lines.map((l) => (l.id.length <= 4 ? 5 : MAXD)));
      let order;
      if (live) {
        co.busy = true; co.err = ''; renderClient();
        try {
          const utm = {}; try { new URLSearchParams(sessionStorage.getItem('shopeiz-utm') || '').forEach((v, k) => (utm[k] = v)); } catch (err) {}
          const r = await api('place_order', { p: { name: co.f.name, phone: co.f.phone, email: co.f.email, addr: co.f.addr, city: co.f.city, pin: co.f.pin, state: co.f.state, pay: co.pay, promo: store.promo ? PROMO.code : '', items: store.cart.map((l) => ({ id: l.id, v: l.v || '', qty: l.qty })), utm, ua: navigator.userAgent } });
          order = { id: r.code, name: co.f.name, phone: co.f.phone, total: r.total, cod: r.pay === 'cod', arrives: dateIn(maxDays), lines: r.lines };
        } catch (err) { co.busy = false; co.err = err.message; renderClient(); return; }
      } else {
        order = { id: 'SZ-' + (40000 + Math.floor(Math.random() * 9999)), name: co.f.name, phone: co.f.phone, total: t.total, cod: co.pay === 'cod', arrives: dateIn(maxDays), lines: t.lines.map((l) => ({ t: l.p.title, q: l.qty, v: l.total })) };
      }
      try { sessionStorage.setItem('shopeiz-order', JSON.stringify(order)); } catch (err) {}
      if (live && window.SZAUTH) await window.SZAUTH.rememberAddress(co.f);
      store.cart = []; store.promo = false; save();
      location.href = '/order-confirmed';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawers();
    if (e.key === 'Enter' && e.target.matches('[data-promo]')) { e.preventDefault(); applyPromo(); }
  });
  // Remember where a visitor came from, for order analytics
  try { if (/utm_|gclid|fbclid/.test(location.search) && !sessionStorage.getItem('shopeiz-utm')) sessionStorage.setItem('shopeiz-utm', location.search.slice(1)); } catch (e) {}

  /* ---------- Product gallery ---------- */
  let lbK = 0;
  const gImgs = (() => { try { return JSON.parse(($('#gimgs') || {}).textContent || '[]'); } catch (e) { return []; } })();
  function lbOpen(k) {
    if (!gImgs.length) return;
    lbK = (k + gImgs.length) % gImgs.length;
    const lb = $('#lb'); lb.querySelector('img').src = gImgs[lbK]; lb.hidden = false; document.body.style.overflow = 'hidden';
  }
  const gm = $('#pmain');
  if (gm) gm.addEventListener('scroll', () => {
    const k = Math.round(gm.scrollLeft / gm.clientWidth);
    $$('.thumbs button').forEach((b, i) => b.classList.toggle('on', i === k));
    const c = $('#gcount'); if (c) c.textContent = `${k + 1} / ${gImgs.length}`;
  }, { passive: true });
  document.addEventListener('keydown', (e) => { const lb = $('#lb'); if (!lb || lb.hidden) return; if (e.key === 'ArrowRight') lbOpen(lbK + 1); if (e.key === 'ArrowLeft') lbOpen(lbK - 1); if (e.key === 'Escape') { lb.hidden = true; document.body.style.overflow = ''; } });
  // Star picker
  document.addEventListener('change', (e) => {
    if (e.target.name === 'rating' && e.target.closest('.rv-rate')) { const v = Number(e.target.value); $$('.rv-rate label').forEach((l, i) => l.classList.toggle('on', i < v)); }
  });

  /* ---------- Review link from a delivered order: open the form with the order number ---------- */
  (() => {
    const code = new URLSearchParams(location.search).get('review');
    const f = $('[data-form="review"]');
    if (!code || !f) return;
    f.hidden = false;
    if (f.order_code) f.order_code.value = code;
    setTimeout(() => f.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  })();

  /* ---------- Hero slider ---------- */
  let heroK = 0, heroTimer;
  function heroGo(k) {
    const slides = $$('.slide');
    if (!slides.length) return;
    heroK = (k + slides.length) % slides.length;
    slides.forEach((s, i) => { s.classList.toggle('on', i === heroK); s.setAttribute('aria-hidden', i === heroK ? 'false' : 'true'); });
    $$('.hero-nav .bars button').forEach((b, i) => { b.classList.remove('on'); void b.offsetWidth; b.classList.toggle('on', i === heroK); });
    const n = $('#heroNum'); if (n) n.textContent = String(heroK + 1).padStart(2, '0');
  }
  function heroStart() { clearInterval(heroTimer); heroTimer = setInterval(() => heroGo(heroK + 1), 6500); }
  if ($('#heroVis') && $$('.slide').length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroStart();
    $('#heroVis').addEventListener('mouseenter', () => clearInterval(heroTimer));
    $('#heroVis').addEventListener('mouseleave', heroStart);
  }

  /* ---------- Reveal on scroll ---------- */
  let io;
  function observe() {
    if (!('IntersectionObserver' in window)) { $$('.reveal').forEach((e) => e.classList.add('in')); return; }
    io = io || new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal:not(.in)').forEach((e) => io.observe(e));
  }
  window.addEventListener('scroll', () => {
    $('#hdr').classList.toggle('scrolled', window.scrollY > 8);
    const sb = $('#stickyBuy'); if (sb && sb.innerHTML.trim()) sb.classList.toggle('on', window.scrollY > 560);
  }, { passive: true });

  renderClient();
  if (VIEW === 'cart' || VIEW === 'checkout') refreshPrices();
  // Delivery PIN chosen in the header fills the checkout address
  if (VIEW === 'checkout') {
    let pv = null; try { pv = JSON.parse(localStorage.getItem('shopeiz-pin') || 'null'); } catch (e) {}
    if (pv && pv.pin && !co.f.pin) { co.f.pin = pv.pin; if (pv.city && !co.f.city) co.f.city = pv.city; if (pv.state && !co.f.state) co.f.state = pv.state; renderClient(); }
  }
  // Signed-in customers: fill the checkout form from their saved address
  if (VIEW === 'checkout' && window.SZAUTH && window.SZAUTH.user() && !co.f.name && !co.f.addr) {
    window.SZAUTH.prefill().then((d) => { if (d && !co.f.name && !co.f.addr) { Object.keys(d).forEach((k) => { if (d[k]) co.f[k] = d[k]; }); renderClient(); } });
  }
  syncWish();
  updateCounts();
  observe();
})();

/* Search suggestions: phrases, categories and products as you type, recent and popular searches on focus */
(function () {
  if (typeof document === 'undefined') return;
  const POP = ['Drones', 'Earbuds', 'Kettle', 'Sarees', 'Storage containers', 'Lunch box'];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const recent = { get() { try { return JSON.parse(localStorage.getItem('sz-recent') || '[]'); } catch (e) { return []; } },
    add(q) { try { const r = [q, ...this.get().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5); localStorage.setItem('sz-recent', JSON.stringify(r)); } catch (e) {} },
    clear() { try { localStorage.removeItem('sz-recent'); } catch (e) {} } };
  const cache = {};
  const sHref = (q) => '/search?q=' + encodeURIComponent(q);
  const bold = (ph, q) => { const i = ph.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(ph) : esc(ph.slice(0, i)) + '<span class="sg-typed">' + esc(ph.slice(i, i + q.length)) + '</span><b>' + esc(ph.slice(i + q.length)) + '</b>'; };
  const icS = '<svg class="i"><use href="#i-search"/></svg>';

  function panelFor(form) {
    let p = form.querySelector('.sg');
    if (!p) { p = document.createElement('div'); p.className = 'sg'; p.setAttribute('role', 'listbox'); p.hidden = true; form.appendChild(p); }
    return p;
  }
  function idle(form) {
    const r = recent.get();
    return (r.length ? `<div class="sg-sec"><div class="sg-h">Recent searches <button type="button" class="sg-clear" data-sg-clear>Clear</button></div>${r.map((q) => `<a class="sg-term" href="${sHref(q)}" data-q="${esc(q)}">${icS}<span>${esc(q)}</span></a>`).join('')}</div>` : '') +
      `<div class="sg-sec"><div class="sg-h">Popular right now</div><div class="sg-pills">${POP.map((q) => `<a class="sg-pill" href="${sHref(q)}" data-q="${esc(q)}">${esc(q)}</a>`).join('')}</div></div>`;
  }
  function results(d) {
    if (!d.total) return `<div class="sg-none">No matches for “${esc(d.q)}”. Try a simpler word, like “kettle” or “drone”.</div><div class="sg-sec"><div class="sg-h">Popular right now</div><div class="sg-pills">${POP.map((q) => `<a class="sg-pill" href="${sHref(q)}" data-q="${esc(q)}">${esc(q)}</a>`).join('')}</div></div>`;
    const terms = [d.q, ...d.terms].slice(0, 6);
    return `<div class="sg-cols"><div class="sg-left">
      <div class="sg-sec"><div class="sg-h">Suggestions</div>${terms.map((t) => `<a class="sg-term" href="${sHref(t)}" data-q="${esc(t)}">${icS}<span>${bold(t, d.q)}</span></a>`).join('')}</div>
      ${d.cats.length ? `<div class="sg-sec"><div class="sg-h">Categories</div>${d.cats.map((c) => `<a class="sg-cat" href="${c.href}"><span>${esc(c.label)}</span><small>${c.n.toLocaleString('en-IN')}</small></a>`).join('')}</div>` : ''}
    </div><div class="sg-right"><div class="sg-h">Products</div>
      ${d.items.map((p) => `<a class="sg-item" href="${p.href}"><span class="sg-img">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : ''}</span><span class="sg-txt"><span class="sg-t">${bold(p.t, d.q.split(' ').pop())}</span><span class="sg-p">${p.p}${p.w ? ` <s>${p.w}</s>` : ''}</span></span></a>`).join('')}
    </div></div>
    <a class="sg-all" href="${sHref(d.q)}" data-q="${esc(d.q)}">See all ${d.total.toLocaleString('en-IN')} result${d.total === 1 ? '' : 's'} for “${esc(d.q)}” <svg class="i"><use href="#i-arrow"/></svg></a>`;
  }
  function show(form, html) { const p = panelFor(form); p.innerHTML = html; p.hidden = false; form.classList.add('sg-on'); p.querySelectorAll('a').forEach((a) => a.setAttribute('role', 'option')); }
  function hide(form) { const p = form.querySelector('.sg'); if (p) p.hidden = true; form.classList.remove('sg-on'); }
  let timer, seq = 0;
  function update(input) {
    const form = input.closest('form'), q = input.value.trim();
    clearTimeout(timer);
    if (q.length < 2) return show(form, idle(form));
    if (cache[q.toLowerCase()]) return show(form, results(cache[q.toLowerCase()]));
    timer = setTimeout(async () => {
      const my = ++seq;
      try {
        const r = await fetch('/suggest?q=' + encodeURIComponent(q.toLowerCase()));
        const d = await r.json(); cache[q.toLowerCase()] = d;
        if (my === seq && input.value.trim() === q) show(form, results(d));
      } catch (e) {}
    }, 160);
  }
  const isSearch = (el) => el && el.matches && el.matches('form.search input[name="q"]');
  document.addEventListener('focusin', (e) => { if (isSearch(e.target)) update(e.target); });
  document.addEventListener('input', (e) => { if (isSearch(e.target)) update(e.target); });
  document.addEventListener('keydown', (e) => {
    if (!isSearch(e.target)) return;
    const form = e.target.closest('form'), p = form.querySelector('.sg');
    if (e.key === 'Escape') { hide(form); return; }
    if (!p || p.hidden || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const links = [...p.querySelectorAll('a')], cur = p.querySelector('a.on');
    let i = links.indexOf(cur) + (e.key === 'ArrowDown' ? 1 : -1);
    if (i >= links.length) i = 0; if (i < 0) i = links.length - 1;
    links.forEach((a) => a.classList.remove('on')); links[i].classList.add('on'); links[i].scrollIntoView({ block: 'nearest' });
  }, true);
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!form.matches('form.search')) return;
    const on = form.querySelector('.sg a.on');
    if (on) { e.preventDefault(); if (on.dataset.q) recent.add(on.dataset.q); location.href = on.href; return; }
    const q = (form.querySelector('input[name="q"]').value || '').trim();
    if (!q) { e.preventDefault(); return; }
    recent.add(q);
  }, true);
  document.addEventListener('mousedown', (e) => {
    const clr = e.target.closest('[data-sg-clear]');
    if (clr) { e.preventDefault(); recent.clear(); const f = clr.closest('form'); show(f, idle(f)); return; }
    const a = e.target.closest('.sg a[data-q]'); if (a) recent.add(a.dataset.q);
    document.querySelectorAll('form.search.sg-on').forEach((f) => { if (!f.contains(e.target)) hide(f); });
  });
})();
/* Bottom tab bar: highlight the current section */
(function () {
  if (typeof document === 'undefined') return;
  const p = location.pathname;
  const t = p === '/' ? 'home' : p.startsWith('/deals') ? 'deals' : p.startsWith('/account') || p.startsWith('/login') || p.startsWith('/wishlist') || p.startsWith('/track') ? 'account' : p.startsWith('/cart') || p.startsWith('/checkout') ? 'cart' : '';
  const go = () => { const el = document.querySelector('.tabbar [data-tab="' + t + '"]'); if (el) el.classList.add('on'); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

/* Delivery PIN code: customers tell us where they are once; header, product pages and checkout use it */
(function () {
  if (typeof document === 'undefined') return;
  const SZ = window.SZ || {};
  const { ic, esc, dateIn } = SZ;
  const KEY = 'shopeiz-pin';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const put = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  // Areas couriers take longer to reach: J&K and Ladakh, the North-East, Sikkim, Andaman and Lakshadweep
  const remote = (pin) => /^(18|19|79|737|744|6825)/.test(pin);
  const title = (t) => String(t || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  async function lookup(pin) {
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
      const r = await fetch('https://api.postalpincode.in/pincode/' + pin, { signal: ctl.signal }); clearTimeout(to);
      const j = await r.json(); const d = j && j[0];
      if (!d || d.Status !== 'Success' || !d.PostOffice || !d.PostOffice.length) return { pin, bad: true };
      const po = d.PostOffice[0];
      const city = [po.Block, po.Division, po.District].find((x) => x && x !== 'NA') || po.District;
      return { pin, city: title(city), district: title(po.District), state: title(po.State), remote: remote(pin) };
    } catch (e) {
      // Lookup service unavailable: accept any well-formed PIN, we deliver everywhere in India
      return { pin, city: '', state: '', remote: remote(pin), offline: true };
    }
  }
  const label = (v) => (v ? (v.city ? v.city + ' ' + v.pin : v.pin) : 'Select location');
  const extra = (v) => (v && v.remote ? 3 : 0);

  function paint() {
    const v = get();
    $$('[data-pin-label]').forEach((el) => (el.textContent = label(v)));
    $$('.nh-loc').forEach((el) => el.classList.toggle('empty', !v));
    if (v) hideNudge();
    const row = $('[data-pinrow]');
    if (row) {
      const days = Number(row.dataset.days) || 10;
      const t = row.querySelector('.pin-t'), b = row.querySelector('button');
      if (v) {
        t.innerHTML = `Delivering to <b>${esc(v.city ? v.city + ', ' : '')}${esc(v.pin)}</b><small>${v.remote ? 'Remote area: please allow 2 to 3 extra days.' : 'Delivery available · ' + (row.dataset.cod === '0' ? 'Prepaid by UPI' : 'Cash on delivery available')}</small>`;
        b.textContent = 'Change';
        const eta = $('[data-eta]'); if (eta) eta.textContent = dateIn(days + extra(v));
      } else { t.textContent = 'Enter your PIN code to check delivery to your area'; b.textContent = 'Check'; }
    }
  }

  let box;
  function modal() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'pinm'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Delivery location');
    box.innerHTML = `<div class="pinm-c">
      <div class="pinm-h"><h3>Where should we deliver?</h3><button data-pin="close" aria-label="Close">${ic('i-x')}</button></div>
      <p class="sub">Enter your PIN code to see delivery dates and options for your area.</p>
      <form class="pin-f" data-pin-form><input name="pin" inputmode="numeric" maxlength="6" autocomplete="postal-code" placeholder="6-digit PIN code" aria-label="PIN code"><button type="submit">Apply</button></form>
      <div data-pin-res></div><div data-pin-saved></div>
      <div class="pin-foot"><span></span><button type="button" data-pin="clear">Clear location</button></div>
    </div>`;
    document.body.appendChild(box);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    return box;
  }
  function open() {
    const m = modal(); const v = get();
    const inp = m.querySelector('input'); inp.value = v ? v.pin : '';
    m.querySelector('[data-pin-res]').innerHTML = v ? result(v) : '';
    m.classList.add('on');
    setTimeout(() => inp.focus(), 60);
    // Saved addresses for signed-in customers
    const sv = m.querySelector('[data-pin-saved]');
    if (window.SZAUTH && window.SZAUTH.user() && window.SZAUTH.addresses) {
      window.SZAUTH.addresses().then((list) => {
        if (!list || !list.length) return;
        sv.innerHTML = `<div class="pin-saved"><small>Your addresses</small><div>${list.slice(0, 4).map((a) => `<button type="button" data-pin="use" data-p="${esc(a.pin)}" class="${v && v.pin === a.pin ? 'on' : ''}"><b>${esc(a.label || a.name)}</b>${esc(a.city)} ${esc(a.pin)}</button>`).join('')}</div></div>`;
      });
    }
  }
  function close() { if (box) box.classList.remove('on'); }
  const result = (v) => v.bad
    ? `<div class="pin-res bad">${ic('i-x')}<div><b>We couldn't find PIN code ${esc(v.pin)}</b><span>Please check the number and try again.</span></div></div>`
    : `<div class="pin-res ok">${ic('i-check')}<div><b>Delivery available to ${esc(v.city ? v.city + ', ' : '')}${esc(v.state ? v.state + ' ' : '')}${esc(v.pin)}</b><span>${v.remote ? 'Remote area: usually 2 to 3 days longer than standard.' : `Usually ${(window.SZ_SET && window.SZ_SET.min) || 6} to ${(window.SZ_SET && window.SZ_SET.max) || 10} working days`} · Cash on delivery and UPI</span></div></div>`;

  async function apply(pin) {
    const m = modal(); const btn = m.querySelector('[data-pin-form] button'); const res = m.querySelector('[data-pin-res]');
    pin = String(pin || '').replace(/\D/g, '');
    if (!/^[1-9]\d{5}$/.test(pin)) { res.innerHTML = `<div class="pin-res bad">${ic('i-x')}<div><b>Please enter a valid 6-digit PIN code</b></div></div>`; return; }
    btn.disabled = true; btn.textContent = 'Checking…';
    const v = await lookup(pin);
    btn.disabled = false; btn.textContent = 'Apply';
    res.innerHTML = result(v);
    if (v.bad) return;
    v.at = Date.now(); put(v); paint();
    if (window.SZAUTH && window.SZAUTH.user() && window.SZAUTH.savePin) window.SZAUTH.savePin(v);
    document.dispatchEvent(new CustomEvent('sz:pin', { detail: v }));
    setTimeout(close, 1100);
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-pin]');
    if (!el) return;
    const a = el.dataset.pin;
    if (a === 'open') { e.preventDefault(); open(); }
    if (a === 'close') close();
    if (a === 'use') { modal().querySelector('input').value = el.dataset.p; apply(el.dataset.p); }
    if (a === 'clear') { try { localStorage.removeItem(KEY); } catch (err) {} paint(); close(); }
  });
  document.addEventListener('submit', (e) => { if (e.target.matches('[data-pin-form]')) { e.preventDefault(); apply(e.target.pin.value); } });
  document.addEventListener('input', (e) => { if (e.target.closest('[data-pin-form]')) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); if (e.target.value.length === 6) apply(e.target.value); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // First visit: a small prompt under "Deliver to" asks for the PIN code (once a week at most if dismissed)
  let nudge;
  function hideNudge() { if (nudge) { nudge.classList.remove('on'); setTimeout(() => nudge && nudge.remove(), 300); nudge = null; } }
  function showNudge() {
    if (get()) return;
    let later = 0; try { later = Number(localStorage.getItem('shopeiz-pin-later') || 0); } catch (e) {}
    if (Date.now() - later < 7 * 864e5) return;
    const anchor = $('.nh-loc-w'); if (!anchor || !anchor.offsetParent) return;
    if (['checkout', 'login', 'account', 'track'].includes(document.body.dataset.view)) return;
    nudge = document.createElement('div');
    nudge.className = 'pin-nudge'; nudge.setAttribute('role', 'dialog'); nudge.setAttribute('aria-label', 'Choose your delivery location');
    nudge.innerHTML = '<b>Where should we deliver?</b><p>Enter your PIN code to see delivery dates and options for your area.</p><div><button class="go" data-pin="open">Enter PIN code</button><button class="later" data-pin="later">Later</button></div>';
    anchor.appendChild(nudge);
    requestAnimationFrame(() => requestAnimationFrame(() => nudge && nudge.classList.add('on')));
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-pin]');
    if (el && el.dataset.pin === 'later') { try { localStorage.setItem('shopeiz-pin-later', String(Date.now())); } catch (err) {} hideNudge(); return; }
    if (el && el.dataset.pin === 'open') hideNudge();
  });
  setTimeout(showNudge, 1800);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
  window.SZPIN = { get };
})();
