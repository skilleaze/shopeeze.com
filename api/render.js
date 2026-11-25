/* Renders every Shopeiz page on the server so search engines receive complete HTML:
   home, shop, categories, products, search, help, location pages, sitemaps.
   Cart, checkout and wishlist are filled in by the browser (assets/app.js). */
const fs = require('fs');
const path = require('path');
const C = require('../assets/catalog.js');
const V = require('../assets/views.js');
const L = require('../lib/locations.js');
const { SITE, CATS, P, FREE_OVER, STD_FEE } = C;
const { esc, url, fmt, bySlug, catOf, ic } = V;

const SHELL = fs.readFileSync(path.join(__dirname, '..', 'templates', 'shell.html'), 'utf8');
const VERSION = '8';
const DEFAULT_DESC = 'The art of having everything. Anything you need, in one place, at your door: drones, electronics, fashion, home and beauty. Free delivery over ₹499, free returns for 30 days, cash on delivery.';

function headHtml(h) {
  const title = esc(h.title || 'Shopeiz | The art of having everything');
  const desc = esc(h.description || DEFAULT_DESC);
  const canon = h.canonical ? SITE + h.canonical : null;
  const img = h.image ? (h.image.startsWith('http') ? h.image : SITE + h.image) : SITE + '/assets/drones/t7-pro.png';
  const ld = (h.ld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<title>${title}</title>
<meta name="description" content="${desc}">
${h.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
${canon ? `<link rel="canonical" href="${canon}">\n<link rel="alternate" hreflang="en-IN" href="${canon}">\n<link rel="alternate" hreflang="x-default" href="${canon}">` : ''}
<meta name="theme-color" content="#6D001A">
<meta property="og:site_name" content="Shopeiz">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
<meta property="og:type" content="${h.ogType || 'website'}">
${canon ? `<meta property="og:url" content="${canon}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta property="og:locale" content="en_IN">
${ld}`;
}

function nav(active) {
  const items = [['all', 'Shop all'], ...CATS.map((c) => [c.id, c.label]), ['deals', 'Deals']];
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
    .replace('{{FPLACES}}', L.footerPlaces())
    .replace('{{YEAR}}', String(new Date().getFullYear()))
    .replace('{{STICKY}}', sticky)
    .split('{{V}}').join(VERSION);
}

/* ---------- Structured data ---------- */
const ORG_ID = SITE + '/#organization', SITE_ID = SITE + '/#website';
const RETURN_POLICY = { '@type': 'MerchantReturnPolicy', applicableCountry: 'IN', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 30, returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/FreeReturn', refundType: 'https://schema.org/FullRefund' };
const ORG = {
  '@context': 'https://schema.org', '@type': 'OnlineStore', '@id': ORG_ID, name: 'Shopeiz', url: SITE + '/',
  logo: { '@type': 'ImageObject', url: SITE + '/assets/brand/shopeiz-logo.png', width: 512, height: 512 }, image: SITE + '/assets/brand/shopeiz-logo.png',
  slogan: 'The art of having everything.',
  description: 'Shopeiz is an online store for drones, electronics, gadgets, fashion, home and beauty, delivering across India with free delivery over ₹499, cash on delivery and 30-day free returns.',
  areaServed: { '@type': 'Country', name: 'India' }, currenciesAccepted: 'INR', paymentAccepted: 'UPI, Credit Card, Debit Card, Cash on Delivery',
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
function productLd(p) {
  const o = {
    '@context': 'https://schema.org', '@type': 'Product', '@id': SITE + url.product(p) + '#product', name: p.title, sku: p.id, description: p.desc, category: catOf(p).label + ' > ' + p.sub,
    url: SITE + url.product(p), mainEntityOfPage: { '@id': SITE + url.product(p) + '#webpage' },
    offers: {
      '@type': 'Offer', url: SITE + url.product(p), priceCurrency: 'INR', price: p.price.toFixed(2), priceValidUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10), availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
      ...(p.was ? { priceSpecification: [{ '@type': 'UnitPriceSpecification', priceType: 'https://schema.org/StrikethroughPrice', price: p.was.toFixed(2), priceCurrency: 'INR' }] } : {}),
      seller: { '@id': ORG_ID },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: p.price >= FREE_OVER ? '0' : String(STD_FEE), currency: 'INR' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: Math.max(5, p.days), unitCode: 'DAY' } },
      },
      hasMerchantReturnPolicy: RETURN_POLICY,
    },
  };
  if (p.img) o.image = [SITE + p.img];
  return o;
}

/* ---------- Routes ---------- */
function route(pathname, query) {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const home = { head: { canonical: '/', ld: [ORG, WEBSITE, webPage('WebPage', '/', 'Shopeiz | The art of having everything', DEFAULT_DESC, { about: { '@id': ORG_ID }, mainEntity: itemList(C.BEST.map((id) => P.find((p) => p.id === id)), 'Bestsellers') })] }, main: V.vHome({ placesHtml: L.homePlaces() }), view: 'home' };
  if (!parts.length) return home;

  const [a, b] = parts;
  const opts = { sub: query.get('sub') || '', sort: query.get('sort') || '' };
  const filtered = !!(opts.sub || opts.sort);

  if (a === 'shop' && !b) return { head: { title: 'Shop All Products Online | Shopeiz', description: 'Shop drones, electronics, gadgets, fashion, home and beauty online at Shopeiz. Free delivery over ₹499, cash on delivery and 30-day free returns across India.', canonical: url.shop, noindex: filtered, ld: listPage(url.shop, 'Shop all products', 'Every product at Shopeiz.', P, [['Home', '/'], ['Shop all']]) }, main: V.vList('all', null, opts), active: 'all' };
  if (a === 'deals' && !b) return { head: { title: 'Deals and Offers: Real Prices Against MRP | Shopeiz', description: 'Today\'s deals at Shopeiz: drones, headphones, laptops, tablets and more at real prices against MRP. Free delivery over ₹499 and cash on delivery.', canonical: url.deals, noindex: filtered, ld: listPage(url.deals, 'Deals and offers', 'Products priced below MRP at Shopeiz.', P.filter((p) => p.was), [['Home', '/'], ['Deals']]) }, main: V.vList('deals', null, opts), active: 'deals' };
  if (a === 'category' && b && !parts[2]) {
    const c = CATS.find((x) => x.id === b);
    if (c) return { head: { title: `Buy ${c.label} Online in India at Best Prices | Shopeiz`, description: c.seo, canonical: url.cat(c.id), noindex: filtered, ld: listPage(url.cat(c.id), `${c.label} at Shopeiz`, c.seo, P.filter((p) => p.cat === c.id), [['Home', '/'], [c.label]]) }, main: V.vList('cat', c.id, opts), active: c.id };
  }
  if (a === 'products' && b && !parts[2]) {
    const p = bySlug(b);
    if (p) {
      const c = catOf(p);
      const desc = `Buy ${p.title} online at ${fmt(p.price)}${p.was ? ` (MRP ${fmt(p.was)}, save ${V.off(p)}%)` : ''}. ${p.desc} Free delivery over ₹499, cash on delivery and 30-day free returns across India.`;
      return {
        head: { title: `${p.title}: Buy Online at ${fmt(p.price)} | Shopeiz`, description: desc.slice(0, 300), canonical: url.product(p), image: p.img, ogType: 'product', ld: [webPage('ItemPage', url.product(p), p.title, p.desc, { mainEntity: { '@id': SITE + url.product(p) + '#product' } }), productLd(p), crumbLd([['Home', '/'], [c.label, url.cat(c.id)], [p.title]])] },
        main: V.vProduct(p), active: c.id, view: 'product',
        sticky: `<div class="p">${esc(p.title)}<b>${fmt(p.price)}</b></div><button class="btn btn-dark" data-act="add" data-id="${p.id}" data-qty="1">Add to bag</button>`,
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
function sitemapIndex() {
  const n = Math.ceil(L.allPlaceUrls().length / CHUNK);
  const files = ['/sitemaps/pages.xml', ...Array.from({ length: n }, (_, i) => `/sitemaps/places-${i + 1}.xml`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map((f) => `<sitemap><loc>${SITE}${f}</loc></sitemap>`).join('\n')}\n</sitemapindex>`;
}
function urlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((u) => typeof u === 'string' ? `<url><loc>${SITE}${u}</loc></url>` : `<url><loc>${SITE}${u.loc}</loc>${u.img ? `<image:image><image:loc>${SITE}${u.img}</image:loc></image:image>` : ''}</url>`).join('\n')}\n</urlset>`;
}
function sitemap(file) {
  if (file === 'pages.xml') {
    return urlset(['/', url.shop, url.deals, ...CATS.map((c) => url.cat(c.id)), ...P.map((p) => ({ loc: url.product(p), img: p.img })), ...Object.keys(V.HELP).map(url.help), url.india]);
  }
  const m = /^places-(\d+)\.xml$/.exec(file);
  if (m) {
    const all = L.allPlaceUrls();
    const i = Number(m[1]) - 1;
    const slice = all.slice(i * CHUNK, (i + 1) * CHUNK);
    if (slice.length) return urlset(slice);
  }
  return null;
}

/* ---------- Handler ---------- */
module.exports = (req, res) => {
  const u = new URL(req.url, SITE);
  const pathname = decodeURIComponent(u.pathname);

  if (pathname === '/sitemap.xml' || pathname.startsWith('/sitemaps/')) {
    const body = pathname === '/sitemap.xml' ? sitemapIndex() : sitemap(pathname.slice('/sitemaps/'.length));
    res.statusCode = body ? 200 : 404;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.end(body || '');
  }
  // Lower-case and trailing-slash clean-up for consistent URLs
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (clean !== pathname || /[A-Z]/.test(clean)) {
    res.statusCode = 301;
    res.setHeader('Location', clean.toLowerCase() + u.search);
    return res.end();
  }

  let r;
  try { r = route(pathname, u.searchParams); } catch (e) { console.error(e); r = undefined; }
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
  res.setHeader('Cache-Control', dynamic ? 'public, s-maxage=60' : 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.end(page(r));
};
module.exports.route = route;
module.exports.page = page;
module.exports.sitemap = sitemap;
module.exports.sitemapIndex = sitemapIndex;
