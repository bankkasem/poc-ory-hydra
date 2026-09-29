# Backend

## Structure

```text
src/
├── index.ts
├── routes/                 HTTP routes and request schemas
└── services/
    ├── hydra/              Ory Hydra Admin API integration
    └── database/           MySQL integration
```

## Rules

1. Keep `Request`, `Response`, HTTP status codes, route paths, and Zod request schemas inside `routes/`.
2. Keep application and integration logic inside `services/`.
3. Keep SQL and database column names inside `services/database/`.
4. Keep Hydra URLs, payloads, and response validation inside `services/hydra/`.
5. Return camelCase values from services to routes.
6. Place each test next to the module it verifies.
