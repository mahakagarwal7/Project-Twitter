import express from "express";
import routes from "./routes";
import { authMiddleware } from "./api-gateway/auth.middleware";

export const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Backend is running");
});

app.use("/protected", authMiddleware);

app.use(routes);
