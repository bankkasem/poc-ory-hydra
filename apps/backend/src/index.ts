import { authRoutes } from "./routes/auth";

const port = Number(Bun.env.PORT ?? 3001);

Bun.serve({
  port,
  routes: {
    "/health": Response.json({ status: "ok" }),
    ...authRoutes,
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
