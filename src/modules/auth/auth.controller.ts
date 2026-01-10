import { signup, login } from "./auth.service";
import type { Request, Response } from "express";
import { deleteSession } from "../sessions/session.repo";
import { changePassword } from "./password-change.service";
import { PasswordPolicyError } from "./password.policy";
import { blacklistToken } from "./tokenBlacklist";
import { verifyToken } from "../../crypto/jwt";


export async function signupHandler(req:Request, res: Response) {
  try {
    await signup(req.body.email, req.body.password);
    res.send("User created");
  } catch (err) {
    if (err instanceof PasswordPolicyError) {
      return res.status(400).json({ error: err.message });
    }

    // Any unexpected error
    return res.status(500).json({ error: "Internal server error" });
  }
}
export async function loginHandler(req: Request, res: Response) {
    const { email, password } = req.body;
    const token = await login(email, password);
    res.json({ token });
}


export async function logoutHandler(req: Request, res: Response) {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);

  const token = auth.split(" ")[1];
  if (!token) return res.sendStatus(401);
  const payload = verifyToken(token);
  await blacklistToken(token, payload.exp);
  await deleteSession(token);
  res.send("Logged out");
}
export async function changePasswordHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const userId = req.user.userId; 
    const { oldPassword, newPassword } = req.body;
    await changePassword(userId, oldPassword, newPassword);
    res.send("Password updated successfully");
  } catch (err) {
    if (err instanceof PasswordPolicyError) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  }
}
