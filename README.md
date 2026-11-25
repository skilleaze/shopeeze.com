# Shopeiz storefront

Static website. No build step, no dependencies.

## Files
- `index.html` — the whole store (home, category, product, cart, checkout, confirmation). Markup at the top, product data and logic in the `<script data-dc-script>` block at the bottom.
- `Product Tile.dc.html` — the product card used in every grid.
- `support.js` — small runtime that renders the two files above. Don't edit.
- `_ds/…` — Shopeiz design system: fonts, colour/type tokens, components bundle.
- `assets/drones/` — drone product photos.

## Edit products
In `index.html`, find `const P = [` — each line is one product (`price` = offer price, `was` = cut price/MRP, `img` = photo path). Categories are in `const CATS = [`.

## Run locally
Must be served over http (opening the file directly won't load the card component):

    npx serve .

## Deploy on Vercel
1. Push this folder to a GitHub repo (this folder is the repo root).
2. Vercel → Add New Project → import the repo.
3. Framework preset: **Other**. Build command: none. Output directory: `.` (root).
4. Deploy.
