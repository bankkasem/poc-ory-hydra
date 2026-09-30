import { getDatabase } from "./client";

type SessionRow = {
  id: string;
  client_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: Date;
};

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

function expiresAt(expiresIn: number) {
  return new Date(Date.now() + expiresIn * 1000);
}

export async function createSession(clientId: string, tokens: SessionTokens) {
  const id = crypto.randomUUID();
  const sql = getDatabase();
  await sql`
    INSERT INTO oauth_sessions (
      id,
      client_id,
      access_token,
      refresh_token,
      access_token_expires_at
    ) VALUES (
      ${id},
      ${clientId},
      ${tokens.accessToken},
      ${tokens.refreshToken},
      ${expiresAt(tokens.expiresIn)}
    )
  `;
  return id;
}

export async function findSession(id: string) {
  const sql = getDatabase();
  const [row] = await sql<SessionRow[]>`
    SELECT id, client_id, access_token, refresh_token, access_token_expires_at
    FROM oauth_sessions
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    accessTokenExpiresAt: new Date(row.access_token_expires_at),
  };
}

export async function updateSession(id: string, tokens: SessionTokens) {
  const sql = getDatabase();
  await sql`
    UPDATE oauth_sessions
    SET
      access_token = ${tokens.accessToken},
      refresh_token = ${tokens.refreshToken},
      access_token_expires_at = ${expiresAt(tokens.expiresIn)}
    WHERE id = ${id}
  `;
}

export async function deleteSession(id: string) {
  const sql = getDatabase();
  await sql`DELETE FROM oauth_sessions WHERE id = ${id}`;
}
