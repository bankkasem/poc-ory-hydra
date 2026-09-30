function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function authConfig() {
  const clientId = required("OAUTH_CLIENT_ID", process.env.OAUTH_CLIENT_ID);
  return {
    backendUrl: required("BACKEND_URL", process.env.BACKEND_URL),
    clientId,
    hydraPublicUrl: required("HYDRA_PUBLIC_URL", process.env.HYDRA_PUBLIC_URL),
    redirectUri: required("OAUTH_REDIRECT_URI", process.env.OAUTH_REDIRECT_URI),
    cookies: {
      session: `${clientId}_session`,
      state: `${clientId}_state`,
      verifier: `${clientId}_verifier`,
    },
  };
}

export const secureCookie = process.env.NODE_ENV === "production";
