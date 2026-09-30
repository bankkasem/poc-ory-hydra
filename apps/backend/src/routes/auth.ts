import { authenticateUser } from "../services/auth";
import { findUserById } from "../services/database/users";
import { acceptConsent, getConsentRequest } from "../services/hydra/consent";
import { acceptLogin, getLoginRequest } from "../services/hydra/login";
import { introspectAccessToken } from "../services/hydra/token";
import {
  bearerTokenSchema,
  consentRequestSchema,
  loginChallengeSchema,
  loginRequestSchema,
} from "./auth.schemas";

function unauthorized() {
  return Response.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

export const authRoutes = {
  "/me": {
    GET: async (request: Request) => {
      const token = bearerTokenSchema.safeParse(
        request.headers.get("Authorization"),
      );
      if (!token.success) return unauthorized();
      const subject = await introspectAccessToken(token.data);
      if (!subject) return unauthorized();
      const user = await findUserById(subject);
      return user ? Response.json(user) : unauthorized();
    },
  },
  "/auth/login/session": {
    POST: async (request: Request) => {
      const input = loginChallengeSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!input.success)
        return Response.json(
          { error: "Invalid login challenge" },
          { status: 400 },
        );

      const login = await getLoginRequest(input.data.loginChallenge);
      if (!login.skip || !login.subject) return Response.json({ skip: false });

      const redirectTo = await acceptLogin(
        input.data.loginChallenge,
        login.subject,
      );
      return Response.json({ skip: true, redirectTo });
    },
  },
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
