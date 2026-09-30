import { type NextRequest, NextResponse } from "next/server";
import {
  authConfig,
  decryptSession,
  encryptSession,
  requestTokens,
  sessionCookieOptions,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const config = authConfig();
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return new Response("Forbidden", { status: 403 });
  const session = await decryptSession(
    request.cookies.get(config.cookies.session)?.value,
    config.cookieSecret,
    config.clientId,
  );
  const response = NextResponse.redirect(new URL("/", config.redirectUri));
  response.headers.set("Cache-Control", "no-store");
  if (!session) {
    response.headers.set(
      "Location",
      new URL("/login", config.redirectUri).href,
    );
    response.cookies.set(config.cookies.session, "", {
      ...sessionCookieOptions,
      maxAge: 0,
    });
    return response;
  }
  if (session.expiresAt > Date.now() + 5_000) return response;

  const refreshed = await requestTokens(
    config.hydraPublicUrl,
    {
      client_id: config.clientId,
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    },
    session.sessionExpiresAt,
  );
  if (!refreshed) {
    response.headers.set(
      "Location",
      new URL("/login", config.redirectUri).href,
    );
    response.cookies.set(config.cookies.session, "", {
      ...sessionCookieOptions,
      maxAge: 0,
    });
    return response;
  }
  response.cookies.set(
    config.cookies.session,
    await encryptSession(refreshed, config.cookieSecret, config.clientId),
    {
      ...sessionCookieOptions,
      expires: new Date(refreshed.sessionExpiresAt),
    },
  );
  return response;
}
