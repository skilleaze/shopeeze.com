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
  const imgUrl = (src, w) => (!src ? src : /cdn\.shopify\.com/.test(src) ? src.split('?')[0] + '?width=' + w : /\/render\/image\//.test(src) ? src + (src.includes('?') ? '&' : '?') + 'width=' + w + '&height=' + w * 2 + '&resize=contain' : src);
  // Responsive srcset for our own resizable brand photos
  const srcset = (src, ws) => (/\/render\/image\//.test(src) ? ws.map((w) => imgUrl(src, w) + ' ' + w + 'w').join(', ') : '');
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
  const starRow = (v, cls = '') => `<i class="st5 ${cls}" aria-hidden="true">${Array.from({ length: 5 }, (_, k) => `<svg class="${k < Math.round(v) ? 'on' : ''}"><use href="#i-star"/></svg>`).join('')}</i>`;
  function stars(p) {
    if (!p.reviews) return '';
    return `<div class="stars">${starRow(p.rating)}<span>${Number(p.rating).toFixed(1)} (${p.reviews})</span></div>`;
  }
  const priceHtml = (p) => `<div class="price"><b>${fmt(p.price)}</b>${p.was ? `<s>${fmt(p.was)}</s><span class="off">${off(p)}% off</span>` : ''}</div>`;
  // Product card, laid out like a marketplace tile: image with wishlist and quick add, then title, rating, price and delivery
  function card(p, ctx = {}) {
    const w = (ctx.wish || []).includes(p.id);
    const add = p.available === false ? '' : `data-act="add" data-id="${p.id}" data-snap="${snap(p)}"`;
    const n = Number(p.reviews || 0);
    return `<article class="pc">
    <div class="pc-img">
      <a href="${url.product(p)}" aria-label="${esc(p.title)}">${media(p, '', 400)}</a>
      ${p.tag ? `<span class="pc-tag">${esc(p.tag)}</span>` : ''}
      <button class="pc-wish ${w ? 'on' : ''}" data-act="wish" data-id="${p.id}" data-snap="${snap(p)}" aria-label="Save ${esc(p.title)} to wishlist" aria-pressed="${w}">${ic('i-heart')}</button>
      ${add ? `<button class="pc-add" ${add} aria-label="Add ${esc(p.title)} to cart">${ic('i-plus')}</button>` : ''}
    </div>
    <div class="pc-body">
      <h3 class="pc-t"><a href="${url.product(p)}">${esc(p.title)}</a></h3>
      ${n || p.alts ? `<div class="pc-r">${n ? `<span class="pc-rv">${ic('i-star')}<b>${Number(p.rating).toFixed(1)}</b></span><span class="pc-rc">(${n.toLocaleString('en-IN')})</span>` : ''}${p.alts ? `<span class="pc-more">+${p.alts} more option${p.alts === 1 ? '' : 's'}</span>` : ''}</div>` : ''}
      <div class="pc-p"><span class="pc-cur">₹</span><strong>${Math.round(p.price).toLocaleString('en-IN')}</strong>${p.was ? `<s>${Math.round(p.was).toLocaleString('en-IN')}</s><em>${off(p)}%</em>` : ''}</div>
      ${p.available !== false && codePrice(p.price) ? `<div class="pc-code"><span>${ic('i-tag')}</span><b>₹${codePrice(p.price).toLocaleString('en-IN')}</b> with ${esc(PROMO.code)}</div>` : ''}
      ${p.available === false ? '<div class="pc-out">Out of stock</div>' : `<div class="pc-del">${ic('i-truck')}<span>Get it by <b>${dateIn(daysOf(p))}</b></span></div>`}
    </div>
  </article>`;
  }
  // Real offer available on every product: the first-order code
  const codePrice = (price) => (PROMO.code && PROMO.pct > 0 ? Math.round(price) - Math.round(price * PROMO.pct / 100) : 0);
  // Horizontal product rail with arrow buttons
  const rail = (list, ctx) => `<div class="rail"><button class="rail-b prev" data-act="rail" data-d="-1" aria-label="Scroll back">${ic('i-arrow', 'i flip')}</button><div class="rail-in">${list.map((p) => card(p, ctx)).join('')}</div><button class="rail-b next" data-act="rail" data-d="1" aria-label="Scroll forward">${ic('i-arrow')}</button></div>`;
  const ribbon = (title, href, more = 'View all') => `<div class="rb-head"><h2 class="ribbon">${esc(title)}</h2>${href ? `<a class="rb-more" href="${href}">${more} ${ic('i-arrow')}</a>` : ''}</div>`;
  const gridOf = (list, ctx, cls = '') => `<div class="pgrid ${cls}">${list.map((p) => card(p, ctx)).join('')}</div>`;
  const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([label, href], i) => (i ? `<span class="sep">${ic('i-down', 'i rot')}</span>` : '') + (href ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`)).join('')}</nav>`;

  /* ---------- Home ---------- */
  const SKIP = /pelvic|stimulator|massager|intimate|condom|lingerie|bra\b|panty|vibrat|adult/i;
  function vHome(ctx = {}) {
    const counts = {}; P.forEach((p) => { if (!p.alt) counts[p.cat] = (counts[p.cat] || 0) + 1; });
    const ok = (p) => p.img && p.available !== false && !p.alt && !SKIP.test(p.title) && !(p.win < 0);
    // At most two products from the same sub-category in one row, so rows show variety
    const varied = (list, n) => { const seen = {}; return list.filter((p) => { const k = (p.sub || '').toLowerCase(); seen[k] = (seen[k] || 0) + 1; return seen[k] <= 2; }).slice(0, n); };
    const cats = CATS.filter((c) => counts[c.id]).sort((a, b) => counts[b.id] - counts[a.id]);
    const cover = (c) => c.cover || c.img || ((P.find((p) => p.cat === c.id && ok(p)) || {}).img);
    const short = (l) => l.replace(' & Decor', '').replace(' & Care', '').replace(' & Storage', '').replace(' & Stationery', '').replace(' & Outdoors', '').replace(' & Hardware', '').replace(' & Gifts', '');
    // Deals spread across categories: the biggest saving from each category in turn
    const byCat = {}; P.filter((p) => ok(p) && p.was && off(p) >= 15 && off(p) <= 85 && p.price >= 199).forEach((p) => (byCat[p.cat] = byCat[p.cat] || []).push(p));
    Object.values(byCat).forEach((l) => l.sort((a, b) => ((b.win || 0) - (a.win || 0)) * 0.5 + (off(b) - off(a))));
    const deals = []; for (let r = 0; r < 4; r++) cats.forEach((c) => { const x = (byCat[c.id] || [])[r]; if (x && deals.length < 18) deals.push(x); });
    // Bestsellers: our own drone first, then the top product of each category
    const best = BEST.map(byId).filter(Boolean);
    cats.forEach((c) => { if (best.length < 14 && !best.some((x) => x.cat === c.id)) { const x = P.find((p) => p.cat === c.id && ok(p)); if (x) best.push(x); } });
    // Every product appears once on the home page
    const used = new Set();
    const take = (list) => list.filter((p) => !used.has(p.id) && !(p.gk && used.has(p.gk))).map((p) => { used.add(p.id); if (p.gk) used.add(p.gk); return p; });
    const mega = take(deals.slice(0, 4));
    const dealRail = take(deals.slice(4));
    const bestRail = take(best);
    const S = C.SLIDES || [];
    const banner = (sl, k) => `<a class="hb-card" href="${url.cat(sl.cat)}">
        <img src="${imgUrl(sl.img, 900)}" srcset="${srcset(sl.img, [600, 900, 1300])}" sizes="(max-width:760px) 80vw, 25vw" alt="${esc(sl.alt)}" style="object-position:${sl.pos || 'center'}" ${k ? 'loading="lazy"' : 'fetchpriority="high"'}>
        <span class="hb-veil"></span>
        <span class="hb-txt"><em>${esc(sl.kicker)}</em>${k ? `<b>${esc(sl.title)}</b>` : `<h1>${esc(sl.title)}</h1>`}<span class="hb-cta">${esc(sl.cta)} ${ic('i-arrow')}</span></span>
      </a>`;
    const tile = (href, img, t, sub) => `<a class="rs-tile" href="${href}"><span class="rs-img"><img src="${imgUrl(img, 500)}" alt="" loading="lazy"></span><b>${t}</b><span>${sub}</span></a>`;
    const C2 = (id) => CATS.find((c) => c.id === id) || cats[0];
    const mini = (p) => `<div class="mg-card"><span class="mg-lab">${esc(catOf(p).label)}</span>
        <a class="mg-img" href="${url.product(p)}"><img src="${imgUrl(p.img, 300)}" alt="${esc(p.title)}" loading="lazy"></a>
        <button class="pc-add" data-act="add" data-id="${p.id}" data-snap="${snap(p)}" aria-label="Add ${esc(p.title)} to cart">${ic('i-plus')}</button>
        <a class="mg-t" href="${url.product(p)}">${esc(p.title)}</a>
        <div class="pc-p"><span class="pc-cur">₹</span><strong>${Math.round(p.price).toLocaleString('en-IN')}</strong>${p.was ? `<s>${Math.round(p.was).toLocaleString('en-IN')}</s>` : ''}</div>
      </div>`;
    const focus = (c, line) => `<a class="fc-card" href="${url.cat(c.id)}"><img src="${imgUrl(cover(c), 700)}" alt="${esc(c.label)}" loading="lazy"><span class="fc-txt"><b>${esc(c.label)}</b><span>${line}</span><em>Shop now ${ic('i-arrow')}</em></span></a>`;
    const rows = cats.slice(0, 5).map((c) => {
      const list = take(varied(P.filter((p) => p.cat === c.id && ok(p) && !used.has(p.id) && !(p.gk && used.has(p.gk))), 14));
      return list.length >= 4 ? `<section class="hsec"><div class="wrap2">${ribbon(c.label, url.cat(c.id))}${rail(list, ctx)}</div></section>` : '';
    }).join('');
    return `
  <section class="hb"><div class="wrap2 hb-grid">
    ${S.map(banner).join('')}
    <div class="hb-col">
      <a class="hb-promo wine" href="${url.deals}"><em>Welcome offer</em><b>${PROMO.pct}% OFF</b><span>your first order with code <strong>${PROMO.code}</strong></span><span class="hb-pill">Shop deals ${ic('i-arrow')}</span></a>
      <a class="hb-promo cream" href="${url.shop}"><em>Across India</em><b>Cash on delivery</b><span>Free delivery on orders over ${fmt(C.FREE_OVER)}, to every PIN code.</span><span class="hb-pill dark">Shop everything ${ic('i-arrow')}</span></a>
    </div>
  </div></section>

  <section class="cstrip"><div class="wrap2"><div class="cs-in">
    <a class="cs cs-deal" href="${url.deals}"><span class="cs-img"><span class="cs-sale">SALE</span><b>Deals</b><i>Up to ${Math.max(0, ...P.filter((p) => p.was).map(off)) >= 50 ? '70' : '40'}% off</i></span><span class="cs-l">Deals</span></a>
    ${cats.map((c) => `<a class="cs" href="${url.cat(c.id)}"><span class="cs-img"><img src="${imgUrl(cover(c), 240)}" alt="" loading="lazy"></span><span class="cs-l">${short(c.label)}</span></a>`).join('')}
  </div></div></section>

  <section class="trio"><div class="wrap2 trio-in">
    <div class="tri tri-a"><h2 class="ribbon">More reasons to shop</h2><div class="rs-grid">
      ${tile(url.deals, cover(C2('festive')), 'Deals', 'Real prices against MRP')}
      ${tile(url.shop, cover(C2('home')), 'Bestsellers', 'Our most-loved picks')}
      ${tile(url.cat('drones'), cover(C2('drones')), 'Our drones', 'Ships fast from our stock')}
      ${tile(url.cat('kitchen'), cover(C2('kitchen')), 'Kitchen', 'Clever tools for every day')}
    </div></div>
    ${mega.length === 4 ? `<div class="tri tri-b"><div class="mg-head"><h2 class="ribbon light">Mega deals</h2><a class="mg-all" href="${url.deals}">Shop deals</a></div><div class="mg-grid">${mega.map(mini).join('')}</div></div>` : ''}
    <div class="tri tri-c"><h2 class="ribbon">In focus</h2><div class="fc-col">
      ${focus(C2('beauty'), 'Care and grooming, for less')}
      ${focus(C2('electronics'), 'Gadgets you will use every day')}
    </div></div>
  </div></section>

  ${dealRail.length >= 4 ? `<section class="hsec"><div class="wrap2">${ribbon('Best deals for you', url.deals)}${rail(dealRail, ctx)}</div></section>` : ''}
  <section class="hsec"><div class="wrap2">${ribbon('Bestsellers', url.shop)}${rail(bestRail, ctx)}</div></section>
  ${rows}

  <section class="perks-strip"><div class="wrap2 ps-in">
    <div>${ic('i-cash')}<p><b>Cash on delivery</b><span>Pay when it arrives</span></p></div>
    <div>${ic('i-truck')}<p><b>Free delivery over ${fmt(C.FREE_OVER)}</b><span>To every PIN code in India</span></p></div>
    <div>${ic('i-return')}<p><b>${POLICY.replaceDays}-day replacement</b><span>Damaged or wrong item? We replace it</span></p></div>
    <div>${ic('i-lock')}<p><b>Secure UPI payment</b><span>GPay, PhonePe, Paytm and more</span></p></div>
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

  /* Live search suggestions: phrases, categories and top products for the typed text */
  const STOP = new Set(['for','with','and','the','of','in','to','a','an','set','pack','pcs','pc','piece','pieces','multicolor','multicolour','black','white','blue','red','pink','green','grey','gray','yellow','brown','free','size','new','combo']);
  function suggest(q) {
    const s = String(q || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
    const out = { q: s, terms: [], cats: [], items: [], total: 0 };
    if (s.length < 2) return out;
    const list = searchList(s);
    out.total = list.length;
    const words = s.replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter(Boolean);
    const last = words[words.length - 1] || '';
    // Phrases: 1 to 3 word runs from matching titles that contain the last typed word
    const cnt = {};
    list.slice(0, 500).forEach((p) => {
      const t = p.title.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
      const seen = new Set();
      t.forEach((w, i) => {
        if (!w.startsWith(last)) return;
        for (let a = Math.max(0, i - 1); a <= i; a++) for (let b = i; b <= Math.min(t.length - 1, i + 1); b++) {
          const g = t.slice(a, b + 1);
          if (g.some((x) => /^\d/.test(x)) || STOP.has(g[0]) || STOP.has(g[g.length - 1])) continue;
          const ph = g.join(' ');
          if (ph.length < 3 || seen.has(ph)) continue;
          seen.add(ph); cnt[ph] = (cnt[ph] || 0) + (g.length > 1 ? 1.2 : 1);
        }
      });
    });
    const head = words.slice(0, -1).join(' ');
    out.terms = [...new Set(Object.entries(cnt).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])
      .map(([ph]) => (head && !ph.includes(head) ? head + ' ' + ph : ph)))].filter((ph) => ph !== s).slice(0, 5);
    // Categories: named by the query, then where the results mostly sit
    const byCat = {};
    list.forEach((p) => { byCat[p.cat] = (byCat[p.cat] || 0) + 1; });
    const named = CATS.filter((c) => c.label.toLowerCase().includes(s) || c.id.includes(s));
    const busy = CATS.filter((c) => byCat[c.id]).sort((a, b) => byCat[b.id] - byCat[a.id]);
    out.cats = [...new Set([...named, ...busy])].slice(0, 3).map((c) => ({ label: c.label, href: url.cat(c.id), n: byCat[c.id] || P.filter((p) => p.cat === c.id).length }));
    const seenG = new Set();
    out.items = list.filter((p) => !p.gk || (!seenG.has(p.gk) && seenG.add(p.gk))).slice(0, 6).map((p) => ({ t: p.title, href: url.product(p), img: imgUrl(p.img, 120) || '', p: fmt(p.price), w: p.was && p.was > p.price ? fmt(p.was) : '', r: p.rating || 0 }));
    return out;
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
    if (kind !== 'search') d.list = d.list.filter((p) => !p.alt);
    // Group sub-categories that differ only in spelling ("Mixer-Juicer-Grinder" = "Mixer Juicer Grinder"), skip vague ones
    const skey = (x) => String(x || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').replace(/s$/, '');
    const vague = new Set(['homeandkitchen', 'homeimprovement', 'kitchenware', 'otherproduct', 'allproduct', 'trending', 'bestseller', 'newarrival', 'goods', 'general', 'kid', 'women', 'men']);
    const groups = {};
    d.list.forEach((p) => { const k = skey(p.sub); if (!k || vague.has(k)) return; (groups[k] = groups[k] || { n: 0, names: {} }).n++; groups[k].names[p.sub] = (groups[k].names[p.sub] || 0) + 1; });
    const label = (k) => Object.entries(groups[k].names).sort((a, b) => b[1] - a[1])[0][0].replace(/-/g, ' ');
    const subKeys = Object.keys(groups).filter((k) => groups[k].n >= 3).sort((a, b) => groups[b].n - groups[a].n).slice(0, 12);
    const subs = subKeys.map(label);
    const subOf = {}; subKeys.forEach((k, i) => (subOf[k] = subs[i]));
    const subCount = {}; subKeys.forEach((k, i) => (subCount[subs[i]] = groups[k].n));
    const sub = subs.includes(opts.sub) ? opts.sub : 'all';
    const sort = ['pop', 'lo', 'hi', 'off', 'new'].includes(opts.sort) ? opts.sort : 'pop';
    let shown = sub === 'all' ? d.list : d.list.filter((p) => subOf[skey(p.sub)] === sub);
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
    return { ...d, subs, subCount, sub, sort, shown, items, page, pages, link };
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
    const counts = {}; P.forEach((p) => { if (!p.alt) counts[p.cat] = (counts[p.cat] || 0) + 1; });
    const curCat = v.cat ? v.cat.id : kind === 'deals' ? 'deals' : kind === 'all' ? 'all' : '';
    const sorts = [['pop', 'Recommended'], ['lo', 'Price: Low to High'], ['hi', 'Price: High to Low'], ['off', 'Biggest Saving']];
    const label = kind === 'search' ? esc(key) : v.title;
    const side = `<aside class="lf" id="filters"><div class="lf-mh"><b>Filters</b><button class="lf-x" data-act="filters" aria-label="Close filters">${ic('i-x')}</button></div>
      <div class="lf-sec"><h3>Category</h3>
        <a class="lf-cat ${curCat === 'all' ? 'on' : ''}" href="${url.shop}"><i></i>All products <small>${P.filter((p) => !p.alt).length.toLocaleString('en-IN')}</small></a>
        ${CATS.filter((c) => counts[c.id]).map((c) => `<a class="lf-cat ${curCat === c.id ? 'on' : ''}" href="${url.cat(c.id)}"><i></i>${c.label} <small>${counts[c.id].toLocaleString('en-IN')}</small></a>
          ${curCat === c.id && v.subs.length > 1 ? `<div class="lf-subs">${v.subs.map((x) => `<a class="${v.sub === x ? 'on' : ''}" href="${v.link({ sub: v.sub === x ? 'all' : x, page: 1 })}"><i></i>${esc(x)} <small>${v.subCount[x]}</small></a>`).join('')}</div>` : ''}`).join('')}
        <a class="lf-cat ${curCat === 'deals' ? 'on' : ''}" href="${url.deals}"><i></i>Deals</a>
      </div>
      <div class="lf-sec"><h3>Delivery</h3><p class="lf-note">${ic('i-truck')} ${POLICY.minDays} to ${POLICY.maxDays} working days, anywhere in India. Free over ${fmt(C.FREE_OVER)}.</p></div>
      <div class="lf-sec"><h3>Payment</h3><p class="lf-note">${ic('i-cash')} Cash on delivery or UPI</p></div>
    </aside>`;
    return `<div class="wrap2 lst">
    ${crumbs([['Home', '/'], [v.crumb]])}
    <div class="lst-in">
      ${side}
      <div class="lst-main">
        <div class="lst-bar">
          <h1 class="lst-h">${v.shown.length.toLocaleString('en-IN')} Results for <b>“${label}”</b>${v.page > 1 ? ` <small>· Page ${v.page}</small>` : ''}</h1>
          <button class="mfilter" data-act="filters">${ic('i-filter')} Filter</button>
          <label class="srt">${ic('i-down', 'i')}<span>Sort By:</span><select data-act="sort">${sorts.map(([val, l]) => `<option value="${val}" ${v.sort === val ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        ${v.subs.length > 1 ? `<div class="chipr">${['all', ...v.subs].map((x) => `<a class="chp ${v.sub === x ? 'on' : ''}" href="${v.link({ sub: x, page: 1 })}">${x === 'all' ? 'All' : esc(x)}</a>`).join('')}</div>` : ''}
        ${v.items.length ? gridOf(v.items, ctx) : `<div class="empty"><h2>No results found</h2><p>Try a different word, or <a class="link" href="${url.shop}">browse everything</a>.</p></div>`}
        ${pager(v)}
        ${v.cat && v.page === 1 ? `<div class="lst-seo"><h2>${esc(v.cat.label)} online at Shopeiz</h2><p>${esc(v.cat.seo)}</p></div>` : ''}
      </div>
    </div>
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
  // Short highlight bullets taken from the description
  function highlights(p) {
    const html = p.desc_html || '';
    let pts = [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    if (pts.length < 2) pts = html.replace(/<[^>]+>/g, '\n').split(/\n|(?<=\.)\s+/).map((x) => x.trim());
    return pts.map((x) => x.replace(/\s+/g, ' ')).filter((x) => x.length > 12 && x.length < 160 && !/:\s*$/.test(x)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 5);
  }
  // "Key: value" pairs found in the description, plus what we know about the product
  function specRows(p) {
    const text = (p.desc_html || '').replace(/<\/(p|li|tr|h3|h4)>|<br>/gi, '\n').replace(/<\/t[dh]>/gi, ': ').replace(/<[^>]+>/g, '');
    const rows = [];
    text.split('\n').forEach((line) => {
      const m = /^\s*([A-Za-z][A-Za-z /&()-]{1,28}?)\s*[:\-–]\s+(.{1,120})$/.exec(line.trim());
      if (m && !/http|www|price|mrp|contact|whatsapp/i.test(line)) rows.push([m[1].trim(), m[2].trim().replace(/:\s*$/, '')]);
    });
    const seen = new Set();
    const out = rows.filter(([k]) => { const key = k.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 14);
    out.push(['Category', catOf(p).label + (p.sub ? ' · ' + p.sub : '')]);
    if (p.variants && p.variants.length > 1) out.push(['Options', p.variants.map((v) => v.title).join(', ')]);
    out.push(['Delivery', deliveryText(p) + ', anywhere in India']);
    out.push(['Payment', p.cod === false ? 'UPI (prepaid only)' : 'Cash on delivery or UPI']);
    out.push(['Replacement', `${POLICY.replaceDays} days for damaged, defective or wrong items`]);
    return out;
  }
  function faqs(p) {
    return [
      [`How long does delivery take for the ${p.title}?`, `It usually arrives in ${deliveryText(p)}. You get tracking details by SMS or WhatsApp as soon as it ships.`],
      ['Is cash on delivery available?', p.cod === false ? 'This item is prepaid only. You can pay securely by UPI after placing the order.' : `Yes. Cash on delivery is available across India for a ${fmt(C.COD_FEE)} fee, or you can pay by UPI.`],
      ['What if it arrives damaged or is not what I ordered?', `Tell us within ${POLICY.replaceDays} days of delivery with photos or an unboxing video and we will send a free replacement, or refund you if a replacement is not possible.`],
      ['Is the price inclusive of GST?', `Yes. The price shown, ${fmt(p.price)}, includes GST. Delivery is free on orders over ${fmt(C.FREE_OVER)}.`],
    ];
  }
  const rvImg = (u, w) => String(u).replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${w}&height=${w}&resize=cover&quality=70`;
  function reviewsHtml(p) {
    const r = p.reviewData || { count: 0, items: [] };
    const n = Number(r.count || 0), avg = Number(r.avg || 0), dist = r.dist || {};
    const bars = [5, 4, 3, 2, 1].map((k) => { const c = Number(dist[k] || 0); return `<div class="rbar"><span>${k} ${ic('i-star', 'i s')}</span><i><b style="width:${n ? (c / n) * 100 : 0}%"></b></i><em>${c}</em></div>`; }).join('');
    const list = (r.items || []).map((x) => `<article class="rv">
      <div class="rv-top">${starRow(x.rating)}${x.verified ? '<span class="vb">Verified buyer</span>' : ''}</div>
      ${x.title ? `<h4>${esc(x.title)}</h4>` : ''}<p>${esc(x.body)}</p>
      ${(x.photos || []).length ? `<div class="rv-pics">${x.photos.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(rvImg(u, 200))}" alt="Customer photo" loading="lazy"></a>`).join('')}</div>` : ''}
      <div class="rv-by">${esc(x.name)}${x.city ? ', ' + esc(x.city) : ''} · ${new Date(x.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      ${x.reply ? `<div class="rv-reply"><b>Shopeiz replied:</b> ${esc(x.reply)}</div>` : ''}
    </article>`).join('');
    const pics = (r.photos || []).slice(0, 12);
    return `<section class="pd-sec" id="reviews"><div class="wrap2">
      <div class="pd-h"><h2>Ratings &amp; reviews</h2></div>
      ${pics.length ? `<div class="rv-photos"><b>Customer photos</b><div>${pics.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(rvImg(u, 240))}" alt="Customer photo" loading="lazy"></a>`).join('')}</div></div>` : ''}
      <div class="rv-grid">
        <div class="rv-sum">
          ${n ? `<div class="big">${avg.toFixed(1)}</div>${starRow(avg, 'lg')}<p>Based on ${n} review${n === 1 ? '' : 's'}</p>${bars}` : `<div class="big">–</div>${starRow(0, 'lg')}<p>No reviews yet. Bought this? Be the first to share what you think.</p>`}
          <button class="btn btn-dark btn-block" data-act="rvopen" style="margin-top:22px">Write a review</button>
        </div>
        <div>
          <form class="rv-form" data-form="review" hidden>
            <input type="hidden" name="product_id" value="${p.id}">
            <div class="rv-rate" role="radiogroup" aria-label="Your rating">${[1, 2, 3, 4, 5].map((k) => `<label><input type="radio" name="rating" value="${k}" required><svg><use href="#i-star"/></svg><span class="sr">${k} star${k > 1 ? 's' : ''}</span></label>`).join('')}</div>
            <div class="fields">
              <div class="field"><label>Your name</label><input name="name" required maxlength="60"></div>
              <div class="field"><label>City (optional)</label><input name="city" maxlength="60"></div>
              <div class="field full"><label>Review title (optional)</label><input name="title" maxlength="120"></div>
              <div class="field full"><label>Your review</label><textarea name="body" required minlength="10" maxlength="2000" rows="4"></textarea></div>
              <div class="field"><label>Order number (for a Verified buyer badge)</label><input name="order_code" placeholder="SZ10001"></div>
              <div class="field"><label>Mobile used for the order</label><input name="phone" inputmode="numeric"></div>
            </div>
            <p class="msg err" data-rverr></p>
            <button class="btn btn-wine" type="submit">Submit review</button>
            <p class="note">Reviews are checked by our team before they appear.</p>
          </form>
          <div class="rv-list">${list || (n ? '' : '<p class="muted-p">Honest reviews from real customers will appear here.</p>')}</div>
        </div>
      </div>
    </div></section>`;
  }
  function vProduct(p, ctx = {}) {
    const c = catOf(p);
    const near = P.filter((x) => x.cat === p.cat && x.id !== p.id && !x.alt && (!p.gk || x.gk !== p.gk));
    const related = near.slice().sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price)).slice(0, 8);
    if (related.length < 4) related.push(...P.filter((x) => x.cat !== p.cat && x.was).slice(0, 4 - related.length));
    const imgs = (p.images && p.images.length ? p.images : p.img ? [p.img] : []).slice(0, 10);
    const vars = p.variants || [];
    const curV = vars.find((v) => v.id === p.defaultVariant) || vars.find((v) => v.ok) || null;
    const price = curV ? curV.price : p.price;
    const soldOut = p.available === false || (vars.length && !vars.some((v) => v.ok));
    const vp = { ...p, price };
    const hl = highlights(p);
    const fam = (p.family || []).slice(0, 10);
    const desc = p.desc_html ? `<div class="rich">${p.desc_html}</div>` : `<p>${esc(p.desc || '')}</p>`;
    const n = Number((p.reviewData && p.reviewData.count) || p.reviews || 0), avg = Number((p.reviewData && p.reviewData.avg) || p.rating || 0);
    const sizeLike = vars.every((v) => /^(xxs|xs|s|m|l|xl|xxl|xxxl|[2-6]xl|free ?size|\d{1,2}(\.\d)?|uk ?\d+|\d+\s*(cm|in|inch|ml|l|kg|g))$/i.test(v.title.trim()));
    return `<div class="wrap2 pdx">
    ${crumbs([['Home', '/'], [c.label, url.cat(c.id)], ...(p.sub ? [[p.sub.replace(/-/g, ' ')]] : []), [p.title]])}
    <div class="pdx-in">
      <div class="pdx-gal">
        ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, k) => `<button class="${k ? '' : 'on'}" data-act="pimg" data-k="${k}" aria-label="Photo ${k + 1}"><img src="${esc(imgUrl(src, 160))}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        <div class="pdx-main">
          <div class="g-main" id="pmain">
            ${imgs.length ? imgs.map((src, k) => `<button class="g-slide" data-act="zoom" data-k="${k}" aria-label="Enlarge photo ${k + 1}"><img src="${esc(imgUrl(src, 1000))}" alt="${esc(p.title)}${k ? ' photo ' + (k + 1) : ''}" ${k ? 'loading="lazy"' : 'fetchpriority="high"'}></button>`).join('') : `<div class="g-slide">${media(p)}</div>`}
          </div>
          <button class="pc-wish pdx-wish" data-act="wish" data-id="${p.id}" data-snap="${snap(p)}" aria-label="Save to wishlist">${ic('i-heart')}</button>
          ${p.tag ? `<span class="pc-tag">${esc(p.tag)}</span>` : ''}
          ${imgs.length > 1 ? `<span class="g-count" id="gcount">1 / ${imgs.length}</span>` : ''}
        </div>
        <script type="application/json" id="gimgs">${JSON.stringify(imgs.map((x) => imgUrl(x, 1600))).replace(/</g, '\\u003c')}</script>
      </div>

      <div class="pdx-info">
        <a class="pdx-brand" href="${url.cat(c.id)}">${esc(c.label)} ${ic('i-down', 'i rot')}</a>
        <h1>${esc(p.title)}</h1>
        <a class="pdx-rate" href="#reviews">${n ? `<b>${avg.toFixed(1)}</b>${starRow(avg)}<u>${n} Rating${n === 1 ? '' : 's'}</u>` : `${starRow(0)}<u>Be the first to rate</u>`}</a>
        <div id="pprice" class="pdx-price"><span class="pc-cur">₹</span><strong>${Math.round(price).toLocaleString('en-IN')}</strong>${p.was ? `<s>₹${Math.round(p.was).toLocaleString('en-IN')}</s><em>${off(vp)}% Off</em>` : ''}</div>
        <p class="pdx-tax">Inclusive of all taxes${soldOut ? '' : p.cod === false ? ' · Prepaid by UPI only' : ' · Cash on delivery available'}</p>
        ${!soldOut && codePrice(price) ? `<div class="pdx-offers"><h3>${ic('i-tag')} Offers</h3>
          <div class="pdx-off"><b>₹${codePrice(price).toLocaleString('en-IN')} on your first order</b><span>Use code <em>${esc(PROMO.code)}</em> at checkout for ${PROMO.pct}% off (once per mobile number).</span></div>
          <div class="pdx-off"><b>${price >= C.FREE_OVER ? 'Free delivery on this item' : `Free delivery on orders over ${fmt(C.FREE_OVER)}`}</b><span>${price >= C.FREE_OVER ? 'No delivery charge, anywhere in India.' : `Add ${fmt(C.FREE_OVER - price)} more to your cart to skip the ${fmt(C.STD_FEE)} delivery fee.`}</span></div>
        </div>` : ''}
        ${fam.length ? `<div class="fam"><span class="vl">Colour</span><div>${fam.map((f) => `<a href="/products/${esc(f.slug)}" title="${esc(f.title)}"><img src="${esc(imgUrl(f.img, 160))}" alt="${esc(f.title)}" loading="lazy"></a>`).join('')}</div></div>` : ''}
        ${vars.length > 1 ? `<div class="vars"><span class="vl">${sizeLike ? 'Size' : 'Option'}</span><div>${vars.map((v) => `<button class="${curV && v.id === curV.id ? 'on' : ''}" data-act="pvar" data-v="${esc(v.id)}" data-price="${v.price}" ${v.ok ? '' : 'disabled'}>${esc(v.title)}${v.ok ? '' : ' (sold out)'}</button>`).join('')}</div></div>` : ''}
        <a class="pdx-explore" href="${url.cat(c.id)}">${ic('i-gift')}<span>Explore more bestsellers in <b>${esc(c.label)}</b></span>${ic('i-down', 'i rot')}</a>
        <div class="pdx-del">
          <h3>Delivery information</h3>
          <div class="pdx-pin" data-pinrow data-days="${daysOf(p)}" data-cod="${p.cod === false ? 0 : 1}">${ic('i-pin')}<span class="pin-t">Enter your PIN code to check delivery to your area</span><button data-pin="open">Check</button></div>
          <div class="pdx-dbox"><span class="pdx-pill">${ic('i-truck')} Standard</span><span>Get it by <b data-eta>${dateIn(daysOf(p))}</b></span><small data-eta-range>${deliveryText(p)}</small></div>
          <div class="pdx-dbox"><span class="pdx-pill alt">${ic('i-cash')} ${p.cod === false ? 'Prepaid' : 'COD'}</span><span>${p.cod === false ? 'Pay securely by UPI' : 'Pay cash when it arrives, or by UPI'}</span></div>
        </div>
        ${hl.length ? `<div class="pdx-hl"><h3>Highlights</h3><ul>${hl.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      </div>

      <aside class="pdx-buy">
        <div class="pdx-seller"><span class="pdx-logo"><svg viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono"/></svg></span><div><small>Sold by</small><b>Shopeiz</b><span>${ic('i-star')} Checked suppliers · Delivered across India</span></div></div>
        <div class="pdx-hf"><h3>Hassle free <span>shopping</span></h3><p>Check what is covered with this item</p>
          <div class="pdx-hfl">
            <div>${ic('i-return')}<span>${POLICY.replaceDays}-day replacement for damaged or wrong items</span></div>
            <div>${ic('i-shield')}<span>${p.cod === false ? 'Secure UPI payment' : 'Cash on delivery available'}</span></div>
            <div>${ic('i-truck')}<span>${price >= C.FREE_OVER ? 'Free delivery on this item' : `Free delivery on orders over ${fmt(C.FREE_OVER)}`}</span></div>
          </div>
        </div>
        ${soldOut ? `<div class="stock-out"><b>Currently out of stock.</b> Save it to your wishlist and check back soon.</div>
        <button class="pdx-cta line" data-act="wish" data-id="${p.id}" data-snap="${snap(p)}">${ic('i-heart')} Save to wishlist</button>` : `
        <div class="pdx-qty"><span>Quantity</span><div class="qty"><button data-act="pq" data-d="-1" aria-label="Decrease quantity">${ic('i-minus')}</button><span id="pq">1</span><button data-act="pq" data-d="1" aria-label="Increase quantity">${ic('i-plus')}</button></div></div>
        <button class="pdx-cta" id="pdpAdd" data-act="add" data-id="${p.id}" data-qty="1" data-price="${price}" data-snap="${snap(vp, curV ? curV.id : '')}">Add to cart</button>
        <button class="pdx-cta line" data-act="buynow" data-id="${p.id}">Buy now</button>`}
      </aside>
    </div>
  </div>
  <nav class="pd-tabs"><div class="wrap2"><a href="#about">Description</a><a href="#specs">Specifications</a><a href="#reviews">Reviews${n ? ` (${n})` : ''}</a><a href="#faq">Delivery &amp; FAQ</a></div></nav>
  <section class="pd-sec" id="about"><div class="wrap2 pd-two">
    <div class="pd-h"><h2>About this product</h2></div>
    <div><p class="pd-lead">${esc(overview(p))}</p>${desc}</div>
  </div></section>
  <section class="pd-sec" id="specs"><div class="wrap2 pd-two">
    <div class="pd-h"><h2>Specifications</h2></div>
    <dl class="spec-t">${specRows(p).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  </div></section>
  ${reviewsHtml(p)}
  <section class="pd-sec" id="faq"><div class="wrap2 pd-two">
    <div class="pd-h"><h2>Delivery &amp; questions</h2></div>
    <div class="faq">${faqs(p).map(([q, a]) => `<details><summary>${esc(q)} ${ic('i-down')}</summary><div class="a">${esc(a)}</div></details>`).join('')}</div>
  </div></section>
  <section class="hsec"><div class="wrap2">${ribbon('Similar products', url.cat(c.id))}${rail(related, ctx)}</div></section>
  <div class="lightbox" id="lb" hidden><button class="lb-x" data-act="lbclose" aria-label="Close">${ic('i-x')}</button><button class="lb-p" data-act="lbnav" data-d="-1" aria-label="Previous">${ic('i-arrow', 'i flip')}</button><img alt=""><button class="lb-n" data-act="lbnav" data-d="1" aria-label="Next">${ic('i-arrow')}</button></div>`;
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

  return { fmt, esc, ic, byId, bySlug, catOf, off, dateIn, daysOf, deliveryText, imgUrl, snap, url, media, stars, priceHtml, card, gridOf, crumbs, vHome, vList, listData, listView, searchList, suggest, PAGE_SIZE, vProduct, overview, faqs, specList, starRow, vHelp, HELP, vNotFound };
});
