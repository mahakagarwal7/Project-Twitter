import { pg } from "../../db/postgres.js";
export async function createUser(email: string, passwordHash: string) {
  await pg.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
    [email, passwordHash]
  );
}
export async function findUserByEmail(email: string) {
  const result = await pg.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
}
