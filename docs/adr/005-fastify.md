# ADR 005: Fastify as API Framework

**Status:** Accepted

## Context

We need a high-performance, extensible web framework for building the REST API with support for TypeScript, WebSockets, and plugin architecture.

## Decision

We will use Fastify as the web framework for our API server.

## Consequences

### Positive
- Excellent performance (one of the fastest Node.js frameworks)
- Native TypeScript support
- Rich plugin ecosystem
- Built-in schema validation with JSON Schema
- Comprehensive logging and error handling
- WebSocket support via plugins

### Negative
- Smaller community compared to Express
- Different patterns from Express (requires learning)
- Some third-party middleware not compatible
