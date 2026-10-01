import { z } from "zod";
import { hydraAdminUrl } from "./admin";
import { introspectToken } from "./token";

const consentSessionsSchema = z.array(
  z.object({ consent_request_id: z.string().min(1) }),
);

export async function logoutBrowserSession(refreshToken: string) {
  const token = await introspectToken(refreshToken);
  if (!token.active || token.token_use !== "refresh_token" || !token.sub)
    return "unauthorized";
  const sid = token.ext?.loginSessionId;
  if (!sid) return "missing-session-id";

  // ponytail: Hydra's separate admin calls are not atomic with an in-flight authorization;
  // use coordinated session invalidation if strict concurrent logout is required.
  const url = hydraAdminUrl("/admin/oauth2/auth/sessions/consent");
  url.searchParams.set("subject", token.sub);
  url.searchParams.set("login_session_id", sid);
  url.searchParams.set("page_size", "100");
  const ids: string[] = [];
  let pageToken: string | null;
  do {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Hydra session lookup failed: ${response.status}`);
    ids.push(
      ...consentSessionsSchema
        .parse(await response.json())
        .map((session) => session.consent_request_id),
    );
    const next = response.headers.get("Link")?.match(/<([^>]+)>;\s*rel="next"/);
    pageToken = next?.[1]
      ? new URL(next[1], url).searchParams.get("page_token")
      : null;
    if (!pageToken) break;
    url.searchParams.set("page_token", pageToken);
  } while (pageToken);
  if (ids.length === 0)
    throw new Error(
      "Hydra has no token chains for this login session; log in again before retrying",
    );

  // Deleting the login session sets the consent flows' login_session_id to NULL.
  // Collect their IDs first, then end SSO before revoking those token chains.
  const loginUrl = hydraAdminUrl("/admin/oauth2/auth/sessions/login");
  loginUrl.searchParams.set("sid", sid);
  const ended = await fetch(loginUrl, { method: "DELETE" });
  if (!ended.ok) throw new Error(`Hydra logout failed: ${ended.status}`);

  for (const id of ids) {
    const revokeUrl = hydraAdminUrl("/admin/oauth2/auth/sessions/consent");
    revokeUrl.searchParams.set("consent_request_id", id);
    const response = await fetch(revokeUrl, { method: "DELETE" });
    if (!response.ok)
      throw new Error(`Hydra token revocation failed: ${response.status}`);
  }
  return "ok";
}
