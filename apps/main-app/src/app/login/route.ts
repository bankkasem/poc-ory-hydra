import { NextResponse } from "next/server";
import {
  authConfig,
  createAuthorizationRequest,
  secureCookie,
} from "@/lib/auth";

export async function GET() {
  const config = authConfig();
  const authorization = await createAuthorizationRequest(config);
  const response = NextResponse.redirect(authorization.authorizationUrl);
  const options = {
    httpOnly: true,
    maxAge: 600,
    path: "/callback",
    sameSite: "lax" as const,
    secure: secureCookie,
  };

  response.cookies.set(
    config.cookies.verifier,
    authorization.verifier,
    options,
  );
  response.cookies.set(config.cookies.state, authorization.state, options);
  return response;
}
