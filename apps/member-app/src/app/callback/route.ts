import { type NextRequest, NextResponse } from "next/server";
import { authConfig, secureCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const config = authConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(config.cookies.state)?.value;
  const codeVerifier = request.cookies.get(config.cookies.verifier)?.value;

  if (!code || !state || state !== expectedState || !codeVerifier) {
    return new Response("Invalid OAuth callback", { status: 400 });
  }

  const exchange = await fetch(`${config.backendUrl}/auth/oauth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: config.clientId,
      code,
      codeVerifier,
      redirectUri: config.redirectUri,
    }),
  });
  const data = await exchange.json();
  if (!exchange.ok || typeof data.sessionId !== "string") {
    return new Response("Unable to create session", { status: 401 });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(config.cookies.session, data.sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: secureCookie,
  });
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
