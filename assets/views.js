/* Shopeiz page views. Shared by the server (to send complete pages Google can read)
   and the browser (cart, wishlist and checkout). Pure functions: data in, HTML out. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./catalog.js'));
  else root.SZ = Object.assign(root.SZ || {}, factory(root.SZ));
})(typeof self !== 'undefined' ? self : this, function (C) {
  const { CATS, P, HERO, BEST, FREE_OVER, STD_FEE, EXP_FEE, COD_FEE, PROMO } = C;

  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const byId = (id) => P.find((p) => p.id === id);
  const bySlug = (s) => P.find((p) => p.slug === s);
  const catOf = (p) => CATS.find((c) => c.id === p.cat) || CATS[0];
  const off = (p) => (p.was ? Math.round((1 - p.price / p.was) * 100) : 0);
  const dateIn = (d) => { const t = new Date(Date.now() + d * 864e5); return t.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }); };

  const url = {
    home: '/', shop: '/shop', deals: '/deals', cart: '/cart', checkout: '/checkout', wishlist: '/wishlist', india: '/online-shopping-india',
    cat: (id) => (id === 'all' ? '/shop' : id === 'deals' ? '/deals' : '/category/' + id),
    product: (p) => '/products/' + p.slug,
    help: (k) => '/help/' + k,
    place: (slug) => '/online-shopping-in-' + slug,
    search: (q) => '/search?q=' + encodeURIComponent(q),
  };

  /* ---------- Pieces ---------- */
  function media(p, cls = '') {
    if (p.img) return `<img src="${p.img}" alt="${esc(p.title)}" loading="lazy" decoding="async">`;
    const c = catOf(p);
    return `<div class="ph ${cls}" style="background:${c.tone};color:${c.ink}">${ic(p.icon || c.icon)}<em>${esc(p.sub)}</em></div>`;
  }
  function stars(p) {
    if (!p.rating) return '';
    const full = Math.round(p.rating);
    return `<div class="stars"><i>${Array.from({ length: 5 }, (_, k) => `<svg style="opacity:${k < full ? 1 : .25}"><use href="#i-star"/></svg>`).join('')}</i>${p.rating} (${p.reviews})</div>`;
  }
  const priceHtml = (p) => `<div class="price"><b>${fmt(p.price)}</b>${p.was ? `<s>${fmt(p.was)}</s><span class="off">${off(p)}% off</span>` : ''}</div>`;
  function card(p, ctx = {}) {
    const w = (ctx.wish || []).includes(p.id);
    const badge = p.was ? `<span class="badge">−${off(p)}%</span>` : p.tag ? `<span class="badge light">${esc(p.tag)}</span>` : '';
    return `<article class="card reveal">
    <div style="position:relative">
      <a class="media" href="${url.product(p)}" aria-label="${esc(p.title)}">${media(p)}${badge}</a>
      <button class="wish ${w ? 'on' : ''}" data-act="wish" data-id="${p.id}" aria-label="Save ${esc(p.title)} to wishlist" aria-pressed="${w}">${ic('i-heart')}</button>
      <button class="quick only-d" data-act="add" data-id="${p.id}">Add to bag</button>
    </div>
    <div class="card-body">
      <p class="card-sub">${esc(p.sub)}</p>
      <h3><a href="${url.product(p)}">${esc(p.title)}</a></h3>
      ${stars(p)}${priceHtml(p)}
    </div>
    <button class="quick only-m" data-act="add" data-id="${p.id}">Add to bag</button>
  </article>`;
  }
  const gridOf = (list, ctx) => `<div class="grid">${list.map((p) => card(p, ctx)).join('')}</div>`;
  const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([label, href], i) => (i ? '<span>/</span>' : '') + (href ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`)).join('')}</nav>`;

  /* ---------- Home ---------- */
  function vHome(ctx = {}) {
    const best = BEST.map(byId).filter(Boolean);
    const t7 = byId('d4');
    return `
  <section class="hero">
    <div class="hero-copy">
      <span class="eyebrow">Shopeiz · From S to Z</span>
      <h1>The art of having <em>everything.</em></h1>
      <p class="lead">Anything you need, in one place, at your door. Drones, electronics, fashion, home and beauty. Fair prices, secure checkout, delivered across India.</p>
      <div class="ctas">
        <a class="btn btn-wine" href="${url.cat('drones')}">Shop drones ${ic('i-arrow')}</a>
        <a class="btn btn-line" href="${url.shop}">Explore all</a>
      </div>
      <div class="hero-perks">
        <span>${ic('i-truck')} Free delivery over ${fmt(FREE_OVER)}</span>
        <span>${ic('i-return')} 30-day free returns</span>
        <span>${ic('i-cash')} Cash on delivery</span>
      </div>
    </div>
    <div class="hero-visual" id="heroVis">
      ${HERO.map((id, k) => `<div class="slide ${k ? '' : 'on'}" data-slide="${k}"><img src="${byId(id).img}" alt="${esc(byId(id).title)}" ${k ? 'loading="lazy"' : 'fetchpriority="high"'}></div>`).join('')}
      <a class="hero-tag" id="heroTag" href="${url.product(byId(HERO[0]))}"><div><div class="t">${esc(byId(HERO[0]).title)}</div><div class="p">${fmt(byId(HERO[0]).price)}</div></div><span class="go">${ic('i-arrow')}</span></a>
      <div class="dots">${HERO.map((_, k) => `<button class="${k ? '' : 'on'}" data-act="slide" data-k="${k}" aria-label="Show slide ${k + 1}"></button>`).join('')}</div>
    </div>
  </section>

  <div class="trust">
    <div>${ic('i-truck')}<p style="margin:0"><b>Free delivery</b><span>On orders over ${fmt(FREE_OVER)}</span></p></div>
    <div>${ic('i-return')}<p style="margin:0"><b>30-day returns</b><span>Free and easy, no questions</span></p></div>
    <div>${ic('i-shield')}<p style="margin:0"><b>Secure checkout</b><span>UPI, cards and net banking</span></p></div>
    <div>${ic('i-cash')}<p style="margin:0"><b>Cash on delivery</b><span>Pay when it arrives</span></p></div>
  </div>

  <section class="block"><div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">Shop by category</span><h2>Anything you need, in one place</h2></div><a class="link" href="${url.shop}">View everything ${ic('i-arrow')}</a></div>
    <div class="cat-grid">${CATS.map((c) => `<a class="cat-tile reveal" href="${url.cat(c.id)}" style="color:${c.ink}">
      <div class="bg" style="background:${c.tone}">${c.img ? `<img src="${c.img}" alt="" loading="lazy">` : ic(c.icon)}</div>
      <h3>${c.label}</h3><span>${P.filter((p) => p.cat === c.id).length} pieces ${ic('i-arrow')}</span></a>`).join('')}</div>
  </div></section>

  <section class="feature">
    <div class="pic reveal"><img src="${t7.img}" alt="${esc(t7.title)} in its box" loading="lazy"></div>
    <div class="copy">
      <span class="eyebrow">The flagship · ${esc(t7.sub)}</span>
      <h2>The T7 Pro. <em>The view from above.</em></h2>
      <p>${esc(t7.desc)} Foldable, beginner-friendly and ready to fly the day it arrives.</p>
      <ul>
        <li>${ic('i-check')} Remote with a built-in screen, no phone needed</li>
        <li>${ic('i-check')} Choose orange or black</li>
        <li>${ic('i-check')} Delivered by ${dateIn(t7.days)} · free returns</li>
      </ul>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-light" data-act="add" data-id="${t7.id}">Add to bag · ${fmt(t7.price)}</button>
        <a class="link" style="color:#fff" href="${url.product(t7)}">Details ${ic('i-arrow')}</a>
      </div>
    </div>
  </section>

  <section class="block"><div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">Most loved</span><h2>What everyone's buying</h2></div><a class="link" href="${url.deals}">Shop all deals ${ic('i-arrow')}</a></div>
    ${gridOf(best, ctx)}
  </div></section>

  <section class="offer">
    <svg class="bgmono" viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono"/></svg>
    <span class="eyebrow">Welcome offer</span>
    <h2>${PROMO.pct}% off your first order.</h2>
    <p>Use the code at checkout. It works on everything in your bag, drones included.</p>
    <div class="code"><b>${PROMO.code}</b><button class="btn btn-light" style="height:44px" data-act="copy">Copy code</button></div>
  </section>

  <section class="story"><div class="wrap story-in">
    <div class="story-mark reveal"><svg class="mono" viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono"/></svg><svg class="mono z" viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono" transform="matrix(-1 0 0 1 206.04 0)"/></svg></div>
    <div class="reveal">
      <span class="eyebrow">Our mark</span>
      <h2>A price tag that carries <em>everything.</em></h2>
      <p>Every product we sell has one. The tag stands for clear, fair prices; the three bars inside are our shelves: gadgets, fashion, home and everything in between. Flip the S and it becomes a Z: Shopeiz starts with S and ends with Z, and so does everything you need.</p>
      <p class="sign">From S to Z.</p>
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">The Shopeiz promise</span><h2>Four things we never compromise on</h2></div></div>
    <div class="promise">
      <div class="reveal"><span class="n">01</span><h3>Choice</h3><p>If people buy it, we sell it. One search covers every category.</p></div>
      <div class="reveal"><span class="n">02</span><h3>Trust</h3><p>Verified sellers, secure checkout and returns that just work.</p></div>
      <div class="reveal"><span class="n">03</span><h3>Speed</h3><p>Fast to find, fast to pay, fast to arrive. Every step is short.</p></div>
      <div class="reveal"><span class="n">04</span><h3>Fair price</h3><p>Clear prices, no hidden fees, real deals instead of fake discounts.</p></div>
    </div>
  </div></section>

  ${ctx.placesHtml || ''}

  <section class="news"><div class="wrap">
    <div><span class="eyebrow" style="color:var(--gold-2)">Join the list</span><h2>New arrivals and real deals, first.</h2></div>
    <div><form data-form="news"><label class="sr" for="em">Email address</label><input id="em" type="email" required placeholder="Your email address"><button>Join</button></form><small>One thoughtful email a fortnight. Unsubscribe anytime.</small></div>
  </div></section>`;
  }

  /* ---------- Listing: shop, category, deals, search ---------- */
  function listData(kind, key) {
    if (kind === 'search') {
      const t = String(key || '').trim().toLowerCase();
      const list = t ? P.filter((p) => (p.title + ' ' + p.sub + ' ' + catOf(p).label + ' ' + p.desc).toLowerCase().includes(t)) : [];
      return { list, title: `“${esc(key)}”`, blurb: `${list.length} result${list.length === 1 ? '' : 's'}`, crumb: 'Search', base: url.search(key) };
    }
    if (kind === 'deals') return { list: P.filter((p) => p.was), title: 'Deals', blurb: 'Real prices against MRP on things worth owning. No fake discounts.', crumb: 'Deals', base: url.deals };
    if (kind === 'cat') {
      const c = CATS.find((x) => x.id === key);
      if (c) return { list: P.filter((p) => p.cat === c.id), title: c.label, blurb: c.blurb, crumb: c.label, base: url.cat(c.id), cat: c };
    }
    return { list: P.slice(), title: 'Shop all', blurb: 'Everything in the Shopeiz collection, in one place.', crumb: 'Shop all', base: url.shop };
  }
  function vList(kind, key, opts = {}, ctx = {}) {
    const d = listData(kind, key);
    const subs = [...new Set(d.list.map((p) => p.sub))];
    const sub = subs.includes(opts.sub) ? opts.sub : 'all';
    const sort = ['pop', 'lo', 'hi', 'off'].includes(opts.sort) ? opts.sort : 'pop';
    let shown = sub === 'all' ? d.list : d.list.filter((p) => p.sub === sub);
    shown = shown.slice().sort((a, b) => sort === 'lo' ? a.price - b.price : sort === 'hi' ? b.price - a.price : sort === 'off' ? off(b) - off(a) : 0);
    const join = d.base.includes('?') ? '&' : '?';
    const link = (s) => d.base + (s === 'all' ? '' : join + 'sub=' + encodeURIComponent(s)) + (sort !== 'pop' ? (s === 'all' ? join : '&') + 'sort=' + sort : '');
    const intro = d.cat ? `<p style="max-width:720px;color:var(--ink-2);margin:14px 0 0">${esc(d.cat.seo)}</p>` : '';
    return `<div class="wrap">
    <div class="page-head">${crumbs([['Home', '/'], [d.crumb]])}<h1>${d.title}</h1><p>${d.blurb}</p>${intro}</div>
    <div class="toolbar">
      <div class="chips">${subs.length > 1 ? ['all', ...subs].map((x) => `<a class="chip ${sub === x ? 'on' : ''}" href="${link(x)}">${x === 'all' ? 'All' : esc(x)}</a>`).join('') : ''}</div>
      <label class="sort">Sort by <select data-act="sort">
        ${[['pop', 'Featured'], ['lo', 'Price: low to high'], ['hi', 'Price: high to low'], ['off', 'Biggest saving']].map(([v, l]) => `<option value="${v}" ${sort === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
    </div>
    ${shown.length ? gridOf(shown, ctx) : `<div class="empty"><h2>Nothing here yet</h2><p>Try another search, or <a class="link" href="${url.shop}">browse everything</a></p></div>`}
    <div style="height:110px"></div>
  </div>`;
  }

  /* ---------- Product ---------- */
  function specList(p) {
    return p.specs.includes(':')
      ? `<dl class="specs">${p.specs.split('·').map((x) => { const [k, ...v] = x.split(':'); return `<div><dt>${esc(k.trim())}</dt><dd>${esc(v.join(':').trim())}</dd></div>`; }).join('')}</dl>`
      : `<p style="margin:0">${esc(p.specs)}</p>`;
  }
  function vProduct(p, ctx = {}) {
    const c = catOf(p);
    const related = P.filter((x) => x.cat === p.cat && x.id !== p.id).concat(P.filter((x) => x.cat !== p.cat && x.was)).slice(0, 4);
    return `<div class="wrap">
    <div style="padding-top:28px">${crumbs([['Home', '/'], [c.label, url.cat(c.id)], [p.title]])}</div>
    <div class="pdp">
      <div class="gallery"><div class="media">${media(p)}${p.was ? `<span class="badge">Save ${fmt(p.was - p.price)}</span>` : p.tag ? `<span class="badge light">${esc(p.tag)}</span>` : ''}</div></div>
      <div>
        <span class="eyebrow">${c.label} · ${esc(p.sub)}</span>
        <h1>${esc(p.title)}</h1>
        ${stars(p)}
        ${priceHtml(p)}
        <p class="tax">Inclusive of all taxes${p.price >= 3000 ? ` · or 3 no-cost EMIs of ${fmt(Math.ceil(p.price / 3))}` : ''}</p>
        <p class="desc">${esc(p.desc)}</p>
        <div class="buy">
          <div class="qty"><button data-act="pq" data-d="-1" aria-label="Decrease quantity">${ic('i-minus')}</button><span id="pq">1</span><button data-act="pq" data-d="1" aria-label="Increase quantity">${ic('i-plus')}</button></div>
          <button class="btn btn-dark" id="pdpAdd" data-act="add" data-id="${p.id}" data-qty="1" data-price="${p.price}">Add to bag · ${fmt(p.price)}</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:12px">
          <button class="btn btn-wine" data-act="buynow" data-id="${p.id}">Buy it now</button>
          <button class="btn btn-line wish-big" data-act="wish" data-id="${p.id}" aria-label="Save to wishlist" style="padding:0 18px">${ic('i-heart')}</button>
        </div>
        <div class="perks">
          <div>${ic('i-truck')}<p style="margin:0"><b>Get it by ${dateIn(p.days)}</b><span>${p.price >= FREE_OVER ? 'Free standard delivery' : `Free delivery on orders over ${fmt(FREE_OVER)}`} · Express available</span></p></div>
          <div>${ic('i-return')}<p style="margin:0"><b>30-day free returns</b><span>Changed your mind? Send it back, on us.</span></p></div>
          <div>${ic('i-cash')}<p style="margin:0"><b>Cash on delivery available</b><span>Or pay securely by UPI, card or net banking.</span></p></div>
        </div>
        <details class="acc" open><summary>Details ${ic('i-down')}</summary><div class="in">${esc(p.desc)}</div></details>
        <details class="acc"><summary>Specifications ${ic('i-down')}</summary><div class="in">${specList(p)}</div></details>
        <details class="acc"><summary>Delivery &amp; returns ${ic('i-down')}</summary><div class="in">Delivered across India. Standard delivery is free on orders over ${fmt(FREE_OVER)} (otherwise ${fmt(STD_FEE)}). Express delivery is ${fmt(EXP_FEE)}. Cash on delivery is available. Returns are free within 30 days of delivery.</div></details>
      </div>
    </div>
  </div>
  <section class="block" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">You may also like</span><h2>Pairs well with</h2></div></div>
    ${gridOf(related, ctx)}
  </div></section>`;
  }

  /* ---------- Help ---------- */
  const HELP = {
    delivery: ['Delivery', `Shopeiz delivers across India. Standard delivery takes 1 to 5 working days depending on the product and your PIN code, and is free on orders over ${fmt(FREE_OVER)}; below that it costs ${fmt(STD_FEE)}. Express delivery is ${fmt(EXP_FEE)}. You'll see the expected date on every product page and at checkout.`],
    returns: ['Returns & refunds', 'Return anything within 30 days of delivery for free. Items should be unused and in their original packaging. Refunds go back to your original payment method; cash-on-delivery orders are refunded by UPI or bank transfer.'],
    payment: ['Payment options', `Pay by UPI, credit or debit card (Visa, Mastercard, RuPay) or cash on delivery (${fmt(COD_FEE)} fee). All prices include GST.`],
    about: ['About Shopeiz', 'The art of having everything. Shopeiz is an online marketplace for everything: gadgets, electronics, fashion, home, beauty and more. It is for anyone who needs something and would rather not spend the afternoon looking for it. Wide choice, fair prices, secure payment and reliable delivery: every order, every time.'],
    contact: ['Contact', 'Questions about an order or a product? Reach us via the contact details on your order confirmation and we will get back to you within one working day.'],
  };
  function vHelp(k) {
    const h = HELP[k];
    return `<div class="wrap"><div class="page-head">${crumbs([['Home', '/'], [h[0]]])}<h1>${h[0]}</h1></div><p style="max-width:680px;font-size:17px;color:var(--ink-2);padding:36px 0 120px;margin:0">${h[1]}</p></div>`;
  }
  function vNotFound() {
    return `<div class="wrap"><div class="empty" style="padding:110px 0 130px"><span class="eyebrow">Page not found</span><h2 style="margin-top:14px">We couldn't find that page.</h2><p style="margin-bottom:26px">It may have moved. Everything you need is still one search away.</p><a class="btn btn-dark" href="${url.shop}">Shop all</a></div></div>`;
  }

  return { fmt, esc, ic, byId, bySlug, catOf, off, dateIn, url, media, stars, priceHtml, card, gridOf, crumbs, vHome, vList, listData, vProduct, specList, vHelp, HELP, vNotFound };
});
