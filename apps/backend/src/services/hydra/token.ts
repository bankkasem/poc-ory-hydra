import { z } from "zod";
import { hydraAdminUrl } from "./admin";

const introspectionSchema = z.object({
  active: z.boolean(),
  sub: z.string().optional(),
  token_use: z.string().optional(),
  ext: z.object({ loginSessionId: z.string().min(1).optional() }).optional(),
});
export async function introspectToken(token: string) {
  const response = await fetch(hydraAdminUrl("/admin/oauth2/introspect"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  });
  if (!response.ok)
    throw new Error(`Hydra rejected introspection: ${response.status}`);

  return introspectionSchema.parse(await response.json());
}

export async function introspectAccessToken(token: string) {
  const data = await introspectToken(token);
  return data.active && data.token_use === "access_token"
    ? (data.sub ?? null)
    : null;
}
