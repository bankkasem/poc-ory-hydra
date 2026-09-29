import { z } from "zod";
import { hydraAdminUrl } from "./admin";

const acceptLoginResponseSchema = z.object({ redirect_to: z.string().url() });

export async function acceptLogin(loginChallenge: string, subject: string) {
  const url = hydraAdminUrl("/admin/oauth2/auth/requests/login/accept");
  url.searchParams.set("login_challenge", loginChallenge);

  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject }),
  });

  if (!response.ok) throw new Error(`Hydra rejected login: ${response.status}`);
  return acceptLoginResponseSchema.parse(await response.json()).redirect_to;
}
