# Ory Hydra POC

Minimal Bun monorepo for learning how an existing application integrates with Ory Hydra.

## Apps

- `apps/frontend` — Next.js frontend
- `apps/backend` — Bun HTTP API

## Development

```bash
bun install
cp apps/backend/.env.example apps/backend/.env.local
docker compose up -d
bun run dev
```

Frontend runs on <http://localhost:3000> and backend health check on <http://localhost:3001/health>.

Hydra exposes its public API on <http://localhost:4444> and admin API on <http://localhost:4445>. MySQL listens on `localhost:3306` and contains separate `app_db` and `hydra_db` databases.

Create the public OAuth client once after starting Docker:

```bash
docker compose exec hydra hydra create oauth2-client \
  --endpoint http://127.0.0.1:4445 \
  --id poc-frontend \
  --name "POC Frontend" \
  --grant-type authorization_code \
  --response-type code \
  --scope openid,profile \
  --redirect-uri http://localhost:3000/callback \
  --allowed-cors-origin http://localhost:3000 \
  --token-endpoint-auth-method none
```

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
