import { type NextRequest, NextResponse } from "next/server";
import {
  authConfig,
  encryptSession,
  requestTokens,
  sessionCookieOptions,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const config = authConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(config.cookies.state)?.value;
  const codeVerifier = request.cookies.get(config.cookies.verifier)?.value;

  if (!code || !state || state !== expectedState || !codeVerifier) {
    return new Response("Invalid OAuth callback", { status: 400 });
  }

  const session = await requestTokens(config.hydraPublicUrl, {
    client_id: config.clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });
  if (!session) {
    return new Response("Unable to create session", { status: 401 });
  }

  const response = NextResponse.redirect(new URL("/", config.redirectUri));
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(
    config.cookies.session,
    await encryptSession(session, config.cookieSecret, config.clientId),
    {
      ...sessionCookieOptions,
      expires: new Date(session.sessionExpiresAt),
    },
  );
  response.cookies.set(config.cookies.state, "", {
    maxAge: 0,
    path: "/callback",
  });
  response.cookies.set(config.cookies.verifier, "", {
    maxAge: 0,
    path: "/callback",
  });
  return response;
}
