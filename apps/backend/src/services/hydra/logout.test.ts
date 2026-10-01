import { expect, test } from "bun:test";
import { logoutBrowserSession } from "./logout";
import { introspectAccessToken } from "./token";

test("logout revokes only the proven browser session, including paginated token chains", async () => {
  const originalFetch = globalThis.fetch;
  const previousUrl = Bun.env.HYDRA_ADMIN_URL;
  Bun.env.HYDRA_ADMIN_URL = "http://hydra.test";
  let active = true;
  let sid: string | undefined = "browser-a";
  let fail = false;
  const deleted: string[] = [];
  let pages = 0;
  globalThis.fetch = Object.assign(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input.toString());
      if (url.pathname.endsWith("/introspect"))
        return Response.json({
          active,
          sub: "same-user",
          token_use: "refresh_token",
          ext: { loginSessionId: sid },
        });
      if (fail) return new Response(null, { status: 503 });
      if (url.pathname.endsWith("/login")) {
        expect(pages).toBe(2);
        expect(init?.method).toBe("DELETE");
        expect(url.searchParams.get("sid")).toBe("browser-a");
        expect(url.searchParams.has("subject")).toBe(false);
        return new Response(null, { status: 204 });
      }
      if (init?.method === "DELETE") {
        expect(Array.from(url.searchParams.keys())).toEqual([
          "consent_request_id",
        ]);
        deleted.push(url.searchParams.get("consent_request_id") ?? "");
        return new Response(null, { status: 204 });
      }
      expect(url.searchParams.get("subject")).toBe("same-user");
      expect(url.searchParams.get("login_session_id")).toBe("browser-a");
      pages += 1;
      return url.searchParams.has("page_token")
        ? Response.json([{ consent_request_id: "member-a" }])
        : Response.json([{ consent_request_id: "main-a" }], {
            headers: {
              Link: '<http://hydra.test/admin/oauth2/auth/sessions/consent?page_token=second>; rel="next"',
            },
          });
    },
    { preconnect: originalFetch.preconnect },
  );
  try {
    expect(await logoutBrowserSession("refresh-a")).toBe("ok");
    expect(deleted).toEqual(["main-a", "member-a"]);
    expect(await introspectAccessToken("refresh-a")).toBeNull();
    fail = true;
    await expect(logoutBrowserSession("refresh-a")).rejects.toThrow("503");
    active = false;
    expect(await logoutBrowserSession("expired")).toBe("unauthorized");
    active = true;
    sid = undefined;
    expect(await logoutBrowserSession("legacy")).toBe("missing-session-id");
    expect(deleted).toEqual(["main-a", "member-a"]);
  } finally {
    globalThis.fetch = originalFetch;
    Bun.env.HYDRA_ADMIN_URL = previousUrl;
  }
});
