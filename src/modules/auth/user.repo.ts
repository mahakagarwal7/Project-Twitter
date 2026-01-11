import { pg } from "../../db/postgres.js";
import redisClient from "../../config/redis.js";
import * as crypto from "crypto";



/**
 * Blind index for email
 * Allows lookup without storing plain email
 */
function emailBlindIndex(email: string) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

/**
 * CREATE USER
 * Used during signup
 */
export async function createUser(email: string, passwordHash: string) {
  const blindIndex = emailBlindIndex(email);

  await pg.query(
    `
    INSERT INTO users_identity (email_blind_index, email_encrypted, password_hash)
    VALUES ($1, $2, $3)
    `,
    [blindIndex, Buffer.from(email), passwordHash]
  );

  // 🔹 CHANGE: Invalidate Redis cache after user creation
  // Prevents stale cache issues during signup/login
  await redisClient.del(`user:email:${blindIndex}`);
}

/**
 * FIND USER BY EMAIL
 * Used in signup (duplicate check) and login
 */
export async function findUserByEmail(email: string) {
  const blindIndex = emailBlindIndex(email);
  const cacheKey = `user:email:${blindIndex}`;

  // 🔹 CHANGE: Redis-first lookup for performance
  const cachedUser = await redisClient.get(cacheKey);
  if (cachedUser) {
    return JSON.parse(cachedUser);
  }

  // Fallback to DB
  const result = await pg.query(
    `
    SELECT 
      user_id AS id,
      password_hash,
      failed_login_attempts,
      locked_until
    FROM users_identity
    WHERE email_blind_index = $1
    `,
    [blindIndex]
  );

  const user = result.rows[0];

  // 🔹 CHANGE: Cache DB result for faster future lookups
  if (user) {
    await redisClient.setEx(cacheKey, 300, JSON.stringify(user));
  }

  return user;
}

/**
 * FIND USER BY ID
 */
export async function findUserById(userId: number) {
  const result = await pg.query(
    `
    SELECT *
    FROM users_identity
    WHERE user_id = $1
    `,
    [userId]
  );

  return result.rows[0];
}

/**
 * FAILED LOGIN ATTEMPTS HANDLING
 * (used by auth.service)
 */

// 🔹 CHANGE: Increment failed login attempts
export async function incrementFailedAttempts(userId: number) {
  await pg.query(
    `
    UPDATE users_identity
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE user_id = $1
    `,
    [userId]
  );
}

// 🔹 CHANGE: Reset attempts after successful login
export async function resetFailedAttempts(userId: number) {
  await pg.query(
    `
    UPDATE users_identity
    SET failed_login_attempts = 0,
        locked_until = NULL
    WHERE user_id = $1
    `,
    [userId]
  );
}

// 🔹 CHANGE: Temporarily lock account after too many failures
export async function lockAccount(userId: number, minutes: number) {
  await pg.query(
    `
    UPDATE users_identity
    SET locked_until = NOW() + INTERVAL '${minutes} minutes'
    WHERE user_id = $1
    `,
    [userId]
  );
}

/**
 * PASSWORD UPDATE
 * (for future reset/change password flows)
 */
export async function updatePasswordHash(
  userId: number,
  newPasswordHash: string
) {
  await pg.query(
    `
    UPDATE users_identity
    SET password_hash = $1
    WHERE user_id = $2
    `,
    [newPasswordHash, userId]
  );
}
