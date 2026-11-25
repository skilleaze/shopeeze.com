/* ============================================================
   SHOPEIZ CATALOGUE: edit products here.
   Every product automatically gets its own search-friendly page at /products/<slug>.

   price = selling price, was = MRP (optional), img = photo path (optional),
   days = delivery estimate in days, slug = page address (optional, made from the title).
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SZ = Object.assign(root.SZ || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  const SITE = 'https://shopeiz.com';
  const CATS = [
    { id: 'drones',      label: 'Drones',      blurb: 'Foldable camera drones, ready to fly out of the box.', icon: 'p-drone',      tone: '#F3F3F2', ink: '#070707', img: '/assets/drones/m3-max.png',
      seo: 'Buy camera drones online in India at the best prices. Foldable drones with dual cameras, phone and screen remotes, free delivery over ₹499 and cash on delivery.' },
    { id: 'electronics', label: 'Electronics', blurb: 'Sound, smartphones and smart-home tech that just works.', icon: 'p-headphones', tone: '#F3F3F2', ink: '#070707',
      seo: 'Shop electronics online in India: headphones, smartphones and smart-home devices at fair prices with free delivery over ₹499 and cash on delivery.' },
    { id: 'gadgets',     label: 'Gadgets',     blurb: 'Laptops, tablets and wearables for work and play.',      icon: 'p-laptop',     tone: '#F3F3F2', ink: '#070707',
      seo: 'Buy gadgets online in India: laptops, tablets and fitness watches with no-cost EMI, free delivery and 30-day free returns.' },
    { id: 'fashion',     label: 'Fashion',     blurb: 'Wardrobe staples in honest materials.',                  icon: 'p-shirt',      tone: '#F3F3F2', ink: '#070707',
      seo: 'Online fashion shopping in India: everyday clothing and leather bags for men and women, cash on delivery and free returns for 30 days.' },
    { id: 'home',        label: 'Home',        blurb: 'Pieces that make home feel finished.',                   icon: 'p-sofa',       tone: '#F3F3F2', ink: '#070707',
      seo: 'Shop home and kitchen online in India: sofas, cast iron cookware and more, delivered to your door with free returns for 30 days.' },
    { id: 'beauty',      label: 'Beauty',      blurb: 'Everyday skin and hair care, gently made.',              icon: 'p-sparkles',   tone: '#F3F3F2', ink: '#070707',
      seo: 'Buy beauty products online in India: moisturiser with SPF, shampoo and everyday skin and hair care with free delivery over ₹499.' },
  ];
  const P = [
    { id: 'd4', cat: 'drones', sub: 'Camera drones', title: 'T7 Pro Drone', price: 6499, days: 3, img: '/assets/drones/t7-pro.png', tag: 'Flagship', desc: 'Our top drone, with a screen remote. Available in orange or black.', specs: 'Full specifications from the seller to be added.' },
    { id: 'd3', cat: 'drones', sub: 'Camera drones', title: 'M3 Max', price: 1999, was: 3888, days: 3, img: '/assets/drones/m3-max.png', slug: 'm3-max-drone', desc: 'Dual-camera drone with a phone-holder remote for a live view while you fly.', specs: 'Full specifications from the seller to be added.' },
    { id: 'd2', cat: 'drones', sub: 'Camera drones', title: 'J2 Drone', price: 1799, was: 2947, days: 3, img: '/assets/drones/j2.png', desc: 'Foldable camera drone with coloured arm lights. Comes in a black or red finish.', specs: 'Full specifications from the seller to be added.' },
    { id: 'd1', cat: 'drones', sub: 'Camera drones', title: 'E88 Pro Drone', price: 1399, was: 2499, days: 3, img: '/assets/drones/e88-pro.png', tag: 'Best value', desc: 'Foldable camera drone with a phone-holder remote. Spare batteries, propellers and a carry case are shown in the box.', specs: 'Full specifications from the seller to be added.' },
    { id: 'p1', cat: 'electronics', sub: 'Audio', title: 'Wireless Noise-Cancelling Headphones', price: 8999, was: 11999, days: 1, icon: 'p-headphones', rating: 4.7, reviews: 128, desc: 'Thirty hours of battery, fast charging and active noise cancelling that adapts to where you are. Folds flat into the case included.', specs: 'Battery: 30 h · Charging: USB-C, 10 min = 5 h · Weight: 250 g · Bluetooth 5.3' },
    { id: 'p2', cat: 'electronics', sub: 'Phones', title: 'Smartphone 128 GB, Graphite', price: 29999, days: 3, icon: 'p-phone', rating: 4.6, reviews: 342, desc: 'A 6.1-inch display, a camera that handles low light, and a battery that lasts a full day of real use.', specs: 'Storage: 128 GB · Display: 6.1 in OLED · Camera: 48 MP · Dual SIM' },
    { id: 'p11', cat: 'electronics', sub: 'Smart home', title: 'Video Doorbell with Chime', price: 6999, days: 1, icon: 'p-bell', rating: 4.4, reviews: 211, desc: 'See who is at the door from your phone. Wired or battery, with a plug-in chime for inside.', specs: 'Video: 1080p HD · Night vision · Battery: 6 months · Works with Wi-Fi 2.4 GHz' },
    { id: 'p3', cat: 'gadgets', sub: 'Tablets', title: '11-inch Tablet with Keyboard Case', price: 44999, was: 51999, days: 3, icon: 'p-tablet', rating: 4.5, reviews: 87, desc: 'Light enough to carry all day, with a keyboard case that turns it into a laptop for email and documents.', specs: 'Display: 11 in · Storage: 256 GB · Battery: 10 h · Weight: 470 g' },
    { id: 'p6', cat: 'gadgets', sub: 'Laptops', title: '14-inch Laptop, 16 GB RAM', price: 74999, was: 84999, days: 3, icon: 'p-laptop', rating: 4.6, reviews: 203, desc: 'Fast enough for editing photos and quiet enough for a library. All-day battery and a sharp 14-inch screen.', specs: 'Memory: 16 GB · Storage: 512 GB SSD · Display: 14 in 2.8K · Weight: 1.3 kg' },
    { id: 'p12', cat: 'gadgets', sub: 'Wearables', title: 'Fitness Watch with GPS', price: 12999, was: 15999, days: 3, icon: 'p-watch', rating: 4.5, reviews: 365, desc: 'Tracks runs, swims and sleep. Built-in GPS and a battery that lasts a week.', specs: 'Battery: 7 days · Water resistant: 50 m · GPS · Heart rate' },
    { id: 'p4', cat: 'fashion', sub: 'Men', title: 'Heavyweight Cotton T-Shirt', price: 799, days: 1, icon: 'p-shirt', rating: 4.4, reviews: 512, desc: 'Thick 240 gsm cotton that keeps its shape after washing. Relaxed fit, ribbed collar.', specs: 'Material: 100% cotton · Weight: 240 gsm · Sizes: XS to XXL · Machine wash' },
    { id: 'p10', cat: 'fashion', sub: 'Women', title: 'Leather Crossbody Bag', price: 3499, days: 3, icon: 'p-handbag', rating: 4.6, reviews: 94, desc: 'Full-grain leather, an adjustable strap and room for a phone, wallet and keys.', specs: 'Material: full-grain leather · Size: 24 × 16 × 7 cm · Strap: 110 to 130 cm' },
    { id: 'p5', cat: 'home', sub: 'Living', title: 'Three-Seat Linen Sofa', price: 54999, days: 5, icon: 'p-sofa', rating: 4.8, reviews: 46, desc: 'Deep seats, removable linen covers and a solid oak frame. Delivered and assembled in your living room.', specs: 'Width: 220 cm · Depth: 95 cm · Frame: oak · Covers: washable linen' },
    { id: 'p9', cat: 'home', sub: 'Kitchen', title: 'Cast Iron Casserole, 5 L', price: 6499, was: 7999, days: 1, icon: 'p-pot', rating: 4.9, reviews: 77, desc: 'Enamelled cast iron that goes from hob to oven to table. Holds heat for slow cooking.', specs: 'Capacity: 5 L · Oven safe to 260°C · All hobs including induction' },
    { id: 'p7', cat: 'beauty', sub: 'Skincare', title: 'Daily Moisturiser SPF 30, 50 ml', price: 649, days: 1, icon: 'p-jar', rating: 4.5, reviews: 690, desc: 'A light, non-greasy moisturiser with broad-spectrum SPF 30. Suits all skin types.', specs: 'Size: 50 ml · SPF 30 · Fragrance free · Dermatologist tested' },
    { id: 'p13', cat: 'beauty', sub: 'Hair', title: 'Repair Shampoo, 400 ml', price: 399, days: 1, icon: 'p-bottle', rating: 4.2, reviews: 430, desc: 'A gentle daily shampoo for dry and coloured hair. Sulphate free.', specs: 'Size: 400 ml · Sulphate free · For dry and coloured hair' },
  ];
  const HERO = ['d4', 'd3', 'd1', 'd2'];
  const BEST = ['p1', 'd3', 'p9', 'p12', 'p10', 'd1', 'p7', 'p6'];
  const FREE_OVER = 499, STD_FEE = 40, EXP_FEE = 99, COD_FEE = 49;
  const PROMO = { code: 'SZWELCOME', pct: 10 };

  const slugify = (s) => String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  P.forEach((p) => { p.slug = p.slug || slugify(p.title); });

  return { SITE, CATS, P, HERO, BEST, FREE_OVER, STD_FEE, EXP_FEE, COD_FEE, PROMO, slugify };
});
