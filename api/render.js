/* Renders every Shopeiz page on the server so search engines receive complete HTML:
   home, shop, categories, products, search, help, location pages, sitemaps.
   Cart, checkout and wishlist are filled in by the browser (assets/app.js). */
const fs = require('fs');
const path = require('path');
const C = require('../assets/catalog.js');
const V = require('../assets/views.js');
const L = require('../lib/locations.js');
const S = require('../lib/store.js');
const { SITE, CATS, P, NAV_CATS, POLICY } = C;
const { esc, url, fmt, bySlug, catOf, ic } = V;

const SHELL = fs.readFileSync(path.join(__dirname, '..', 'templates', 'shell.html'), 'utf8');
const VERSION = '17';
const DEFAULT_DESC = 'The art of having everything. Anything you need, in one place, at your door: kitchen, home, electronics, beauty, fashion, toys and drones. Free delivery over ₹499, cash on delivery, 7-day replacement.';

function headHtml(h) {
  const title = esc(h.title || 'Shopeiz | The art of having everything');
  const desc = esc(h.description || DEFAULT_DESC);
  const canon = h.canonical ? SITE + h.canonical : null;
  const SHARE = SITE + '/assets/brand/shopeiz-share.jpg';
  const img = h.image ? (h.image.startsWith('http') ? h.image : SITE + h.image) : SHARE;
  const imgMeta = img === SHARE
    ? `<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:alt" content="Shopeiz: The art of having everything. Free delivery over ₹499, cash on delivery, delivered across India.">`
    : `<meta property="og:image:alt" content="${title}">`;
  const ld = (h.ld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<title>${title}</title>
<meta name="description" content="${desc}">
${h.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
${h.prev ? `<link rel="prev" href="${SITE + h.prev}">\n` : ''}${h.next ? `<link rel="next" href="${SITE + h.next}">\n` : ''}${canon ? `<link rel="canonical" href="${canon}">\n<link rel="alternate" hreflang="en-IN" href="${canon}">\n<link rel="alternate" hreflang="x-default" href="${canon}">` : ''}
<meta name="theme-color" content="#6D001A">
<meta property="og:site_name" content="Shopeiz">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
<meta property="og:image:secure_url" content="${img}">
${imgMeta}
<meta property="og:type" content="${h.ogType || 'website'}">
${canon ? `<meta property="og:url" content="${canon}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${img}">
<meta property="og:locale" content="en_IN">
${ld}`;
}

function nav(active) {
  const counts = {}; P.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));
  const items = [['all', 'Shop all'], ...NAV_CATS.map((id) => CATS.find((c) => c.id === id)).filter((c) => c && counts[c.id]).map((c) => [c.id, c.label]), ['deals', 'Deals']];
  return items.map(([id, l]) => `<a href="${url.cat(id)}" class="${active === id ? 'on' : ''} ${id === 'deals' ? 'sale' : ''}">${l}</a>`).join('');
}

function page({ head, main, view = '', active = '', sticky = '', q = '' }) {
  return SHELL
    .replace('{{HEAD}}', headHtml(head))
    .replace('{{VIEW}}', view)
    .replace('{{Q}}', esc(q))
    .replace('{{NAV}}', nav(active))
    .replace('{{MAIN}}', main)
    .replace('{{FCATS}}', CATS.map((c) => `<li><a href="${url.cat(c.id)}">${c.label}</a></li>`).join(''))
    .replace('</head>', `<script>window.SZ_SET=${JSON.stringify({ free_over: C.FREE_OVER, std_fee: C.STD_FEE, cod_fee: C.COD_FEE, promo_code: C.PROMO.code, promo_pct: C.PROMO.pct, min: POLICY.minDays, max: POLICY.maxDays, rep: POLICY.replaceDays })}</script>\n</head>`)
    .replace('{{FPLACES}}', L.footerPlaces())
    .replace('{{YEAR}}', String(new Date().getFullYear()))
    .replace('{{STICKY}}', sticky)
    .split('{{V}}').join(VERSION);
}

/* ---------- Structured data ---------- */
const ORG_ID = SITE + '/#organization', SITE_ID = SITE + '/#website';
const RETURN_POLICY = { '@type': 'MerchantReturnPolicy', applicableCountry: 'IN', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 7, returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/FreeReturn', refundType: 'https://schema.org/ExchangeRefund', itemCondition: 'https://schema.org/DamagedCondition' };
const ORG = {
  '@context': 'https://schema.org', '@type': 'OnlineStore', '@id': ORG_ID, name: 'Shopeiz', url: SITE + '/',
  logo: { '@type': 'ImageObject', url: SITE + '/assets/brand/shopeiz-logo.png', width: 512, height: 512 }, image: [SITE + '/assets/brand/shopeiz-share.jpg', SITE + '/assets/brand/shopeiz-logo.png'],
  slogan: 'The art of having everything.',
  description: 'Shopeiz is an online store for kitchen, home, electronics, beauty, fashion, toys and drones, delivering across India with free delivery over ₹499, cash on delivery and a 7-day replacement promise.',
  areaServed: { '@type': 'Country', name: 'India' }, currenciesAccepted: 'INR', paymentAccepted: 'UPI, Cash on Delivery',
  hasMerchantReturnPolicy: RETURN_POLICY,
};
const WEBSITE = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE_ID, name: 'Shopeiz', alternateName: 'Shopeiz Online Shopping', url: SITE + '/', inLanguage: 'en-IN', publisher: { '@id': ORG_ID }, potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: SITE + '/search?q={search_term_string}' }, 'query-input': 'required name=search_term_string' } };
function webPage(type, path, name, description, extra = {}) {
  return Object.assign({ '@context': 'https://schema.org', '@type': type, '@id': SITE + path + '#webpage', url: SITE + path, name, description, inLanguage: 'en-IN', isPartOf: { '@id': SITE_ID }, publisher: { '@id': ORG_ID } }, extra);
}
function itemList(list, name) {
  return { '@type': 'ItemList', name, numberOfItems: list.length, itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + url.product(p), name: p.title })) };
}
function listPage(path, title, description, list, crumbs) {
  return [webPage('CollectionPage', path, title, description, { mainEntity: itemList(list, title) }), crumbLd(crumbs)];
}
function crumbLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: href ? SITE + href : undefined })) };
}
const abs = (src) => (/^https?:/.test(src) ? src : SITE + src);
function productLd(p) {
  const imgs = (p.images && p.images.length ? p.images : p.img ? [p.img] : []).slice(0, 6).map((x) => abs(V.imgUrl(x, 1200)));
  const soldOut = p.available === false;
  const o = {
    '@context': 'https://schema.org', '@type': 'Product', '@id': SITE + url.product(p) + '#product', name: p.title, sku: p.id, description: V.overview(p) + (p.desc ? ' ' + p.desc : ''), category: catOf(p).label + (p.sub ? ' > ' + p.sub : ''),
    url: SITE + url.product(p), mainEntityOfPage: { '@id': SITE + url.product(p) + '#webpage' },
    offers: {
      '@type': 'Offer', url: SITE + url.product(p), priceCurrency: 'INR', price: p.price.toFixed(2), priceValidUntil: new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10),
      availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
      ...(p.was ? { priceSpecification: [{ '@type': 'UnitPriceSpecification', priceType: 'https://schema.org/StrikethroughPrice', price: p.was.toFixed(2), priceCurrency: 'INR' }] } : {}),
      seller: { '@id': ORG_ID },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: p.price >= C.FREE_OVER ? '0' : String(C.STD_FEE), currency: 'INR' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: Math.max(2, V.daysOf(p) - 2), unitCode: 'DAY' } },
      },
      hasMerchantReturnPolicy: RETURN_POLICY,
    },
  };
  if (imgs.length) o.image = imgs;
  // Only real, approved customer reviews are ever marked up
  const rd = p.reviewData || {};
  if (Number(rd.count) > 0) {
    o.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(rd.avg).toFixed(1), reviewCount: Number(rd.count), bestRating: 5, worstRating: 1 };
    o.review = (rd.items || []).slice(0, 5).map((x) => ({ '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: x.rating, bestRating: 5 }, author: { '@type': 'Person', name: x.name }, datePublished: String(x.at).slice(0, 10), reviewBody: x.body }));
  }
  return o;
}

/* ---------- Routes ---------- */
async function route(pathname, query) {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const home = { head: { canonical: '/', ld: [ORG, WEBSITE, webPage('WebPage', '/', 'Shopeiz | The art of having everything', DEFAULT_DESC, { about: { '@id': ORG_ID }, mainEntity: null })] }, main: V.vHome({}), view: 'home' };
  home.head.ld[2].mainEntity = itemList(C.BEST.map((id) => P.find((p) => p.id === id)).filter(Boolean), 'Bestsellers');
  if (!parts.length) return home;

  const [a, b] = parts;
  const opts = { sub: query.get('sub') || '', sort: query.get('sort') || '', page: query.get('page') || '' };
  const filtered = !!(opts.sub || opts.sort);
  // Listing head: page 2+ keep their own canonical; filtered views are not indexed
  const listHead = (kind, key, base, title, description, crumb) => {
    const v = V.listView(kind, key, opts);
    const pg = v.page > 1 ? ` (page ${v.page})` : '';
    return {
      title: title + pg, description: (v.page > 1 ? `Page ${v.page} of ${v.pages}. ` : '') + description, noindex: filtered,
      canonical: v.page > 1 && !filtered ? base + '?page=' + v.page : base,
      prev: !filtered && v.page > 1 ? (v.page === 2 ? base : base + '?page=' + (v.page - 1)) : '', next: !filtered && v.page < v.pages ? base + '?page=' + (v.page + 1) : '',
      ld: listPage(v.page > 1 ? base + '?page=' + v.page : base, title, description, v.items, crumb),
    };
  };

  if (a === 'shop' && !b) return { head: listHead('all', null, url.shop, 'Shop All Products Online | Shopeiz', `Shop ${P.length.toLocaleString('en-IN')} products online at Shopeiz: kitchen, home, electronics, beauty, fashion, toys and drones. Free delivery over ₹499 and cash on delivery across India.`, [['Home', '/'], ['Shop all']]), main: V.vList('all', null, opts), active: 'all' };
  if (a === 'deals' && !b) return { head: listHead('deals', null, url.deals, 'Deals and Offers: Real Prices Against MRP | Shopeiz', 'Today\'s deals at Shopeiz: kitchen tools, gadgets, home and beauty at real prices against MRP. Free delivery over ₹499 and cash on delivery.', [['Home', '/'], ['Deals']]), main: V.vList('deals', null, opts), active: 'deals' };
  if (a === 'category' && b && !parts[2]) {
    const c = CATS.find((x) => x.id === b);
    if (c) return { head: listHead('cat', c.id, url.cat(c.id), `Buy ${c.label} Online in India at Best Prices | Shopeiz`, c.seo, [['Home', '/'], [c.label]]), main: V.vList('cat', c.id, opts), active: c.id };
  }
  if (a === 'products' && b && !parts[2]) {
    const p = (await S.detail(b)) || bySlug(b);
    if (p) {
      const c = catOf(p);
      const soldOut = p.available === false;
      const desc = `Buy ${p.title} online at ${fmt(p.price)}${p.was ? ` (MRP ${fmt(p.was)}, save ${V.off(p)}%)` : ''}. Delivered across India in ${V.deliveryText(p)}, cash on delivery, ${POLICY.replaceDays}-day replacement.${p.desc ? ' ' + p.desc : ''}`;
      return {
        head: { title: `${p.title}: Buy Online at ${fmt(p.price)} | Shopeiz`, description: desc.slice(0, 300), canonical: url.product(p), image: p.img ? abs(V.imgUrl(p.img, 1200)) : '', ogType: 'product', noindex: soldOut, ld: [webPage('ItemPage', url.product(p), p.title, V.overview(p), { mainEntity: { '@id': SITE + url.product(p) + '#product' } }), productLd(p), crumbLd([['Home', '/'], [c.label, url.cat(c.id)], [p.title]]), { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: V.faqs(p).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] },
        main: V.vProduct(p), active: c.id, view: 'product',
        sticky: soldOut ? '' : `<div class="p">${esc(p.title)}<b>${fmt(p.price)}</b></div><button class="btn btn-dark" data-act="add" data-id="${p.id}" data-qty="1" data-snap="${V.snap(p, p.defaultVariant || '')}">Add to bag</button>`,
      };
    }
  }
  if (a === 'search' && !b) {
    const q = (query.get('q') || '').slice(0, 80);
    return { head: { title: q ? `Search results for “${q}” | Shopeiz` : 'Search | Shopeiz', canonical: '/search', noindex: true }, main: V.vList('search', q, opts), q };
  }
  if (a === 'help' && b && V.HELP[b] && !parts[2]) {
    const h = V.HELP[b];
    const type = b === 'about' ? 'AboutPage' : b === 'contact' ? 'ContactPage' : 'WebPage';
    const extra = b === 'returns' ? { mainEntity: Object.assign({ '@context': undefined }, RETURN_POLICY) } : b === 'about' ? { mainEntity: { '@id': ORG_ID } } : {};
    const ld = [webPage(type, url.help(b), h[0], h[1], extra), crumbLd([['Home', '/'], [h[0]]])];
    if (b === 'about') ld.unshift(ORG);
    return { head: { title: `${h[0]} | Shopeiz`, description: h[1].slice(0, 300), canonical: url.help(b), ld }, main: V.vHelp(b) };
  }
  const client = { cart: ['Your bag', 'cart'], checkout: ['Checkout', 'checkout'], wishlist: ['Wishlist', 'wishlist'], 'order-confirmed': ['Order confirmed', 'done'] };
  if (client[a] && !b) return { head: { title: `${client[a][0]} | Shopeiz`, noindex: true, canonical: '/' + a }, main: '<div class="wrap" style="min-height:60vh"></div>', view: client[a][1] };

  if (a === 'online-shopping-india' && !b) return L.indiaPage();
  if (a.startsWith('online-shopping-in-') && !b) {
    const res = L.placePage(a.slice('online-shopping-in-'.length));
    if (res) return res;
  }
  return null;
}

/* ---------- Sitemaps ---------- */
const CHUNK = 5000;
const productUrls = () => P.filter((p) => p.available !== false).map((p) => ({ loc: url.product(p), img: p.img ? abs(V.imgUrl(p.img, 1200)) : '' }));
function sitemapIndex() {
  const n = Math.ceil(L.allPlaceUrls().length / CHUNK);
  const np = Math.max(1, Math.ceil(productUrls().length / CHUNK));
  const files = ['/sitemaps/pages.xml', ...Array.from({ length: np }, (_, i) => `/sitemaps/products-${i + 1}.xml`), ...Array.from({ length: n }, (_, i) => `/sitemaps/places-${i + 1}.xml`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map((f) => `<sitemap><loc>${SITE}${f}</loc></sitemap>`).join('\n')}\n</sitemapindex>`;
}
const xmlEsc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function urlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((u) => typeof u === 'string' ? `<url><loc>${SITE}${xmlEsc(u)}</loc></url>` : `<url><loc>${SITE}${xmlEsc(u.loc)}</loc>${u.img ? `<image:image><image:loc>${xmlEsc(u.img)}</image:loc></image:image>` : ''}</url>`).join('\n')}\n</urlset>`;
}
function sitemap(file) {
  if (file === 'pages.xml') {
    const cats = CATS.filter((c) => P.some((p) => p.cat === c.id));
    const catPages = [];
    cats.forEach((c) => { const n = Math.ceil(P.filter((p) => p.cat === c.id).length / V.PAGE_SIZE); for (let i = 1; i <= n; i++) catPages.push(url.cat(c.id) + (i > 1 ? '?page=' + i : '')); });
    return urlset(['/', url.shop, url.deals, ...catPages, ...Object.keys(V.HELP).map(url.help), url.india]);
  }
  let m = /^products-(\d+)\.xml$/.exec(file);
  if (m) {
    const i = Number(m[1]) - 1;
    const slice = productUrls().slice(i * CHUNK, (i + 1) * CHUNK);
    if (slice.length) return urlset(slice);
  }
  m = /^places-(\d+)\.xml$/.exec(file);
  if (m) {
    const all = L.allPlaceUrls();
    const i = Number(m[1]) - 1;
    const slice = all.slice(i * CHUNK, (i + 1) * CHUNK);
    if (slice.length) return urlset(slice);
  }
  return null;
}

/* ---------- Handler ---------- */
module.exports = async (req, res) => {
  await S.ready();
  const u = new URL(req.url, SITE);
  const pathname = decodeURIComponent(u.pathname);

  if (pathname === '/sitemap.xml' || pathname.startsWith('/sitemaps/')) {
    const body = pathname === '/sitemap.xml' ? sitemapIndex() : sitemap(pathname.slice('/sitemaps/'.length));
    res.statusCode = body ? 200 : 404;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=604800');
    return res.end(body || '');
  }
  if (pathname === '/suggest') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.end(JSON.stringify(V.suggest(u.searchParams.get('q') || '')));
  }
  // Lower-case and trailing-slash clean-up for consistent URLs
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (clean !== pathname || /[A-Z]/.test(clean)) {
    res.statusCode = 301;
    res.setHeader('Location', clean.toLowerCase() + u.search);
    return res.end();
  }

  let r;
  try { r = await route(pathname, u.searchParams); } catch (e) { console.error(e); r = undefined; }
  if (r && r.redirect) {
    res.statusCode = 301;
    res.setHeader('Location', r.redirect);
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    return res.end();
  }
  const found = !!r;
  if (!r) r = { head: { title: 'Page not found | Shopeiz', noindex: true }, main: V.vNotFound() };
  res.statusCode = found ? 200 : 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const dynamic = ['/cart', '/checkout', '/wishlist', '/order-confirmed', '/search'].includes(pathname);
  res.setHeader('Cache-Control', dynamic ? 'public, s-maxage=60' : 'public, s-maxage=900, stale-while-revalidate=86400');
  res.end(page(r));
};
module.exports.route = route;
module.exports.page = page;
module.exports.sitemap = sitemap;
module.exports.sitemapIndex = sitemapIndex;
