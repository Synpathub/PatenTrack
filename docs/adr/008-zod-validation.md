# ADR 008: Zod for Runtime Validation

**Status:** Accepted

## Context

We need runtime validation for API inputs, configuration, and data transformation with strong TypeScript integration.

## Decision

We will use Zod for schema validation and type inference.

## Consequences

### Positive
- TypeScript-first design
- Type inference from schemas
- Composable schema definitions
- Excellent error messages
- Can reuse schemas across frontend and backend

### Negative
- Additional validation overhead at runtime
- Schemas need to be maintained alongside types
- Learning curve for complex schemas
