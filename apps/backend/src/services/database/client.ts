import { SQL } from "bun";

let database: SQL | undefined;

export function getDatabase() {
  if (database) return database;
  if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

  database = new SQL(Bun.env.DATABASE_URL);
  return database;
}
