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
import exerciseRoutes from "./modules/exercises/exercise.routes";
import folderRoutes from "./modules/exercises/folder.routes";
import classPlanFolderRoutes from "./modules/class-plans/class-plan-folder.routes";
import classPlanRoutes from "./modules/class-plans/class-plan.routes";
import classRoutes from "./modules/scheduling/class.routes";
import classInstanceRoutes from "./modules/scheduling/class-instance.routes";
import quickScheduleRoutes from "./modules/scheduling/quick-schedule.routes";
import uploadRoutes from "./modules/uploads/upload.routes";
import dropdownRoutes from "./modules/dropdowns/dropdown.routes";
import clientRoutes from "./modules/clients/client.routes";
import sessionNoteRoutes from "./modules/session-notes/session-note.routes";
import profileRoutes from "./modules/profile/profile.routes";

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

// Upload routes (temp images)
app.use("/api/uploads", authenticate, uploadRoutes);

// Exercise routes
app.use("/api/exercises", exerciseRoutes);
app.use("/api/exercise-folders", folderRoutes);
app.use("/api/class-plan-folders", classPlanFolderRoutes);
app.use("/api/class-plans", classPlanRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/class-instances", classInstanceRoutes);
app.use("/api/quick-schedule", quickScheduleRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/session-notes", sessionNoteRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dropdowns", authenticate, dropdownRoutes);
app.use(errorHandler);

export default app;
