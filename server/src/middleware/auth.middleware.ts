import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { UnauthorizedError } from "../lib/errors";

export interface AuthPayload {
  instructorId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    throw new UnauthorizedError("Not authenticated");
  }

  req.user = {
    instructorId: session.user.id,
    email: session.user.email,
  };

  next();
}
