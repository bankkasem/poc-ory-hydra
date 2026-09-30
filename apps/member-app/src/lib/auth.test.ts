import { expect, test } from "bun:test";
import {
  createAuthorizationRequest,
  createCodeChallenge,
  decryptSession,
  encryptSession,
  requestTokens,
} from "./auth";

test("creates the RFC 7636 S256 code challenge", async () => {
  expect(
    await createCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
  ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});

test("creates an authorization request for refresh tokens", async () => {
  const { authorizationUrl, state, verifier } =
    await createAuthorizationRequest({
      hydraPublicUrl: "http://localhost:4444",
      clientId: "poc-main-app",
      redirectUri: "http://localhost:3002/callback",
    });

  expect(authorizationUrl.searchParams.get("client_id")).toBe("poc-main-app");
  expect(authorizationUrl.searchParams.get("scope")).toBe(
    "openid profile offline_access",
  );
  expect(authorizationUrl.searchParams.get("state")).toBe(state);
  expect(verifier.length).toBeGreaterThanOrEqual(43);
});

const secret = "12".repeat(32);
const session = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: Date.now() + 3600_000,
  sessionExpiresAt: Date.now() + 720 * 3600_000,
};

test("encrypted cookies reject tampering, wrong app/key and expired sessions", async () => {
  const encrypted = await encryptSession(session, secret, "main");
  expect(encrypted).not.toContain(session.accessToken);
  expect(await decryptSession(encrypted, secret, "main")).toEqual(session);
  expect(await encryptSession(session, secret, "main")).not.toBe(encrypted);
  const bytes = Buffer.from(encrypted, "base64url");
  bytes[20] = (bytes[20] ?? 0) ^ 1;
  expect(
    await decryptSession(bytes.toString("base64url"), secret, "main"),
  ).toBeNull();
  expect(await decryptSession(encrypted, "34".repeat(32), "main")).toBeNull();
  expect(await decryptSession(encrypted, secret, "member")).toBeNull();
  expect(await decryptSession("old-uuid-session", secret, "main")).toBeNull();
  const expired = await encryptSession(
    { ...session, sessionExpiresAt: Date.now() - 1 },
    secret,
    "main",
  );
  expect(await decryptSession(expired, secret, "main")).toBeNull();
  await expect(
    encryptSession(
      { ...session, accessToken: "a".repeat(4000) },
      secret,
      "main",
    ),
  ).rejects.toThrow("cookie size");
});

test("token exchange preserves the absolute session expiry during rotation", async () => {
  const originalFetch = globalThis.fetch;
  let status = 200;
  globalThis.fetch = Object.assign(
    async (_input: string | URL | Request, init?: RequestInit) => {
      expect(init?.cache).toBe("no-store");
      expect(new URLSearchParams(String(init?.body)).get("refresh_token")).toBe(
        "refresh-old",
      );
      return Response.json(
        {
          access_token: "access-new",
          refresh_token: "refresh-new",
          expires_in: 3600,
        },
        { status },
      );
    },
    { preconnect: originalFetch.preconnect },
  );
  try {
    const parameters = {
      client_id: "main",
      grant_type: "refresh_token",
      refresh_token: "refresh-old",
    };
    const result = await requestTokens(
      "http://hydra.test",
      parameters,
      session.sessionExpiresAt,
    );
    expect(result?.refreshToken).toBe("refresh-new");
    expect(result?.sessionExpiresAt).toBe(session.sessionExpiresAt);
    status = 400;
    expect(await requestTokens("http://hydra.test", parameters)).toBeNull();
    status = 503;
    await expect(
      requestTokens("http://hydra.test", parameters),
    ).rejects.toThrow("503");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
