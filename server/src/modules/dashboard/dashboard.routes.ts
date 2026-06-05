import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as dashboardService from "./dashboard.service";

const router = Router();

router.use(authenticate);

router.get("/stats", async (req: Request, res: Response) => {
  const result = await dashboardService.getDashboardStats(req.user!.instructorId);
  res.json(result);
});

router.get("/notifications", async (req: Request, res: Response) => {
  const result = await dashboardService.getDashboardNotifications(
    req.user!.instructorId
  );
  res.json(result);
});

export default router;
