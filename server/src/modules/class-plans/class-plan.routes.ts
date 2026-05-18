import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import * as classPlanService from "./class-plan.service";
import {
  addExerciseToSectionSchema,
  addSectionSchema,
  createClassPlanSchema,
  listClassPlansSchema,
  updateClassPlanSchema,
  updateSectionExerciseSchema,
  updateSectionSchema,
  type ListClassPlansQuery,
} from "./class-plan.validation";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  validateQuery(listClassPlansSchema),
  async (req: Request, res: Response) => {
    const result = await classPlanService.listClassPlans(
      req.user!.instructorId,
      req.query as unknown as ListClassPlansQuery
    );
    res.json(result);
  }
);

router.post(
  "/",
  validate(createClassPlanSchema),
  async (req: Request, res: Response) => {
    const template = await classPlanService.createClassPlan(
      req.user!.instructorId,
      req.body
    );
    res.status(201).json(template);
  }
);

router.post("/:id/duplicate", async (req: Request, res: Response) => {
  const template = await classPlanService.duplicateClassPlan(
    req.params.id as string,
    req.user!.instructorId
  );
  res.status(201).json(template);
});

router.get("/:id", async (req: Request, res: Response) => {
  const template = await classPlanService.getClassPlanById(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(template);
});

router.patch(
  "/:id",
  validate(updateClassPlanSchema),
  async (req: Request, res: Response) => {
    const template = await classPlanService.updateClassPlan(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.json(template);
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  const result = await classPlanService.deleteClassPlan(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(result);
});

router.post(
  "/:id/sections",
  validate(addSectionSchema),
  async (req: Request, res: Response) => {
    const section = await classPlanService.addSection(
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
    const section = await classPlanService.updateSection(
      req.params.id as string,
      req.params.sectionId as string,
      req.user!.instructorId,
      req.body
    );
    res.json(section);
  }
);

router.delete("/:id/sections/:sectionId", async (req: Request, res: Response) => {
  const result = await classPlanService.deleteSection(
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
    const row = await classPlanService.addExerciseToSection(
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
    const row = await classPlanService.updateSectionExercise(
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
    const result = await classPlanService.removeSectionExercise(
      req.params.id as string,
      req.params.sectionId as string,
      req.params.pseId as string,
      req.user!.instructorId
    );
    res.json(result);
  }
);

export default router;
