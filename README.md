# QR Menu System

A full-stack QR code restaurant menu and ordering system built with React, Express, and MongoDB.

Customers can scan a table QR code to browse the menu and place orders. Restaurant staff can log in to an admin dashboard to manage menu items, categories, tables, and incoming orders.

## Features

- QR-based table menu access
- Customer-facing digital menu
- Cart and order placement flow
- Admin authentication with JWT
- Dashboard for restaurant management
- Menu item and category management
- Table management with QR code generation
- Order tracking and status updates

## Tech Stack

- Frontend: React, React Router, Axios
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Authentication: JWT
- Media upload support: Cloudinary

## Project Structure

```text
qr-menu-system/
  backend/    Express API, MongoDB models, controllers, routes
  frontend/   React client for customers and admins
```

## Main Routes

Frontend routes:

- `/menu` - customer menu page
- `/order-success` - order confirmation page
- `/admin/login` - admin sign-in
- `/admin/dashboard` - dashboard overview
- `/admin/menu` - manage menu items
- `/admin/categories` - manage categories
- `/admin/orders` - manage incoming orders
- `/admin/tables` - manage tables and QR codes
- `/restaurant-inquiry` - public restaurant inquiry / service page (no login required)
- `/super-admin` - platform Super Admin dashboard (role-protected)
- `/super-admin/users` - Super Admin user management
- `/super-admin/users/create` - Super Admin create-account form

Backend API routes:

- `/api/auth`
- `/api/menu`
- `/api/orders`
- `/api/tables`
- `/api/super-admin` (Super Admin only)

## Getting Started

### 1. Install dependencies

Install backend packages:

```bash
cd backend
npm install
```

Install frontend packages:

```bash
cd frontend
npm install
```

### 2. Configure environment variables

Create `backend/.env` using `backend/.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:3000

# Super Admin provisioning (see below) — keep secret, never commit real values
SUPER_ADMIN_NAME=Platform Owner
SUPER_ADMIN_EMAIL=superadmin@yourdomain.com
SUPER_ADMIN_PASSWORD=change_me_strong_password
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api

# Official business phone shown on /restaurant-inquiry (tel: link + copy).
# Leave empty until the official number exists — the page then shows a
# clearly-marked placeholder instead of a fake number.
REACT_APP_CONTACT_PHONE=
```

### 3. Seed the database

From the `backend` folder:

```bash
npm run seed
```

Seeded admin login:

- Email: `admin@digitaldiner.com`
- Password: `password123`

### 4. Start the app

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in a separate terminal:

```bash
cd frontend
npm run build
npm install -g serve
serve -s build
```

Frontend URL:

- `http://localhost:3000`

Backend URL:

- `http://localhost:5000`

## Available Scripts

Backend:

- `npm start` - start the API with Node
- `npm run dev` - start the API with Nodemon
- `npm run seed` - populate demo data

Frontend:

- `npm start` - start the React development server
- `npm run build` - create a production build
- `npm test` - run tests

## Notes

- The frontend expects the API at `http://localhost:5000/api` unless overridden by `REACT_APP_API_URL`.
- QR code links are generated using `FRONTEND_URL`, so keep it aligned with the address where the frontend is running.
- Cloudinary is required only if you want image upload features to work.

## Restaurant Branding & Theming

Each restaurant (the owner account) has a persistent branding configuration stored in MongoDB on the `User` document (`branding` subdocument): logo, primary/hover colors, secondary and accent colors, page background, surface, primary/secondary text, plus light and dark brand variants. Restaurants that predate this feature keep working with the default palette — no migration needed.

- Admin: **Theme & Branding** page at `/admin/theme` (upload/replace/remove logo, color pickers with live preview, restore defaults, save).
- Public menu: the restaurant logo, name and palette are applied automatically on `/menu?owner=…` (delivered with the existing public-menu request).
- API: `GET /api/branding`, `PUT /api/branding` (or `{ "reset": true }`), `POST /api/branding/logo` (multipart field `logo`), `DELETE /api/branding/logo` — all require a JWT and are scoped to the authenticated owner.
- Logo rules differ from menu-item images on purpose: PNG/JPEG/WebP only (no SVG/GIF), 2 MB max, magic-byte validation, server-generated `logo-<ownerId>-…` filenames, and file deletion is restricted to the caller's own logo files.
- Theming is centralized through CSS custom properties (`frontend/src/utils/branding.js` + `index.css`); components must consume the tokens instead of hardcoded colors.

### Production storage considerations

Uploads (menu images and logos) are stored on the **local disk** under `backend/uploads/` and served statically at `/uploads`. This is fine for a single-instance deployment, but note:

- On platforms with ephemeral filesystems (Heroku, serverless, containers), attach a persistent volume or move uploads to object storage (S3, Cloudinary, …) — otherwise files disappear on redeploy.
- For multi-instance deployments, use shared storage or a CDN in front of `/uploads`; local disk is not shared between instances.
- In production, terminate TLS and point `REACT_APP_API_URL` at the API origin so `/uploads/…` URLs resolve correctly; consider an nginx `location /uploads` alias with long-lived cache headers.
- `backend/utils/cloudinary.js` and `backend/middleware/uploadMiddleware.js` remain available if you prefer Cloudinary for media storage.

## Currency Convention (Iranian Toman)

All monetary amounts throughout the application are denominated and displayed in **Iranian Toman (تومان)**:

- `IRT` is used as the application-specific currency identifier when a code is needed internally. It is a **project convention, not an official ISO 4217 code** (Toman is not an ISO currency; the official Iranian currency is the Rial, `IRR`, and 1 Toman = 10 Rial).
- Prices are stored in the database as plain numeric values in Toman — no currency label is persisted, and no Rial/Toman conversion (multiply/divide by 10/100) is ever applied, so historical order amounts keep their original meaning.
- All display formatting is centralized in `frontend/src/utils/currency.js` (`formatPrice(value, language)` / `useFormatPrice()`): Persian interface renders Persian digits with `٬` grouping plus `تومان` (e.g. `۱۵۰٬۰۰۰ تومان`), English renders Latin digits with `,` grouping plus `Toman` (e.g. `150,000 Toman`). Invalid or missing values render `—` instead of a misleading number.
- Admin price inputs are labeled as Toman (not Rial) and validated server-side: prices must be finite, non-negative numbers (`menuController` rejects anything else; Mongoose enforces `min: 0`).

## Public Registration & Super Admin Provisioning

Public self-registration has been removed. Ordinary visitors can no longer create accounts through the UI or by calling `POST /api/auth/register` (the endpoint now always answers `403`). Restaurant owners see the CTA «رستوران خود را ثبت کنید» ("Register your Restaurant") on the login page; it opens the public inquiry page `/restaurant-inquiry`, which presents the QR menu service and the official contact number. Accounts are then created manually by the platform Super Admin.

### Roles

- `super_admin` — the platform owner; manages all accounts through the `/super-admin` area and the `/api/super-admin` API.
- `restaurant_admin` (default) — the existing restaurant owner; manages only their own restaurant, exactly as before.

The role lives on the `User` document and is always read from the database by the auth middleware — never from JWT claims or request bodies. Legacy users without a `role` field behave as `restaurant_admin`, and an optional `isActive` flag (default: active) lets the Super Admin disable accounts; disabled accounts cannot log in and their tokens are rejected with `403`.

### Provisioning the first Super Admin

The first Super Admin is created offline — no API endpoint grants super admin privileges:

1. Set in `backend/.env` (see `backend/.env.example`):

```env
SUPER_ADMIN_NAME=Platform Owner
SUPER_ADMIN_EMAIL=superadmin@yourdomain.com
SUPER_ADMIN_PASSWORD=use_a_strong_random_password
```

2. Run:

```bash
cd backend
npm run super-admin
```

The script hashes the password with the application's existing bcrypt hook, never prints it, and is safe to rerun: an existing super admin with that email is left untouched (the password is never reset), and the script refuses to overwrite an existing restaurant account. Log in at `/admin/login` — the Super Admin lands on `/super-admin`.

### Official contact number

The phone number on the inquiry page is not hardcoded. Set `REACT_APP_CONTACT_PHONE` in `frontend/.env`; until it is set, the page shows a clearly-marked placeholder and no `tel:` link, so a fake number can never be mistaken for a real one.

### Super Admin API

All `/api/super-admin/*` routes require a valid JWT **and** the persisted `super_admin` role:

- `GET /api/super-admin/stats` — totals: users, restaurants, active/disabled
- `GET /api/super-admin/users` — list/search users (`search`, `role`, `status`, `page`, `limit`)
- `POST /api/super-admin/users` — create an account (restaurant admin or super admin)
- `PUT /api/super-admin/users/:id` — update name/email/restaurant/role/status
- `PUT /api/super-admin/users/:id/password` — reset a user's password

Password hashes are never returned by any endpoint, all writes pick fields explicitly (no mass assignment / role escalation), and a super admin cannot demote or disable their own account.

## Future Improvements

- Payment integration
- Real-time order updates
- Role-based staff accounts
- Printable kitchen tickets
- Analytics and reporting

