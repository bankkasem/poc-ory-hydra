import { expect, test } from "bun:test";
import { decryptSession, encryptSession, requestTokens } from "./auth";

// Run with the Docker stack and all dev servers running:
// HYDRA_LOGOUT_E2E=1 bun test apps/main-app/src/lib/logout.integration.test.ts
for (const logoutPort of [3002, 3003])
  test.skipIf(Bun.env.HYDRA_LOGOUT_E2E !== "1")(
    `logout from port ${logoutPort} revokes both apps and rotated tokens without affecting another browser`,
    async () => {
      const suffix = crypto.randomUUID();
      const browsers = [`logout-a-${suffix}`, `logout-b-${suffix}`] as const;
      async function browser(session: string, ...args: string[]) {
        const process = Bun.spawn(
          ["bunx", "agent-browser", "--session", session, ...args],
          { stdout: "pipe", stderr: "pipe" },
        );
        const output = await new Response(process.stdout).text();
        if ((await process.exited) !== 0)
          throw new Error(
            `agent-browser command failed: ${args[0]} ${args[1] ?? ""}`,
          );
        return output;
      }
      async function cookieSecret(app: string) {
        const env = await Bun.file(
          new URL(`../../../${app}/.env.local`, import.meta.url),
        ).text();
        const secret = env.match(/^OAUTH_COOKIE_SECRET=(.+)$/m)?.[1]?.trim();
        if (!secret) throw new Error("Missing local cookie secret");
        return secret;
      }
      async function sessions(name: string) {
        const result = JSON.parse(
          await browser(name, "cookies", "get", "--json"),
        );
        const cookies = result.data.cookies as {
          name: string;
          value: string;
        }[];
        return Promise.all(
          ["main-app", "member-app"].map(async (app) => {
            const secret = await cookieSecret(app);
            const clientId = `poc-${app}`;
            const session = await decryptSession(
              cookies.find((cookie) => cookie.name === `${clientId}_session`)
                ?.value,
              secret,
              clientId,
            );
            if (!session) throw new Error("Missing browser session");
            return session;
          }),
        );
      }
      const me = (token: string) =>
        fetch("http://localhost:3000/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
      try {
        for (const name of browsers) {
          await browser(name, "open", "http://localhost:3002");
          expect(await browser(name, "snapshot", "-i")).toContain("ยืนยันตัวตน");
          await browser(
            name,
            "find",
            "role",
            "button",
            "click",
            "--name",
            "ยืนยันตัวตน",
          );
          await browser(name, "wait", "--url", "http://localhost:3002/");
          await browser(name, "open", "http://localhost:3003");
          expect(await browser(name, "snapshot", "-i")).toContain("จัดการสมาชิก");
        }
        const [mainA, memberA] = await sessions(browsers[0]);
        const other = await sessions(browsers[1]);
        if (!mainA || !memberA) throw new Error("Missing app sessions");
        for (const session of [mainA, memberA, ...other])
          expect((await me(session.accessToken)).status).toBe(200);
        expect((await me(mainA.refreshToken)).status).toBe(401);
        const rotated = await requestTokens(
          "http://localhost:4444",
          {
            client_id: "poc-member-app",
            grant_type: "refresh_token",
            refresh_token: memberA.refreshToken,
          },
          memberA.sessionExpiresAt,
        );
        if (!rotated) throw new Error("Refresh failed before logout");
        await browser(
          browsers[0],
          "cookies",
          "set",
          "poc-member-app_session",
          await encryptSession(
            rotated,
            await cookieSecret("member-app"),
            "poc-member-app",
          ),
          "--url",
          "http://localhost:3003",
          "--httpOnly",
          "--sameSite",
          "Lax",
        );
        const rejected = await fetch("http://localhost:3002/logout", {
          method: "POST",
          headers: { Origin: "https://untrusted.example" },
          redirect: "manual",
        });
        expect(rejected.status).toBe(403);
        expect((await me(mainA.accessToken)).status).toBe(200);

        await browser(browsers[0], "open", `http://localhost:${logoutPort}`);
        expect(await browser(browsers[0], "snapshot", "-i")).toContain(
          "ออกจากระบบ",
        );
        await browser(
          browsers[0],
          "find",
          "role",
          "button",
          "click",
          "--name",
          "ออกจากระบบ",
        );
        await browser(
          browsers[0],
          "wait",
          "--url",
          `http://localhost:${logoutPort}/logged-out`,
        );
        expect(await browser(browsers[0], "snapshot", "-i")).toContain(
          "ออกจากระบบแล้ว",
        );
        for (const session of [mainA, memberA, rotated]) {
          expect((await me(session.accessToken)).status).toBe(401);
          const refreshed = await requestTokens("http://localhost:4444", {
            client_id: session === mainA ? "poc-main-app" : "poc-member-app",
            grant_type: "refresh_token",
            refresh_token: session.refreshToken,
          });
          expect(refreshed).toBeNull();
        }
        for (const session of other)
          expect((await me(session.accessToken)).status).toBe(200);
        const otherPort = logoutPort === 3002 ? 3003 : 3002;
        await browser(browsers[0], "open", `http://localhost:${otherPort}`);
        await browser(
          browsers[0],
          "wait",
          "--url",
          `http://localhost:${otherPort}/logged-out`,
        );
        const remaining = JSON.parse(
          await browser(browsers[0], "cookies", "get", "--json"),
        );
        expect(
          remaining.data.cookies.some((cookie: { name: string }) =>
            cookie.name.endsWith("_session"),
          ),
        ).toBe(false);
        await browser(browsers[0], "open", "http://localhost:3002/login");
        expect(await browser(browsers[0], "snapshot", "-i")).toContain(
          "ยืนยันตัวตน",
        );
        await browser(browsers[1], "open", "http://localhost:3002/login");
        await browser(browsers[1], "wait", "--url", "http://localhost:3002/");
        expect(await browser(browsers[1], "snapshot", "-i")).toContain(
          "หน้าหลัก",
        );
      } finally {
        for (const name of browsers) await browser(name, "close");
      }
    },
    120_000,
  );
