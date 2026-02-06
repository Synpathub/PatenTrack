# PatenTrack Architecture

## Overview

PatenTrack is a B2B SaaS platform for patent intelligence and ownership tracking, built as a TypeScript monorepo with schema-based multi-tenancy.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Apps                            │
├──────────────────┬──────────────────┬─────────────────────────────┤
│   Web Admin      │  Web Customer    │      Web Share             │
│   (Internal)     │  (Customer)      │   (Public Read-only)       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   API Gateway   │
                   │    (Fastify)    │
                   └────────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼─────┐    ┌──────▼──────┐   ┌──────▼────────┐
    │Ingestion │    │ Processing  │   │  Monitoring   │
    │  Jobs    │    │   Engine    │   │    Service    │
    └────┬─────┘    └──────┬──────┘   └──────┬────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                   ┌────────▼────────┐
                   │   PostgreSQL    │
                   │  Multi-tenant   │
                   │  (Schema-based) │
                   └─────────────────┘
```

## Package Structure

### Core Packages

- **@patentrack/core**: Shared enums, types, Zod schemas, and error classes
- **@patentrack/shared**: Logger, config loader, and common utilities
- **@patentrack/db**: Drizzle ORM schemas, tenant manager, connection pool

### Service Packages

- **@patentrack/api**: Fastify API server with auth, rate limiting, WebSocket
- **@patentrack/monitoring**: Health checks, log scanning, GitHub issue reporting
- **@patentrack/ingestion**: USPTO data ingestion (Phase P2)
- **@patentrack/processing**: Entity normalization, title chains (Phase P3)
- **@patentrack/scheduler**: Cron jobs for automated tasks (Phase P4)

### Frontend Apps

- **@patentrack/web-admin**: Internal admin dashboard
- **@patentrack/web-customer**: Customer portal for patent management
- **@patentrack/web-share**: Public read-only patent sharing

## Multi-Tenancy Model

PatenTrack uses **schema-based multi-tenancy**:

- Each tenant gets a dedicated PostgreSQL schema (e.g., `tenant_acme`)
- Public schema contains: tenants, users, ingestion_jobs, global_normalizations
- Tenant schemas contain: patents, companies, transactions, etc.
- Strong data isolation with minimal query overhead

## Authentication & Authorization

- JWT-based authentication
- Three user roles: ADMIN, CUSTOMER_ADMIN, CUSTOMER_USER
- Role-based access control (RBAC) via Fastify preHandlers
- Admin-only routes for platform management

## Data Flow

### Ingestion Pipeline (Phase P2)
1. USPTO bulk data downloaded
2. Parsed and validated
3. Stored in tenant schema
4. Ingestion job status tracked

### Processing Pipeline (Phase P3)
1. Raw entity names extracted
2. ML-based normalization
3. Title chains computed
4. Ownership percentages calculated

### Query & Analytics
1. Customer accesses via web portal
2. API authenticates and routes to tenant schema
3. Data returned with computed fields
4. Real-time updates via WebSocket

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3
- **Package Manager**: pnpm 8
- **Build Tool**: Turbo
- **API**: Fastify 4
- **Database**: PostgreSQL 16
- **ORM**: Drizzle
- **Cache**: Redis 7
- **Frontend**: React 18 + Vite
- **Validation**: Zod
- **Logging**: Pino
- **Process Manager**: PM2
- **Containers**: Docker Compose

## Deployment

- PostgreSQL and Redis run in Docker containers
- API services managed by PM2 in cluster mode
- Frontend apps built to static assets
- CI/CD via GitHub Actions

## Security

- Environment variables for secrets
- bcrypt for password hashing
- JWT tokens with expiration
- Rate limiting per IP
- Schema-based tenant isolation
- Input validation with Zod

## Monitoring & Observability

- Health checks for all services
- Structured JSON logging with Pino
- Log scanning for errors
- Automated GitHub issue creation
- Daily health reports

## Scalability Considerations

- Horizontal scaling via PM2 cluster mode
- Connection pooling for database
- Redis for distributed caching
- Schema-based isolation allows per-tenant optimization
- Separate ingestion/processing services for background work

## Future Enhancements

- Phase P2: USPTO bulk ingestion
- Phase P3: ML-based entity normalization
- Phase P4: Advanced scheduling and automation
- Phase P5: Real-time collaboration features
- Phase P6: Advanced analytics and reporting
