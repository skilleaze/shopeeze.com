/* Location pages: "Online shopping in <town>", district, state and all-India pages.
   Built from data/ (India Post PIN code directory). Every page uses that place's own data:
   PIN codes, villages and localities served, taluk, district, nearby towns, state language
   and festivals, with wording that varies from page to page. */
const fs = require('fs');
const path = require('path');
const C = require('../assets/catalog.js');
const V = require('../assets/views.js');
const { fmt, esc, ic, url, gridOf, crumbs, byId } = V;
const { P, CATS, FREE_OVER, STD_FEE, EXP_FEE, COD_FEE, SITE } = C;

const DATA = path.join(__dirname, '..', 'data');
const index = JSON.parse(fs.readFileSync(path.join(DATA, 'index.json'), 'utf8'));
const stateCache = {};
function loadState(slug) {
  if (!stateCache[slug]) {
    const s = JSON.parse(fs.readFileSync(path.join(DATA, 'states', slug + '.json'), 'utf8'));
    s.bySlug = Object.fromEntries(s.towns.map((t) => [t.s, t]));
    s.byDistrict = {};
    s.towns.forEach((t) => (s.byDistrict[t.d] = s.byDistrict[t.d] || []).push(t));
    stateCache[slug] = s;
  }
  return stateCache[slug];
}

// State and district addresses (avoid clashing with a town of the same name)
const stateUrlSlug = {}, stateBySlug = {}, districtBySlug = {};
index.states.forEach((s) => {
  const u = index.towns[s.slug] ? s.slug + '-state' : s.slug;
  stateUrlSlug[s.slug] = u;
  stateBySlug[u] = s;
  s.districts.forEach((d) => (districtBySlug[d.slug] = { d, s }));
});
const stateUrl = (slug) => url.place(stateUrlSlug[slug]);

const POPULAR = ['mangalore', 'puttur', 'vitla', 'udupi', 'bengaluru', 'mysuru', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kochi', 'kozhikode', 'thiruvananthapuram', 'coimbatore', 'indore', 'bhopal', 'patna', 'chandigarh', 'guwahati']
  .filter((s) => index.towns[s]);
function townName(slug) { const st = index.towns[slug]; const t = st && loadState(st).bySlug[slug]; return t ? t.n : slug; }

/* ---------- deterministic variation ---------- */
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let x = seed || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; }
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function shuffle(r, arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const list = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const plural = (n, w) => `${n.toLocaleString('en-IN')} ${w}${n === 1 ? '' : 's'}`;

/* ---------- shared bits ---------- */
function featured(r, n = 8) {
  const drones = P.filter((p) => p.cat === 'drones');
  const rest = shuffle(r, P.filter((p) => p.cat !== 'drones'));
  return shuffle(r, shuffle(r, drones).slice(0, 2).concat(rest.slice(0, n - 2)));
}
const catLinks = (r) => shuffle(r, CATS).map((c) => `<a href="${url.cat(c.id)}">${c.label}</a>`).join('');
function faqHtml(items) {
  return `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)} ${ic('i-down')}</summary><div class="a">${a}</div></details>`).join('')}</div>`;
}
function faqLd(items) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) };
}
function crumbLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: href ? SITE + href : undefined })) };
}

/* ---------- Town page ---------- */
function townPage(slug) {
  const stSlug = index.towns[slug];
  if (!stSlug) return null;
  const S = loadState(stSlug);
  const t = S.bySlug[slug];
  const dist = S.districts.find((d) => d.slug === t.d);
  const r = rng(hash(slug));
  const n = t.n, dn = t.dn, st = S.name;
  const taluk = (t.t && t.t[0]) || '';
  const nameFull = t.alt ? `${n} (${t.alt})` : n;
  const pins = t.p, pinTxt = pins.length > 1 ? `PIN codes ${list(pins.slice(0, 6))}${pins.length > 6 ? ' and more' : ''}` : `PIN code ${pins[0]}`;
  const fest = shuffle(r, S.festivals);
  const areas = t.v;
  const sameDist = (S.byDistrict[t.d] || []).filter((o) => o.s !== slug);
  const sameTaluk = sameDist.filter((o) => taluk && o.t && o.t.includes(taluk));
  const nearby = shuffle(r, sameTaluk).slice(0, 14).concat(shuffle(r, sameDist.filter((o) => !sameTaluk.includes(o))).slice(0, 24 - Math.min(14, sameTaluk.length)));
  const areaLinks = areas.map((a) => { const o = sameDist.find((x) => x.n === a); return o ? `<a href="${url.place(o.s)}">${esc(a)}</a>` : esc(a); });
  const twins = t.dup ? Object.keys(index.towns).filter((k) => k !== slug && (k === C.slugify(n) || k.startsWith(C.slugify(n) + '-'))).filter((k) => townName(k) === n).slice(0, 8) : [];

  const leads = [
    `Anything you need, in one place, delivered to your door in ${nameFull}. Drones, electronics, gadgets, fashion, home and beauty, with free delivery over ${fmt(FREE_OVER)} and cash on delivery.`,
    `Shopeiz brings the whole store to ${nameFull}, ${dn}. Order online, pay by UPI, card or cash when it arrives, and return anything free for 30 days.`,
    `Shop online from ${nameFull} without the trip to town. Fair prices on drones, headphones, laptops, fashion and home essentials, delivered across ${dn} district.`,
    `The art of having everything, now in ${nameFull}. Browse drones, tech, fashion, home and beauty, then have it delivered to your door${pins.length > 1 ? ` anywhere across ${pins.length} PIN codes` : ` at PIN code ${pins[0]}`}.`,
    `Online shopping in ${nameFull} made simple: one store for gadgets, electronics, fashion, home and beauty, with free delivery over ${fmt(FREE_OVER)} and free returns for 30 days.`,
  ];
  const deliveryP = [
    `We deliver to ${n} and the surrounding ${taluk ? taluk + ' taluk' : dn + ' district'} on ${pinTxt}. Most orders arrive within 1 to 5 working days, and the exact date for your order is shown on each product page and at checkout before you pay.`,
    `Orders to ${n} (${pinTxt}) usually reach your door in 1 to 5 working days. Standard delivery is free on orders over ${fmt(FREE_OVER)}; below that it costs ${fmt(STD_FEE)}. Need it sooner? Express delivery is ${fmt(EXP_FEE)}.`,
    `Shopeiz ships to every address in ${n}, covering ${pinTxt}. Enter your PIN code at checkout and you'll see when your parcel will arrive, usually within 1 to 5 working days.`,
    `From the ${n} post office area to the villages around it, Shopeiz delivers to ${pinTxt} in ${dn}. Expect your order in 1 to 5 working days, with free standard delivery over ${fmt(FREE_OVER)}.`,
  ];
  const payP = [
    `Pay the way that suits you in ${n}: UPI (Google Pay, PhonePe, Paytm), debit or credit card, or cash on delivery for a small ${fmt(COD_FEE)} fee. All prices include GST.`,
    `Cash on delivery is available across ${n} and ${dn}. Prefer to pay online? UPI and all major cards work at checkout, and every price you see already includes GST.`,
    `Not sure yet? Choose cash on delivery and pay when your order reaches ${n}. You can also pay by UPI or card. If something isn't right, returns are free for 30 days.`,
  ];
  const regionP = [
    `Shopping for ${fest[0]}${fest[1] ? ' or ' + fest[1] : ''}? Order early and Shopeiz will deliver gifts and essentials to ${n} in good time. Our pages are in English; delivery partners across ${st} are used to addresses written in ${S.lang} too.`,
    `Across ${st}, from ${S.capital} to ${n}, people use Shopeiz for everyday essentials and gifts for ${list(fest.slice(0, 2))}. Write your address the way you normally would, in English or with local landmarks.`,
    `Whether it's a new phone before ${fest[0]}, a drone for a birthday or a casserole for family meals, ${n} gets the same prices as every other city in India. No local markup, no hidden delivery charges over ${fmt(FREE_OVER)}.`,
  ];
  const whyP = [
    `${n} has local shops for daily needs, but some things are easier to find online: a camera drone, noise-cancelling headphones or a laptop with the right specs. Shopeiz keeps a short, carefully chosen range so you don't have to compare a hundred listings.`,
    `Why order online in ${n}? You see the full price including GST before you pay, you get a delivery date up front, and if it isn't right you can send it back free within 30 days.`,
    `Shopeiz is built on four promises: choice, trust, speed and fair price. For shoppers in ${n} that means verified products, secure checkout, quick delivery to ${dn} and real deals instead of fake discounts.`,
  ];
  const q = (opts) => pick(r, opts);
  const faq = [
    [q([`Does Shopeiz deliver to ${n}?`, `Can I order online from Shopeiz in ${n}?`, `Is home delivery available in ${n}?`]),
      `Yes. Shopeiz delivers to ${n} in ${dn} district, ${st}, covering ${pinTxt}${areas.length ? `, including ${list(areas.slice(0, 4))}` : ''}.`],
    [q([`How long does delivery to ${n} take?`, `When will my order reach ${n}?`, `What is the delivery time for ${n}?`]),
      `Most orders reach ${n} in 1 to 5 working days. The exact delivery date is shown on the product page and at checkout. Express delivery is available for ${fmt(EXP_FEE)}.`],
    [q([`Is cash on delivery available in ${n}?`, `Can I pay cash on delivery in ${n}?`, `Does Shopeiz offer COD in ${n}?`]),
      `Yes, cash on delivery is available in ${n} for a ${fmt(COD_FEE)} fee. You can also pay by UPI, debit card or credit card.`],
    [q([`Is delivery free in ${n}?`, `How much does delivery to ${n} cost?`]),
      `Standard delivery to ${n} is free on orders over ${fmt(FREE_OVER)}. Below that it costs ${fmt(STD_FEE)}.`],
    [q([`How do returns work in ${n}?`, `Can I return a product in ${n}?`]),
      `Returns are free within 30 days of delivery. We collect from your address in ${n} and refund your original payment method; cash-on-delivery orders are refunded by UPI or bank transfer.`],
  ];
  const lead = pick(r, leads);
  const head = {
    title: `Online Shopping in ${n}${t.dup ? ', ' + dn : ''} | Free Delivery and COD | Shopeiz`,
    description: `Online shopping in ${n}, ${dn} (${st}) with Shopeiz. Drones, electronics, fashion, home and beauty. Free delivery over ₹499, cash on delivery, 30-day returns. ${pinTxt}.`.slice(0, 300),
    canonical: url.place(slug),
    ld: [crumbLd([['Home', '/'], ['India', url.india], [st, stateUrl(stSlug)], [dn, url.place(t.d)], [n]]), faqLd(faq)],
  };
  const sections = shuffle(r, ['why', 'region']);
  const extra = { why: `<p>${pick(r, whyP)}</p>`, region: `<p>${pick(r, regionP)}</p>` };
  const main = `
  <section class="loc-hero"><div class="wrap">
    <div>
      ${crumbs([['Home', '/'], ['India', url.india], [st, stateUrl(stSlug)], [dn, url.place(t.d)], [n]])}
      <h1>Online shopping in <em>${esc(n)}</em></h1>
      <p class="lead">${esc(lead)}</p>
      <div class="ctas" style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-wine" href="${url.shop}">Shop all ${ic('i-arrow')}</a><a class="btn btn-line" href="${url.cat('drones')}">Shop drones</a></div>
    </div>
    <dl class="loc-facts">
      <div><dt>Town</dt><dd>${esc(nameFull)}</dd></div>
      ${taluk ? `<div><dt>Taluk</dt><dd>${esc(taluk)}</dd></div>` : ''}
      <div><dt>District</dt><dd><a href="${url.place(t.d)}">${esc(dn)}</a></dd></div>
      <div><dt>State</dt><dd><a href="${stateUrl(stSlug)}">${esc(st)}</a></dd></div>
      <div><dt>${pins.length > 1 ? 'PIN codes' : 'PIN code'}</dt><dd>${pins.length > 1 ? plural(pins.length, 'PIN') : pins[0]}</dd></div>
      <div><dt>Delivery</dt><dd>1 to 5 working days</dd></div>
      <div><dt>Cash on delivery</dt><dd>Available</dd></div>
    </dl>
  </div></section>

  <section class="block"><div class="wrap two-col">
    <div class="prose">
      <h2>Delivery to ${esc(n)}</h2>
      <p>${esc(pick(r, deliveryP))}</p>
      <div class="pins" aria-label="PIN codes">${pins.map((p) => `<span>${p}</span>`).join('')}</div>
      <p>${esc(pick(r, payP))}</p>
      ${sections.map((k) => extra[k]).join('')}
      ${twins.length ? `<p>Looking for another ${esc(n)}? ${twins.map((k) => { const ts = index.towns[k]; const o = loadState(ts).bySlug[k]; return `<a class="link" href="${url.place(k)}">${esc(n)}, ${esc(o.dn)}</a>`; }).join(' · ')}</p>` : ''}
    </div>
    <aside class="side-box">
      <h3>Shop by category</h3>
      <div class="popular" style="margin-bottom:22px">${catLinks(r)}</div>
      <h3>Why Shopeiz</h3>
      <p style="margin:0 0 6px">${ic('i-truck')} Free delivery over ${fmt(FREE_OVER)}</p>
      <p style="margin:0 0 6px">${ic('i-cash')} Cash on delivery</p>
      <p style="margin:0 0 6px">${ic('i-return')} Free returns for 30 days</p>
      <p style="margin:0">${ic('i-shield')} Secure UPI and card checkout</p>
    </aside>
  </div></section>

  <section class="block" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Delivered to ${esc(n)}</span><h2>${pick(r, ['Shop online, delivered to your door', 'Our bestsellers, at your door', 'Order today, delivered to ' + esc(n)])}</h2></div><a class="link" href="${url.shop}">Shop all ${ic('i-arrow')}</a></div>
    ${gridOf(featured(r))}
  </div></section>

  ${areas.length ? `<section class="block" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">${plural(t.vn, 'area')} covered</span><h2>${pick(r, ['Villages and localities we deliver to', 'Areas around ' + esc(n) + ' we deliver to', 'Delivering across ' + esc(n) + ' and nearby'])}</h2></div></div>
    <ul class="areas">${areaLinks.map((a) => `<li>${a}</li>`).join('')}</ul>
    ${t.vn > areas.length ? `<p style="color:var(--muted);font-size:14px;margin-top:14px">And ${t.vn - areas.length} more villages served by the ${esc(n)} post office.</p>` : ''}
  </div></section>` : ''}

  <section class="block" style="padding-top:0"><div class="wrap two-col">
    <div><div class="sec-head" style="margin-bottom:18px"><div><span class="eyebrow">Questions</span><h2>Shopping online in ${esc(n)}</h2></div></div>${faqHtml(faq)}</div>
    <aside>
      <div class="sec-head" style="margin-bottom:18px"><div><span class="eyebrow">Nearby</span><h2 style="font-size:32px">Also delivering to</h2></div></div>
      <ul class="areas" style="columns:2 140px">${nearby.map((o) => `<li><a href="${url.place(o.s)}">${esc(o.n)}</a></li>`).join('')}</ul>
      <p style="margin-top:18px"><a class="link" href="${url.place(t.d)}">All of ${esc(dn)} district ${ic('i-arrow')}</a></p>
    </aside>
  </div></section>`;
  return { head, main };
}

/* ---------- District page ---------- */
function districtPage(slug) {
  const hit = districtBySlug[slug];
  if (!hit) return null;
  const { d, s } = hit;
  const S = loadState(s.slug);
  const towns = (S.byDistrict[d.slug] || []).slice().sort((a, b) => a.n.localeCompare(b.n));
  const r = rng(hash(slug));
  const pins = [...new Set(towns.flatMap((t) => t.p))].sort();
  const big = towns.filter((t) => t.ho).map((t) => t.n);
  const letters = [...new Set(towns.map((t) => t.n[0].toUpperCase()))];
  const faq = [
    [`Does Shopeiz deliver across ${d.name} district?`, `Yes. Shopeiz delivers to all ${plural(towns.length, 'town')} and locality in ${d.name}, covering ${plural(pins.length, 'PIN code')}.`],
    [`How long does delivery take in ${d.name}?`, `Most orders arrive within 1 to 5 working days. The exact date is shown on each product page and at checkout.`],
    [`Is cash on delivery available in ${d.name}?`, `Yes, cash on delivery is available everywhere in ${d.name} for a ${fmt(COD_FEE)} fee.`],
  ];
  const head = {
    title: `Online Shopping in ${d.name} District, ${s.name} | Shopeiz`,
    description: `Online shopping across ${d.name} district, ${s.name}: delivery to ${towns.length} towns and ${pins.length} PIN codes. Free delivery over ₹499, cash on delivery, 30-day free returns.`,
    canonical: url.place(slug),
    ld: [crumbLd([['Home', '/'], ['India', url.india], [s.name, stateUrl(s.slug)], [d.name + ' district']]), faqLd(faq)],
  };
  const main = `
  <section class="loc-hero"><div class="wrap">
    <div>
      ${crumbs([['Home', '/'], ['India', url.india], [s.name, stateUrl(s.slug)], [d.name + ' district']])}
      <h1>Online shopping in <em>${esc(d.name)}</em> district</h1>
      <p class="lead">${esc(pick(r, [
        `Shopeiz delivers to every town and village in ${d.name}, ${s.name}. Find your town below for delivery details, PIN codes and areas covered.`,
        `From ${list(shuffle(r, big.length ? big : towns.map((t) => t.n)).slice(0, 3))} to the smallest village post office, Shopeiz delivers across ${d.name} district with cash on delivery and free returns.`,
        `Anything you need, in one place, at your door anywhere in ${d.name}. Choose your town to see local delivery information.`]))}</p>
    </div>
    <dl class="loc-facts">
      <div><dt>District</dt><dd>${esc(d.name)}</dd></div>
      <div><dt>State</dt><dd><a href="${stateUrl(s.slug)}">${esc(s.name)}</a></dd></div>
      <div><dt>Towns and localities</dt><dd>${towns.length.toLocaleString('en-IN')}</dd></div>
      <div><dt>PIN codes</dt><dd>${pins.length.toLocaleString('en-IN')}</dd></div>
      <div><dt>Cash on delivery</dt><dd>Available</dd></div>
    </dl>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">${plural(towns.length, 'place')}</span><h2>Choose your town in ${esc(d.name)}</h2></div></div>
    ${letters.length > 6 ? `<div class="az">${letters.map((l) => `<a href="#l-${l}">${l}</a>`).join('')}</div>` : ''}
    ${letters.map((l) => `${letters.length > 6 ? `<div class="letter" id="l-${l}">${l}</div>` : ''}<ul class="place-cols">${towns.filter((t) => t.n[0].toUpperCase() === l).map((t) => `<li><a href="${url.place(t.s)}">${esc(t.n)}</a><small>${t.p[0]}</small></li>`).join('')}</ul>`).join('')}
  </div></section>
  <section class="block" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Delivered across ${esc(d.name)}</span><h2>Shop the bestsellers</h2></div><a class="link" href="${url.shop}">Shop all ${ic('i-arrow')}</a></div>
    ${gridOf(featured(r))}
  </div></section>
  <section class="block" style="padding-top:0"><div class="wrap two-col"><div>${faqHtml(faq)}</div><aside class="side-box"><h3>Other districts in ${esc(s.name)}</h3><ul class="areas" style="columns:2 140px">${s.districts.filter((x) => x.slug !== slug).map((x) => `<li><a href="${url.place(x.slug)}">${esc(x.name)}</a></li>`).join('')}</ul></aside></div></section>`;
  return { head, main };
}

/* ---------- State page ---------- */
function statePage(urlSlug) {
  const s = stateBySlug[urlSlug];
  if (!s) return null;
  const S = loadState(s.slug);
  const r = rng(hash(urlSlug));
  const big = S.towns.filter((t) => t.ho).sort((a, b) => b.vn - a.vn).slice(0, 40).sort((a, b) => a.n.localeCompare(b.n));
  const head = {
    title: `Online Shopping in ${s.name} | Free Delivery and COD | Shopeiz`,
    description: `Online shopping in ${s.name}: Shopeiz delivers to ${S.towns.length.toLocaleString('en-IN')} towns across ${s.districts.length} districts. Free delivery over ₹499, cash on delivery and 30-day free returns.`,
    canonical: stateUrl(s.slug),
    ld: [crumbLd([['Home', '/'], ['India', url.india], [s.name]])],
  };
  const main = `
  <section class="loc-hero"><div class="wrap">
    <div>
      ${crumbs([['Home', '/'], ['India', url.india], [s.name]])}
      <h1>Online shopping in <em>${esc(s.name)}</em></h1>
      <p class="lead">${esc(`From ${S.capital || big[0]?.n || s.name} to every district post office, Shopeiz delivers drones, electronics, fashion, home and beauty across ${s.name}. ${pick(r, ['Free delivery over ' + fmt(FREE_OVER) + ', cash on delivery and free returns for 30 days.', 'Pay by UPI, card or cash on delivery, with free returns for 30 days.'])}`)}</p>
    </div>
    <dl class="loc-facts">
      <div><dt>Districts</dt><dd>${s.districts.length}</dd></div>
      <div><dt>Towns and localities</dt><dd>${S.towns.length.toLocaleString('en-IN')}</dd></div>
      <div><dt>Language</dt><dd>${esc(S.lang)}</dd></div>
      <div><dt>Cash on delivery</dt><dd>Available</dd></div>
    </dl>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">${plural(s.districts.length, 'district')}</span><h2>Choose your district</h2></div></div>
    <ul class="place-cols">${s.districts.map((d) => `<li><a href="${url.place(d.slug)}">${esc(d.name)}</a><small>${d.towns} places</small></li>`).join('')}</ul>
  </div></section>
  ${big.length ? `<section class="block" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Main towns</span><h2>Popular towns in ${esc(s.name)}</h2></div></div>
    <div class="popular">${big.map((t) => `<a href="${url.place(t.s)}">${esc(t.n)}</a>`).join('')}</div>
  </div></section>` : ''}
  <section class="block" style="padding-top:0"><div class="wrap">
    <div class="prose" style="margin-bottom:40px"><h2>Shopping for ${esc(list(S.festivals.slice(0, 2)))}?</h2><p>${esc(`Order early for ${list(S.festivals)} and Shopeiz will deliver anywhere in ${s.name}. Write your address in English with local landmarks; our delivery partners know ${s.name} well.`)}</p></div>
    <div class="sec-head"><div><span class="eyebrow">Delivered across ${esc(s.name)}</span><h2>Shop the bestsellers</h2></div><a class="link" href="${url.shop}">Shop all ${ic('i-arrow')}</a></div>
    ${gridOf(featured(r))}
  </div></section>`;
  return { head, main };
}

/* ---------- All India ---------- */
function indiaPage() {
  const total = Object.keys(index.towns).length;
  const head = {
    title: 'Online Shopping in India | Delivery to Every State | Shopeiz',
    description: `Shopeiz delivers across India: ${total.toLocaleString('en-IN')} towns in ${index.states.length} states and union territories. Free delivery over ₹499, cash on delivery and 30-day free returns.`,
    canonical: url.india,
    ld: [crumbLd([['Home', '/'], ['India']])],
  };
  const main = `
  <section class="loc-hero"><div class="wrap">
    <div>
      ${crumbs([['Home', '/'], ['Delivery across India']])}
      <h1>Online shopping across <em>India</em></h1>
      <p class="lead">The art of having everything, delivered to ${total.toLocaleString('en-IN')} towns and cities. Choose your state, then your district and town, for local delivery details and PIN codes.</p>
    </div>
    <dl class="loc-facts">
      <div><dt>States and union territories</dt><dd>${index.states.length}</dd></div>
      <div><dt>Towns and localities</dt><dd>${total.toLocaleString('en-IN')}</dd></div>
      <div><dt>Free delivery</dt><dd>Over ${fmt(FREE_OVER)}</dd></div>
      <div><dt>Cash on delivery</dt><dd>Available</dd></div>
    </dl>
  </div></section>
  <section class="block"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Popular</span><h2>Popular cities and towns</h2></div></div>
    <div class="popular">${POPULAR.map((p) => `<a href="${url.place(p)}">${esc(townName(p))}</a>`).join('')}</div>
  </div></section>
  <section class="block" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">${index.states.length} states and union territories</span><h2>Choose your state</h2></div></div>
    <ul class="place-cols">${index.states.map((s) => `<li><a href="${stateUrl(s.slug)}">${esc(s.name)}</a><small>${s.towns.toLocaleString('en-IN')}</small></li>`).join('')}</ul>
  </div></section>`;
  return { head, main };
}

/* ---------- Router + helpers ---------- */
function placePage(slug) {
  if (index.aliases[slug]) return { redirect: url.place(index.aliases[slug]) };
  if (index.towns[slug]) return townPage(slug);
  if (stateBySlug[slug]) return statePage(slug);
  if (districtBySlug[slug]) return districtPage(slug);
  return null;
}
function homePlaces() {
  return `<section class="block" style="padding-top:0"><div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Delivering across India</span><h2>Online shopping near you</h2></div><a class="link" href="${url.india}">All ${Object.keys(index.towns).length.toLocaleString('en-IN')} towns ${ic('i-arrow')}</a></div>
    <div class="popular">${POPULAR.map((p) => `<a href="${url.place(p)}">Online shopping in ${esc(townName(p))}</a>`).join('')}</div>
  </div></section>`;
}
function footerPlaces() {
  return `<div class="fplaces"><b>Delivering to</b>${POPULAR.slice(0, 14).map((p) => `<a href="${url.place(p)}">${esc(townName(p))}</a>`).join('')}<a href="${url.india}">All India</a></div>`;
}
function allPlaceUrls() {
  const out = [url.india];
  index.states.forEach((s) => { out.push(stateUrl(s.slug)); s.districts.forEach((d) => out.push(url.place(d.slug))); });
  Object.keys(index.towns).sort().forEach((t) => out.push(url.place(t)));
  return out;
}

module.exports = { placePage, indiaPage, homePlaces, footerPlaces, allPlaceUrls };
