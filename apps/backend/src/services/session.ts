import {
  createSession,
  deleteSession,
  findSession,
  updateSession,
} from "./database/sessions";
import { findUserById } from "./database/users";
import {
  exchangeAuthorizationCode,
  introspectAccessToken,
  refreshTokens,
} from "./hydra/token";

type ExchangeInput = {
  clientId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
};

export async function createOAuthSession(input: ExchangeInput) {
  const tokens = await exchangeAuthorizationCode(input);
  return tokens ? createSession(input.clientId, tokens) : null;
}

export async function getOAuthSessionUser(sessionId: string) {
  const session = await findSession(sessionId);
  if (!session) return null;

  let accessToken = session.accessToken;
  if (session.accessTokenExpiresAt.getTime() <= Date.now() + 5_000) {
    const tokens = await refreshTokens(session.clientId, session.refreshToken);
    if (!tokens) {
      await deleteSession(session.id);
      return null;
    }

    await updateSession(session.id, tokens);
    accessToken = tokens.accessToken;
  }

  const subject = await introspectAccessToken(accessToken);
  if (!subject) {
    await deleteSession(session.id);
    return null;
  }

  return findUserById(subject);
}
