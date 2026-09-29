import { SQL } from "bun";

let database: SQL | undefined;

function getDatabase() {
  if (database) return database;
  if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

  database = new SQL(Bun.env.DATABASE_URL);
  return database;
}

type UserRow = {
  id: string;
  phone_number: string;
  verification_code_hash: string;
};

export async function findUserByPhone(phoneNumber: string) {
  const sql = getDatabase();
  const [row] = await sql<UserRow[]>`
    SELECT id, phone_number, verification_code_hash
    FROM users
    WHERE phone_number = ${phoneNumber}
    LIMIT 1
  `;

  if (!row) return null;
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    verificationCodeHash: row.verification_code_hash,
  };
}

export async function findUserById(id: string) {
  const sql = getDatabase();
  const [row] = await sql<Pick<UserRow, "id" | "phone_number">[]>`
    SELECT id, phone_number
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!row) return null;
  return { id: row.id, phoneNumber: row.phone_number };
}
