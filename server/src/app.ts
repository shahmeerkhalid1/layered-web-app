import "express-async-errors";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { authenticate } from "./middleware/auth.middleware";
import { requireAdmin } from "./middleware/admin.middleware";
import { errorHandler } from "./middleware/error.middleware";
import adminRoutes from "./modules/admin/routes";
import * as adminService from "./modules/admin/service";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public endpoint: check if signup is enabled
app.get("/api/signup-status", async (_req, res) => {
  const enabled = await adminService.isSignupEnabled();
  res.json({ signupEnabled: enabled });
});

// Public endpoint: verify invitation token
app.get("/api/invite/verify", async (req, res) => {
  const token = req.query.token as string;
  const invitation = await adminService.verifyInvitation(token);
  res.json({ email: invitation.email, role: invitation.role });
});

// Admin routes (protected)
app.use("/api/admin", authenticate, requireAdmin, adminRoutes);

app.use(errorHandler);

export default app;
