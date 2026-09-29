import { authenticateUser } from "../services/auth";
import { acceptConsent, getConsentRequest } from "../services/hydra/consent";
import { acceptLogin } from "../services/hydra/login";
import { consentRequestSchema, loginRequestSchema } from "./auth.schemas";

export const authRoutes = {
  "/auth/login": {
    POST: async (request: Request) => {
      const input = loginRequestSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!input.success)
        return Response.json(
          { error: "Invalid request body" },
          { status: 400 },
        );

      const user = await authenticateUser(input.data);
      if (!user)
        return Response.json({ error: "Invalid credentials" }, { status: 401 });

      const redirectTo = await acceptLogin(input.data.loginChallenge, user.id);
      return Response.json({ redirectTo });
    },
  },
  "/auth/consent": {
    GET: async (request: Request) => {
      const input = consentRequestSchema.safeParse({
        consentChallenge: new URL(request.url).searchParams.get(
          "consentChallenge",
        ),
      });
      if (!input.success)
        return Response.json(
          { error: "Invalid consent challenge" },
          { status: 400 },
        );

      const consent = await getConsentRequest(input.data.consentChallenge);
      return Response.json({
        client: consent.client,
        requestedScopes: consent.requestedScopes,
        skip: consent.skip,
      });
    },
    POST: async (request: Request) => {
      const input = consentRequestSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!input.success)
        return Response.json(
          { error: "Invalid request body" },
          { status: 400 },
        );

      const redirectTo = await acceptConsent(input.data.consentChallenge);
      return Response.json({ redirectTo });
    },
  },
};
