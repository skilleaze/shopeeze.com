/* ============================================================
   SHOPEIZ CATALOGUE: edit products here.
   Every product automatically gets its own search-friendly page at /products/<slug>.

   Our own stock is listed below. Supplier products (Dropplier etc.) are synced into the database
   and managed from /admin.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SZ = Object.assign(root.SZ || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  const SITE = 'https://shopeiz.com';
  // Shop categories. Supplier products are sorted into these automatically; nav shows the first ones.
  const CATS = [
    { id: 'kitchen',     label: 'Kitchen',            blurb: 'Clever tools, storage and serveware for everyday cooking.', icon: 'p-pot',
      seo: 'Shop kitchen and dining products online in India: choppers, organisers, cookware, bottles and clever kitchen tools at fair prices with cash on delivery.' },
    { id: 'home',        label: 'Home & Decor',       blurb: 'Lighting, decor and home improvement that make a space feel finished.', icon: 'p-sofa',
      seo: 'Buy home decor and home improvement products online in India: lights, wall decor, bathroom fittings and more, delivered to your door with cash on delivery.' },
    { id: 'electronics', label: 'Electronics',        blurb: 'Mobile accessories, audio, chargers and smart gadgets.', icon: 'p-headphones',
      seo: 'Shop electronics and mobile accessories online in India: earbuds, speakers, chargers, power banks and smart gadgets with cash on delivery.' },
    { id: 'beauty',      label: 'Beauty & Care',      blurb: 'Personal care, grooming and wellness essentials.', icon: 'p-sparkles',
      seo: 'Buy beauty and personal care products online in India: grooming tools, hair care, massagers and bath essentials with cash on delivery.' },
    { id: 'fashion',     label: 'Fashion',            blurb: 'Bags, accessories and wardrobe pieces.', icon: 'p-shirt',
      seo: 'Online fashion shopping in India: bags, wallets, jewellery and accessories for men and women, with cash on delivery across India.' },
    { id: 'kids',        label: 'Toys & Kids',        blurb: 'Toys, games and baby essentials they will love.', icon: 'p-drone',
      seo: 'Shop toys and kids products online in India: RC toys, puzzles, games and baby essentials with cash on delivery.' },
    { id: 'drones',      label: 'Drones',             blurb: 'Foldable camera drones, ready to fly out of the box.', icon: 'p-drone', img: '/assets/drones/m3-max.png',
      seo: 'Buy camera drones online in India at the best prices. Foldable drones with dual cameras, phone and screen remotes and cash on delivery.' },
    { id: 'cleaning',    label: 'Cleaning & Storage', blurb: 'Mops, organisers and storage that keep things tidy.', icon: 'p-sofa',
      seo: 'Buy cleaning supplies and storage organisers online in India: mops, lint rollers, racks, boxes and laundry essentials with cash on delivery.' },
    { id: 'auto',        label: 'Car & Bike',         blurb: 'Accessories and tools for the road.', icon: 'p-bell',
      seo: 'Shop car and bike accessories online in India: jump starters, holders, cleaning tools and more with cash on delivery.' },
    { id: 'office',      label: 'Office & Stationery', blurb: 'Desk, study and craft essentials.', icon: 'p-laptop',
      seo: 'Buy office and stationery products online in India: desk organisers, pens, notebooks and craft supplies with cash on delivery.' },
    { id: 'sports',      label: 'Sports & Outdoors',  blurb: 'Fitness, travel and garden gear.', icon: 'p-watch',
      seo: 'Shop sports, fitness, travel and garden products online in India with cash on delivery.' },
    { id: 'tools',       label: 'Tools & Hardware',   blurb: 'Hand tools, fixings and security.', icon: 'p-bell',
      seo: 'Buy tools and hardware online in India: hand tools, tapes, locks and repair essentials with cash on delivery.' },
    { id: 'festive',     label: 'Festive & Gifts',    blurb: 'Pooja, festive decor and gifts.', icon: 'p-sparkles',
      seo: 'Shop pooja items, festive decor and gifts online in India with cash on delivery.' },
  ];
  CATS.forEach((c) => { c.tone = '#F3F3F2'; c.ink = '#070707'; });
  const NAV_CATS = ['kitchen', 'home', 'electronics', 'beauty', 'fashion', 'kids', 'drones'];

  // Our own stock (priced by hand). Supplier products come from the database.
  // cost = what we pay, price = selling price, was = MRP (optional), days = working days to deliver.
  const OWN = [
    { id: 'd4', cat: 'drones', sub: 'Camera drones', title: 'T7 Pro Drone', price: 6499, days: 5, img: '/assets/drones/t7-pro.png', tag: 'Flagship', desc: 'Our top drone, with a screen remote. Available in orange or black.' },
    { id: 'd3', cat: 'drones', sub: 'Camera drones', title: 'M3 Max', price: 1999, was: 3888, days: 5, img: '/assets/drones/m3-max.png', slug: 'm3-max-drone', desc: 'Dual-camera drone with a phone-holder remote for a live view while you fly.' },
    { id: 'd2', cat: 'drones', sub: 'Camera drones', title: 'J2 Drone', price: 1799, was: 2947, days: 5, img: '/assets/drones/j2.png', desc: 'Foldable camera drone with coloured arm lights. Comes in a black or red finish.' },
    { id: 'd1', cat: 'drones', sub: 'Camera drones', title: 'E88 Pro Drone', price: 1399, was: 2499, days: 5, img: '/assets/drones/e88-pro.png', tag: 'Best value', desc: 'Foldable camera drone with a phone-holder remote. Spare batteries, propellers and a carry case are shown in the box.' },
    { id: 's1', cat: 'auto', sub: 'Car accessories', title: 'Car Jump Starter with Tyre Inflator', cost: 1500, price: 3999, days: 5, img: '/assets/products/car-jump-starter.jpg', tag: 'Top pick', desc: 'Portable jump starter for cars and bikes with a built-in tyre inflator, digital display and clamps. Starts a flat battery without another car.' },
    { id: 's2', cat: 'cleaning', sub: 'Vacuum cleaners', title: '4-in-1 Portable Vacuum Cleaner', cost: 530, price: 1199, days: 5, img: '/assets/products/portable-vacuum-cleaner.jpg', desc: 'Cordless handheld vacuum with blower mode and a set of nozzles for the car, keyboard, sofa and corners.' },
    { id: 's3', cat: 'kids', sub: 'RC toys', title: 'RC Fighter Jet with Lights', cost: 570, price: 999, days: 5, img: '/assets/products/rc-jet.jpg', desc: 'Remote-controlled stunt jet with LED lights and a two-stick controller. A fun first flyer for kids and adults.' },
    { id: 's4', cat: 'electronics', sub: 'Phone accessories', title: 'Smart Auto Power Disconnector', cost: 330, price: 574, days: 5, img: '/assets/products/smart-auto-power-disconnector.jpg', desc: 'Plugs in between your charger and phone and cuts the power when the battery is full, to protect battery health overnight.' },
    { id: 's5', cat: 'electronics', sub: 'Power', title: 'Portable Power Inverter with Battery', cost: 1300, price: 2385, days: 5, img: '/assets/products/portable-inverter.jpg', desc: 'Portable inverter and battery adapter kit with sockets and USB ports for power on the go, at home or outdoors.' },
    { id: 's6', cat: 'sports', sub: 'Travel', title: 'Foldable Steel Glass, 150 ml', cost: 70, price: 178, days: 5, img: '/assets/products/foldable-steel-glass.jpg', desc: 'Collapsible stainless steel travel cup with a lid and key ring. Folds flat into your pocket or bag.' },
    { id: 's7', cat: 'sports', sub: 'Bottles', title: 'Collapsible Silicone Water Bottle, 600 ml', cost: 102, price: 233, days: 5, img: '/assets/products/silicone-folding-bottle.jpg', desc: 'Food-grade silicone bottle that rolls up when empty. Light for travel, gym and school.' },
    { id: 's8', cat: 'fashion', sub: 'Bags', title: 'PU Leather Smart Sling Bag', cost: 225, price: 449, days: 5, img: '/assets/products/pu-leather-sling-bag.jpg', desc: 'Slim crossbody sling bag in PU leather with a combination lock and a USB port for charging on the move.' },
    { id: 's9', cat: 'cleaning', sub: 'Laundry', title: 'Stainless Steel Cloth Drying Rope, 10 m', cost: 60, price: 199, days: 5, img: '/assets/products/steel-cloth-drying-rope.jpg', desc: 'Heavy-duty 10 metre stainless steel clothesline with hooks, for balconies, terraces and outdoors. Rust resistant.' },
    { id: 's10', cat: 'kitchen', sub: 'Gas stove accessories', title: 'Gas Stove Burner Stand', cost: 136, price: 299, days: 5, img: '/assets/products/gas-stove-burner-stand.jpg', desc: 'Windproof burner stand that focuses the flame on your pan, saving gas and keeping small pots steady.' },
    { id: 's11', cat: 'home', sub: 'Pet supplies', title: 'Cat Dancing Ball Toy', cost: 70, price: 230, days: 5, img: '/assets/products/cat-dancing-ball.jpg', desc: 'Bouncing ball on a rope toy that keeps cats and small dogs chasing and playing.' },
    { id: 's12', cat: 'cleaning', sub: 'Lint removers', title: 'Mini Lint Roller', cost: 35, price: 169, days: 5, img: '/assets/products/mini-lint-roller.jpg', desc: 'Reusable, washable lint roller for clothes, sofas and car seats. Picks up hair, lint, dust and crumbs.' },
    { id: 's13', cat: 'kids', sub: 'Toy guns', title: 'Automatic Gel Blaster Toy Gun', cost: 380, price: 840, days: 5, img: '/assets/products/gel-blaster-toy-gun.jpg', desc: 'Automatic gel ball blaster with goggles and water gel beads. For outdoor play with adult supervision.' },
  ];
  OWN.forEach((p) => { p.supplier = 'own'; p.available = true; p.cod = true; });
  // P is the live product list. On the server it is refilled from the database; in the browser it holds our own stock.
  const P = OWN.slice();
  const HERO = ['d4', 'd3', 'd1', 'd2'];
  const BEST = ['s1', 'd3', 's2', 's12', 's8', 'd1', 's3', 's10'];
  const FREE_OVER = 499, STD_FEE = 40, EXP_FEE = 0, COD_FEE = 49;
  const PROMO = { code: 'SZWELCOME', pct: 10 };
  const POLICY = { minDays: 6, maxDays: 10, ownMax: 5, replaceDays: 7 };

  const slugify = (s) => String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  OWN.forEach((p) => { p.slug = p.slug || slugify(p.title); });

  return { SITE, CATS, NAV_CATS, OWN, P, HERO, BEST, FREE_OVER, STD_FEE, EXP_FEE, COD_FEE, PROMO, POLICY, slugify };
});
