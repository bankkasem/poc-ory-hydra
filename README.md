# Ory Hydra POC

Minimal Bun monorepo for learning how an existing application integrates with Ory Hydra.

## Apps

- `apps/auth-app` — login, consent, and the first OAuth client
- `apps/new-app` — protected Next.js application and second OAuth client
- `apps/backend` — Bun HTTP API

## Development

```bash
task setup
bun run dev
```

Auth App runs on <http://localhost:3000>, New App runs on <http://localhost:3002>, and the backend health check is available on <http://localhost:3001/health>.

Hydra exposes its public API on <http://localhost:4444> and admin API on <http://localhost:4445>. MySQL listens on `localhost:3306` and contains separate `app_db` and `hydra_db` databases.

`task setup` creates or updates both public OAuth clients and is safe to run again after changing their local configuration.

Run `task setup:fresh` to verify setup from empty Docker volumes. It asks for confirmation before deleting local MySQL and Hydra data.

The local seed user is `0812345678` with verification code `123456`. The code is stored as an Argon2id hash, not plaintext.

Verify the seed credentials through the backend:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"loginChallenge":"from-hydra","phoneNumber":"0812345678","verificationCode":"123456"}'
```

MySQL runs `docker/mysql/init.sql` only when its data volume is first created. Hydra creates and updates its own tables through the `hydra-migrate` service each time the stack starts.

```bash
docker compose down
```

The committed credentials and secrets are for local development only.
