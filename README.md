# Harrisons Warehouse Visitor Registration System

A Progressive Web App (PWA) for managing visitor check-in and check-out at Harrisons Warehouse.

## Features

- **Visitor Check-In**: Register visitors with name, type (EXTERNAL/STAFF), company/department, purpose, and car plate
- **QR Code Generation**: Unique QR code generated for each visitor for quick check-out
- **PIN-based Check-Out**: Secure 4-digit PIN verification for self-service check-out
- **Staff Dashboard**: View active visitors, visitor history, and force-complete capability
- **PWA Support**: Install as a mobile app for offline capability

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
4. After deployment, seed the demo user:

```bash
curl -X POST https://your-app.vercel.app/api/admin/seed \
  -H "x-setup-secret: YOUR_SETUP_SECRET"
```

### Notes

- PWA is automatically disabled on Vercel (`VERCEL=1`) to avoid build issues with next-pwa
- The database schema is pushed automatically via Prisma migrations; ensure `DATABASE_URL` is set before first deploy
- For production, generate a secure `SESSION_SECRET` (e.g., `openssl rand -base64 32`)

## Demo Credentials

- **Username**: `storekeeper`
- **Password**: `demo1234`

## Visitor Types

| Type | Fields | Purpose Options |
|------|--------|-----------------|
| EXTERNAL | Company, Car Plate (optional) | GENERAL, TRUCK |
| STAFF | Department | GENERAL (locked) |

## Visitor Status Flow

1. **ACTIVE**: Visitor has checked in
2. **COMPLETED**: Visitor checked out normally using PIN
3. **FORCE_COMPLETED**: Visitor checked out by staff (with remarks)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkin` | Register new visitor |
| POST | `/api/checkout` | Self-service check-out |
| GET | `/api/visitor/[id]` | Get visitor details with QR |
| GET | `/api/visitors` | List visitors (filter by status) |
| POST | `/api/visitors/[id]/force-complete` | Force complete a visit |
| POST | `/api/auth/login` | Staff login |
| POST | `/api/auth/logout` | Staff logout |
| GET | `/api/auth/me` | Get current session |

## Scripts

- `npm run dev` - Start development server on port 3847
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup` - Generate Prisma client, push schema, and seed database
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
├── app/
│   ├── api/           # API routes
│   ├── checkin/       # Check-in pages
│   ├── checkout/      # Check-out page
│   ├── dashboard/     # Staff dashboard
│   ├── login/         # Staff login
│   └── page.tsx       # Home page
├── lib/
│   ├── prisma.ts      # Prisma client
│   ├── session.ts     # Iron Session config
│   ├── utils.ts       # Utility functions
│   └── qr.ts          # QR code generation
├── prisma/
│   └── schema.prisma  # Database schema
├── public/
│   └── manifest.json  # PWA manifest
└── scripts/
    └── seed.ts        # Database seeder
```

## License

MIT
