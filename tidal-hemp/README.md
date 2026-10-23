# Tidal Hemp — storefront

A premium hemp ecommerce storefront built with Next.js 16 (App Router), React 19, Tailwind CSS 4 and Lucide icons.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## What's included

| Route | What it is |
| --- | --- |
| `/` | Homepage: hero, featured products, private access, quality, about |
| `/shop` | Collection with category tabs, filters (type, price, availability), sorting — all synced to the URL |
| `/shop/[slug]` | Product page: gallery, size + quantity, add to cart, lab results, expandable details, mobile sticky add-to-cart |
| `/account` | Customer dashboard: orders + tracking, private releases, saved products, lab reports, profile, community |
| `/access` | Request access / sign in |
| `/checkout` | Checkout UI with age-verification step (payment provider placeholder) |
| `/coa/[batch]` | Printable Certificate of Analysis for each batch |
| `/about` `/quality` `/faq` `/contact` `/legal/*` | Informational pages (not age-gated) |

Overlays: slide-out cart, search, mobile menu, filter sheet, age verification.

## Where things live

```
src/config/site.ts        Brand, nav, shipping thresholds, compliance (age, gated routes, disclaimer)
src/data/products.ts      Placeholder catalog — the only place product content lives
src/data/content.ts       FAQ, legal copy, mock customer + orders
src/lib/catalog.ts        Catalog API (async) — replace these functions to connect a real backend
src/lib/types.ts          Product / variant / batch / order types
src/context/              Cart + access (age verification, session, saved products)
src/components/           Header, Footer, ProductCard, ProductGrid, ProductGallery, ProductFilters,
                          CartDrawer, AccountDashboard, AccessGate, FAQ, LabResults, AnnouncementBar, …
scripts/render-placeholders.mjs   Generates the placeholder photography in public/images
```

## Connecting a real backend

1. **Products** — reimplement the functions in `src/lib/catalog.ts` (`getProducts`, `getProductBySlug`, …) against Shopify Storefront, Medusa, etc. Keep the `Product` shape from `src/lib/types.ts`, or map to it.
2. **Cart** — `src/context/CartContext.tsx` stores lines in `localStorage`. Swap for your platform's cart API; components only use `useCart()`.
3. **Auth + private releases** — `src/context/AccessContext.tsx` is a placeholder session. Use your auth provider, and only return `isPrivate` products from the API for signed-in customers (the client-side `MembersOnly` wrapper is presentation only).
4. **Age verification** — the `AccessGate` modal is the UX layer. For compliance, back it with an ID-verification provider at checkout and an httpOnly cookie checked in `proxy.ts` (Next 16's middleware).
5. **Images** — replace files in `public/images` (same names), or point `images` in the catalog at your CDN and add the host to `next.config.ts`.

## Placeholder imagery

The product and editorial images are rendered from HTML/CSS/SVG scenes with headless Chromium (`npm run images`), so the site looks finished before a photo shoot. Product shots are 1200×1500 (4:5).

## Before launch

- Replace legal copy and the disclaimer in `site.ts` with text reviewed by counsel.
- Replace the generated COA pages with the labs' signed PDFs.
- Set the Signal community link in `site.ts` (`signalUrl`).
