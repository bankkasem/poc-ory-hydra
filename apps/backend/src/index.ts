const port = Number(Bun.env.PORT ?? 3001);

Bun.serve({
  port,
  routes: {
    "/health": Response.json({ status: "ok" }),
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Backend listening on http://localhost:${port}`);
