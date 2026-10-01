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

Auth App runs on <http://localhost:3001>, Main App on <http://localhost:3002>, Member App on <http://localhost:3003>, and the backend health check is available on <http://localhost:3000/health>.

Hydra exposes its public API on <http://localhost:4444> and admin API on <http://localhost:4445>. The local infrastructure is split into two independent Compose projects:

- `compose.app.yaml` — project `poc-app`; `app-mysql` simulates the existing application database (`app_db`) on `localhost:3306`.
- `compose.hydra.yaml` — project `poc-hydra`; `hydra-mysql`, `hydra-migrate`, and `hydra` form the new OAuth stack. Its database (`hydra_db`) has a separate user and volume, accessible locally on `127.0.0.1:3307` for tools such as TablePlus (user `hydra`, password `local-hydra-password`).

Hydra does not connect to `app_db`. The backend reads application users and communicates with Hydra through its Admin API. Each Compose project has its own network; they do not need a shared Docker network because the applications run on the host.

For an existing checkout, run `docker compose -p poc-ory-hydra -f compose.app.yaml down --remove-orphans` once before `task setup` to stop the old containers under the original project name. Do not add `--volumes`. The App DB project explicitly reuses the `poc-ory-hydra_mysql-data` volume, preserving existing users and any old tables. Compose may warn that this volume belongs to the old project; its reuse is intentional. Hydra starts with a new database; previous clients, sessions, and tokens are not copied. Setup registers the clients again, and users must log in again. A fresh App DB contains only application tables.

`task setup` creates or updates the Main App and Member App public OAuth clients and is safe to run again after changing their local configuration.

Main App and Member App store access and refresh tokens in an AES-256-GCM encrypted `HttpOnly` cookie. Each Next.js BFF exchanges and refreshes its own tokens; the backend accepts Bearer access tokens and verifies them with Hydra. Application sessions need no database table.

`OAUTH_COOKIE_SECRET` is a separate 32-byte hex key per app. `task setup` generates missing keys in each app's `.env.local` and preserves existing keys. For deployment, keep keys in server environment variables and use HTTPS; you can generate keys with `openssl rand -hex 32`. Cookies have an absolute 30-day lifetime matching the configured Hydra refresh-token lifetime. Changing a key invalidates that app's cookies.

An expired access token redirects through the app's `/refresh` Route Handler, which writes the rotated tokens into a new cookie before returning to the page. Hydra allows a 10-second refresh-token grace period for overlapping requests. This is a bounded retry window, not a guarantee for every concurrent request or delayed response.

Existing `oauth_sessions` tables from the earlier implementation are no longer read or written. Setup preserves those tables and their data; a fresh installation does not create them.

Run `task setup:fresh` to verify setup from empty Docker volumes. It asks for confirmation before deleting local MySQL and Hydra data.

The local seed user is `0812345678` with verification code `123456`. The code is stored as an Argon2id hash, not plaintext.

Verify the seed credentials through the backend:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"loginChallenge":"from-hydra","phoneNumber":"0812345678","verificationCode":"123456"}'
```

App MySQL runs `database/init.sql` only when its data volume is first created. Hydra MySQL creates `hydra_db` and its database user through the MySQL image's environment variables; `hydra-migrate` creates and updates Hydra's tables before Hydra starts. All Hydra configuration is in `compose.hydra.yaml`, with no mounted configuration file. After changing it, run `task setup` again so Compose recreates the affected containers; a plain restart does not apply changed environment variables.

```bash
docker compose -f compose.hydra.yaml down
docker compose -f compose.app.yaml down
```

The committed credentials and secrets are for local development only.

## ECS deployment reference

`compose.hydra.yaml` is a local reference, not an ECS deployment file:

- Map Hydra's image, command, and non-secret environment variables to an ECS Task Definition.
- Use a separate database such as RDS instead of the local `hydra-mysql` container and volume.
- Inject `DSN` from Secrets Manager into the migration and Hydra tasks, and `SECRETS_SYSTEM` into the Hydra task. Keep the system secret stable across deployments.
- Run `hydra-migrate` as a one-off task and wait for successful completion before starting or updating the Hydra service; Compose's `depends_on` is not an ECS deployment workflow.
- Remove `--dev`, use real HTTPS issuer/login/consent URLs, and configure trusted TLS termination for the load balancer.
- Expose only the Public API to browsers. Keep the Admin API private and reachable only by authorized backend/setup tasks.
