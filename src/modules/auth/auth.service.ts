import { hashPassword, verifyPassword } from "../../crypto/password";
import { createToken } from "../../crypto/jwt";
import {
  createUser,
  findUserByEmail,
  incrementFailedAttempts,
  resetFailedAttempts,
  lockAccount,
} from "./user.repo";
import { createSession } from "../sessions/session.repo";
import { validatePassword } from "./password.policy";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

/**
 * SIGNUP FLOW
 * Goal: make signup predictable and safe
 */
export async function signup(email: string, password: string) {
  // 🔹 CHANGE: Explicitly check if user already exists
  // This prevents duplicate accounts
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // 🔹 CHANGE: Enforce password policy BEFORE hashing
  validatePassword(password);

  // Hash password securely
  const passwordHash = await hashPassword(password);

  // Create user in DB
  await createUser(email, passwordHash);

  // Signup does not auto-login (clean separation of concerns)
  return { success: true };
}

/**
 * LOGIN FLOW
 * Goal: stabilize login + add security (failed attempts & lock)
 */
export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);

  // 🔹 CHANGE: Clear error for invalid credentials
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // 🔹 CHANGE: Block login if account is temporarily locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new Error("Account temporarily locked. Try again later.");
  }

  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    // 🔹 CHANGE: Track failed login attempts
    await incrementFailedAttempts(user.id);

    // 🔹 CHANGE: Lock account after max failed attempts
    if (user.failed_login_attempts + 1 >= MAX_FAILED_ATTEMPTS) {
      await lockAccount(user.id, LOCK_TIME_MINUTES);
    }

    throw new Error("Invalid credentials");
  }

  // 🔹 CHANGE: Reset failed attempts on successful login
  await resetFailedAttempts(user.id);

  // Create JWT + session
  const token = createToken(user.id);
  await createSession(user.id, token);

  return token;
}
