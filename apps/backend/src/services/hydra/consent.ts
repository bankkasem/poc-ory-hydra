import { z } from "zod";
import { hydraAdminUrl } from "./admin";

const consentResponseSchema = z.object({
  client: z.object({
    client_id: z.string(),
    client_name: z.string().nullish(),
  }),
  requested_scope: z.array(z.string()).default([]),
  requested_access_token_audience: z.array(z.string()).default([]),
  skip: z.boolean(),
});
const acceptConsentResponseSchema = z.object({
  redirect_to: z.string().url(),
});

function consentUrl(path: string, consentChallenge: string) {
  const url = hydraAdminUrl(path);
  url.searchParams.set("consent_challenge", consentChallenge);
  return url;
}

export async function getConsentRequest(consentChallenge: string) {
  const response = await fetch(
    consentUrl("/admin/oauth2/auth/requests/consent", consentChallenge),
  );
  if (!response.ok)
    throw new Error(`Hydra rejected consent request: ${response.status}`);

  const data = consentResponseSchema.parse(await response.json());
  return {
    client: {
      id: data.client.client_id,
      name: data.client.client_name ?? data.client.client_id,
    },
    requestedScopes: data.requested_scope,
    requestedAudience: data.requested_access_token_audience,
    skip: data.skip,
  };
}

export async function acceptConsent(consentChallenge: string) {
  const request = await getConsentRequest(consentChallenge);
  const response = await fetch(
    consentUrl("/admin/oauth2/auth/requests/consent/accept", consentChallenge),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_scope: request.requestedScopes,
        grant_access_token_audience: request.requestedAudience,
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Hydra rejected consent: ${response.status}`);

  return acceptConsentResponseSchema.parse(await response.json()).redirect_to;
}
