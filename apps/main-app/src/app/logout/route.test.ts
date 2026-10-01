import { expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { encryptSession } from "../../lib/auth";
import { GET, POST } from "./route";

test("logout requires same origin and keeps the cookie when global logout fails", async () => {
  const env = {
    BACKEND_URL: "http://backend.test",
    HYDRA_PUBLIC_URL: "http://hydra.test",
    OAUTH_CLIENT_ID: "main",
    OAUTH_REDIRECT_URI: "http://app.test/callback",
    OAUTH_COOKIE_SECRET: "12".repeat(32),
  };
  const previous = Object.fromEntries(
    Object.keys(env).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, env);
  const originalFetch = globalThis.fetch;
  let status = 503;
  let calls = 0;
  globalThis.fetch = Object.assign(
    async (_input: string | URL | Request, init?: RequestInit) => {
      calls += 1;
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer refresh-token",
      );
      return new Response(null, { status });
    },
    { preconnect: originalFetch.preconnect },
  );
  try {
    const cookie = await encryptSession(
      {
        accessToken: "expired-access",
        refreshToken: "refresh-token",
        expiresAt: Date.now() - 1,
        sessionExpiresAt: Date.now() + 60_000,
      },
      env.OAUTH_COOKIE_SECRET,
      "main",
    );
    const request = (origin = "http://app.test") =>
      new NextRequest("http://app.test/logout", {
        method: "POST",
        headers: { Origin: origin, Cookie: `main_session=${cookie}` },
      });
    expect((await POST(request("https://evil.test"))).status).toBe(403);
    expect(calls).toBe(0);
    for (status of [503, 401, 409]) {
      const response = await POST(request());
      expect(response.status).toBe(status === 503 ? 503 : 409);
      expect(response.headers.has("Set-Cookie")).toBe(false);
    }
    status = 204;
    const response = await POST(request());
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("http://app.test/logged-out");
    expect(response.headers.get("Set-Cookie")).toContain("main_session=;");
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(
      (
        await GET(
          new NextRequest("http://app.test/logout", {
            headers: { "sec-fetch-site": "cross-site" },
          }),
        )
      ).status,
    ).toBe(403);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
