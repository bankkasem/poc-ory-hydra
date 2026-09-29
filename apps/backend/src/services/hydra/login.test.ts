import { expect, test } from "bun:test";
import { acceptLogin } from "./login";

test("accepts a Hydra login challenge", async () => {
  const originalFetch = globalThis.fetch;
  const previousUrl = Bun.env.HYDRA_ADMIN_URL;
  Bun.env.HYDRA_ADMIN_URL = "http://hydra.test";
  globalThis.fetch = Object.assign(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input.toString());
      expect(init?.method).toBe("PUT");
      expect(url.pathname).toBe("/admin/oauth2/auth/requests/login/accept");
      expect(url.searchParams.get("login_challenge")).toBe("challenge");
      expect(JSON.parse(String(init?.body))).toEqual({ subject: "user-id" });
      return Response.json({ redirect_to: "http://localhost:4444/continue" });
    },
    { preconnect: originalFetch.preconnect },
  );

  try {
    expect(await acceptLogin("challenge", "user-id")).toBe(
      "http://localhost:4444/continue",
    );
  } finally {
    globalThis.fetch = originalFetch;
    Bun.env.HYDRA_ADMIN_URL = previousUrl;
  }
});
