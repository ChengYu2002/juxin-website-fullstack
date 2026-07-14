# Juxin Manufacturing Website – Backend

Backend for the Juxin Manufacturing independent B2B website.

The backend powers three areas: a **secure inquiry workflow** (contact form), a **full product management API** (public catalog + admin CRUD), and an **admin console API** (JWT login, image uploads to object storage). It also serves the built frontend so the whole site runs as a single service.

> This README reflects the **current** state of the project. Early versions (V1) focused only on the inquiry workflow; product management, admin authentication (JWT), and image uploads were added in later iterations (V2 / V3).

---

## Tech Stack

- **Node.js 20 + Express 5**
- **MongoDB Atlas + Mongoose** (products, inquiries)
- **JWT (`jsonwebtoken`) + `bcryptjs`** for admin authentication
- **Aliyun OSS** via the S3-compatible SDK (`@aws-sdk/client-s3`) for image storage
- **Multer** for multipart image uploads
- **Resend + Nodemailer (SMTP)** for notification emails
- **Helmet + CORS** for HTTP hardening (CSP configured for OSS/image hosts)
- **express-rate-limit + express-slow-down** for anti-spam / anti-bruteforce
- **ESLint + Prettier**

---

## Features

### 1. Inquiry workflow (contact form backend)

- Validates inquiry payload (`name` / `email` / `message`, optional `company`)
- Captures client meta (IP, User-Agent) and best-effort IP geolocation (`country` / `region`)
- Stores inquiry in MongoDB with delivery status (`emailStatus`: `pending` / `sent` / `failed`) and workflow status (`status`: `new` / `done`)
- Sends notification email via **Resend** (primary) with SMTP fallback
- Anti-spam: request **rate limiting** + **speed limiting (slow-down)** + **dedupe** protection (blocks repeated submissions in a short window)

### 2. Admin authentication (JWT)

- `POST /api/admin/login` issues a signed **JWT** (default expiry `7d`)
- Passwords verified with **bcrypt** against `ADMIN_PASSWORD_HASH` (falls back to plaintext `ADMIN_PASSWORD` with a warning if the hash isn't configured yet)
- **Login rate limiting**: max 10 attempts per IP per 15 min (`429` on excess) to resist brute-force
- All admin routes are protected by the `requireAdmin` middleware, which verifies the JWT and checks `role === 'admin'`

### 3. Product management API

- **Public catalog** (no auth): list products and fetch by id **or** slug
- **Admin CRUD** (JWT required): create / update / delete products, and fine-grained deletes for **variants** and **variant images**
- Rich product model: `slug`, `category`, `moq`, **variants** (`key` / `label` / `images[]`), **specs** (dimensions, carton size, weights, wheel size, container load, pcs/carton), plus merchandising flags (`isPopular`, `profitMargin`, `sortOrder`, `isActive`)

### 4. Image uploads (object storage)

- `POST /api/admin/uploads/images` — multipart upload of up to **5 images** (Multer memory storage → streamed to OSS)
- `DELETE /api/admin/uploads/images` — remove an image from OSS
- Files stored in **Aliyun OSS**; public URLs built from `OSS_PUBLIC_BASE_URL`

### 5. Serving the frontend (single-service deployment)

- Serves the built frontend (`dist/`) as static assets
- **SPA fallback**: any non-`/api` route returns `index.html`, so client-side routes (`/products`, `/admin`, `/contact`, …) work on refresh

### 6. Robust middleware & error handling

- `trust proxy` enabled for correct client IP behind Render / Nginx / Cloudflare
- Centralized error handler with proper status codes: `CastError` (bad ObjectId), `ValidationError`, MongoDB duplicate key (`11000`), `500` fallback
- Unknown-endpoint (`404`) handler and request logging middleware

---

## API Endpoints

Admin endpoints require a JWT obtained from `POST /api/admin/login`, sent as:

```
Authorization: Bearer <JWT>
```

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/login` | — | Log in, returns `{ ok, token }` (rate-limited) |

### Inquiries

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/inquiries` | — | Create an inquiry (validated, anti-spam, emailed) |
| GET | `/api/inquiries/admin/` | admin | List all inquiries |
| PUT | `/api/inquiries/admin/:id` | admin | Update an inquiry (e.g. mark `status: done`) |
| DELETE | `/api/inquiries/admin/:id` | admin | Delete an inquiry |

### Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | — | Public product list |
| GET | `/api/products/:idorSlug` | — | Public product by id or slug |
| GET | `/api/products/admin` | admin | Admin product list |
| GET | `/api/products/admin/:idorSlug` | admin | Admin product by id or slug |
| POST | `/api/products/admin` | admin | Create product |
| PUT | `/api/products/admin/:id` | admin | Update product |
| DELETE | `/api/products/admin/:id` | admin | Delete product |
| DELETE | `/api/products/admin/:id/variants/:key` | admin | Delete a variant |
| DELETE | `/api/products/admin/:id/variants/:key/images` | admin | Delete a variant's image |

### Uploads

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/uploads/images` | admin | Upload up to 5 images to OSS |
| DELETE | `/api/admin/uploads/images` | admin | Delete an image from OSS |

Example — create an inquiry:

```json
POST /api/inquiries
{
  "name": "Buyer Name",
  "email": "buyer@example.com",
  "company": "Acme Trading",
  "message": "Hello, I'm interested in JX-80SP..."
}
```

---

## Environment Variables

Create a `.env` file in the project root (**never commit it**):

```bash
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI="mongodb+srv://..."

# Admin auth (JWT)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$..."   # bcrypt hash (preferred)
# ADMIN_PASSWORD="..."          # plaintext fallback (dev only)
JWT_SECRET="your-strong-jwt-secret"
JWT_EXPIRES_IN="7d"

# Email (Resend – primary)
RESEND_API_KEY="re_..."
MAIL_FROM="onboarding@resend.dev"
MAIL_TO="sales@example.com"

# Email (SMTP – fallback)
SMTP_HOST="smtp.qq.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="xxx@qq.com"
SMTP_PASS="your_smtp_app_password"

# Object storage (Aliyun OSS)
OSS_REGION="cn-hangzhou"
OSS_BUCKET="your-bucket"
OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"
OSS_PUBLIC_BASE_URL="https://img.your-domain.com"
OSS_ACCESS_KEY_ID="..."
OSS_ACCESS_KEY_SECRET="..."

# Logging
LOG_LEVEL=info
```

**Note:** Never commit `.env` to Git.

---

## Project Structure

```txt
src/
  app.js            # Express app: middleware, routes, static serving
  index.js          # Bootstrap: DB connection + server start
  config/
  controllers/      # inquiry, product, upload
  middleware/       # requireAdmin (JWT), rate limit, validation, error handler, logger
  models/           # inquiry, product (variants + specs)
  routes/           # adminAuth, inquiry, products, uploads
  services/         # mailer (Resend/SMTP), geo (IP geolocation)
  utils/
tests/
.env
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run (development, auto-reload)
npm run dev

# Run (production)
npm start

# Lint
npm run lint
```

---

## Notes

- **Auth evolved from V1**: admin routes originally used a static `ADMIN_TOKEN`; they now use a proper **JWT login** (`bcrypt` + rate-limited `/login`).
- **Single-service model**: the backend serves the built frontend, so one deployment hosts the whole site (see the root Docker / deploy setup).
- **Object storage**: product images live in Aliyun OSS, not the app server, keeping the container stateless.
