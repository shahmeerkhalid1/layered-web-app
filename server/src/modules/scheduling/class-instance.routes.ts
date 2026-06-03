import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import * as schedulingService from "./scheduling.service";
import {
  assignTemplateSchema,
  listClassInstancesQuerySchema,
  markAttendanceSchema,
  updateClassInstanceSchema,
  type ListClassInstancesQuery,
} from "./scheduling.validation";
import {
  addExerciseToSectionSchema,
  addSectionSchema,
  updateSectionExerciseSchema,
  updateSectionSchema,
} from "../class-plans/class-plan.validation";
import * as sessionNoteService from "../session-notes/session-note.service";
import { createSessionNoteSchema } from "../session-notes/session-note.validation";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  validateQuery(listClassInstancesQuerySchema),
  async (req: Request, res: Response) => {
    const rows = await schedulingService.listClassInstancesForCalendar(
      req.user!.instructorId,
      req.query as unknown as ListClassInstancesQuery
    );
    res.json(rows);
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  const row = await schedulingService.getClassInstanceById(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(row);
});

router.patch(
  "/:id",
  validate(updateClassInstanceSchema),
  async (req: Request, res: Response) => {
    const row = await schedulingService.updateClassInstance(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.json(row);
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  const result = await schedulingService.deleteClassInstance(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(result);
});

router.post(
  "/:id/assign-template",
  validate(assignTemplateSchema),
  async (req: Request, res: Response) => {
    const row = await schedulingService.assignTemplateToInstance(
      req.params.id as string,
      req.user!.instructorId,
      req.body.templateId as string
    );
    res.json(row);
  }
);

router.post(
  "/:id/sections",
  validate(addSectionSchema),
  async (req: Request, res: Response) => {
    const section = await schedulingService.addInstanceSection(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.status(201).json(section);
  }
);

router.patch(
  "/:id/sections/:sectionId",
  validate(updateSectionSchema),
  async (req: Request, res: Response) => {
    const section = await schedulingService.updateInstanceSection(
      req.params.id as string,
      req.params.sectionId as string,
      req.user!.instructorId,
      req.body
    );
    res.json(section);
  }
);

router.delete("/:id/sections/:sectionId", async (req: Request, res: Response) => {
  const result = await schedulingService.deleteInstanceSection(
    req.params.id as string,
    req.params.sectionId as string,
    req.user!.instructorId
  );
  res.json(result);
});

router.post(
  "/:id/sections/:sectionId/exercises",
  validate(addExerciseToSectionSchema),
  async (req: Request, res: Response) => {
    const row = await schedulingService.addExerciseToInstanceSection(
      req.params.id as string,
      req.params.sectionId as string,
      req.user!.instructorId,
      req.body
    );
    res.status(201).json(row);
  }
);

router.patch(
  "/:id/sections/:sectionId/exercises/:pseId",
  validate(updateSectionExerciseSchema),
  async (req: Request, res: Response) => {
    const row = await schedulingService.updateInstanceSectionExercise(
      req.params.id as string,
      req.params.sectionId as string,
      req.params.pseId as string,
      req.user!.instructorId,
      req.body
    );
    res.json(row);
  }
);

router.delete(
  "/:id/sections/:sectionId/exercises/:pseId",
  async (req: Request, res: Response) => {
    const result = await schedulingService.removeExerciseFromInstanceSection(
      req.params.id as string,
      req.params.sectionId as string,
      req.params.pseId as string,
      req.user!.instructorId
    );
    res.json(result);
  }
);

router.get("/:id/notes", async (req: Request, res: Response) => {
  const notes = await sessionNoteService.listSessionNotesForInstance(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(notes);
});

router.post(
  "/:id/notes",
  validate(createSessionNoteSchema),
  async (req: Request, res: Response) => {
    const note = await sessionNoteService.createOrUpsertSessionNote(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.status(201).json(note);
  }
);

router.get("/:id/attendance", async (req: Request, res: Response) => {
  const rows = await schedulingService.getAttendance(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(rows);
});

router.patch(
  "/:id/attendance",
  validate(markAttendanceSchema),
  async (req: Request, res: Response) => {
    const rows = await schedulingService.markAttendance(
      req.params.id as string,
      req.user!.instructorId,
      req.body.attendance
    );
    res.json(rows);
  }
);

export default router;
