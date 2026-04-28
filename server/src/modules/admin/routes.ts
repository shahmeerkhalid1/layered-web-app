import { Router, Request, Response } from "express";
import { validate } from "../../middleware/validate.middleware";
import { inviteSchema, settingsPatchSchema } from "./validation";
import * as adminService from "./service";

const router = Router();

// ─── Invitations ────────────────────────────────────────────────────────────

router.post("/invite", validate(inviteSchema), async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const invitation = await adminService.createInvitation(
    email,
    role,
    req.user!.instructorId
  );

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const inviteLink = `${clientUrl}/register?token=${invitation.token}`;

  res.status(201).json({ invitation, inviteLink });
});

router.get("/invitations", async (_req: Request, res: Response) => {
  const invitations = await adminService.listInvitations();
  res.json({ invitations });
});

// ─── Invitation Verification (public, no admin guard) ───────────────────────

router.get("/invite/verify", async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const invitation = await adminService.verifyInvitation(token);
  res.json({ email: invitation.email, role: invitation.role });
});

// ─── Platform Settings ──────────────────────────────────────────────────────

router.get("/settings", async (_req: Request, res: Response) => {
  const settings = await adminService.getSettings();
  res.json(settings);
});

router.patch("/settings", validate(settingsPatchSchema), async (req: Request, res: Response) => {
  const settings = await adminService.updateSettings(req.body);
  res.json(settings);
});

// ─── Platform Stats ─────────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  const stats = await adminService.getPlatformStats();
  res.json(stats);
});

export default router;
