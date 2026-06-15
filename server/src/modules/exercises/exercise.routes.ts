import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs/promises";
import { authenticate } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import * as exerciseService from "./exercise.service";
import {
  createExerciseSchema,
  updateExerciseSchema,
  createFolderSchema,
  setProgressionSchema,
  reorderImagesSchema,
  listExercisesQuerySchema,
  saveToLibrarySchema,
  type ListExercisesQuery,
} from "./exercise.validation";
import { uploadExerciseImage, deleteObject } from "../../lib/storage";
import { signExerciseImages, signExerciseListResult } from "../../lib/media-urls";

const router = Router();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

router.use(authenticate);

// ─── Exercises ───────────────────────────────────────────────────────────────

router.get(
  "/",
  validateQuery(listExercisesQuerySchema),
  async (req: Request, res: Response) => {
    const exercises = await exerciseService.listExercises(
      req.user!.instructorId,
      req.query as unknown as ListExercisesQuery
    );
    res.json(await signExerciseListResult(exercises));
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  const exercise = await exerciseService.getExercise(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(await signExerciseImages(exercise));
});

router.patch(
  "/:id/save-to-library",
  validate(saveToLibrarySchema),
  async (req: Request, res: Response) => {
    const exercise = await exerciseService.saveExerciseToLibrary(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.json(await signExerciseImages(exercise));
  }
);

router.post(
  "/",
  validate(createExerciseSchema),
  async (req: Request, res: Response) => {
    const exercise = await exerciseService.createExercise(
      req.user!.instructorId,
      req.body
    );
    res.status(201).json(await signExerciseImages(exercise));
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
    res.json(await signExerciseImages(exercise));
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

    const exerciseId = req.params.id as string;
    try {
      const { storageKey } = await uploadExerciseImage(
        req.file.path,
        exerciseId
      );
      const image = await exerciseService.addImage(
        exerciseId,
        req.user!.instructorId,
        storageKey
      );
      const signed = await signExerciseImages({ images: [image] });
      res.status(201).json(signed.images![0]);
    } finally {
      await fs.unlink(req.file.path).catch(() => {});
    }
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
      await deleteObject(image.publicId);
    }
    res.status(204).send();
  }
);

router.patch(
  "/:id/images/reorder",
  validate(reorderImagesSchema),
  async (req: Request, res: Response) => {
    const images = await exerciseService.reorderImages(
      req.params.id as string,
      req.user!.instructorId,
      req.body.imageIds
    );
    const signed = await signExerciseImages({ images });
    res.json(signed.images);
  }
);

export default router;
