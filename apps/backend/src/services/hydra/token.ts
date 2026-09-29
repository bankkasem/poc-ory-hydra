import { z } from "zod";
import { hydraAdminUrl } from "./admin";

const introspectionSchema = z.object({
  active: z.boolean(),
  sub: z.string().optional(),
});

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
