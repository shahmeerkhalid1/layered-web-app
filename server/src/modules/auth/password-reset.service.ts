import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import { auth } from "../../lib/auth";
import { AppError } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import type { RequestPasswordResetInput } from "./password-reset.validation";

export async function requestPasswordResetForEmail(
  input: RequestPasswordResetInput,
  headers: IncomingHttpHeaders
): Promise<{ message: string }> {
  const instructor = await prisma.instructor.findFirst({
    where: {
      email: {
        equals: input.email,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (!instructor) {
    throw new AppError("No account found for this email.", 404);
  }

  await auth.api.requestPasswordReset({
    body: {
      email: input.email,
      redirectTo: input.redirectTo,
    },
    headers: fromNodeHeaders(headers),
  });

  return { message: "Password reset email sent." };
}
