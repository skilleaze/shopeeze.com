# Shopeiz storefront

Live at https://shopeiz.com. Static website: no build step, no dependencies.

## Files
- `index.html`: the whole store: home, category, search, product, wishlist, bag, checkout and confirmation. Styles at the top, catalogue and logic in the `<script>` at the bottom.
- `assets/drones/`: drone product photos.
- `assets/fonts/`: brand fonts: Archivo (all text) and Big Shoulders Display Black (logo only).

Design follows the Shopeiz Brand Book: black and white with burgundy `#6D001A` for the main action and offers, square corners, 2px rules, flush-left layout.
- `vercel.json`: hosting settings.

## Edit products
In `index.html`, find `const P = [`: each line is one product:
- `price` = selling price, `was` = MRP (optional, shows the % off badge)
- `img` = photo path (optional; without it a styled placeholder is shown)
- `days` = delivery estimate in days
- `rating` / `reviews` = optional

Categories are in `const CATS = [`. Delivery fees, the free-delivery threshold and the promo code are just below the product list.

## Deploy
Every push to `main` deploys to shopeiz.com automatically through Vercel.
