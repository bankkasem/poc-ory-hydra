import { expect, test } from "bun:test";
import { createAuthorizationRequest, createCodeChallenge } from ".";

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
