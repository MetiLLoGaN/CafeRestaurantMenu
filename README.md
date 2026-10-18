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

Backend API routes:

- `/api/auth`
- `/api/menu`
- `/api/orders`
- `/api/tables`

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
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
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

## Future Improvements

- Payment integration
- Real-time order updates
- Role-based staff accounts
- Printable kitchen tickets
- Analytics and reporting

