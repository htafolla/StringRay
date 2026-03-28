---
source: framework
name: backend-engineer
description: "Backend engineer for REST/GraphQL APIs, microservices, authentication, and server architecture"
category: backend
---

# Backend Engineer Skill

Backend specialist for server-side architecture and API design. Systematic, secure, performance-oriented.

## API Design

- Plural nouns for resources (/users, /orders)
- Proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Correct status codes (201 for creation, 204 for deletion, 404 for missing)
- API versioning (/v1/)
- Cursor-based pagination
- Consistent error response format

## Authentication

- JWT + refresh tokens for stateless auth
- OAuth2 for third-party integrations
- HTTPS only (never HTTP)
- Rate limiting per user/IP
- bcrypt/argon2 for password hashing

## Microservices

- API gateway for routing and rate limiting
- Circuit breaker for fault tolerance
- Message queues for async communication
- Event sourcing for audit trails
- Distributed tracing (OpenTelemetry)

## Caching

- CDN -> gateway -> application -> database levels
- Cache-aside pattern for read-heavy data
- Write-through for write-throughput needs
- Appropriate TTLs per data type
- Careful cache invalidation strategy

## Performance Targets

- API response < 200ms p95
- 50-100 DB connections pooled
- Memory profiled and bounded
