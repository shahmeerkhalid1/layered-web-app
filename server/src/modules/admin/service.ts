import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import type { Role, InvitationStatus } from "../../generated/prisma/client";

const INVITE_EXPIRY_DAYS = 7;

// ─── Invitations ────────────────────────────────────────────────────────────

export async function createInvitation(
  email: string,
  role: Role,
  invitedById: string
) {
  const existing = await prisma.invitation.findFirst({
    where: { email, status: "PENDING" },
  });
  if (existing) {
    throw new ConflictError("A pending invitation already exists for this email");
  }

  const existingUser = await prisma.instructor.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError("A user with this email already exists");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  return prisma.invitation.create({
    data: { email, role, invitedById, expiresAt },
  });
}

export async function listInvitations() {
  return prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { name: true, email: true } } },
  });
}

export async function verifyInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) throw new NotFoundError("Invitation");
  if (invitation.status !== "PENDING") {
    throw new ConflictError(`Invitation has already been ${invitation.status.toLowerCase()}`);
  }
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    throw new ConflictError("Invitation has expired");
  }
  return invitation;
}

export async function acceptInvitation(token: string) {
  return prisma.invitation.update({
    where: { token },
    data: { status: "ACCEPTED" as InvitationStatus },
  });
}

// ─── Platform Settings ──────────────────────────────────────────────────────

export async function getSettings() {
  const rows = await prisma.platformSetting.findMany();
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return {
    signupEnabled: settings["signupEnabled"] === "true",
  };
}

export async function updateSettings(patch: { signupEnabled?: boolean }) {
  if (patch.signupEnabled !== undefined) {
    await prisma.platformSetting.upsert({
      where: { key: "signupEnabled" },
      update: { value: String(patch.signupEnabled) },
      create: { key: "signupEnabled", value: String(patch.signupEnabled) },
    });
  }
  return getSettings();
}

export async function isSignupEnabled(): Promise<boolean> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "signupEnabled" },
  });
  return setting?.value === "true";
}

// ─── Platform Stats ─────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [totalInstructors, activeInstructors, bannedInstructors] =
    await Promise.all([
      prisma.instructor.count(),
      prisma.instructor.count({ where: { banned: { not: true } } }),
      prisma.instructor.count({ where: { banned: true } }),
    ]);

  return {
    totalInstructors,
    activeInstructors,
    bannedInstructors,
  };
}
