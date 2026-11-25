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
  function card(p, ctx = {}) {
    const w = (ctx.wish || []).includes(p.id);
    const badge = p.tag ? `<span class="badge">${esc(p.tag)}</span>` : '';
    const add = p.available === false ? '' : `data-act="add" data-id="${p.id}" data-snap="${snap(p)}"`;
    return `<article class="card reveal">
    <div class="card-media">
      <a class="media" href="${url.product(p)}" aria-label="${esc(p.title)}">${media(p)}</a>${badge}
      <button class="wish ${w ? 'on' : ''}" data-act="wish" data-id="${p.id}" data-snap="${snap(p)}" aria-label="Save ${esc(p.title)} to wishlist" aria-pressed="${w}">${ic('i-heart')}</button>
    </div>
    <div class="card-body">
      <h3><a href="${url.product(p)}">${esc(p.title)}</a></h3>
      ${stars(p)}
      <div class="card-row">
        <div class="cprice">${p.was ? `<b class="sale">${fmt(p.price)}</b><s>${fmt(p.was)}</s><span class="pct">${off(p)}% off</span>` : `<b>${fmt(p.price)}</b>`}</div>
        ${add ? `<button class="qa" ${add} aria-label="Add ${esc(p.title)} to bag">${ic('i-bag')}<span>Quick add</span></button>` : '<span class="soldout">Sold out</span>'}
      </div>
    </div>
  </article>`;
  }
  const gridOf = (list, ctx, cls = '') => `<div class="grid ${cls}">${list.map((p) => card(p, ctx)).join('')}</div>`;
  const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([label, href], i) => (i ? '<span>/</span>' : '') + (href ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`)).join('')}</nav>`;

  /* ---------- Home ---------- */
  function vHome(ctx = {}) {
    const counts = {}; P.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));
    // Bestsellers: one product from each category, so the row shows the range of the store
    let best = BEST.map(byId).filter(Boolean);
    const seenCats = new Set(best.map((p) => p.cat));
    const byCount = Object.keys(counts || {}).sort((a, b) => counts[b] - counts[a]);
    for (const cid of byCount) {
      if (best.length >= 8) break;
      if (seenCats.has(cid)) continue;
      const pick = P.find((p) => p.cat === cid && p.img && !/pelvic|stimulator|massager|intimate|lingerie/i.test(p.title));
      if (pick) { best.push(pick); seenCats.add(cid); }
    }
    const hero = HERO.map(byId).filter(Boolean);
    const fl = byId('d1');
    // Category cover: the best-ranked clean product shot (fashion uses model photos)
    const SKIP = /pelvic|stimulator|massager|intimate|condom|lingerie|bra\b|panty/i;
    const pref = (c) => (c.id === 'fashion' ? /^(sw|bs)\d/ : /^(dp|dd|s\d|d\d)/);
    const coverP = (c) => P.find((p) => p.cat === c.id && p.img && pref(c).test(p.id) && !SKIP.test(p.title)) || P.find((p) => p.cat === c.id && p.img && !SKIP.test(p.title));
    const cover = (c) => c.cover || c.img || (coverP(c) || {}).img;
    const cats = CATS.filter((c) => counts[c.id]).sort((a, b) => counts[b.id] - counts[a.id]).slice(0, 12);
    const count = P.length;
    const heroCats = cats.slice(0, 8);
    const slides = (C.SLIDES || []).filter((sl) => counts[sl.cat] || sl.cat === 'home');
    return `
  <section class="hero" id="heroVis" aria-roledescription="carousel" aria-label="Featured collections">
    ${slides.map((sl, k) => `<div class="slide ${k ? '' : 'on'}" data-slide="${k}" ${k ? 'aria-hidden="true"' : ''}>
      <picture>
        <source media="(max-width:760px)" srcset="${sl.img}&w=900&h=1300">
        <img src="${imgUrl(sl.img, 1800)}" srcset="${srcset(sl.img, [800, 1200, 1800, 2400])}" sizes="100vw" alt="${esc(sl.alt)}" style="object-position:${sl.pos || 'center'}" ${k ? 'loading="lazy"' : 'fetchpriority="high"'}>
      </picture>
      <div class="veil"></div>
      <div class="hero-text">
        <span class="kicker">${esc(sl.kicker)}</span>
        ${k ? `<h2>${esc(sl.title)}</h2>` : `<h1>${esc(sl.title)}</h1>`}
        <p>${esc(sl.text)}</p>
        <div class="ctas">
          <a class="btn btn-light" href="${url.cat(sl.cat)}">${esc(sl.cta)}</a>
          <a class="btn btn-ghost" href="${url.shop}">Shop everything</a>
        </div>
      </div>
    </div>`).join('')}
    ${slides.length > 1 ? `<div class="hero-nav">
      <span class="num"><b id="heroNum">01</b> / ${String(slides.length).padStart(2, '0')}</span>
      <div class="bars">${slides.map((_, k) => `<button class="${k ? '' : 'on'}" data-act="slide" data-k="${k}" aria-label="Show slide ${k + 1}"><i></i></button>`).join('')}</div>
    </div>` : ''}
  </section>
  <section class="intro"><div class="wrap intro-in">
    <p class="intro-lead">Shopeiz brings ${count >= 1000 ? Math.floor(count / 1000).toLocaleString('en-IN') + ',000+' : count} carefully priced pieces into one store, from the kitchen to the wardrobe, delivered to every PIN code in India.</p>
    <ul class="hero-cats">${heroCats.map((c) => `<li><a href="${url.cat(c.id)}">${c.label}</a></li>`).join('')}</ul>
  </div></section>

  <div class="trust">
    <div>${ic('i-truck')}<p style="margin:0"><b>Free delivery</b><span>On orders over ${fmt(C.FREE_OVER)}</span></p></div>
    <div>${ic('i-return')}<p style="margin:0"><b>${POLICY.replaceDays}-day replacement</b><span>Damaged or wrong item? We replace it</span></p></div>
    <div>${ic('i-shield')}<p style="margin:0"><b>Delivered across India</b><span>Tracked to your door in ${POLICY.minDays} to ${POLICY.maxDays} working days</span></p></div>
    <div>${ic('i-cash')}<p style="margin:0"><b>Cash on delivery</b><span>Pay when it arrives</span></p></div>
  </div>

  <section class="block"><div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">Shop by category</span><h2>Anything you need, in one place</h2></div><a class="link" href="${url.shop}">View everything ${ic('i-arrow')}</a></div>
    <div class="cat-grid">${cats.map((c) => `<a class="cat-tile reveal" href="${url.cat(c.id)}">
      <div class="ct-img">${cover(c) ? `<img src="${imgUrl(cover(c), 600)}" srcset="${srcset(cover(c), [400, 600, 900])}" sizes="(max-width:700px) 50vw, 25vw" alt="${esc(c.label)}" loading="lazy">` : ic(c.icon)}</div>
      <h3>${c.label}</h3><span>${counts[c.id].toLocaleString('en-IN')} ${counts[c.id] === 1 ? 'product' : 'products'}</span></a>`).join('')}</div>
  </div></section>

  ${fl ? `<section class="feature">
    <div class="pic reveal"><img src="${fl.img}" alt="${esc(fl.title)} with its remote" loading="lazy"></div>
    <div class="copy">
      <span class="eyebrow">Our drone · ${esc(fl.sub)}</span>
      <h2>The E88 Pro. <em>The view from above.</em></h2>
      <p>${esc(fl.desc)} Foldable, beginner-friendly and ready to fly the day it arrives.</p>
      <ul>
        <li>${ic('i-check')} Phone-holder remote for a live view while you fly</li>
        <li>${ic('i-check')} Folds small enough to carry anywhere</li>
        <li>${ic('i-check')} Delivered by ${dateIn(daysOf(fl))} · cash on delivery</li>
      </ul>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-light" data-act="add" data-id="${fl.id}" data-snap="${snap(fl)}">Add to bag · ${fmt(fl.price)}</button>
        <a class="link" style="color:#fff" href="${url.product(fl)}">Details ${ic('i-arrow')}</a>
      </div>
    </div>
  </section>` : ''}

  <section class="block"><div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">Most loved</span><h2>What everyone's buying</h2><p>One favourite from each corner of the store.</p></div><a class="link" href="${url.shop}">Shop all products ${ic('i-arrow')}</a></div>
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
    <div class="story-mark reveal"><svg class="mono" viewBox="0 0 206.04 235.47" aria-hidden="true"><use href="#mono"/></svg></div>
    <div class="reveal">
      <span class="eyebrow">Our mark</span>
      <h2>A price tag that carries <em>everything.</em></h2>
      <p>Every product we sell carries one. The tag is our promise of a clear, fair price with nothing hidden. The three bars inside are our shelves: kitchen, home and gadgets, and everything in between. One mark, one standard, on everything we sell.</p>
      <p class="sign">Everything, fairly priced.</p>
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
    out.items = list.slice(0, 6).map((p) => ({ t: p.title, href: url.product(p), img: imgUrl(p.img, 120) || '', p: fmt(p.price), w: p.was && p.was > p.price ? fmt(p.was) : '', r: p.rating || 0 }));
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
    </div>
    ${v.items.length ? gridOf(v.items, ctx, 'bleed') : `<div class="wrap"><div class="empty"><h2>Nothing here yet</h2><p>Try another search, or <a class="link" href="${url.shop}">browse everything</a></p></div></div>`}
    <div class="wrap">${pager(v)}<div style="height:110px"></div></div>`;
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
  function reviewsHtml(p) {
    const r = p.reviewData || { count: 0, items: [] };
    const n = Number(r.count || 0), avg = Number(r.avg || 0), dist = r.dist || {};
    const bars = [5, 4, 3, 2, 1].map((k) => { const c = Number(dist[k] || 0); return `<div class="rbar"><span>${k} ${ic('i-star', 'i s')}</span><i><b style="width:${n ? (c / n) * 100 : 0}%"></b></i><em>${c}</em></div>`; }).join('');
    const list = (r.items || []).map((x) => `<article class="rv">
      <div class="rv-top">${starRow(x.rating)}${x.verified ? '<span class="vb">Verified buyer</span>' : ''}</div>
      ${x.title ? `<h4>${esc(x.title)}</h4>` : ''}<p>${esc(x.body)}</p>
      <div class="rv-by">${esc(x.name)}${x.city ? ', ' + esc(x.city) : ''} · ${new Date(x.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      ${x.reply ? `<div class="rv-reply"><b>Shopeiz replied:</b> ${esc(x.reply)}</div>` : ''}
    </article>`).join('');
    return `<section class="pd-sec" id="reviews"><div class="wrap">
      <div class="pd-h"><h2>Ratings &amp; reviews</h2></div>
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
    const near = P.filter((x) => x.cat === p.cat && x.id !== p.id);
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
    return `<div class="wrap">
    <div style="padding-top:24px">${crumbs([['Home', '/'], [c.label, url.cat(c.id)], [p.title]])}</div>
    <div class="pdp">
      <div class="gallery">
        <div class="g-main" id="pmain">
          ${imgs.length ? imgs.map((src, k) => `<button class="g-slide" data-act="zoom" data-k="${k}" aria-label="Enlarge photo ${k + 1}"><img src="${esc(imgUrl(src, 1000))}" alt="${esc(p.title)}${k ? ' photo ' + (k + 1) : ''}" ${k ? 'loading="lazy"' : 'fetchpriority="high"'}></button>`).join('') : `<div class="g-slide">${media(p)}</div>`}
          ${p.was ? `<span class="badge">Save ${off(p)}%</span>` : p.tag ? `<span class="badge">${esc(p.tag)}</span>` : ''}
          ${imgs.length > 1 ? `<span class="g-count" id="gcount">1 / ${imgs.length}</span>` : ''}
        </div>
        ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, k) => `<button class="${k ? '' : 'on'}" data-act="pimg" data-k="${k}" aria-label="Photo ${k + 1}"><img src="${esc(imgUrl(src, 160))}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        <script type="application/json" id="gimgs">${JSON.stringify(imgs.map((x) => imgUrl(x, 1600))).replace(/</g, '\\u003c')}</script>
      </div>
      <div class="pd-info">
        <span class="eyebrow">${c.label}${p.sub ? ' · ' + esc(p.sub) : ''}</span>
        <h1>${esc(p.title)}</h1>
        <a class="pd-rating" href="#reviews">${starRow(avg)}<span>${n ? `${avg.toFixed(1)} · ${n} review${n === 1 ? '' : 's'}` : 'No reviews yet · Write the first'}</span></a>
        <div id="pprice">${priceHtml(vp)}</div>
        <p class="tax">Inclusive of all taxes${soldOut ? '' : p.cod === false ? ' · Prepaid by UPI only' : ' · Cash on delivery available'}</p>
        ${fam.length ? `<div class="fam"><span class="vl">Also available in</span><div>${fam.map((f) => `<a href="/products/${esc(f.slug)}" title="${esc(f.title)}"><img src="${esc(imgUrl(f.img, 160))}" alt="${esc(f.title)}" loading="lazy"></a>`).join('')}</div></div>` : ''}
        ${vars.length > 1 ? `<div class="vars"><span class="vl">${vars.every((v) => /^(xxs|xs|s|m|l|xl|xxl|xxxl|[2-6]xl|free ?size|\d{1,2}(\.\d)?|uk ?\d+|\d+\s*(cm|in|inch|ml|l|kg|g))$/i.test(v.title.trim())) ? 'Size' : 'Option'}</span><div>${vars.map((v) => `<button class="${curV && v.id === curV.id ? 'on' : ''}" data-act="pvar" data-v="${esc(v.id)}" data-price="${v.price}" ${v.ok ? '' : 'disabled'}>${esc(v.title)}${v.ok ? '' : ' (sold out)'}</button>`).join('')}</div></div>` : ''}
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
        ${hl.length ? `<ul class="hl">${hl.map((x) => `<li>${ic('i-check')}<span>${esc(x)}</span></li>`).join('')}</ul>` : ''}
        <div class="perks">
          <div>${ic('i-truck')}<p style="margin:0"><b>Get it by ${dateIn(daysOf(p))}</b><span>${deliveryText(p)} · ${price >= C.FREE_OVER ? 'Free delivery' : `Free delivery on orders over ${fmt(C.FREE_OVER)}`}</span></p></div>
          <div>${ic('i-return')}<p style="margin:0"><b>${POLICY.replaceDays}-day replacement</b><span>Damaged, defective or wrong item? We replace it.</span></p></div>
          <div>${ic('i-cash')}<p style="margin:0">${p.cod === false ? '<b>Prepaid by UPI only</b><span>Cash on delivery is not available for this item.</span>' : '<b>Cash on delivery available</b><span>Or pay by UPI with a secure link.</span>'}</p></div>
        </div>
      </div>
    </div>
  </div>
  <nav class="pd-tabs"><div class="wrap"><a href="#about">Description</a><a href="#specs">Specifications</a><a href="#reviews">Reviews${n ? ` (${n})` : ''}</a><a href="#faq">Delivery &amp; FAQ</a></div></nav>
  <section class="pd-sec" id="about"><div class="wrap pd-two">
    <div class="pd-h"><h2>About this product</h2></div>
    <div><p class="pd-lead">${esc(overview(p))}</p>${desc}</div>
  </div></section>
  <section class="pd-sec" id="specs"><div class="wrap pd-two">
    <div class="pd-h"><h2>Specifications</h2></div>
    <dl class="spec-t">${specRows(p).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  </div></section>
  ${reviewsHtml(p)}
  <section class="pd-sec" id="faq"><div class="wrap pd-two">
    <div class="pd-h"><h2>Delivery &amp; questions</h2></div>
    <div class="faq">${faqs(p).map(([q, a]) => `<details><summary>${esc(q)} ${ic('i-down')}</summary><div class="a">${esc(a)}</div></details>`).join('')}</div>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">You may also like</span><h2>More in ${esc(c.label)}</h2></div><a class="link" href="${url.cat(c.id)}">See all ${ic('i-arrow')}</a></div>
    ${gridOf(related, ctx)}
  </div></section>
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
