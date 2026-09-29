import { z } from "zod";

const acceptLoginResponseSchema = z.object({ redirect_to: z.string().url() });

export async function acceptLogin(loginChallenge: string, subject: string) {
  if (!Bun.env.HYDRA_ADMIN_URL) throw new Error("HYDRA_ADMIN_URL is required");

  const url = new URL(
    "/admin/oauth2/auth/requests/login/accept",
    Bun.env.HYDRA_ADMIN_URL,
  );
  url.searchParams.set("login_challenge", loginChallenge);

  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject }),
  });

  if (!response.ok) throw new Error(`Hydra rejected login: ${response.status}`);
  return acceptLoginResponseSchema.parse(await response.json()).redirect_to;
}
