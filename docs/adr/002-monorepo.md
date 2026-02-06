# ADR 002: Monorepo with pnpm Workspaces

**Status:** Accepted

## Context

We need to manage multiple packages (core, shared, db, api, monitoring, etc.) and applications (web-admin, web-customer, web-share) in a cohesive development environment.

## Decision

We will use a monorepo architecture managed by pnpm workspaces, with Turbo for build orchestration.

## Consequences

### Positive
- Shared code easily accessible across packages
- Atomic commits across multiple packages
- Simplified dependency management
- Fast, disk-efficient installations with pnpm
- Parallel builds and caching with Turbo

### Negative
- Initial setup complexity
- Need to manage inter-package dependencies carefully
- CI/CD pipelines need special handling for monorepos
