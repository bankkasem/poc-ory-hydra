import { type NextRequest, NextResponse } from "next/server";
import { authConfig, decryptSession, sessionCookieOptions } from "@/lib/auth";

function signedOut() {
  const config = authConfig();
  const response = NextResponse.redirect(
    new URL("/logged-out", config.redirectUri),
    303,
  );
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(config.cookies.session, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  for (const name of [config.cookies.state, config.cookies.verifier])
    response.cookies.set(name, "", { path: "/callback", maxAge: 0 });
  return response;
}

// Local cleanup after the backend has rejected the app's token.
export async function GET(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return new Response("Forbidden", { status: 403 });
  return signedOut();
}

export async function POST(request: NextRequest) {
  const config = authConfig();
  if (request.headers.get("origin") !== new URL(config.redirectUri).origin)
    return new Response("Forbidden", { status: 403 });
  const session = await decryptSession(
    request.cookies.get(config.cookies.session)?.value,
    config.cookieSecret,
    config.clientId,
  );
  if (!session) return signedOut();
  try {
    const response = await fetch(`${config.backendUrl}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.refreshToken}` },
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 409)
      return new Response("ไม่สามารถออกทุกแอปได้ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง", {
        status: 409,
      });
    if (!response.ok) throw new Error("Logout failed");
  } catch {
    return new Response("ไม่สามารถออกจากระบบได้ กรุณาลองอีกครั้ง", { status: 503 });
  }
  return signedOut();
}
