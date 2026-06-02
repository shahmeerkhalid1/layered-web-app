import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import * as schedulingService from "./scheduling.service";
import {
  createClassSchema,
  enrollClientsSchema,
  listClassesQuerySchema,
  unenrollClientsSchema,
  updateClassSchema,
  type ListClassesQuery,
} from "./scheduling.validation";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  validateQuery(listClassesQuerySchema),
  async (req: Request, res: Response) => {
    const result = await schedulingService.listClasses(
      req.user!.instructorId,
      req.query as unknown as ListClassesQuery
    );
    res.json(result);
  }
);

router.post(
  "/",
  validate(createClassSchema),
  async (req: Request, res: Response) => {
    const result = await schedulingService.createClass(req.user!.instructorId, req.body);
    res.status(201).json(result);
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  const result = await schedulingService.getClassById(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(result);
});

router.patch(
  "/:id",
  validate(updateClassSchema),
  async (req: Request, res: Response) => {
    const result = await schedulingService.updateClass(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.json(result);
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  const result = await schedulingService.deleteClass(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(result);
});

router.get("/:id/enrollments", async (req: Request, res: Response) => {
  const enrollments = await schedulingService.getEnrollments(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(enrollments);
});

router.post(
  "/:id/enrollments",
  validate(enrollClientsSchema),
  async (req: Request, res: Response) => {
    const result = await schedulingService.enrollClients(
      req.params.id as string,
      req.body.clientIds as string[],
      req.user!.instructorId
    );
    res.status(201).json(result);
  }
);

router.delete(
  "/:id/enrollments",
  validate(unenrollClientsSchema),
  async (req: Request, res: Response) => {
    const result = await schedulingService.unenrollClients(
      req.params.id as string,
      req.body.enrollmentIds as string[],
      req.user!.instructorId
    );
    res.json(result);
  }
);

router.delete(
  "/:id/enrollments/:enrollmentId",
  async (req: Request, res: Response) => {
    const result = await schedulingService.unenrollClient(
      req.params.id as string,
      req.params.enrollmentId as string,
      req.user!.instructorId
    );
    res.json(result);
  }
);

export default router;
