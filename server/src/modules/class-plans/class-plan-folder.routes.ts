import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as classPlanFolderService from "./class-plan-folder.service";
import { createClassPlanFolderSchema } from "./class-plan-folder.validation";

const router = Router();
router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  const folders = await classPlanFolderService.listFolders(req.user!.instructorId);
  res.json(folders);
});

router.post(
  "/",
  validate(createClassPlanFolderSchema),
  async (req: Request, res: Response) => {
    const folder = await classPlanFolderService.createFolder(
      req.user!.instructorId,
      req.body.name
    );
    res.status(201).json(folder);
  }
);

router.patch(
  "/:id",
  validate(createClassPlanFolderSchema),
  async (req: Request, res: Response) => {
    const folder = await classPlanFolderService.updateFolder(
      req.params.id as string,
      req.user!.instructorId,
      req.body.name
    );
    res.json(folder);
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  await classPlanFolderService.deleteFolder(
    req.params.id as string,
    req.user!.instructorId
  );
  res.status(204).send();
});

export default router;
