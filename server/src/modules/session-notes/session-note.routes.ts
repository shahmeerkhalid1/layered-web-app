import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as sessionNoteService from "./session-note.service";
import {
  attachExercisesSchema,
  updateSessionNoteSchema,
} from "./session-note.validation";

const router = Router();

router.use(authenticate);

router.post("/:id/share", async (req: Request, res: Response) => {
  const result = await sessionNoteService.shareSessionNote(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(result);
});

router.get("/:id", async (req: Request, res: Response) => {
  const note = await sessionNoteService.getSessionNoteById(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(note);
});

router.patch(
  "/:id",
  validate(updateSessionNoteSchema),
  async (req: Request, res: Response) => {
    const note = await sessionNoteService.updateSessionNote(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.json(note);
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  const result = await sessionNoteService.deleteSessionNote(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(result);
});

router.post(
  "/:id/exercises",
  validate(attachExercisesSchema),
  async (req: Request, res: Response) => {
    const note = await sessionNoteService.attachExercisesToNote(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.json(note);
  }
);

router.delete("/:id/exercises/:exerciseId", async (req: Request, res: Response) => {
  const note = await sessionNoteService.detachExerciseFromNote(
    req.params.id as string,
    req.params.exerciseId as string,
    req.user!.instructorId
  );
  res.json(note);
});

export default router;
