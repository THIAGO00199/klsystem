# KL System — Online Scheduling Platform

A web application prototype for appointment-based businesses such as barbershops, clinics, and salons. The product concept combines a public booking experience with business-side management.

## Current foundation

- Next.js App Router with React and TypeScript.
- Supabase client integration for authentication and application data.
- Public-facing landing page describing the service and subscription tiers.
- Initial routes for authentication, business pages, service management, professionals, schedules, and appointments.

## Development

Requirements: Node.js compatible with the Next.js version in `package.json` and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Run the production build and lint checks with:

```bash
npm run build
npm run lint
```

## Configuration

Create a local `.env.local` file with the Supabase project URL and public anonymous key:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit `.env.local`, service-role keys, database credentials, or production data. The repository intentionally excludes local environment files.

## Project status

This repository is an early product foundation, not a production-ready booking service. Authentication, database policies, tenant isolation, payment handling, booking concurrency, and operational security must be reviewed and tested before real businesses or customer data are onboarded.

---

[Português](./README.pt-BR.md) · [English](./README.en.md) · [Español](./README.es.md)
