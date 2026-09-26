# Harrisons Warehouse Visitor Registration System

A Progressive Web App (PWA) for managing visitor check-in and check-out across multiple warehouses with role-based access control (RBAC) and **physical visitor tags**.

## Features

- **Physical Visitor Tags**: Reusable QR-coded tags for streamlined group check-in
- **Group Visits**: One tag per group - first person fills full details, others just add their name
- **Multi-Warehouse Support**: Site → Warehouse hierarchy with per-warehouse tag management
- **Role-Based Access Control (RBAC)**: Three-tier user system (Super Admin, Site Admin, Storekeeper)
- **Storekeeper Dashboard**: View active tags, group checkout, search, time alerts
- **Tag Management**: Create, delete, and print tag labels for each warehouse
- **PWA Support**: Install as a mobile app for offline capability

## Visitor Tag Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      VISITOR TAG FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ARRIVAL                                                     │
│     ┌──────────┐                                                │
│     │ Visitor  │──► Asks storekeeper for a tag                  │
│     └──────────┘                                                │
│                                                                 │
│  2. CHECK-IN                                                    │
│     ┌──────────┐      ┌─────────────┐                           │
│     │   Tag    │──►   │  Scan QR    │──► Fill in details        │
│     │   [01]   │      │  on phone   │                           │
│     └──────────┘      └─────────────┘                           │
│                                                                 │
│     First person: Full form (name, company, purpose, vehicle)   │
│     Others: Just name (joins existing group)                    │
│                                                                 │
│  3. ON SITE                                                     │
│     Tag stays with the group - storekeeper can track them       │
│                                                                 │
│  4. DEPARTURE                                                   │
│     ┌──────────┐      ┌─────────────┐                           │
│     │ Visitor  │──►   │ Return tag  │──► Storekeeper checks     │
│     │  group   │      │ to keeper   │   out the whole group     │
│     └──────────┘      └─────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Benefits
- **No PINs or QR codes to remember** - visitors just scan the physical tag
- **Group visits simplified** - one tag for the whole group
- **Lost tag detection** - dashboard alerts for tags in use > 8 hours
- **Reusable** - tags are recycled when groups leave

## Hierarchy Structure

```
Company
├── Site (e.g., Sarawak Region)
│   ├── Warehouse (e.g., KCH01 - Kuching Main)
│   │   └── Tags (T01-T10)
│   ├── Warehouse (e.g., KCH02 - Kuching Cold Storage)
│   │   └── Tags (T01-T10)
│   └── Warehouse (e.g., SBU01 - Sibu Distribution)
│       └── Tags (T01-T10)
└── Site (e.g., Sabah Region)
    ├── Warehouse (e.g., KK01 - Kota Kinabalu Main)
    │   └── Tags (T01-T10)
    └── Warehouse (e.g., SDK01 - Sandakan)
        └── Tags (T01-T10)
```

## User Roles

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **SUPER_ADMIN** | Full system | Create sites & warehouses; manage tags; create Site Admins; view all data |
| **SITE_ADMIN** | One site | Manage tags and Storekeepers within assigned site |
| **STOREKEEPER** | Assigned warehouses | Check out visitors; view dashboard for assigned warehouses |

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

## Tag URLs

Visitors scan the QR code on a physical tag, which links to:

```
/tag/[TAG_CODE]
```

### Example Tag URLs

| URL | Warehouse | Tag |
|-----|-----------|-----|
| `/tag/KCH01-T01` | Kuching Main Warehouse | Tag 01 |
| `/tag/KCH01-T05` | Kuching Main Warehouse | Tag 05 |
| `/tag/KCH02-T01` | Kuching Cold Storage | Tag 01 |
| `/tag/KK01-T03` | Kota Kinabalu Main | Tag 03 |

## Printing Tag Labels

1. Log in as SUPER_ADMIN or SITE_ADMIN
2. Go to **Admin → Tags**
3. Optionally filter to one warehouse
4. Click **Print Labels** (or **Print these** on a single warehouse) to open the label sheet

Each label includes:
- QR code at least 3cm square, linking to the production tag URL
- Tag number about 2cm tall, printed beside the QR code
- Tag code (e.g., "KCH01-T01")
- Warehouse name
- "Scan to check in" instruction

Labels are laid out for A4, two across, with dashed cut lines and a page margin. The QR code uses `NEXT_PUBLIC_SITE_URL` when that variable is set, so a label printed from a preview deployment still points at production. When it is unset, the QR code uses the current site origin.

Print on adhesive label paper and attach to durable physical tags (plastic cards, key fobs, etc.).

## Demo Accounts

### Super Admin
- **Username**: `superadmin`
- **Password**: `admin123`
- **Access**: Full system - manage all sites, warehouses, tags, and users

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
| `SETUP_SECRET` | Yes, to seed | Secret sent as `x-setup-secret` to `POST /api/admin/seed`. Required in every environment, including Vercel preview, because preview deployments use the production database |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public origin encoded in printed tag QR codes. Production value: `https://web-cs-visitor-registration.vercel.app`. Falls back to the current origin when unset |

### Deploy Steps

1. Connect your GitHub repository to Vercel
2. Add the required environment variables
3. Deploy - Vercel will automatically run `prisma generate` via the `postinstall` script
4. After deployment, seed the demo data:

```bash
curl -X POST https://your-app.vercel.app/api/admin/seed \
  -H "x-setup-secret: YOUR_SETUP_SECRET"
```

`POST /api/admin/seed` rejects the request when `x-setup-secret` is missing or does not match `SETUP_SECRET`. That check applies on preview deployments as well as production.

### Notes

- PWA is automatically disabled on Vercel (`VERCEL=1`) to avoid build issues with next-pwa
- The database schema is pushed automatically via Prisma; ensure `DATABASE_URL` is set before first deploy
- For production, generate a secure `SESSION_SECRET` (e.g., `openssl rand -base64 32`)

## Visitor Types

| Type | Fields | Purpose Options |
|------|--------|-----------------|
| EXTERNAL | Company, Vehicle Type, Car Plate (optional) | GENERAL, TRUCK |
| STAFF | Department | GENERAL (locked) |

The check-in form, dashboard, and history show these codes as words (External, Staff, General, Truck, Car, and so on). Dates are shown as DD/MM/YYYY.

## Visitor Status Flow

1. **ACTIVE**: Visitor is currently checked in (on a tag)
2. **COMPLETED**: Visitor checked out normally (legacy self-service)
3. **STAFF_CHECKOUT**: Visitor checked out by storekeeper (current flow)
4. **FORCE_COMPLETED**: Legacy status (displayed as "Checked out by staff")

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tag/[code]` | Get tag info and active group |
| POST | `/api/tag/[code]/checkin` | Check in via tag |
| GET | `/api/warehouse/[code]` | Validate warehouse code |

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Staff login |
| POST | `/api/auth/logout` | Staff logout |
| GET | `/api/auth/me` | Get current session |

### Dashboard Endpoints (Requires Authentication)
| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/tags/active` | Staff | Get active tags with visitors |
| POST | `/api/tags/[id]/checkout` | Staff | Check out tag (group or single) |
| GET | `/api/visitors` | Staff | List visitors (filtered by access) |
| DELETE | `/api/visitors/[id]` | Site Admin+ | Delete visitor record |

### Admin Endpoints
| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| GET/POST | `/api/admin/tags` | Site Admin+ | List/Create tags |
| DELETE | `/api/admin/tags/[id]` | Site Admin+ | Delete tag |
| GET/POST | `/api/admin/sites` | Super Admin | List/Create sites |
| GET/POST | `/api/admin/warehouses` | Site Admin+ | List/Create warehouses |
| GET/POST | `/api/admin/users` | Site Admin+ | List/Create users |
| POST | `/api/admin/seed` | SETUP_SECRET | Seed demo data |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── admin/          # Admin APIs (sites, warehouses, users, tags, seed)
│   │   ├── auth/           # Authentication APIs
│   │   ├── tag/            # Tag check-in APIs
│   │   ├── tags/           # Active tags API
│   │   ├── visitor/        # Visitor details API
│   │   ├── visitors/       # Visitors list & delete API
│   │   └── warehouse/      # Warehouse validation API
│   ├── admin/              # Admin console pages
│   │   ├── page.tsx        # Super Admin console
│   │   ├── site/           # Site Admin console
│   │   ├── tags/           # Tag management
│   │   └── users/          # User management
│   ├── tag/
│   │   ├── [tagCode]/      # Tag check-in page
│   │   └── success/        # Check-in success page
│   ├── checkin/            # Legacy check-in (redirects to tag info)
│   ├── checkout/           # Legacy checkout (info message)
│   ├── dashboard/          # Staff dashboard
│   │   ├── page.tsx        # Active tags view
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
│   └── schema.prisma       # Database schema (Site, Warehouse, Tag, User, Visitor)
├── public/
│   └── manifest.json       # PWA manifest
└── scripts/
    └── seed.ts             # Database seeder (creates 10 tags per warehouse)
```

## Database Schema

### Site
- `id`, `name`, `code` (optional, unique), timestamps

### Warehouse
- `id`, `siteId` (FK), `code` (unique company-wide), `name`, `isActive`, timestamps

### Tag
- `id`, `warehouseId` (FK), `code` (unique, e.g., "KCH01-T01"), `displayNumber` (e.g., "01"), timestamps

### User
- `id`, `username` (unique), `password`, `name`, `role` (SUPER_ADMIN/SITE_ADMIN/STOREKEEPER)
- `siteId` (nullable, required for SITE_ADMIN)
- Many-to-many relation with Warehouse for STOREKEEPER assignments

### Visitor
- `id`, `warehouseId` (FK), `tagId` (FK, nullable), `isGroupLeader` (boolean)
- Visitor details: `name`, `visitorType`, `company`, `department`, `purpose`, `carPlate`, `vehicleType`
- `pin`, `browserToken` (for legacy compatibility)
- `status` (ACTIVE/COMPLETED/STAFF_CHECKOUT/FORCE_COMPLETED)
- `timeIn`, `timeOut`, `checkoutBy`, `remarks`, timestamps

## Scripts

- `npm run dev` - Start development server on port 3847
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup` - Generate Prisma client, push schema, and seed database
- `npm run db:studio` - Open Prisma Studio

## License

MIT
