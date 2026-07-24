import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as subscriptionService from "./subscription.service";
import {
  createCheckoutSchema,
} from "./subscription.validation";

const router = Router();

router.use(authenticate);

router.get("/status", async (req: Request, res: Response) => {
  const status = await subscriptionService.getSubscriptionStatus(
    req.user!.instructorId
  );
  res.json(status);
});

router.post(
  "/checkout",
  validate(createCheckoutSchema),
  async (req: Request, res: Response) => {
    const result = await subscriptionService.createCheckoutSession(
      req.user!.instructorId,
      req.body
    );
    res.json(result);
  }
);

router.post("/portal", async (req: Request, res: Response) => {
    const result = await subscriptionService.createPortalSession(
      req.user!.instructorId
    );
    res.json(result);
  }
);

export default router;
