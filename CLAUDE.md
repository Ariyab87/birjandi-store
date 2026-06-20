# CLAUDE.md — Birjandi Store Project Handoff

> Read this file at the start of every new chat to restore full context.
> Path: `/Users/ariya/Desktop/Birjandi-store/CLAUDE.md`

---

## What This Project Is

**Birjandi Household Appliances (بیرجندی)** — a bilingual (Persian RTL + English LTR) e-commerce website with two portals:
- **Retail** — individual buyers, retail prices
- **Wholesale** — businesses (Café, Restaurant, Gym, Hotel, Office), wholesale prices

Orders placed via email (no payment gateway yet). Admin managed via Strapi CMS.

**Owner email:** ariyabirjandi87@gmail.com

---

## Project Locations

```
/Users/ariya/Desktop/Birjandi-store/      ← Frontend (Next.js 14)
/Users/ariya/Desktop/birjandi-backend/    ← Backend (Strapi v5.48.0)
```

---

## Restart Commands (run every session)

```bash
# Terminal 1 — Frontend
cd ~/Desktop/Birjandi-store && npm run dev
# Opens at: http://localhost:3000

# Terminal 2 — Backend (if SQLite error, run rebuild first)
cd ~/Desktop/birjandi-backend && npm rebuild better-sqlite3 && npm run develop
# Opens at: http://localhost:1337/admin
```

---

## Tech Stack & Status

| Layer | Tool | Status |
|---|---|---|
| Frontend | Next.js 14 (App Router) | ✅ Done |
| Styling | Tailwind CSS | ✅ Done |
| i18n | next-intl v3 | ✅ FA + EN working |
| Basket | React Context + localStorage | ✅ Done |
| Email orders | Resend | ✅ Working — sends to ariyabirjandi87@gmail.com |
| CMS/Backend | Strapi v5.48.0 | ✅ Running locally |
| Image Storage | Cloudinary | ✅ Connected (cloud: doi5encow) |
| Database | SQLite (local) → PostgreSQL (Railway later) | 🔶 Local only |
| Frontend Deploy | Vercel | ❌ Not deployed yet |
| Backend Deploy | Railway | ❌ Not deployed yet |
| Domain | birjandi.com | ❌ Not purchased yet |

---

## Environment Variables

**Frontend** `/Users/ariya/Desktop/Birjandi-store/.env.local`:
```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
RESEND_API_KEY=re_TTYDYEyG_PdF4QTyR3f8N9b44Jy14ah6o
ORDER_RECIPIENT_EMAIL=ariyabirjandi87@gmail.com
```

**Backend** `/Users/ariya/Desktop/birjandi-backend/.env` (has all Strapi secrets +):
```env
CLOUDINARY_NAME=doi5encow
CLOUDINARY_KEY=299764261128824
CLOUDINARY_SECRET=Pjvm4hNziZakAvG3YGOjtaRrAjo
```

---

## Complete File Structure

```
Birjandi-store/
├── public/
│   ├── logo.png                            ← Brand logo (used in navbar)
│   ├── hero-3d.mp4                         ← Hero section scroll-driven video
│   ├── warehouse.mp4                       ← Warehouse section video
│   └── delivery.mp4                        ← Delivery section video
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── [locale]/
│   │   │   ├── layout.tsx                  ← Header, Footer, BasketProvider, pt-[64px] for fixed navbar
│   │   │   ├── page.tsx                    ← Homepage: hero(scroll video), stats, about, warehouse/delivery, featured, wholesale cards
│   │   │   ├── retail/
│   │   │   │   ├── page.tsx                ← Search + filters + category tabs + product grid
│   │   │   │   ├── checkout/page.tsx       ← Retail order form
│   │   │   │   └── [category]/[product]/
│   │   │   │       ├── page.tsx            ← Product detail page
│   │   │   │       └── AddToBasketButton.tsx
│   │   │   └── wholesale/
│   │   │       ├── page.tsx                ← Business type cards with real Unsplash photos
│   │   │       ├── checkout/page.tsx       ← Wholesale order form
│   │   │       └── [business]/page.tsx     ← Products filtered by business type + search/filter
│   │   └── api/
│   │       └── order/route.ts              ← POST /api/order → sends email via Resend
│   ├── components/
│   │   ├── basket/
│   │   │   ├── BasketContext.tsx           ← useReducer state, localStorage, useBasket() hook
│   │   │   └── BasketDrawer.tsx            ← Slide-in drawer
│   │   ├── layout/
│   │   │   ├── Header.tsx                  ← Fixed navbar, glass dark bg, logo.png + "Birjandi", gold ring on logo
│   │   │   └── Footer.tsx                  ← Two phone numbers, 24/7 support, no address
│   │   ├── product/
│   │   │   └── ProductCard.tsx             ← 200px image height, #f5f5f5 bg, Strapi v5 flat fields
│   │   ├── retail/
│   │   │   └── SearchAndFilter.tsx         ← Search bar + brand dropdown + price range filter
│   │   ├── order/
│   │   │   └── OrderForm.tsx               ← Shared checkout form
│   │   └── ui/
│   │       ├── AnimatedStats.tsx           ← Infinite scrolling stats ticker (white bg, gold text)
│   │       ├── ScrollVideo.tsx             ← Hero scroll-triggered video (plays on first scroll)
│   │       └── WarehouseDeliverySection.tsx ← Warehouse + delivery alternating rows, cream bg
│   ├── lib/
│   │   ├── api.ts                          ← Strapi v5 fetch functions (FLAT fields, no .attributes)
│   │   ├── email.ts                        ← sendOrderEmails() via Resend
│   │   └── utils.ts                        ← cn(), generateOrderId(), RETAIL_CATEGORIES, WHOLESALE_BUSINESS_TYPES
│   ├── styles/globals.css
│   ├── middleware.ts                       ← next-intl routing (default: /fa)
│   └── i18n.ts
├── messages/
│   ├── fa.json
│   └── en.json
├── next.config.js                          ← Image domains: Cloudinary, Unsplash, localhost:1337
├── tailwind.config.ts                      ← Colors: navy, gold, cream
└── .env.local
```

---

## Critical: Strapi v5 API Format

Strapi v5 returns **flat fields** (no `attributes` wrapper):

```ts
// ✅ CORRECT (v5)
product.name_fa
product.retail_price
product.images[0].url

// ❌ WRONG (v4 — do not use)
product.attributes.name_fa
```

Product type fields: `id`, `documentId`, `name_fa`, `name_en`, `brand`, `retail_price`, `wholesale_price`, `min_wholesale_qty`, `category`, `business_types[]`, `description_fa`, `description_en`, `stock_status`, `featured`, `images[]`

Product detail page URLs use `documentId` (not `id`).

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

## What Is Done ✅

- [x] Homepage — hero 3D video, stats ticker, about, warehouse/delivery, featured, wholesale cards
- [x] Navbar — fixed, glassmorphism, logo image + brand text, gold ring hover
- [x] Retail portal — search bar, brand filter, price range filter, category tabs, product grid
- [x] Wholesale portal — 5 business type cards with real photos + search/filter on product pages
- [x] Product detail page
- [x] Basket — context, slide-in drawer, localStorage
- [x] Checkout + order form (retail + wholesale)
- [x] Email system — order email sent to ariyabirjandi87@gmail.com via Resend ✅ tested
- [x] Strapi v5 backend with Product, Category, Order content types
- [x] Cloudinary connected — images upload to cloud ✅ tested
- [x] Bilingual FA/EN with RTL/LTR
- [x] Mobile hamburger menu
- [x] Footer — two phone numbers (+989934642455, +989131444021), 24/7 support, no address
- [x] Product cards — 200px image height, #f5f5f5 background, correct plural count

---

## What Is NOT Done Yet ❌

- [ ] **Deploy backend to Railway** (Strapi + PostgreSQL)
- [ ] **Deploy frontend to Vercel**
- [ ] **Buy domain** (birjandi.com)
- [ ] **Add real products** — only 1 test product exists, need 15-20+
- [ ] **Contact page** — no dedicated contact page yet
- [ ] **SEO** — meta titles, descriptions not set
- [ ] **Mobile testing** — tested via DevTools, not on real device
- [ ] Email `from` address is `onboarding@resend.dev` — needs real domain to change to `orders@birjandi.com`

---

## Next Priority Steps (in order)

1. **Add 15-20 real products** in Strapi with Cloudinary images
2. **Deploy backend to Railway** with PostgreSQL
3. **Deploy frontend to Vercel**
4. **Buy domain** and connect to Vercel + Railway
5. **Update email sender** to orders@birjandi.com after domain is set up
6. **SEO** — add meta tags to pages

---

## Phase Plan

| Phase | Description | Status |
|---|---|---|
| 1 — Foundation | Next.js, Tailwind, homepage, bilingual | ✅ Done |
| 2 — Backend | Strapi, content types, Cloudinary | ✅ Done |
| 3 — Product Catalog | Search, filters, category pages | ✅ Done |
| 4 — Basket & Orders | Basket, checkout, email | ✅ Done |
| 5 — Polish & Launch | Deploy, domain, SEO, mobile | ❌ Next |
| 6 — Future | Payments, accounts, SMS | ❌ Future |

---

*Last updated: June 2026 — Phases 1-4 complete + homepage polish done. Ready for deployment.*
