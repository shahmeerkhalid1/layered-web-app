import { Router, Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as exerciseService from "./exercise.service";
import {
  createExerciseSchema,
  updateExerciseSchema,
  createFolderSchema,
  setProgressionSchema,
} from "./exercise.validation";
import { uploadImage, deleteImage } from "../../lib/cloudinary";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.use(authenticate);

// ─── Exercises ───────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  const exercises = await exerciseService.listExercises(
    req.user!.instructorId,
    {
      search: req.query.search as string,
      folderId: req.query.folderId as string,
      tag: req.query.tag as string,
    }
  );
  res.json(exercises);
});

router.get("/:id", async (req: Request, res: Response) => {
  const exercise = await exerciseService.getExercise(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(exercise);
});

router.post(
  "/",
  validate(createExerciseSchema),
  async (req: Request, res: Response) => {
    const exercise = await exerciseService.createExercise(
      req.user!.instructorId,
      req.body
    );
    res.status(201).json(exercise);
  }
);

router.patch(
  "/:id",
  validate(updateExerciseSchema),
  async (req: Request, res: Response) => {
    const exercise = await exerciseService.updateExercise(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.json(exercise);
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  await exerciseService.deleteExercise(req.params.id as string, req.user!.instructorId);
  res.status(204).send();
});

// ─── Progression ─────────────────────────────────────────────────────────────

router.patch(
  "/:id/progression",
  validate(setProgressionSchema),
  async (req: Request, res: Response) => {
    const exercise = await exerciseService.setProgression(
      req.params.id as string,
      req.user!.instructorId,
      req.body.progressionOfId
    );
    res.json(exercise);
  }
);

router.get("/:id/progression-chain", async (req: Request, res: Response) => {
  const chain = await exerciseService.getProgressionChain(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(chain);
});

// ─── Images ──────────────────────────────────────────────────────────────────

router.post(
  "/:id/images",
  upload.single("image"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }
    const { url, publicId } = await uploadImage(req.file.path);
    const image = await exerciseService.addImage(
      req.params.id as string,
      req.user!.instructorId,
      url,
      publicId
    );
    res.status(201).json(image);
  }
);

router.delete(
  "/:id/images/:imageId",
  async (req: Request, res: Response) => {
    const image = await exerciseService.removeImage(
      req.params.id as string,
      req.params.imageId as string,
      req.user!.instructorId
    );
    if (image.publicId) {
      await deleteImage(image.publicId);
    }
    res.status(204).send();
  }
);

export default router;
