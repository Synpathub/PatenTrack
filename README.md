# PatenTrack

> B2B Patent Intelligence Platform - Monorepo Implementation

PatenTrack is a comprehensive SaaS platform for tracking patent ownership, transactions, and performing entity normalization across USPTO patent data. Built with TypeScript, PostgreSQL, and modern web technologies.

## Features

- 🏢 **Multi-tenant Architecture**: Schema-based isolation for enterprise customers
- 📊 **Patent Tracking**: Monitor patent ownership, transactions, and title chains
- 🤖 **Entity Normalization**: ML-powered company name standardization
- 🔍 **Advanced Search**: Full-text search across patents and entities
- 📈 **Analytics**: Ownership percentages, portfolio analysis, citation networks
- 🔐 **Secure**: Role-based access control, JWT authentication, rate limiting
- 🚀 **Scalable**: Horizontal scaling with PM2, PostgreSQL optimization
- 📱 **Modern UI**: React 18 + TypeScript for admin and customer portals

## Architecture

```
apps/
├── web-admin/         # Internal admin dashboard
├── web-customer/      # Customer portal
└── web-share/         # Public share view

packages/
├── core/              # Shared types, enums, schemas
├── shared/            # Logger, config utilities
├── db/                # Drizzle ORM, migrations, seeds
├── api/               # Fastify API server
├── monitoring/        # Health checks, log scanning
├── ingestion/         # USPTO data ingestion (Phase P2)
├── processing/        # Entity normalization (Phase P3)
└── scheduler/         # Cron jobs (Phase P4)

infrastructure/
├── docker-compose.yml  # PostgreSQL, Redis
├── ecosystem.config.js # PM2 configuration
└── scripts/           # start.sh, stop.sh, deploy.sh
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3
- **Package Manager**: pnpm 8
- **Build**: Turbo
- **API**: Fastify 4
- **Database**: PostgreSQL 16
- **ORM**: Drizzle
- **Cache**: Redis 7
- **Frontend**: React 18 + Vite
- **Validation**: Zod
- **Logging**: Pino
- **Process Manager**: PM2

## Prerequisites

- Node.js 20.0.0 or higher
- pnpm 8.0.0 or higher
- Docker & Docker Compose
- PM2 (for production)

## Getting Started

### 1. Install Dependencies

```bash
# Install pnpm globally if not already installed
npm install -g pnpm@8.15.4

# Install project dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL, REDIS_URL, JWT_SECRET, etc.
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis
cd infrastructure
docker-compose up -d
cd ..

# Wait for services to be ready
sleep 5
```

### 4. Database Setup

```bash
# Run migrations
pnpm db:migrate

# Seed database with sample data
pnpm db:seed
```

### 5. Build Packages

```bash
# Build all packages
pnpm build
```

### 6. Start Development

```bash
# Start all services in development mode
pnpm dev

# Or start API server only
pnpm --filter @patentrack/api dev

# Or start a frontend app
pnpm --filter @patentrack/web-admin dev
```

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @patentrack/api test

# Run tests in watch mode
pnpm --filter @patentrack/core test -- --watch
```

### Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check

# Format code
pnpm format
```

### Adding Dependencies

```bash
# Add to specific package
pnpm --filter @patentrack/api add fastify

# Add dev dependency
pnpm --filter @patentrack/api add -D @types/node

# Add to root (dev dependencies only)
pnpm add -D -w vitest
```

## Production Deployment

### Using PM2

```bash
# Build for production
pnpm build

# Start with PM2
pm2 start infrastructure/ecosystem.config.js

# View logs
pm2 logs

# Stop services
pm2 stop infrastructure/ecosystem.config.js
```

### Using Scripts

```bash
# Start everything (Docker + PM2)
./infrastructure/scripts/start.sh

# Stop everything
./infrastructure/scripts/stop.sh

# Deploy (pull, build, migrate, restart)
./infrastructure/scripts/deploy.sh
```

## API Documentation

### Base URL

Development: `http://localhost:3001`

### Authentication

All API requests (except public endpoints) require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Auth

- `POST /auth/login` - User login
- `POST /auth/admin/login` - Admin login
- `POST /auth/register` - Register new user
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/profile` - Get user profile

#### Health

- `GET /health` - Basic health check
- `GET /ready` - Detailed readiness check

### Example Usage

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"admin123"}'

# Get profile
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer <token>"
```

## Database Schema

### Public Schema

- `tenants` - Tenant organizations
- `users` - User accounts
- `ingestion_jobs` - Data ingestion tracking
- `global_normalizations` - Global entity mappings
- `maintenance_codes` - USPTO maintenance codes
- `cpc_hierarchy` - CPC classification hierarchy

### Tenant Schema (per tenant)

- `companies` - Normalized companies
- `patents` - Patent records
- `transactions` - Ownership transactions
- `entities` - Raw entity names
- `normalized_entities` - Entity normalization results
- `inventors` - Patent inventors
- `patent_inventors` - Patent-inventor relationships
- `patent_families` - Patent family groupings
- `cpc_assignments` - CPC classifications
- `cited_patents` - Patent citations
- `title_chains` - Ownership chains
- `share_links` - Public sharing links
- `law_firms` - Law firm records
- `patent_law_firms` - Patent-law firm relationships
- `normalization_audit` - Normalization review
- `collections` - User-created collections
- `collection_patents` - Collection membership
- `comments` - Patent comments
- `activity_log` - User activity tracking

## Seeded Data

After running `pnpm db:seed`, you can login with:

### Admin User
- Email: `admin@acme.com`
- Password: `admin123`

### Regular User
- Email: `john.doe@acme.com`
- Password: `user123`

## Project Structure

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Types/Interfaces**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Code Standards

- Strict TypeScript mode enabled
- No `any` types allowed
- Named exports only (no default exports)
- Comprehensive JSDoc for public APIs
- No `// TODO` comments in production code

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs patentrack-postgres

# Reset database
docker-compose down -v
docker-compose up -d
pnpm db:migrate
pnpm db:seed
```

### Build Issues

```bash
# Clean all build artifacts
pnpm clean

# Remove node_modules and reinstall
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install

# Rebuild
pnpm build
```

### Port Conflicts

If ports 3000, 3001, 5432, or 6379 are in use:

1. Stop conflicting services
2. Update ports in .env and docker-compose.yml
3. Restart services

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## Documentation

- [Architecture Overview](docs/architecture/README.md)
- [ADR 001: TypeScript](docs/adr/001-typescript.md)
- [ADR 002: Monorepo](docs/adr/002-monorepo.md)
- [ADR 003: PostgreSQL](docs/adr/003-postgresql.md)
- [ADR 004: Drizzle ORM](docs/adr/004-drizzle-orm.md)
- [ADR 005: Fastify](docs/adr/005-fastify.md)
- [ADR 006: React + Vite](docs/adr/006-react-vite.md)
- [ADR 007: Pino Logging](docs/adr/007-pino-logging.md)
- [ADR 008: Zod Validation](docs/adr/008-zod-validation.md)
- [ADR 009: Docker Compose](docs/adr/009-docker-compose.md)
- [ADR 010: Multi-tenancy](docs/adr/010-multi-tenancy.md)

## License

Proprietary - All Rights Reserved

## Support

For support, email support@patentrack.com or open an issue on GitHub.
A patent portfolio oversight for C Suit
