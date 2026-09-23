# Harrisons Warehouse Visitor Registration System

A Progressive Web App (PWA) for managing visitor check-in and check-out across multiple warehouses with role-based access control (RBAC).

## Features

- **Multi-Warehouse Support**: Site → Warehouse hierarchy with per-warehouse check-in URLs
- **Role-Based Access Control (RBAC)**: Three-tier user system (Super Admin, Site Admin, Storekeeper)
- **Per-Warehouse Check-In**: Visitors check in via warehouse-specific QR codes/URLs
- **QR Code Generation**: Unique QR code generated for each visitor for quick check-out
- **PIN-based Check-Out**: Secure 4-digit PIN verification for self-service check-out
- **Staff Dashboard**: View active visitors, visitor history with warehouse filtering
- **PWA Support**: Install as a mobile app for offline capability

## Hierarchy Structure

```
Company
├── Site (e.g., Sarawak Region)
│   ├── Warehouse (e.g., KCH01 - Kuching Main)
│   ├── Warehouse (e.g., KCH02 - Kuching Cold Storage)
│   └── Warehouse (e.g., SBU01 - Sibu Distribution)
└── Site (e.g., Sabah Region)
    ├── Warehouse (e.g., KK01 - Kota Kinabalu Main)
    └── Warehouse (e.g., SDK01 - Sandakan)
```

## User Roles

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **SUPER_ADMIN** | Full system | Create sites & warehouses; create Site Admins; view all data |
| **SITE_ADMIN** | One site | View warehouses in assigned site; create Storekeepers; filter visitors by warehouse |
| **STOREKEEPER** | Assigned warehouses | View combined visitor list across assigned warehouses; force-complete visits |

### User Creation Chain
1. **SUPER_ADMIN** creates Sites, Warehouses, and SITE_ADMIN users
2. **SITE_ADMIN** creates STOREKEEPER users and assigns warehouses within their site
3. **STOREKEEPER** manages day-to-day visitor operations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Iron Session
- **PWA**: next-pwa (disabled on Vercel)

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL

# Setup database and seed demo data
npm run setup

# Start development server
npm run dev
```

The app will be available at **http://localhost:3847**

## Per-Warehouse Check-In URLs

Visitors check in using warehouse-specific URLs:

```
/checkin/[WAREHOUSE_CODE]
```

### Demo Warehouse URLs

| URL | Warehouse | Site |
|-----|-----------|------|
| `/checkin/KCH01` | Kuching Main Warehouse | Sarawak |
| `/checkin/KCH02` | Kuching Cold Storage | Sarawak |
| `/checkin/SBU01` | Sibu Distribution Center | Sarawak |
| `/checkin/KK01` | Kota Kinabalu Main Warehouse | Sabah |
| `/checkin/SDK01` | Sandakan Warehouse | Sabah |

Generate QR codes pointing to these URLs for warehouse gates.

## Demo Accounts

### Super Admin
- **Username**: `superadmin`
- **Password**: `admin123`
- **Access**: Full system - manage all sites, warehouses, and users

### Site Admins
| Site | Username | Password |
|------|----------|----------|
| Sarawak Region | `kuching_admin` | `admin123` |
| Sabah Region | `kk_admin` | `admin123` |

### Storekeepers
| Username | Password | Assigned Warehouses |
|----------|----------|---------------------|
| `storekeeper` | `demo1234` | KCH01, KCH02 (Kuching) |
| `sibu_keeper` | `demo1234` | SBU01 (Sibu) |
| `kk_keeper` | `demo1234` | KK01, SDK01 (Sabah) |

## Vercel Deployment

### Prerequisites

1. A PostgreSQL database (e.g., [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))

### Environment Variables

Configure these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db?sslmode=require`) |
| `SESSION_SECRET` | Yes | Random string, minimum 32 characters for session encryption |
| `SETUP_SECRET` | Optional | Secret for the admin seed endpoint |

### Deploy Steps

1. Connect your GitHub repository to Vercel
2. Add the required environment variables
3. Deploy - Vercel will automatically run `prisma generate` via the `postinstall` script
4. After deployment, seed the demo data:

```bash
curl -X POST https://your-app.vercel.app/api/admin/seed \
  -H "x-setup-secret: YOUR_SETUP_SECRET"
```

### Notes

- PWA is automatically disabled on Vercel (`VERCEL=1`) to avoid build issues with next-pwa
- The database schema is pushed automatically via Prisma; ensure `DATABASE_URL` is set before first deploy
- For production, generate a secure `SESSION_SECRET` (e.g., `openssl rand -base64 32`)

## Visitor Types

| Type | Fields | Purpose Options |
|------|--------|-----------------|
| EXTERNAL | Company, Car Plate (optional) | GENERAL, TRUCK |
| STAFF | Department | GENERAL (locked) |

## Visitor Status Flow

1. **ACTIVE**: Visitor has checked in at a specific warehouse
2. **COMPLETED**: Visitor checked out normally using PIN
3. **FORCE_COMPLETED**: Visitor checked out by staff (with remarks)

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkin` | Register new visitor (requires warehouseCode) |
| POST | `/api/checkout` | Self-service check-out |
| GET | `/api/visitor/[id]` | Get visitor details with QR |
| GET | `/api/warehouse/[code]` | Validate warehouse code |

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Staff login |
| POST | `/api/auth/logout` | Staff logout |
| GET | `/api/auth/me` | Get current session |

### Admin Endpoints (Requires Authentication)
| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET/POST | `/api/admin/sites` | SUPER_ADMIN/SITE_ADMIN | List/Create sites |
| GET/PUT/DELETE | `/api/admin/sites/[id]` | SUPER_ADMIN | Manage site |
| GET/POST | `/api/admin/warehouses` | SUPER_ADMIN/SITE_ADMIN | List/Create warehouses |
| GET/PUT/DELETE | `/api/admin/warehouses/[id]` | SUPER_ADMIN | Manage warehouse |
| GET/POST | `/api/admin/users` | SUPER_ADMIN/SITE_ADMIN | List/Create users |
| GET/PUT/DELETE | `/api/admin/users/[id]` | SUPER_ADMIN/SITE_ADMIN | Manage user |
| GET | `/api/visitors` | Staff | List visitors (filtered by access) |
| POST | `/api/visitors/[id]/force-complete` | Staff | Force complete a visit |
| POST | `/api/admin/seed` | SETUP_SECRET | Seed demo data |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── admin/          # Admin APIs (sites, warehouses, users, seed)
│   │   ├── auth/           # Authentication APIs
│   │   ├── checkin/        # Check-in API
│   │   ├── checkout/       # Check-out API
│   │   ├── visitor/        # Visitor details API
│   │   ├── visitors/       # Visitors list API
│   │   └── warehouse/      # Warehouse validation API
│   ├── admin/              # Admin console pages
│   │   ├── page.tsx        # Super Admin console
│   │   ├── site/           # Site Admin console
│   │   └── users/          # User management
│   ├── checkin/
│   │   ├── page.tsx        # Check-in info page
│   │   ├── [warehouseCode]/ # Per-warehouse check-in
│   │   └── success/        # Check-in success page
│   ├── checkout/           # Check-out page
│   ├── dashboard/          # Staff dashboard
│   │   ├── page.tsx        # Active visitors
│   │   └── history/        # Visitor history
│   ├── login/              # Staff login
│   └── page.tsx            # Home page
├── lib/
│   ├── prisma.ts           # Prisma client
│   ├── session.ts          # Iron Session config with roles
│   ├── rbac.ts             # Role-based access control helpers
│   ├── utils.ts            # Utility functions
│   └── qr.ts               # QR code generation
├── prisma/
│   └── schema.prisma       # Database schema (Site, Warehouse, User, Visitor)
├── public/
│   └── manifest.json       # PWA manifest
└── scripts/
    └── seed.ts             # Database seeder
```

## Scripts

- `npm run dev` - Start development server on port 3847
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup` - Generate Prisma client, push schema, and seed database
- `npm run db:studio` - Open Prisma Studio

## Database Schema

### Site
- `id`, `name`, `code` (optional, unique), timestamps

### Warehouse
- `id`, `siteId` (FK), `code` (unique company-wide), `name`, `isActive`, timestamps

### User
- `id`, `username` (unique), `password`, `name`, `role` (SUPER_ADMIN/SITE_ADMIN/STOREKEEPER)
- `siteId` (nullable, required for SITE_ADMIN)
- Many-to-many relation with Warehouse for STOREKEEPER assignments

### Visitor
- `id`, `warehouseId` (FK, optional for legacy visitors), visitor details, `status`, timestamps
- **Note**: The seed script backfills legacy visitors (with null/empty `warehouseId`) to the default warehouse (KCH01)

## License

MIT
