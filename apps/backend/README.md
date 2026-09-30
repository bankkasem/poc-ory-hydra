# Backend

## Structure

The backend is organized by technical responsibility rather than feature modules.

```text
src/
├── index.ts                    Server entry point
├── routes/                     HTTP layer
│   ├── auth.ts
│   └── auth.schemas.ts
└── services/
    ├── auth.ts                 Authentication logic
    ├── auth.test.ts
    ├── database/               MySQL integration
    │   └── users.ts
    └── hydra/                  Ory Hydra Admin API integration
        ├── admin.ts
        ├── login.ts
        ├── consent.ts
        ├── token.ts
        └── *.test.ts
```

## Rules

1. Keep `Request`, `Response`, HTTP status codes, route paths, and Zod request schemas inside `routes/`.
2. Keep application logic inside `services/`.
3. Keep SQL and database column names inside `services/database/`.
4. Keep Hydra URLs, payloads, and response validation inside `services/hydra/`.
5. Return camelCase values from services to routes.
6. Place each test next to the module it verifies.
