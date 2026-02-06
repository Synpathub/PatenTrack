# ADR 004: Drizzle ORM

**Status:** Accepted

## Context

We need a type-safe ORM that integrates well with TypeScript and provides good developer experience for database operations.

## Decision

We will use Drizzle ORM for database access and schema management.

## Consequences

### Positive
- Fully type-safe queries with TypeScript
- Lightweight and performant
- SQL-like syntax that's easy to understand
- Good migration tooling
- No runtime overhead

### Negative
- Smaller community compared to alternatives like Prisma
- Fewer learning resources available
- Need to write more SQL-like code compared to some ORMs
