# Shopeiz storefront

Live at https://shopeiz.com. Hosted on Vercel; every push to `main` goes live automatically.

## How it works
Every page is built on the server (`api/render.js`) so Google receives complete HTML with titles,
descriptions and structured data. The browser script adds the bag, wishlist and checkout.

- `assets/catalog.js`: **the product catalogue.** Edit products and categories here.
- `assets/views.js`: page layouts shared by the server and the browser.
- `assets/app.js`: bag, wishlist, checkout and small interactions in the browser.
- `templates/shell.html`: the page frame: styles, header, footer, icons.
- `lib/locations.js`: "Online shopping in <town>" pages, plus district, state and all-India pages.
- `data/`: towns, PIN codes, districts and states (built by `scripts/build-data.py`).
- `assets/fonts/`: brand fonts. `assets/brand/`: logo image.
- `robots.txt` and `/sitemap.xml` (generated) tell search engines what to index.

Design follows the Shopeiz Brand Book: black and white with burgundy `#6D001A`, the SHOPEIZ wordmark and tag monogram.

## Add or edit a product
In `assets/catalog.js`, add a line to `P`:
- `price` = selling price, `was` = MRP (optional, shows the % off badge)
- `img` = photo path such as `/assets/products/name.png` (optional; without it a styled placeholder is shown)
- `days` = delivery estimate in days, `slug` = page address (optional, made from the title)

The product automatically gets its own page at `/products/<slug>` with a search-friendly title,
description, Google product data (price, stock, delivery, returns), and a place in the sitemap.

## Page addresses
- `/`, `/shop`, `/deals`, `/category/<id>`, `/products/<slug>`, `/search?q=`, `/help/<topic>`
- `/online-shopping-india`, `/online-shopping-in-<state>`, `/online-shopping-in-<district>-district`, `/online-shopping-in-<town>`
- `/cart`, `/checkout`, `/wishlist`, `/order-confirmed` (not indexed)

## Location data
Built from the India Post all-India PIN code directory
(https://github.com/saravanakumargn/All-India-Pincode-Directory) with
`python3 scripts/build-data.py all-india-pincode-html-csv.csv cities.json`
(cities list: https://github.com/nshntarora/Indian-Cities-JSON).
Local search spellings (for example Vitla for Vittal, Mangaluru for Mangalore) are in `ALIAS` and `CITY_RENAME`.
