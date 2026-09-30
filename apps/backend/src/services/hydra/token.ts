import { z } from "zod";
import { hydraAdminUrl } from "./admin";

const introspectionSchema = z.object({
  active: z.boolean(),
  sub: z.string().optional(),
});
const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().int().positive(),
});

function hydraPublicUrl(path: string) {
  if (!Bun.env.HYDRA_PUBLIC_URL)
    throw new Error("HYDRA_PUBLIC_URL is required");
  return new URL(path, Bun.env.HYDRA_PUBLIC_URL);
}

async function requestTokens(body: URLSearchParams) {
  const response = await fetch(hydraPublicUrl("/oauth2/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return null;

  const tokens = tokenResponseSchema.parse(await response.json());
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  };
}

export function exchangeAuthorizationCode(input: {
  clientId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  return requestTokens(
    new URLSearchParams({
      client_id: input.clientId,
      code: input.code,
      code_verifier: input.codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
    }),
  );
}

export function refreshTokens(clientId: string, refreshToken: string) {
  return requestTokens(
    new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}

export async function introspectAccessToken(token: string) {
  const response = await fetch(hydraAdminUrl("/admin/oauth2/introspect"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  });
  if (!response.ok)
    throw new Error(`Hydra rejected introspection: ${response.status}`);

  const data = introspectionSchema.parse(await response.json());
  return data.active ? (data.sub ?? null) : null;
}
