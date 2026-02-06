# ADR 010: Schema-based Multi-tenancy

**Status:** Accepted

## Context

We need to support multiple tenants (customers) on the platform with strong data isolation, while maintaining reasonable performance and operational complexity.

## Decision

We will implement schema-based multi-tenancy where each tenant gets a dedicated PostgreSQL schema (e.g., `tenant_acme`, `tenant_techventures`).

## Consequences

### Positive
- Strong data isolation between tenants
- Easier to backup/restore individual tenants
- Can optimize indexes per tenant
- Simpler queries without tenant_id filtering
- Better security (accidental cross-tenant queries prevented by schema boundary)

### Negative
- More complex migrations (need to run per schema)
- Harder to query across tenants
- Connection management complexity
- More database objects to manage
- Need careful schema naming and management
