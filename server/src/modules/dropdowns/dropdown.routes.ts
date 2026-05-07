import { Router, Request, Response } from "express";
import { validate } from "../../middleware/validate.middleware";
import { createDropdownOptionSchema } from "./dropdown.validation";
import * as dropdownService from "./dropdown.service";

const router = Router();

router.get("/:categoryKey", async (req: Request, res: Response) => {
  const options = await dropdownService.listOptionsByCategoryKey(
    req.params.categoryKey as string,
    req.user!.instructorId
  );
  res.json(options);
});

router.post(
  "/:categoryKey",
  validate(createDropdownOptionSchema),
  async (req: Request, res: Response) => {
    const option = await dropdownService.addInstructorOption(
      req.params.categoryKey as string,
      req.user!.instructorId,
      req.body.label as string
    );
    res.status(201).json(option);
  }
);

router.delete("/options/:optionId", async (req: Request, res: Response) => {
  await dropdownService.deleteInstructorOption(
    req.params.optionId as string,
    req.user!.instructorId
  );
  res.status(204).send();
});

export default router;
