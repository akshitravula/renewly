# RepSync (repsync.in)

Two-sided platform for fitness studios and gym discovery in India:
1. **Public Discovery Portal**: Verified listings with live check-in heatmaps, real pricing with GST breakdown, verified member reviews, and free trial booking.
2. **Owner Operating System**: Multi-tenant SaaS covering memberships, attendance admission terminal, GST billing (SAC 999723), NPCI dynamic UPI QR generation, CSV bulk imports, and renewals desk with behavioral churn risk scoring.

The core differentiator: **Single Source of Truth**. Public listings are dynamically generated from gym operational data, preventing stale aggregator listings.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide icons
- **Backend & Database**: PostgreSQL 18 with PostGIS & pgvector, Drizzle ORM
- **Testing**: Vitest for unit & integration testing
- **Billing & Payments**: Indian GST compliance engine (SAC 999723), NPCI UPI intent & QR generator

---

## Project Structure

```
src/
├── app/
│   ├── (public)/         # Public discovery pages (home, gym profile)
│   ├── owner/            # Gym owner SaaS portal (dashboard, renewals, attendance, billing)
│   └── api/              # REST API handlers
├── db/                   # Drizzle schema, migrations and seed scripts
├── modules/
│   ├── attendance/       # Check-in validation & turnstile admission rules
│   ├── billing/          # GST engine (CGST/SGST/IGST) & UPI generation
│   ├── members/          # CSV import parser with phone de-duping
│   └── renewals/         # Churn risk scoring & retention message drafting
├── lib/                  # Shared utilities
└── tests/                # Unit and integration test suites
```

---

## Getting Started

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your PostgreSQL credentials:
```bash
cp .env.example .env
```

### 3. Database migrations & seed
```bash
pnpm tsx src/db/migrate.ts
pnpm tsx src/db/seed.ts
```

### 4. Run tests
```bash
pnpm test
```

### 5. Start development server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the public site or [http://localhost:3000/owner/dashboard](http://localhost:3000/owner/dashboard) for the studio manager.
