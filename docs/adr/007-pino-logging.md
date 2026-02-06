# ADR 007: Pino for Logging

**Status:** Accepted

## Context

We need a structured logging solution that provides good performance, JSON output for log aggregation, and TypeScript support.

## Decision

We will use Pino as the logging library across all packages.

## Consequences

### Positive
- Very fast (benchmarked as fastest Node.js logger)
- Structured JSON logging
- Easy to integrate with log aggregation systems
- Child loggers for context
- TypeScript support

### Negative
- JSON-only output requires processing for human readability
- Need separate tool for log viewing in development
