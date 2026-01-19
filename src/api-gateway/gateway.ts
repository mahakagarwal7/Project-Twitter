import express from "express";

import authRouter from "../modules/auth/auth.routes";
import sessionRouter from "../modules/sessions/session.routes";

import { accountRateLimit } from "./rate-limit.middleware";
import { authMiddleware } from "./auth.middleware";

const app = express();

app.use(express.json());

app.use(
    "/auth",
    accountRateLimit({
    limit: 5,
    windowSeconds: 15 * 60,
    key: (req) => `auth:${req.ip}`,
    }),
    authRouter
);

app.use(
    "/sessions",
    authMiddleware,
    accountRateLimit({
    limit: 10,
    windowSeconds: 60 * 60,
    key: (req) => `session:${req.context.userId}`,
    }),
    sessionRouter
);

export default app;
