import { expect, test } from "bun:test";
import { introspectAccessToken } from "./token";

test("introspects active and inactive access tokens", async () => {
  const originalFetch = globalThis.fetch;
  const previousUrl = Bun.env.HYDRA_ADMIN_URL;
  Bun.env.HYDRA_ADMIN_URL = "http://hydra.test";
  let requestCount = 0;

  globalThis.fetch = Object.assign(
    async (input: string | URL | Request, init?: RequestInit) => {
      requestCount += 1;
      expect(new URL(input.toString()).pathname).toBe(
        "/admin/oauth2/introspect",
      );
      expect(init?.method).toBe("POST");
      expect(new URLSearchParams(String(init?.body)).get("token")).toBe(
        requestCount === 1 ? "active-token" : "inactive-token",
      );

      return Response.json(
        requestCount === 1
          ? { active: true, sub: "user-id", token_use: "access_token" }
          : { active: false },
      );
    },
    { preconnect: originalFetch.preconnect },
  );

  try {
    expect(await introspectAccessToken("active-token")).toBe("user-id");
    expect(await introspectAccessToken("inactive-token")).toBeNull();
  } finally {
    globalThis.fetch = originalFetch;
    Bun.env.HYDRA_ADMIN_URL = previousUrl;
  }
});
