function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function oauthConfig() {
  return {
    hydraPublicUrl: required(
      "NEXT_PUBLIC_HYDRA_PUBLIC_URL",
      process.env.NEXT_PUBLIC_HYDRA_PUBLIC_URL,
    ),
    clientId: required(
      "NEXT_PUBLIC_OAUTH_CLIENT_ID",
      process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID,
    ),
    redirectUri: required(
      "NEXT_PUBLIC_OAUTH_REDIRECT_URI",
      process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI,
    ),
  };
}

export const oauthStorage = {
  verifier: "oauth.pkce_verifier",
  state: "oauth.state",
  accessToken: "oauth.access_token",
} as const;

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

export async function beginAuthorization() {
  const config = oauthConfig();
  const verifier = randomValue();
  const state = randomValue();
  const challenge = await createCodeChallenge(verifier);

  sessionStorage.setItem(oauthStorage.verifier, verifier);
  sessionStorage.setItem(oauthStorage.state, state);

  const authorizationUrl = new URL("/oauth2/auth", config.hydraPublicUrl);
  authorizationUrl.search = new URLSearchParams({
    client_id: config.clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid profile",
    state,
  }).toString();

  window.location.assign(authorizationUrl);
}

export async function exchangeCode(code: string) {
  const config = oauthConfig();
  const verifier = sessionStorage.getItem(oauthStorage.verifier);
  if (!verifier) throw new Error("ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเริ่มใหม่");

  const response = await fetch(`${config.hydraPublicUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });
  const data: unknown = await response.json();
  if (
    !response.ok ||
    typeof data !== "object" ||
    data === null ||
    !("access_token" in data) ||
    typeof data.access_token !== "string"
  ) {
    throw new Error("ไม่สามารถเข้าสู่ระบบได้");
  }

  sessionStorage.removeItem(oauthStorage.verifier);
  sessionStorage.removeItem(oauthStorage.state);
  return data.access_token;
}
