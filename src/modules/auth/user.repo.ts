import { pg } from "../../db/postgres.js";
import redisClient from "../../config/redis.js";
import crypto from "crypto";

function emailBlindIndex(email: string) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

export async function createUser(email: string, passwordHash: string) {
  const blindIndex = emailBlindIndex(email);

  await pg.query(
    `
    INSERT INTO users_identity (email_blind_index, email_encrypted, password_hash)
  VALUES ($1, $2, $3)
    `,
    [blindIndex, Buffer.from(email), passwordHash]
  );

  await redisClient.del(`user:email:${blindIndex}`);
}

export async function findUserByEmail(email: string) {
  const blindIndex = emailBlindIndex(email);
  const cacheKey = `user:email:${blindIndex}`;

  const cachedUser = await redisClient.get(cacheKey);
  if (cachedUser) {
    console.log("USER FROM REDIS");
    return JSON.parse(cachedUser);
  }

  console.log("USER FROM DB");
  const result = await pg.query(
    `
    SELECT user_id, password_hash
    FROM users_identity
    WHERE email_blind_index = $1
    `,
    [blindIndex]
  );

  const user = result.rows[0];
  if (user) {
    await redisClient.setEx(cacheKey, 300, JSON.stringify(user));
  }

  return user;
}

export async function findUserById(userId: number) {
  const result = await pg.query(
    `
    SELECT *
    FROM users_identity
    WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0];
}


export async function incrementFailedAttempts(userId: number) {
  await pg.query(
    `
    UPDATE users_identity
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE id = $1
    `,
    [userId]
  );
}

export async function resetFailedAttempts(userId: number) {
  await pg.query(
    `
    UPDATE users_identity
    SET failed_login_attempts = 0,
        locked_until = NULL
    WHERE id = $1
    `,
    [userId]
  );
}

export async function lockAccount(userId: number, minutes: number) {
  await pg.query(
    `
    UPDATE users_identity
    SET locked_until = NOW() + INTERVAL '${minutes} minutes'
    WHERE id = $1
    `,
    [userId]
  );
}

export async function updatePasswordHash(
  userId: number,
  newPasswordHash: string
) {
  await pg.query(
    `
    UPDATE users_identity
    SET password_hash = $1
    WHERE id = $2
    `,
    [newPasswordHash, userId]
  );
}




