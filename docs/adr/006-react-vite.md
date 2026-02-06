# ADR 006: React with Vite for Frontend

**Status:** Accepted

## Context

We need a modern, performant frontend framework and build tool for building three separate web applications (admin, customer portal, and share view).

## Decision

We will use React 18 as the UI framework and Vite as the build tool.

## Consequences

### Positive
- Large ecosystem and community support
- Component-based architecture
- Excellent developer experience with hot module replacement
- Vite provides extremely fast builds and dev server
- Type-safe with TypeScript

### Negative
- React bundle size larger than some alternatives
- Need to choose additional libraries for routing, state management
- Learning curve for complex state management patterns
