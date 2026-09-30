import { z } from "zod";
import { hydraAdminUrl } from "./admin";

const acceptLoginResponseSchema = z.object({ redirect_to: z.string().url() });
const loginRequestSchema = z.object({
  skip: z.boolean(),
  subject: z.string().nullish(),
});

function loginUrl(path: string, loginChallenge: string) {
  const url = hydraAdminUrl(path);
  url.searchParams.set("login_challenge", loginChallenge);
  return url;
}

export async function getLoginRequest(loginChallenge: string) {
  const response = await fetch(
    loginUrl("/admin/oauth2/auth/requests/login", loginChallenge),
  );
  if (!response.ok)
    throw new Error(`Hydra rejected login request: ${response.status}`);

  return loginRequestSchema.parse(await response.json());
}

export async function acceptLogin(loginChallenge: string, subject: string) {
  const response = await fetch(
    loginUrl("/admin/oauth2/auth/requests/login/accept", loginChallenge),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, remember: true, remember_for: 3600 }),
    },
  );

  if (!response.ok) throw new Error(`Hydra rejected login: ${response.status}`);
  return acceptLoginResponseSchema.parse(await response.json()).redirect_to;
}
