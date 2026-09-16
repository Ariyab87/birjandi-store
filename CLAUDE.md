# CLAUDE.md — Birjandi Store Project Handoff

> Read this file at the start of every new chat to restore full context.
> Path: `/Users/ariya/Desktop/Birjandi-store/CLAUDE.md`

---

## What This Project Is

**Kalaland24 (کالالند۲۴)** — live at **https://kalaland24.com**. A bilingual (Persian RTL + English LTR) household-appliances store with two portals:
- **Retail** — individual buyers, retail prices
- **Wholesale** — businesses (Café, Restaurant, Gym, Hotel, Office), wholesale prices

Orders placed via email (no payment gateway yet). Products, articles, orders and reviews are managed in the site's own admin panel at `/fa/admin` (password = `ADMIN_CHAT_PASSWORD`).

**Owner email:** ariyabirjandi87@gmail.com

---

## Architecture (Sept 2026 — Strapi removed)

- **Frontend + API:** Next.js 14 on Vercel (project `ariyab87s-projects/birjandi-store`, functions in `fra1`)
- **Database:** Postgres (Neon free tier, via Vercel Storage) — schema in `db/schema.sql`, client in `src/lib/db.ts` (`DATABASE_URL`)
- **Images:** Cloudinary cloud `doi5encow` — admin uploads go through `/api/admin/upload`
- **Email:** Resend
- **Deploy:** `vercel --prod --yes` from the repo root. **Pushing to GitHub does NOT deploy.**
- **Enamad** trust seal in `src/components/layout/EnamadSeal.tsx` (id 6834202)
- The old Strapi backend (`~/Desktop/birjandi-backend`, Railway project `harmonious-blessing`) is retired. Backups: `~/Desktop/kalaland-backups/`. `scripts/migrate-from-strapi.mjs` copied the data (keeps ids/documentIds).

### Data layer
- `src/lib/api.ts` — storefront reads. `getAllProducts()` loads all published products once (cached 60s, tag `products`) and `getProducts(query, page, size)` filters in memory. Field names (`documentId`, `createdAt`, flat fields) match the old Strapi API.
- `src/lib/format.ts` — `formatPrice`, `getImageUrl` (import these from client components; `api.ts` is server-only because it imports the DB).
- `src/lib/adminProducts.ts` — admin product CRUD; calls `revalidateTag('products')`.
- Prices are stored in **thousands of tomans** (6500 = 6,500,000 تومان).

---

## Local Development

```bash
cd ~/Desktop/Birjandi-store && npm run dev   # http://localhost:3000
```
Needs `.env.local` with `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_CHAT_PASSWORD`, `RESEND_API_KEY`, `ORDER_RECIPIENT_EMAIL`, `EMAIL_FROM`, `GROQ_API_KEY`. **Never commit real keys — this repo is public.**

---

## Key Patterns

### i18n
- Async server components: use `getTranslations()` + `setRequestLocale(locale)`
- Client components: use `useTranslations()`
- Default locale: `fa` (Persian, RTL)

### Colors
- `navy-700` = `#0e2642` (primary)
- `gold-500` = `#d4a017` (accent)
- `cream` = `#f9f6f0` (background)

### Navbar (Header.tsx)
- `position: fixed`, `top: 0`, `z-index: 50`, `width: 100%`
- Background: `rgba(10, 10, 15, 0.45)` + `backdrop-filter: blur(14px)`
- Border bottom: `1px solid rgba(255,255,255,0.07)`
- Layout `<main>` has `pt-[64px]` to clear the fixed navbar on all pages
- Homepage hero has `margin-top: -64px` so video starts from very top behind navbar

### CSS utility classes (globals.css)
- `.btn-primary` — navy button
- `.btn-gold` — gold button
- `.card` — white card with shadow
- `.section-title` — bold navy heading

---

## Homepage Sections (top to bottom)

1. **Hero** — full-screen 3D scroll video, plays on first scroll, glass cards overlay
2. **Animated Stats** — white bg, gold numbers, infinite left scroll ticker
3. **About Us** — `id="about"`, 2-col grid, nationwide delivery (no city names)
4. **Warehouse & Delivery** — cream `#f9f6f0` bg, alternating video+text rows
5. **Featured Products** — `id="featured"`, gray bg, shows when Strapi has featured products
6. **Wholesale Business Types** — 5 cards with real Unsplash photos

---

*Last updated: September 2026 — Strapi replaced by Postgres + built-in admin panel.*
