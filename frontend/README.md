# Juxin Manufacturing Website – Frontend

Frontend for the Juxin Manufacturing independent B2B website.

Two applications live in one React app: a **public marketing/catalog site** (home, products, product detail with gallery, inquiry flow) and a **protected admin console** (login, dashboard, product CRUD, image uploads, inquiry management).

> This README reflects the **current** state of the project. Early versions (V1) were a public catalog running on mock data; the admin console, live backend integration, and SEO were added in later iterations (V2 / V3).

---

## Tech Stack

- **React 19 + Vite 7**
- **React Router 7** (public + nested protected admin routes)
- **Tailwind CSS 4**
- **lucide-react** (icons), **yet-another-react-lightbox** / **react-inner-image-zoom** (gallery)
- Native **fetch**-based service layer (with JWT auth for admin)
- **ESLint + Prettier**

---

## Features

### Public site

- **Home** page: hero, featured/popular product recommendations, certifications, partner marquee
- **Product listing** with category-based filtering
- **Product detail** pages with:
  - **Variant** (e.g. color) selection
  - Interactive **gallery**: image carousel, thumbnails + index indicator, desktop hover-zoom, mobile full-screen lightbox
  - Structured **specs** table (dimensions, weights, carton/container load, MOQ, …)
  - **Related product** recommendations
- **Inquiry workflow with product context**: the contact form is pre-filled with the selected product and variant, and submits to the backend inquiry API
- **SEO**: per-page meta tags (`Seo`) and **JSON-LD structured data** (`JsonLd`) for products/organization
- **Responsive** navigation, footer, and layouts
- `About`, `Contact`, and a `404` Not Found page

### Admin console (`/admin`)

- **JWT login** (`/admin/login`); token stored client-side and attached as `Authorization: Bearer <JWT>`
- **Protected routes**: an `AdminProtected` wrapper + `AdminLayout` guard all admin pages
- **Dashboard** overview
- **Product management**: list, create, and edit products via a full `ProductForm` (variants, specs, merchandising flags)
- **Image uploads**: `ImageUploader` component uploads product images to backend → Aliyun OSS
- **Inquiry management**: view and manage submitted inquiries (e.g. mark as done)
- UX helpers: `BusyOverlay` (async busy state), `TypewriterTitle`

---

## Project Structure

```txt
src/
  app/            # App entry, router (public + admin routes), providers
  pages/          # Public pages: Home, Products, Product, About, Contact, NotFound
  components/     # Public UI: Header, Hero, ProductCard, ProductGallery,
                  #   VariantSelector, ProductSpecs, Recommendations, Seo, JsonLd, ...
  layouts/        # Shared layouts (public / products / admin)
  admin/
    pages/        # Login, Dashboard, Products, ProductCreate, ProductEdit, Inquiries
    components/    # ProductForm, ImageUploader, BusyOverlay, TypewriterTitle
    hooks/ utils/  # Admin-only hooks and auth/token helpers
  services/       # API layer: products, inquiryService, adminApi (JWT), adminUploads
  hooks/          # Shared custom hooks
  data/           # Mock/seed data
  assets/         # Images and icons
  styles/         # Global styles
  lib/            # Utilities
```

---

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | public | Home |
| `/products` | public | Product listing (category filter) |
| `/products/:id` | public | Product detail (variants, gallery, specs) |
| `/about` | public | About |
| `/contact` | public | Contact + inquiry form |
| `/admin/login` | public | Admin login |
| `/admin` | **admin** | Dashboard |
| `/admin/products` | **admin** | Product list |
| `/admin/products-create` | **admin** | Create product |
| `/admin/products/:id` | **admin** | Edit product |
| `/admin/inquiries` | **admin** | Inquiry management |
| `*` | public | 404 Not Found |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server (Vite)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview the production build
npm run preview

# Lint
npm run lint
```

The API base URL is configured in the service layer; in production the built `dist/` is served by the backend, so the frontend and API share the same origin.

---

## Notes

- **Evolved from V1**: originally a public catalog on **mock data**; it now integrates with the live backend for products, inquiries, and admin operations.
- **Single-origin deployment**: `npm run build` produces `dist/`, which the backend serves with an SPA fallback — client routes like `/admin` and `/products` work on refresh.
