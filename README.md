# Ory Hydra POC

Minimal Bun monorepo for learning how an existing application integrates with Ory Hydra.

See [Authentication flow](./auth-flow.mmd) for the current login, SSO, and refresh-token sequence.

## Apps

- `apps/auth-app` — central login and consent UI
- `apps/main-app` — primary protected application and OAuth client
- `apps/member-app` — protected member application and OAuth client
- `apps/backend` — Bun HTTP API

## Development

Local setup requires Bun, Task, Docker, OpenSSL, and jq.

```bash
task setup
bun run dev
```

Auth App runs on <http://localhost:3000>, Main App on <http://localhost:3002>, Member App on <http://localhost:3003>, and the backend health check is available on <http://localhost:3001/health>.

Hydra exposes its public API on <http://localhost:4444> and admin API on <http://localhost:4445>. MySQL listens on `localhost:3306` and contains separate `app_db` and `hydra_db` databases.

`task setup` creates or updates the Main App and Member App public OAuth clients and is safe to run again after changing their local configuration.

Main App and Member App store access and refresh tokens in an AES-256-GCM encrypted `HttpOnly` cookie. Each Next.js BFF exchanges and refreshes its own tokens; the backend accepts Bearer access tokens and verifies them with Hydra. Application sessions need no database table.

`OAUTH_COOKIE_SECRET` is a separate 32-byte hex key per app. `task setup` generates missing keys in each app's `.env.local` and preserves existing keys. For deployment, keep keys in server environment variables and use HTTPS; you can generate keys with `openssl rand -hex 32`. Cookies have an absolute 30-day lifetime matching the configured Hydra refresh-token lifetime. Changing a key invalidates that app's cookies.

An expired access token redirects through the app's `/refresh` Route Handler, which writes the rotated tokens into a new cookie before returning to the page. Hydra allows a 10-second refresh-token grace period for overlapping requests. This is a bounded retry window, not a guarantee for every concurrent request or delayed response.

Existing `oauth_sessions` tables from the earlier implementation are no longer read or written. Setup preserves those tables and their data; a fresh installation does not create them.

Run `task setup:fresh` to verify setup from empty Docker volumes. It asks for confirmation before deleting local MySQL and Hydra data.

The local seed user is `0812345678` with verification code `123456`. The code is stored as an Argon2id hash, not plaintext.

Verify the seed credentials through the backend:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"loginChallenge":"from-hydra","phoneNumber":"0812345678","verificationCode":"123456"}'
```

MySQL runs `docker/mysql/init.sql` only when its data volume is first created. Hydra creates and updates its own tables through the `hydra-migrate` service each time the stack starts. After changing Hydra configuration, run `docker compose restart hydra`.

```bash
docker compose down
```

The committed credentials and secrets are for local development only.
