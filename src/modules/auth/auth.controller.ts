import { signup, login } from "./auth.service";
import type { Request, Response } from "express";
import { deleteSession } from "../sessions/session.repo";
import { PasswordPolicyError } from "./password.policy";

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


export async function logoutHandler(req: Request, res: Response) 
 {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  await deleteSession(token);
  res.send("Logged out");
}
