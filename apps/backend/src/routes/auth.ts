import { authenticateUser } from "../services/auth";
import { acceptConsent, getConsentRequest } from "../services/hydra/consent";
import { acceptLogin, getLoginRequest } from "../services/hydra/login";
import { createOAuthSession, getOAuthSessionUser } from "../services/session";
import {
  consentRequestSchema,
  loginChallengeSchema,
  loginRequestSchema,
  oauthSessionSchema,
  sessionAuthorizationSchema,
} from "./auth.schemas";

function unauthorized() {
  return Response.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": "Session" } },
  );
}

export const authRoutes = {
  "/auth/oauth/session": {
    GET: async (request: Request) => {
      const sessionId = sessionAuthorizationSchema.safeParse(
        request.headers.get("Authorization"),
      );
      if (!sessionId.success) return unauthorized();

      const user = await getOAuthSessionUser(sessionId.data);
      return user ? Response.json(user) : unauthorized();
    },
    POST: async (request: Request) => {
      const input = oauthSessionSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!input.success)
        return Response.json(
          { error: "Invalid OAuth callback" },
          { status: 400 },
        );

      const sessionId = await createOAuthSession(input.data);
      return sessionId
        ? Response.json({ sessionId })
        : Response.json(
            { error: "Invalid authorization code" },
            { status: 401 },
          );
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
