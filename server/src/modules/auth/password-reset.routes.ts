import { Router, type Request, type Response } from "express";
import { validate } from "../../middleware/validate.middleware";
import { requestPasswordResetSchema } from "./password-reset.validation";
import * as passwordResetService from "./password-reset.service";

const router = Router();

router.post("/request", validate(requestPasswordResetSchema), async (req: Request, res: Response) => {
  const result = await passwordResetService.requestPasswordResetForEmail(req.body, req.headers);
  res.json(result);
});

export default router;
