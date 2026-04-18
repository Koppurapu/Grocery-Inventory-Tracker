# Gorecory Inventory Tracker — Product Requirements Document

## Original Problem Statement
Execute `gorecory_bug_spec.md` + Auth Hardening (Decision-Complete). Implement all 12 bugs in the spec on the React + Node/Express path, plus the agreed auth hardening: bcrypt password storage, legacy plain-text password auto-upgrade on login, and real client logout token cleanup. Add backend alert engine (low stock + 15-day expiry + email API), product data model updates (MFG/expiry fields), and UI notifications. Keep scope off the Spring Boot backend.

## Architecture
- Frontend: React 19 + Vite 8 (runs on :3000)
- Backend: Node.js + Express (server.cjs, runs on :8001, `/api/...` routes)
- Database: PostgreSQL 15 (local, `gorecory` database)
- Email: Nodemailer + Gmail SMTP (via .env)
- Routing: React Router v7 with client-side `AuthGuard` (localStorage token)
- Supervisor manages `backend` (node server.cjs) and `frontend` (vite).

## User Personas
- **Store admin / demo user** — manages inventory, orders, suppliers, receives alerts.
- **New account signups** — registers via `/signup`, gets dashboard access.

## Core Requirements (static)
- Auth with bcrypt + legacy plaintext auto-upgrade.
- Protected routes behind `AuthGuard`; logout clears localStorage.
- Products with MFG + expiry dates; auto status (In/Low/Out of Stock) from quantity vs reorder level.
- Notification bell dropdown: low-stock, near-expiry (≤15 days), active deliveries (latest 5 Shipped/Processing), Send Email Alert.
- Landing page: clean nav (Features + Integrations only), all signup CTAs route to `/signup`, updated footer copyright.

## What's Been Implemented (2026-01-18)

### Backend (`/app/backend/server.cjs`)
- `POST /api/register` — creates user, bcrypt-hashes password, 409 on duplicate email.
- `POST /api/login` — bcrypt compare for hashed passwords; legacy plain-text passwords auto-upgraded to bcrypt on successful login.
- Demo user (`demo@gorecory.com` / `demo123`) seeded with bcrypt hash.
- `items` table: added `mfg_date`, `expiry_date` via idempotent `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
- Startup: idempotent status restamp SQL normalizes `items.status` from quantity vs reorder_level.
- Item create/update accept `mfgDate`, `expiryDate`.
- `GET /api/reports/near-expiry?days=15`.
- `GET /api/alerts/messages?days=15` — combined low-stock + near-expiry message payload.
- `POST /api/alerts/email` — sends Gmail SMTP digest email (configured via SMTP_HOST/USER/PASS in .env).

### Frontend
- New `/signup` route with `SignupPage.jsx` (validates required fields, min 6 chars, password match; duplicate email shows error; success stores token+user, redirects to `/dashboard`).
- `AuthGuard.jsx` wraps all `Layout` routes; unauthenticated users go to `/login`.
- `Layout.jsx` logout handler clears localStorage (`token`, `user`) and routes to `/login`.
- Notification bell: dropdown with outside-click close; low-stock + near-expiry + latest 5 active deliveries; dynamic badge total; empty state; Send Email Alert button + status feedback.
- `Products.jsx`: reorder_level mapping fix (`?? 50` fallback), MFG + Expiry inputs in add/edit modal, new Expiry column in table.
- `LandingPage.jsx`: nav shows only `Features` + `Integrations`; all signup CTAs route to `/signup`; integrations section keeps heading only (no paragraph, no logo tiles); CTA trial paragraph removed; footer updated to `© 2026 Gorecory Inventory Tracker. All rights reserved.`
- `LoginPage.jsx`: "Sign up free" now routes to `/signup`.
- `index.css`: hardened sidebar/nav alignment (CSS variables for widths, ellipsis handling, clean collapsed state); centered login input icons with `top: 50%` + `translateY(-50%)`; notification dropdown styles.

### Environment & Services
- Postgres 15 installed, `gorecory` DB created, seed data inserted.
- Supervisor updated to run `node server.cjs` for backend and `yarn start` (vite) for frontend.
- `/app/backend/.env`: DATABASE_URL, PORT=8001, SMTP_* (Gmail app password).
- `/app/frontend/.env`: VITE_API_BASE_URL.

## Test Results (iteration_1)
- Backend: **17/17 passed** (auth, register duplicate, legacy upgrade, items CRUD with dates, status filter, reports, alerts, email).
- Frontend: **All flows verified** (landing, login, signup, AuthGuard, logout, sidebar toggle, notification panel, products).
- Email via Gmail SMTP: real send verified (messageId returned).

## Prioritized Backlog / Next Tasks
- P1: Server-side JWT middleware (currently client-guard only per spec).
- P1: Forgot password flow (reset email via same SMTP).
- P2: Pagination / virtualized tables for large inventories.
- P2: Order shipping status webhooks / real-time badge updates.
- P3: Role-based access (admin vs staff).

## Enhancement Suggestion
Potential improvement: why don't you add a **daily auto-digest email schedule** (e.g., every morning at 8am) for admins? Right now alerts are on-demand from the bell — a scheduled `node-cron` job that calls the existing `/api/alerts/email` logic would make this a "set-and-forget" early-warning system and dramatically reduce stockouts / expiry waste for busy stores.
