import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate, validateQuery } from "../../middleware/validate.middleware";
import * as clientService from "./client.service";
import {
  createClientSchema,
  updateClientSchema,
  listClientsQuerySchema,
  deleteClientsSchema,
  type ListClientsQuery,
} from "./client.validation";
import * as sessionNoteService from "../session-notes/session-note.service";
import {
  listClientNotesQuerySchema,
  type ListClientNotesQuery,
} from "../session-notes/session-note.validation";

const router = Router();

router.use(authenticate);

router.post("/", validate(createClientSchema), async (req: Request, res: Response) => {
  const client = await clientService.createClient(req.user!.instructorId, req.body);
  res.status(201).json(client);
});

router.get(
  "/",
  validateQuery(listClientsQuerySchema),
  async (req: Request, res: Response) => {
    const result = await clientService.listClients(
      req.user!.instructorId,
      req.query as unknown as ListClientsQuery
    );
    res.json(result);
  }
);

router.delete(
  "/",
  validate(deleteClientsSchema),
  async (req: Request, res: Response) => {
    const result = await clientService.deleteClients(
      req.body.clientIds as string[],
      req.user!.instructorId
    );
    res.json(result);
  }
);

router.get(
  "/:id/notes",
  validateQuery(listClientNotesQuerySchema),
  async (req: Request, res: Response) => {
    const result = await sessionNoteService.getClientSessionNotesTimeline(
      req.params.id as string,
      req.user!.instructorId,
      req.query as unknown as ListClientNotesQuery
    );
    res.json(result);
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  const client = await clientService.getClientById(
    req.params.id as string,
    req.user!.instructorId
  );
  res.json(client);
});

router.patch(
  "/:id",
  validate(updateClientSchema),
  async (req: Request, res: Response) => {
    const client = await clientService.updateClient(
      req.params.id as string,
      req.user!.instructorId,
      req.body
    );
    res.json(client);
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  await clientService.deleteClient(req.params.id as string, req.user!.instructorId);
  res.status(204).send();
});

export default router;
