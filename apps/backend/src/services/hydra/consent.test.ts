import { expect, test } from "bun:test";
import { acceptConsent, getConsentRequest } from "./consent";

const consentRequest = {
  client: {
    client_id: "poc-main-app",
    client_name: "Main App",
    skip_consent: true,
  },
  requested_scope: ["openid", "profile"],
  requested_access_token_audience: [],
  skip: false,
};

test("reads and accepts a Hydra consent challenge", async () => {
  const originalFetch = globalThis.fetch;
  const previousUrl = Bun.env.HYDRA_ADMIN_URL;
  Bun.env.HYDRA_ADMIN_URL = "http://hydra.test";
  globalThis.fetch = Object.assign(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input.toString());
      expect(url.searchParams.get("consent_challenge")).toBe("challenge");

      if (init?.method === "PUT") {
        expect(url.pathname).toBe("/admin/oauth2/auth/requests/consent/accept");
        expect(JSON.parse(String(init.body))).toEqual({
          grant_scope: ["openid", "profile"],
          grant_access_token_audience: [],
        });
        return Response.json({
          redirect_to: "http://localhost:4444/continue",
        });
      }

      expect(url.pathname).toBe("/admin/oauth2/auth/requests/consent");
      return Response.json(consentRequest);
    },
    { preconnect: originalFetch.preconnect },
  );

  try {
    expect(await getConsentRequest("challenge")).toEqual({
      client: { id: "poc-main-app", name: "Main App" },
      requestedScopes: ["openid", "profile"],
      requestedAudience: [],
      skip: true,
    });
    expect(await acceptConsent("challenge")).toBe(
      "http://localhost:4444/continue",
    );
  } finally {
    globalThis.fetch = originalFetch;
    Bun.env.HYDRA_ADMIN_URL = previousUrl;
  }
});
