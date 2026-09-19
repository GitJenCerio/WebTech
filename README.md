# glammednailsbyjhen

Full-stack booking platform for a Russian manicure studio in Manila. Public site for browsing services and booking appointments, plus an admin dashboard for calendar, clients, invoices, staff, and operations.

**Live:** [glammednailsbyjhen.com](https://www.glammednailsbyjhen.com)

---

## Tech stack

Use this on a resume as a compact line:

> Next.js, TypeScript, React, MongoDB, Mongoose, NextAuth.js, Tailwind CSS, Radix UI, Cloudinary, Resend, Google APIs, Vercel

| Layer | Technology | Role |
|-------|------------|------|
| Framework | Next.js 16 (App Router) | SSR/SSG, file-based routing, API routes |
| Language | TypeScript | Typed app and API layer |
| UI | React 18, Tailwind CSS, Radix UI, Lucide | Marketing site and admin dashboard |
| Auth | NextAuth.js (credentials + Google OAuth), bcryptjs | Admin login, sessions, password hashing |
| Database | MongoDB Atlas, Mongoose | Bookings, slots, customers, users, invoices |
| Access control | Custom RBAC | `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `STAFF` |
| Media | Cloudinary | Payment proofs, client photos, gallery |
| Email | Resend | Booking, payment, and password-reset mail |
| Integrations | Google Sheets API | Pricing and spreadsheet backup |
| Analytics | Meta Pixel + Conversions API | Booking funnel events |
| Push | Web Push (VAPID) | Admin notifications |
| PDFs | jsPDF, html2canvas | Quotations and invoices |
| Charts | Recharts | Admin finance and overview |
| Validation | Zod | Request and form validation |
| Tests | Jest, ts-jest | Unit, integration, security tests |
| CI / host | GitHub Actions, Vercel | Lint, typecheck, build, deploy |

The project previously used Firebase/Firestore. Production data now lives in MongoDB; Firebase remains only in one-time migration scripts.

---

## What it does

### Public site
- Marketing pages (home, about, services, FAQ, blog, policies)
- Online booking: date, slot, service, location (studio or home service), new vs returning client
- Dual-tech and Express (mani + pedi) booking flows
- Payment-proof and nail-photo uploads via signed Cloudinary links
- Client feedback survey
- SEO: sitemap, robots, structured data, Open Graph

### Admin dashboard
- Overview metrics and charts
- Calendar and slot management (create, edit, bulk hide/unhide/delete)
- Bookings: confirm, reschedule, complete, invoice, deposit tracking
- Clients: search, profiles, VIP, notes, identifier-based bans
- Nail techs, staff/users, quotations, website media
- Finance, audit log, settings, feedback review
- Role-based screens and API guards

---

## Architecture

```mermaid
graph TB
  subgraph Client
    Web[Next.js App Router]
    Web --> Tailwind[Tailwind + Radix UI]
  end

  subgraph Server
    API[Next.js Route Handlers]
    Auth[NextAuth.js]
    Services[Domain services]
  end

  subgraph Data
    Mongo[(MongoDB Atlas)]
    Cloudinary[Cloudinary]
  end

  subgraph External
    Sheets[Google Sheets]
    Resend[Resend]
    Meta[Meta Pixel / CAPI]
    Push[Web Push]
  end

  Web --> API
  Web --> Auth
  API --> Services
  Auth --> Mongo
  Services --> Mongo
  Services --> Cloudinary
  Services --> Sheets
  Services --> Resend
  Services --> Meta
  Services --> Push
```

### Booking flow (simplified)

1. Client picks date, tech, and available slot(s).
2. New or returning client lookup (banned identifiers are blocked).
3. Booking is created as `pending`; slot(s) are reserved.
4. Client uploads payment proof; admin confirms and records deposit/invoice.
5. Appointment is marked complete with remaining payment, tip, and commission.

---

## Data model (MongoDB)

Mongoose models in `lib/models/`:

| Collection | Purpose |
|------------|---------|
| `bookings` | Appointments, payments, invoices, Express groups |
| `slots` | Time slots per nail tech |
| `customers` | Client profiles, stats, VIP, ban status |
| `bannedclients` | Identifier bans (name / email / phone / social) |
| `nailtechs` | Techs, discounts, commissions, working days |
| `users` | Admin accounts and RBAC roles |
| `quotations` | Saved quotations |
| `mediaassets` | Gallery / site media |
| `settings` | Studio settings |
| `auditlogs` | Admin action history |
| `analyticsevents` | Page and funnel events |
| `pushsubscriptions` | Web Push subscriptions |
| `passwordresettokens` | Password reset |
| `clientfeedback` / `feedbacklinks` | Post-visit feedback |
| `bookingcounters` | Sequential booking codes |
| `notificationlogs` | Notification sweep history |

---

## Project structure

```
app/                  Public pages, admin pages, API routes
components/           UI primitives, booking flow, admin widgets
lib/
  models/             Mongoose schemas
  services/           Booking, slots, bans, email, sheets, push
  utils/              Pricing, invoices, deposits, RBAC helpers
  auth-options.ts     NextAuth configuration
  mongodb.ts          DB connection
middleware.ts         Auth, public routes, security headers
__tests__/            Jest tests
scripts/              Maintenance and one-off migrations
.github/workflows/    CI (lint, typecheck, build)
```

---

## Getting started

**Requirements:** Node.js 20+, npm, a MongoDB Atlas (or local) database.

```bash
git clone <repo-url>
cd WebTech
npm install
```

Create `.env.local` in the project root (see below), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin](http://localhost:3000/admin).

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm start
```

---

## Environment variables

Put secrets in `.env.local`. Do not commit that file.

### App and auth
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-long-random-string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Database
```env
MONGODB_URI=mongodb+srv://user:pass@cluster/dbname
# Optional local DNS workaround for Atlas SRV:
# MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1
```

### Cloudinary
```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Email (Resend)
```env
RESEND_API_KEY=
EMAIL_FROM=noreply@your-domain.com
```

### Google Sheets (pricing / backup)
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_ID=
GOOGLE_SHEETS_PRICING_ID=
GOOGLE_SHEETS_BACKUP_ID=
```

### Other
```env
CRON_SECRET=
NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
TURNSTILE_SECRET_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run clean-database` | Wipe data (destructive) |
| `npm run cleanup-old-data` | Remove stale records |
| Maintenance scripts | See `package.json` for invoice/slot/status fixes (most support `--dry-run`) |

Scheduled jobs (Vercel cron / `CRON_SECRET`): slot cleanup, photo cleanup, notification sweep.

---

## Access control

| Role | Typical access |
|------|----------------|
| `SUPER_ADMIN` | Users, settings, full operations |
| `ADMIN` | Bookings, clients, calendar, finance, bans |
| `MANAGER` | Reports and operational views |
| `STAFF` | Limited to assigned nail tech |

Route protection lives in `middleware.ts` and `lib/rbac.ts` / `lib/api-rbac.ts`.

---

## Deployment

Hosted on **Vercel** (`vercel.json`). Set the same environment variables in the Vercel project. CI on GitHub Actions runs lint, TypeScript, and production build on push/PR.

---

## License

Proprietary. All rights reserved for glammednailsbyjhen.

**Jennifer Cerio** — full-stack developer
