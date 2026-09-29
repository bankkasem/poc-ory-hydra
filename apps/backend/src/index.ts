import { authenticateUser, parseLoginInput } from "./auth/authenticate";

const port = Number(Bun.env.PORT ?? 3001);

Bun.serve({
  port,
  routes: {
    "/health": Response.json({ status: "ok" }),
    "/auth/login": {
      POST: async (request) => {
        const input = parseLoginInput(await request.json().catch(() => null));
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
        return Response.json({ user });
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
