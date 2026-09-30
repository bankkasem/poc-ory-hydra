const adminUrl = Bun.env.HYDRA_ADMIN_URL;
const clientId = Bun.env.OAUTH_CLIENT_ID;
const redirectUri = Bun.env.OAUTH_REDIRECT_URI;

if (!adminUrl || !clientId || !redirectUri) {
  throw new Error("Hydra admin URL and OAuth client settings are required");
}

const client = {
  client_id: clientId,
  client_name: Bun.env.OAUTH_CLIENT_NAME ?? clientId,
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  scope: "openid profile offline_access",
  redirect_uris: [redirectUri],
  allowed_cors_origins: [new URL(redirectUri).origin],
  token_endpoint_auth_method: "none",
  skip_consent: true,
};

const clientUrl = new URL(`/admin/clients/${clientId}`, adminUrl);
const existing = await fetch(clientUrl);
if (!existing.ok && existing.status !== 404) {
  throw new Error(
    `Unable to read OAuth client ${clientId}: ${existing.status}`,
  );
}

const response = await fetch(
  existing.status === 404 ? new URL("/admin/clients", adminUrl) : clientUrl,
  {
    method: existing.status === 404 ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(client),
  },
);

if (!response.ok) {
  throw new Error(
    `Unable to configure OAuth client ${clientId}: ${response.status}`,
  );
}

console.log(`OAuth client ${clientId} is ready`);
