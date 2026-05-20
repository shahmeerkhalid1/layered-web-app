import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as schedulingService from "./scheduling.service";
import { quickScheduleSchema } from "./scheduling.validation";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  validate(quickScheduleSchema),
  async (req: Request, res: Response) => {
    const result = await schedulingService.quickSchedule(req.user!.instructorId, req.body);
    res.status(201).json(result);
  }
);

export default router;
