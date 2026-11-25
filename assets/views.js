/* Shopeiz page views. Shared by the server (to send complete pages Google can read)
   and the browser (cart, wishlist and checkout). Pure functions: data in, HTML out. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./catalog.js'));
  else root.SZ = Object.assign(root.SZ || {}, factory(root.SZ));
})(typeof self !== 'undefined' ? self : this, function (C) {
  const { CATS, P, HERO, BEST, PROMO, POLICY } = C;

  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const byId = (id) => P.find((p) => p.id === id);
  const bySlug = (s) => P.find((p) => p.slug === s);
  const catOf = (p) => CATS.find((c) => c.id === p.cat) || CATS[0];
  const off = (p) => (p.was ? Math.round((1 - p.price / p.was) * 100) : 0);
  // Date after n working days (Sundays skipped), in India time
  const dateIn = (n) => {
    const t = new Date(Date.now() + 5.5 * 3600e3); let k = 0;
    while (k < n) { t.setUTCDate(t.getUTCDate() + 1); if (t.getUTCDay() !== 0) k++; }
    return t.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  };
  const daysOf = (p) => p.days || POLICY.maxDays;
  const minDaysOf = (p) => (daysOf(p) <= POLICY.ownMax ? 2 : POLICY.minDays);
  const deliveryText = (p) => `${minDaysOf(p)} to ${daysOf(p)} working days`;
  // Resize photos served by Shopify's image CDN
  const imgUrl = (src, w) => (src && /cdn\.shopify\.com/.test(src) ? src.split('?')[0] + '?width=' + w : src);
  const PAGE_SIZE = 48;
  // What the bag needs to know about a product, kept on the Add button
  const snap = (p, v) => esc(JSON.stringify({ id: p.id, t: p.title, p: p.price, w: p.was || 0, i: p.img || '', s: p.slug, u: p.sub || '', v: v || '', ...(p.cod === false ? { np: 1 } : {}) }));

  const url = {
    home: '/', shop: '/shop', deals: '/deals', cart: '/cart', checkout: '/checkout', wishlist: '/wishlist', india: '/online-shopping-india',
    cat: (id) => (id === 'all' ? '/shop' : id === 'deals' ? '/deals' : '/category/' + id),
    product: (p) => '/products/' + p.slug,
    help: (k) => '/help/' + k,
    place: (slug) => '/online-shopping-in-' + slug,
    search: (q) => '/search?q=' + encodeURIComponent(q),
  };

  /* ---------- Pieces ---------- */
  function media(p, cls = '', w = 600) {
    if (p.img) return `<img src="${imgUrl(p.img, w)}" alt="${esc(p.title)}" loading="lazy" decoding="async">`;
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
    const add = p.available === false ? '' : `data-act="add" data-id="${p.id}" data-snap="${snap(p)}"`;
    return `<article class="card reveal">
    <div style="position:relative">
      <a class="media" href="${url.product(p)}" aria-label="${esc(p.title)}">${media(p)}${badge}</a>
      <button class="wish ${w ? 'on' : ''}" data-act="wish" data-id="${p.id}" data-snap="${snap(p)}" aria-label="Save ${esc(p.title)} to wishlist" aria-pressed="${w}">${ic('i-heart')}</button>
      ${add ? `<button class="quick only-d" ${add}>Add to bag</button>` : ''}
    </div>
    <div class="card-body">
      <p class="card-sub">${esc(p.sub || catOf(p).label)}</p>
      <h3><a href="${url.product(p)}">${esc(p.title)}</a></h3>
      ${stars(p)}${priceHtml(p)}
    </div>
    ${add ? `<button class="quick only-m" ${add}>Add to bag</button>` : ''}
  </article>`;
  }
  const gridOf = (list, ctx) => `<div class="grid">${list.map((p) => card(p, ctx)).join('')}</div>`;
  const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([label, href], i) => (i ? '<span>/</span>' : '') + (href ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`)).join('')}</nav>`;

  /* ---------- Home ---------- */
  function vHome(ctx = {}) {
    let best = BEST.map(byId).filter(Boolean);
    if (best.length < 8) best = best.concat(P.filter((p) => !BEST.includes(p.id) && p.img).slice(0, 8 - best.length));
    const t7 = byId('d4');
    const counts = {}; P.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));
    const cover = (c) => c.img || (P.find((p) => p.cat === c.id && p.img) || {}).img;
    const cats = CATS.filter((c) => counts[c.id]);
    return `
  <section class="hero">
    <div class="hero-copy">
      <span class="eyebrow">Shopeiz · From S to Z</span>
      <h1>The art of having <em>everything.</em></h1>
      <p class="lead">Anything you need, in one place, at your door. Kitchen, home, electronics, beauty, fashion, toys and drones. Fair prices, cash on delivery, delivered across India.</p>
      <div class="ctas">
        <a class="btn btn-wine" href="${url.shop}">Shop everything ${ic('i-arrow')}</a>
        <a class="btn btn-line" href="${url.cat('drones')}">Shop drones</a>
      </div>
      <div class="hero-perks">
        <span>${ic('i-truck')} Free delivery over ${fmt(C.FREE_OVER)}</span>
        <span>${ic('i-return')} ${POLICY.replaceDays}-day replacement</span>
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
    <div>${ic('i-truck')}<p style="margin:0"><b>Free delivery</b><span>On orders over ${fmt(C.FREE_OVER)}</span></p></div>
    <div>${ic('i-return')}<p style="margin:0"><b>${POLICY.replaceDays}-day replacement</b><span>Damaged or wrong item? We replace it</span></p></div>
    <div>${ic('i-shield')}<p style="margin:0"><b>Delivered across India</b><span>Tracked to your door in ${POLICY.minDays} to ${POLICY.maxDays} working days</span></p></div>
    <div>${ic('i-cash')}<p style="margin:0"><b>Cash on delivery</b><span>Pay when it arrives</span></p></div>
  </div>

  <section class="block"><div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">Shop by category</span><h2>Anything you need, in one place</h2></div><a class="link" href="${url.shop}">View everything ${ic('i-arrow')}</a></div>
    <div class="cat-grid">${cats.map((c) => `<a class="cat-tile reveal" href="${url.cat(c.id)}" style="color:${c.ink}">
      <div class="bg" style="background:${c.tone}">${cover(c) ? `<img src="${imgUrl(cover(c), 500)}" alt="" loading="lazy">` : ic(c.icon)}</div>
      <h3>${c.label}</h3><span>${counts[c.id].toLocaleString('en-IN')} ${counts[c.id] === 1 ? 'piece' : 'pieces'} ${ic('i-arrow')}</span></a>`).join('')}</div>
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
        <li>${ic('i-check')} Delivered by ${dateIn(daysOf(t7))} · cash on delivery</li>
      </ul>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-light" data-act="add" data-id="${t7.id}" data-snap="${snap(t7)}">Add to bag · ${fmt(t7.price)}</button>
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
    <p>Use the code at checkout. It works on everything in your bag, once per mobile number.</p>
    <div class="code"><b>${PROMO.code}</b><button class="btn btn-light" style="height:44px" data-act="copy">Copy code</button></div>
  </section>

  <section class="story"><div class="wrap story-in">
    <div class="story-mark reveal"><svg class="mono" viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono"/></svg><svg class="mono z" viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono" transform="matrix(-1 0 0 1 206.04 0)"/></svg></div>
    <div class="reveal">
      <span class="eyebrow">Our mark</span>
      <h2>A price tag that carries <em>everything.</em></h2>
      <p>Every product we sell has one. The tag stands for clear, fair prices; the three bars inside are our shelves: kitchen, home, gadgets and everything in between. Flip the S and it becomes a Z: Shopeiz starts with S and ends with Z, and so does everything you need.</p>
      <p class="sign">From S to Z.</p>
    </div>
  </div></section>

  <section class="block"><div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">The Shopeiz promise</span><h2>Four things we never compromise on</h2></div></div>
    <div class="promise">
      <div class="reveal"><span class="n">01</span><h3>Choice</h3><p>If people buy it, we sell it. One search covers every category.</p></div>
      <div class="reveal"><span class="n">02</span><h3>Trust</h3><p>Checked suppliers, cash on delivery and a replacement if anything arrives damaged.</p></div>
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
  function searchList(q) {
    const words = String(q || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return [];
    const stem = (w) => w.replace(/(es|s)$/, '');
    const ws = words.map(stem);
    return P.map((p) => {
      const t = (p.title + ' ' + (p.sub || '')).toLowerCase(), c = catOf(p).label.toLowerCase();
      let sc = 0;
      for (const w of ws) { if (t.includes(w)) sc += 3; else if (c.includes(w)) sc += 1; else return null; }
      if (t.startsWith(ws[0])) sc += 1;
      return [sc + (p.rank || 0) / 100, p];
    }).filter(Boolean).sort((x, y) => y[0] - x[0]).map((x) => x[1]);
  }
  function listData(kind, key) {
    if (kind === 'search') {
      const list = searchList(key);
      return { list, title: `“${esc(key)}”`, blurb: `${list.length.toLocaleString('en-IN')} result${list.length === 1 ? '' : 's'}`, crumb: 'Search', base: url.search(key) };
    }
    if (kind === 'deals') return { list: P.filter((p) => p.was && off(p) >= 20).sort((a, b) => off(b) - off(a)), title: 'Deals', blurb: 'Real prices against MRP on things worth owning.', crumb: 'Deals', base: url.deals };
    if (kind === 'cat') {
      const c = CATS.find((x) => x.id === key);
      if (c) return { list: P.filter((p) => p.cat === c.id), title: c.label, blurb: c.blurb, crumb: c.label, base: url.cat(c.id), cat: c };
    }
    return { list: P.slice(), title: 'Shop all', blurb: 'Everything in the Shopeiz collection, in one place.', crumb: 'Shop all', base: url.shop };
  }
  // Applies sub-filter, sort and page. Returns everything a listing page needs.
  function listView(kind, key, opts = {}) {
    const d = listData(kind, key);
    const subCount = {};
    d.list.forEach((p) => { if (p.sub) subCount[p.sub] = (subCount[p.sub] || 0) + 1; });
    const subs = Object.keys(subCount).filter((x) => subCount[x] >= 3).sort((a, b) => subCount[b] - subCount[a]).slice(0, 14);
    const sub = subs.includes(opts.sub) ? opts.sub : 'all';
    const sort = ['pop', 'lo', 'hi', 'off', 'new'].includes(opts.sort) ? opts.sort : 'pop';
    let shown = sub === 'all' ? d.list : d.list.filter((p) => p.sub === sub);
    if (sort !== 'pop') shown = shown.slice().sort((a, b) => sort === 'lo' ? a.price - b.price : sort === 'hi' ? b.price - a.price : off(b) - off(a));
    const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
    const page = Math.min(pages, Math.max(1, parseInt(opts.page, 10) || 1));
    const items = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const join = d.base.includes('?') ? '&' : '?';
    const link = (o) => {
      const q = [];
      const sb = o.sub === undefined ? sub : o.sub, so = o.sort === undefined ? sort : o.sort, pg = o.page || 1;
      if (sb !== 'all') q.push('sub=' + encodeURIComponent(sb));
      if (so !== 'pop') q.push('sort=' + so);
      if (pg > 1) q.push('page=' + pg);
      return d.base + (q.length ? join + q.join('&') : '');
    };
    return { ...d, subs, sub, sort, shown, items, page, pages, link };
  }
  function pager(v) {
    if (v.pages < 2) return '';
    const nums = [];
    for (let i = 1; i <= v.pages; i++) if (i === 1 || i === v.pages || Math.abs(i - v.page) <= 2) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
    return `<nav class="pager" aria-label="Pages">
      ${v.page > 1 ? `<a rel="prev" href="${v.link({ page: v.page - 1 })}">${ic('i-arrow', 'i flip')} Previous</a>` : '<span></span>'}
      <div>${nums.map((n) => n === '…' ? '<em>…</em>' : n === v.page ? `<b aria-current="page">${n}</b>` : `<a href="${v.link({ page: n })}">${n}</a>`).join('')}</div>
      ${v.page < v.pages ? `<a rel="next" href="${v.link({ page: v.page + 1 })}">Next ${ic('i-arrow')}</a>` : '<span></span>'}
    </nav>`;
  }
  function vList(kind, key, opts = {}, ctx = {}) {
    const v = listView(kind, key, opts);
    const intro = v.cat && v.page === 1 ? `<p style="max-width:720px;color:var(--ink-2);margin:14px 0 0">${esc(v.cat.seo)}</p>` : '';
    const more = kind === 'all' ? `<div class="cat-chips">${CATS.map((c) => `<a href="${url.cat(c.id)}">${c.label}</a>`).join('')}</div>` : '';
    return `<div class="wrap">
    <div class="page-head">${crumbs([['Home', '/'], [v.crumb]])}<h1>${v.title}${v.page > 1 ? ` <small class="pg">Page ${v.page}</small>` : ''}</h1><p>${v.blurb}${kind !== 'search' ? ` · ${v.shown.length.toLocaleString('en-IN')} products` : ''}</p>${intro}${more}</div>
    <div class="toolbar">
      <div class="chips">${v.subs.length > 1 ? ['all', ...v.subs].map((x) => `<a class="chip ${v.sub === x ? 'on' : ''}" href="${v.link({ sub: x, page: 1 })}">${x === 'all' ? 'All' : esc(x)}</a>`).join('') : ''}</div>
      <label class="sort">Sort by <select data-act="sort">
        ${[['pop', 'Featured'], ['lo', 'Price: low to high'], ['hi', 'Price: high to low'], ['off', 'Biggest saving']].map(([val, l]) => `<option value="${val}" ${v.sort === val ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
    </div>
    ${v.items.length ? gridOf(v.items, ctx) : `<div class="empty"><h2>Nothing here yet</h2><p>Try another search, or <a class="link" href="${url.shop}">browse everything</a></p></div>`}
    ${pager(v)}
    <div style="height:110px"></div>
  </div>`;
  }

  /* ---------- Product ---------- */
  function specList(p) {
    if (!p.specs) return '';
    return p.specs.includes(':')
      ? `<dl class="specs">${p.specs.split('·').map((x) => { const [k, ...v] = x.split(':'); return `<div><dt>${esc(k.trim())}</dt><dd>${esc(v.join(':').trim())}</dd></div>`; }).join('')}</dl>`
      : `<p style="margin:0">${esc(p.specs)}</p>`;
  }
  function hashOf(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // A short, product-specific overview written from what we know, so every page reads differently
  function overview(p) {
    const c = catOf(p), h = hashOf(p.slug || p.id), pick = (a, k = 0) => a[(h >>> k) % a.length];
    const kind = (p.sub || c.label).toLowerCase();
    const save = p.was ? ` That is ${fmt(p.was - p.price)} (${off(p)}%) below the MRP of ${fmt(p.was)}.` : '';
    return [
      pick([`The ${p.title} is part of our ${c.label.toLowerCase()} range at Shopeiz, priced at ${fmt(p.price)} including GST.`,
            `Buy the ${p.title} online at Shopeiz for ${fmt(p.price)}, GST included.`,
            `Looking for ${/^[aeiou]/.test(kind) ? 'an' : 'a'} ${kind}? The ${p.title} is ${fmt(p.price)} at Shopeiz, with GST included.`], 0) + save,
      pick([`It ships to every PIN code in India and usually arrives in ${deliveryText(p)}. ${p.cod === false ? 'Pay by UPI.' : 'Pay by UPI or cash on delivery.'}`,
            `Order today and it should reach you by ${dateIn(daysOf(p))}. ${p.cod === false ? 'Pay securely by UPI.' : 'Cash on delivery is available across India.'}`,
            `We deliver it anywhere in India in ${deliveryText(p)}${p.cod === false ? '. This item is prepaid by UPI' : ', and you can pay in cash when it arrives'}.`], 3),
      pick([`If it arrives damaged or you receive the wrong item, tell us within ${POLICY.replaceDays} days and we will replace it.`,
            `Covered by our ${POLICY.replaceDays}-day replacement promise for damaged, defective or wrong items.`], 6),
    ].join(' ');
  }
  function vProduct(p, ctx = {}) {
    const c = catOf(p);
    const near = P.filter((x) => x.cat === p.cat && x.id !== p.id);
    const related = near.slice().sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price)).slice(0, 8);
    if (related.length < 4) related.push(...P.filter((x) => x.cat !== p.cat && x.was).slice(0, 4 - related.length));
    const imgs = (p.images && p.images.length ? p.images : p.img ? [p.img] : []).slice(0, 8);
    const vars = p.variants || [];
    const curV = vars.find((v) => v.id === p.defaultVariant) || vars.find((v) => v.ok) || null;
    const price = curV ? curV.price : p.price;
    const soldOut = p.available === false || (vars.length && !vars.some((v) => v.ok));
    const vp = { ...p, price };
    const desc = p.desc_html ? `<div class="rich">${p.desc_html}</div>` : `<p>${esc(p.desc || '')}</p>`;
    return `<div class="wrap">
    <div style="padding-top:28px">${crumbs([['Home', '/'], [c.label, url.cat(c.id)], [p.title]])}</div>
    <div class="pdp">
      <div class="gallery">
        <div class="media" id="pmain">${imgs.length ? `<img src="${imgUrl(imgs[0], 900)}" alt="${esc(p.title)}" fetchpriority="high">` : media(p)}${p.was ? `<span class="badge">Save ${fmt(p.was - p.price)}</span>` : p.tag ? `<span class="badge light">${esc(p.tag)}</span>` : ''}</div>
        ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, k) => `<button class="${k ? '' : 'on'}" data-act="pimg" data-src="${esc(imgUrl(src, 900))}" aria-label="Photo ${k + 1}"><img src="${esc(imgUrl(src, 160))}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      </div>
      <div>
        <span class="eyebrow">${c.label}${p.sub ? ' · ' + esc(p.sub) : ''}</span>
        <h1>${esc(p.title)}</h1>
        ${stars(p)}
        <div id="pprice">${priceHtml(vp)}</div>
        <p class="tax">Inclusive of all taxes${soldOut ? '' : p.cod === false ? ' · Prepaid by UPI only' : ' · Cash on delivery available'}</p>
        ${vars.length > 1 ? `<div class="vars"><span class="vl">Option</span><div>${vars.map((v) => `<button class="${curV && v.id === curV.id ? 'on' : ''}" data-act="pvar" data-v="${esc(v.id)}" data-price="${v.price}" ${v.ok ? '' : 'disabled'}>${esc(v.title)}${v.ok ? '' : ' (sold out)'}</button>`).join('')}</div></div>` : ''}
        ${soldOut ? `<div class="stock-out"><b>Currently out of stock.</b> Save it to your wishlist and check back soon.</div>
        <button class="btn btn-line wish-big" data-act="wish" data-id="${p.id}" data-snap="${snap(p)}" style="width:100%">${ic('i-heart')} Save to wishlist</button>` : `
        <div class="buy">
          <div class="qty"><button data-act="pq" data-d="-1" aria-label="Decrease quantity">${ic('i-minus')}</button><span id="pq">1</span><button data-act="pq" data-d="1" aria-label="Increase quantity">${ic('i-plus')}</button></div>
          <button class="btn btn-dark" id="pdpAdd" data-act="add" data-id="${p.id}" data-qty="1" data-price="${price}" data-snap="${snap(vp, curV ? curV.id : '')}">Add to bag · ${fmt(price)}</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:12px">
          <button class="btn btn-wine" data-act="buynow" data-id="${p.id}">Buy it now</button>
          <button class="btn btn-line wish-big" data-act="wish" data-id="${p.id}" data-snap="${snap(p)}" aria-label="Save to wishlist" style="padding:0 18px">${ic('i-heart')}</button>
        </div>`}
        <div class="perks">
          <div>${ic('i-truck')}<p style="margin:0"><b>Get it by ${dateIn(daysOf(p))}</b><span>${deliveryText(p)} · ${price >= C.FREE_OVER ? 'Free delivery' : `Free delivery on orders over ${fmt(C.FREE_OVER)}`}</span></p></div>
          <div>${ic('i-return')}<p style="margin:0"><b>${POLICY.replaceDays}-day replacement</b><span>Damaged, defective or wrong item? We replace it.</span></p></div>
          <div>${ic('i-cash')}<p style="margin:0">${p.cod === false ? '<b>Prepaid by UPI only</b><span>Cash on delivery is not available for this item.</span>' : '<b>Cash on delivery available</b><span>Or pay by UPI with a secure link.</span>'}</p></div>
        </div>
        <details class="acc" open><summary>Overview ${ic('i-down')}</summary><div class="in"><p>${esc(overview(p))}</p></div></details>
        <details class="acc" ${p.desc_html ? '' : 'open'}><summary>Details ${ic('i-down')}</summary><div class="in">${desc}${specList(p)}</div></details>
        <details class="acc"><summary>Delivery &amp; replacement ${ic('i-down')}</summary><div class="in">Delivered across India in ${deliveryText(p)}. Standard delivery is free on orders over ${fmt(C.FREE_OVER)} (otherwise ${fmt(C.STD_FEE)}). ${p.cod === false ? 'This item is prepaid only: pay by UPI.' : `Cash on delivery is available for a ${fmt(C.COD_FEE)} fee.`} If your item arrives damaged, defective or is not what you ordered, contact us within ${POLICY.replaceDays} days of delivery with photos or an unboxing video and we will send a replacement. We do not accept returns for change of mind.</div></details>
      </div>
    </div>
  </div>
  <section class="block" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">You may also like</span><h2>More in ${esc(c.label)}</h2></div><a class="link" href="${url.cat(c.id)}">See all ${ic('i-arrow')}</a></div>
    ${gridOf(related, ctx)}
  </div></section>`;
  }

  /* ---------- Help ---------- */
  const HELP = {
    get delivery() { return ['Delivery', `Shopeiz delivers to every PIN code in India. Orders are packed within 1 to 3 working days and usually reach you in ${POLICY.minDays} to ${POLICY.maxDays} working days in total; items from our own stock (drones and a few others) often arrive sooner. Standard delivery is free on orders over ${fmt(C.FREE_OVER)}; below that it costs ${fmt(C.STD_FEE)}. You will get tracking details by SMS or WhatsApp once your order ships, and the expected date is shown on every product page.`]; },
    get returns() { return ['Replacements & refunds', `If an item arrives damaged, defective, incomplete or is not what you ordered, contact us within ${POLICY.replaceDays} days of delivery with photos or an unboxing video and we will send you a replacement at no cost. If a replacement is not possible we refund you in full: to your original payment method, or by UPI or bank transfer for cash-on-delivery orders. We do not accept returns for change of mind, so please check sizes and details before ordering. Orders can be cancelled free of charge until they are shipped.`]; },
    get payment() { return ['Payment options', `Pay by cash on delivery (${fmt(C.COD_FEE)} fee) or by UPI (GPay, PhonePe, Paytm or any UPI app). For UPI orders we send a secure payment link to your mobile after you order. All prices include GST.`]; },
    about: ['About Shopeiz', 'The art of having everything. Shopeiz is an online store for everything you need: kitchen and home, electronics, beauty, fashion, toys, drones and more. It is for anyone who needs something and would rather not spend the afternoon looking for it. Wide choice, fair prices, cash on delivery and reliable delivery across India.'],
    contact: ['Contact', 'Questions about an order or a product? Reply to the message you receive after ordering, or reach us via the contact details on your order confirmation, and we will get back to you within one working day.'],
  };
  function vHelp(k) {
    const h = HELP[k];
    return `<div class="wrap"><div class="page-head">${crumbs([['Home', '/'], [h[0]]])}<h1>${h[0]}</h1></div><p style="max-width:680px;font-size:17px;color:var(--ink-2);padding:36px 0 120px;margin:0">${h[1]}</p></div>`;
  }
  function vNotFound() {
    return `<div class="wrap"><div class="empty" style="padding:110px 0 130px"><span class="eyebrow">Page not found</span><h2 style="margin-top:14px">We couldn't find that page.</h2><p style="margin-bottom:26px">It may have moved. Everything you need is still one search away.</p><a class="btn btn-dark" href="${url.shop}">Shop all</a></div></div>`;
  }

  return { fmt, esc, ic, byId, bySlug, catOf, off, dateIn, daysOf, deliveryText, imgUrl, snap, url, media, stars, priceHtml, card, gridOf, crumbs, vHome, vList, listData, listView, searchList, PAGE_SIZE, vProduct, overview, specList, vHelp, HELP, vNotFound };
});
