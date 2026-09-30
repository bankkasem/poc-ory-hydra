import { z } from "zod";

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
  sessionExpiresAt: z.number().int().positive(),
});
type TokenSession = z.infer<typeof sessionSchema>;

const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

export async function requestTokens(
  hydraPublicUrl: string,
  parameters: Record<string, string>,
  sessionExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000,
): Promise<TokenSession | null> {
  const response = await fetch(new URL("/oauth2/token", hydraPublicUrl), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parameters),
    cache: "no-store",
  });
  if (response.status === 400 || response.status === 401) return null;
  if (!response.ok)
    throw new Error(`Hydra token request failed: ${response.status}`);
  const tokens = tokenSchema.parse(await response.json());
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    sessionExpiresAt,
  };
}

async function encryptionKey(secret: string) {
  if (!/^[0-9a-f]{64}$/i.test(secret))
    throw new Error("OAUTH_COOKIE_SECRET must be a 32-byte hex key");
  const bytes = Uint8Array.from(secret.match(/../g) ?? [], (hex) =>
    Number.parseInt(hex, 16),
  );
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSession(
  session: TokenSession,
  secret: string,
  clientId: string,
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(clientId) },
    await encryptionKey(secret),
    new TextEncoder().encode(JSON.stringify(sessionSchema.parse(session))),
  );
  const value = Buffer.concat([iv, new Uint8Array(encrypted)]).toString(
    "base64url",
  );
  // Cookie names and attributes also count toward browser cookie limits.
  if (value.length > 3500)
    throw new Error("Encrypted token session exceeds cookie size limit");
  return value;
}

export async function decryptSession(
  value: string | undefined,
  secret: string,
  clientId: string,
) {
  const key = await encryptionKey(secret);
  if (!value || value.length > 3500) return null;
  try {
    const bytes = Buffer.from(value, "base64url");
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytes.subarray(0, 12),
        additionalData: new TextEncoder().encode(clientId),
      },
      key,
      bytes.subarray(12),
    );
    const session = sessionSchema.parse(
      JSON.parse(new TextDecoder().decode(plain)),
    );
    return session.sessionExpiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function base64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function randomValue() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(new Uint8Array(digest));
}

export async function createAuthorizationRequest(config: {
  hydraPublicUrl: string;
  clientId: string;
  redirectUri: string;
}) {
  const verifier = randomValue();
  const state = randomValue();
  const challenge = await createCodeChallenge(verifier);

  const authorizationUrl = new URL("/oauth2/auth", config.hydraPublicUrl);
  authorizationUrl.search = new URLSearchParams({
    client_id: config.clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid profile offline_access",
    state,
  }).toString();

  return { authorizationUrl, state, verifier };
}

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function authConfig() {
  const clientId = required("OAUTH_CLIENT_ID", process.env.OAUTH_CLIENT_ID);
  return {
    backendUrl: required("BACKEND_URL", process.env.BACKEND_URL),
    clientId,
    hydraPublicUrl: required("HYDRA_PUBLIC_URL", process.env.HYDRA_PUBLIC_URL),
    redirectUri: required("OAUTH_REDIRECT_URI", process.env.OAUTH_REDIRECT_URI),
    cookieSecret: required(
      "OAUTH_COOKIE_SECRET",
      process.env.OAUTH_COOKIE_SECRET,
    ),
    cookies: {
      session: `${clientId}_session`,
      state: `${clientId}_state`,
      verifier: `${clientId}_verifier`,
    },
  };
}

export const secureCookie = process.env.NODE_ENV === "production";

export const sessionCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: secureCookie,
};
