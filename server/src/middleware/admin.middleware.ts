import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/errors";

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }
  next();
}
