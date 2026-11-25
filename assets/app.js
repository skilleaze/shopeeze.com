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
    if (!t.count) return `<div class="wrap"><div class="empty" style="padding:120px 0"><h2>Your bag is empty</h2><p style="margin-bottom:28px">Let's find something you'll love.</p><a class="btn btn-dark" href="${url.shop}">Start shopping</a></div></div>`;
    return `<div class="wrap">
    <div class="page-head">${crumbs([['Home', '/'], ['Bag']])}<h1>Your bag</h1></div>
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
    <div class="page-head">${crumbs([['Home', '/'], ['Bag', url.cart], ['Checkout']])}<h1>Checkout</h1>
      <div class="steps"><b>Details</b><span>›</span><b>Address</b><span>›</span><b>Payment</b></div></div>
    <form class="two" data-form="checkout" novalidate>
      <div>
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
    if (!o) return `<div class="wrap"><div class="empty" style="padding:110px 0"><h2>No recent order</h2><p style="margin-bottom:26px">Your bag is waiting.</p><a class="btn btn-dark" href="${url.shop}">Shop all</a></div></div>`;
    return `<div class="wrap"><div class="done">
    <svg class="mono" viewBox="0 0 206.04 235.47" width="58" style="margin:0 auto 26px" aria-hidden="true"><use href="#mono"/></svg>
    <span class="eyebrow">Order ${esc(o.id)}</span>
    <h1>Thank you, ${esc(o.name.split(' ')[0])}.</h1>
    <p style="color:var(--ink-2);font-size:16px">Your order is placed and should arrive by <b>${esc(o.arrives)}</b>. We'll send updates and tracking to ${esc(o.phone)}.</p>
    ${o.cod ? '' : `<div class="pay-note">${ic('i-shield')} <b>Next step:</b> we'll send a UPI payment link to ${esc(o.phone)} shortly. Your order ships once payment is received.</div>`}
    <div class="panel" style="text-align:left;margin:36px 0">${o.lines.map((l) => `<div class="sum-row"><span>${esc(l.t)} × ${l.q}</span><span>${fmt(l.v)}</span></div>`).join('')}<div class="sum-row total" style="margin-bottom:0"><span>${o.cod ? 'To pay on delivery' : 'To pay by UPI'}</span><span>${fmt(o.total)}</span></div></div>
    <a class="btn btn-dark" href="/">Continue shopping</a>
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
    const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CFG.key, Authorization: `Bearer ${CFG.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
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
    $('#bag').innerHTML = `<div class="dhead"><h3>Your bag ${t.count ? `<small style="font-family:var(--sans);font-size:13px;color:var(--muted)">(${t.count})</small>` : ''}</h3><button class="icon-btn" data-act="close" aria-label="Close">${ic('i-x')}</button></div>
    ${t.count ? shipBar(t.sub) : ''}
    <div class="dbody">${t.count ? t.lines.map((l) => lineHtml(l, true)).join('') : `<div class="empty" style="padding:70px 0"><h2 style="font-size:30px">Your bag is empty</h2><p style="margin-bottom:24px">Your next favourite thing is waiting.</p><a class="btn btn-dark" href="${url.shop}">Start shopping</a></div>`}</div>
    ${t.count ? `<div class="dfoot"><div class="sum-row" style="font-size:16px;font-weight:600;margin:0 0 4px"><span>Subtotal</span><span>${fmt(t.sub)}</span></div><p style="font-size:12px;color:var(--muted);margin:0 0 16px">GST included. Delivery and promo codes applied at checkout.</p>
      <a class="btn btn-wine btn-block" href="${url.checkout}">Checkout ${ic('i-lock')}</a>
      <a class="btn btn-block" href="${url.cart}" style="height:44px;margin-top:6px">View bag</a></div>` : ''}`;
  }
  function renderMenu() {
    $('#menu').innerHTML = `<div class="dhead"><span class="wm" style="font-size:24px">Shopeiz</span><button class="icon-btn" data-act="close" aria-label="Close">${ic('i-x')}</button></div>
    <div class="dbody mnav">
      <form class="search" action="/search" role="search">${ic('i-search')}<input name="q" placeholder="Search the store" autocomplete="off" aria-label="Search"></form>
      <a href="${url.shop}">Shop all ${ic('i-arrow')}</a>
      ${SZ.CATS.map((c) => `<a href="${url.cat(c.id)}">${c.label} ${ic('i-arrow')}</a>`).join('')}
      <a href="${url.deals}" style="color:var(--wine)">Deals ${ic('i-arrow')}</a>
      <a href="${url.wishlist}">Wishlist <span style="font-family:var(--sans);font-size:14px;color:var(--muted)">${store.wish.length || ''}</span></a>
      <a href="${url.india}">Delivery across India ${ic('i-arrow')}</a>
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
      const b = $('#pdpAdd'); b.textContent = `Add to bag · ${fmt(Number(b.dataset.price) * pdpQty)}`;
      return;
    }
    if (a === 'pimg') {
      const img = $('#pmain img'); if (img) img.src = el.dataset.src;
      $$('.thumbs button').forEach((b) => b.classList.toggle('on', b === el));
      return;
    }
    if (a === 'pvar') {
      $$('.vars button').forEach((b) => b.classList.toggle('on', b === el));
      const b = $('#pdpAdd'), sn = readSnap(b), price = Number(el.dataset.price);
      sn.v = el.dataset.v; sn.vt = el.textContent.trim(); sn.p = price;
      b.dataset.snap = JSON.stringify(sn); b.dataset.price = price;
      b.textContent = `Add to bag · ${fmt(price * pdpQty)}`;
      const pr = $('#pprice b'); if (pr) pr.textContent = fmt(price);
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
    if (a === 'slide') { heroGo(Number(el.dataset.k)); return; }
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

  /* ---------- Hero slider ---------- */
  let heroK = 0, heroTimer;
  function heroGo(k) {
    heroK = k;
    $$('.slide').forEach((s, i) => s.classList.toggle('on', i === k));
    $$('.dots button').forEach((s, i) => s.classList.toggle('on', i === k));
    const p = byId(HERO[k]), tag = $('#heroTag');
    if (!p) return;
    if (tag) { tag.href = url.product(p); tag.innerHTML = `<div><div class="t">${esc(p.title)}</div><div class="p">${fmt(p.price)}${p.was ? `<s>${fmt(p.was)}</s>` : ''}</div></div><span class="go">${ic('i-arrow')}</span>`; }
  }
  if ($('#heroVis') && !matchMedia('(prefers-reduced-motion: reduce)').matches) heroTimer = setInterval(() => heroGo((heroK + 1) % HERO.length), 5500);

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
  syncWish();
  updateCounts();
  observe();
})();
