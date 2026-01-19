import { hashPassword, verifyPassword } from "../../crypto/password";
import { createToken } from "../../crypto/jwt";
import {
  incrementFailedAttempts,
  resetFailedAttempts,
  lockAccount,
} from "./user.repo";
import { createSession } from "../sessions/session.repo";
import { validatePassword } from "./password.policy";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

export async function signup(email: string, password: string) {
  validatePassword(password);

  const passwordHash = await hashPassword(password);

  await createUser(email, passwordHash);


  return { success: true };
}


export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new Error("Account temporarily locked. Try again later.");
  }

  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    await incrementFailedAttempts(user.id);

    if (user.failed_login_attempts + 1 >= MAX_FAILED_ATTEMPTS) {
      await lockAccount(user.id, LOCK_TIME_MINUTES);
    }

    throw new Error("Invalid credentials");
  }

  await resetFailedAttempts(user.id);

  const token = createToken(user.id);
  await createSession(user.id, token);

  return token;
}
