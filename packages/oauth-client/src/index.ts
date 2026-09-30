function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function randomValue() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(new Uint8Array(digest));
}

export async function createAuthorizationRequest(config: {
  hydraPublicUrl: string;
  clientId: string;
  redirectUri: string;
}) {
  const verifier = randomValue();
  const state = randomValue();
  const challenge = await createCodeChallenge(verifier);

  const authorizationUrl = new URL("/oauth2/auth", config.hydraPublicUrl);
  authorizationUrl.search = new URLSearchParams({
    client_id: config.clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid profile offline_access",
    state,
  }).toString();

  return { authorizationUrl, state, verifier };
}
