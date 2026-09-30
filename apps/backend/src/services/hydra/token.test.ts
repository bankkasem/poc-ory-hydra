import { expect, test } from "bun:test";
import {
  exchangeAuthorizationCode,
  introspectAccessToken,
  refreshTokens,
} from "./token";

test("exchanges an authorization code and rotates a refresh token", async () => {
  const originalFetch = globalThis.fetch;
  const previousUrl = Bun.env.HYDRA_PUBLIC_URL;
  Bun.env.HYDRA_PUBLIC_URL = "http://hydra.test";
  let requestCount = 0;

  globalThis.fetch = Object.assign(
    async (input: string | URL | Request, init?: RequestInit) => {
      requestCount += 1;
      expect(new URL(input.toString()).pathname).toBe("/oauth2/token");
      const body = new URLSearchParams(String(init?.body));

      if (requestCount === 1) {
        expect(body.get("grant_type")).toBe("authorization_code");
        expect(body.get("code_verifier")).toBe("v".repeat(43));
      } else {
        expect(body.get("grant_type")).toBe("refresh_token");
        expect(body.get("refresh_token")).toBe("refresh-1");
      }

      return Response.json({
        access_token: `access-${requestCount}`,
        refresh_token: `refresh-${requestCount}`,
        expires_in: 3600,
      });
    },
    { preconnect: originalFetch.preconnect },
  );

  try {
    expect(
      await exchangeAuthorizationCode({
        clientId: "poc-main-app",
        code: "code",
        codeVerifier: "v".repeat(43),
        redirectUri: "http://localhost:3002/callback",
      }),
    ).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 3600,
    });
    expect(await refreshTokens("poc-main-app", "refresh-1")).toEqual({
      accessToken: "access-2",
      refreshToken: "refresh-2",
      expiresIn: 3600,
    });
  } finally {
    globalThis.fetch = originalFetch;
    Bun.env.HYDRA_PUBLIC_URL = previousUrl;
  }
});

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
          ? { active: true, sub: "user-id" }
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
