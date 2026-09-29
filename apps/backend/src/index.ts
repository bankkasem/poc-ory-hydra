import { authenticateUser, parseLoginRequest } from "./auth/authenticate";
import { acceptLogin } from "./hydra/login";

const port = Number(Bun.env.PORT ?? 3001);

Bun.serve({
  port,
  routes: {
    "/health": Response.json({ status: "ok" }),
    "/auth/login": {
      POST: async (request) => {
        const input = parseLoginRequest(await request.json().catch(() => null));
        if (!input)
          return Response.json(
            { error: "Invalid request body" },
            { status: 400 },
          );

        const user = await authenticateUser(input);
        if (!user) {
          return Response.json(
            { error: "Invalid credentials" },
            { status: 401 },
          );
        }

        const redirectTo = await acceptLogin(input.loginChallenge, user.id);
        return Response.json({ redirectTo });
      },
    },
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
  error(error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  },
});

console.log(`Backend listening on http://localhost:${port}`);
