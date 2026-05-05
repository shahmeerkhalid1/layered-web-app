import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as exerciseService from "./exercise.service";
import { createFolderSchema } from "./exercise.validation";

const router = Router();
router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  const folders = await exerciseService.listFolders(req.user!.instructorId);
  res.json(folders);
});

router.post(
  "/",
  validate(createFolderSchema),
  async (req: Request, res: Response) => {
    const folder = await exerciseService.createFolder(
      req.user!.instructorId,
      req.body.name
    );
    res.status(201).json(folder);
  }
);

router.patch(
  "/:id",
  validate(createFolderSchema),
  async (req: Request, res: Response) => {
    const folder = await exerciseService.updateFolder(
      req.params.id as string,
      req.user!.instructorId,
      req.body.name
    );
    res.json(folder);
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  await exerciseService.deleteFolder(req.params.id as string, req.user!.instructorId);
  res.status(204).send();
});

export default router;
