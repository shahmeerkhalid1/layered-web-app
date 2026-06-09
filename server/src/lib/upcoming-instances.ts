import { prisma } from "./prisma";
import { ValidationError } from "./errors";

const activeFilter = { deletedAt: null };

function utcCalendarDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function upcomingScheduledInstanceWhere(classIds?: string[]) {
  return {
    ...(classIds ? { classId: { in: classIds } } : {}),
    ...activeFilter,
    status: "SCHEDULED" as const,
    date: { gte: utcCalendarDate(new Date()) },
  };
}

export async function getClassIdsWithUpcomingScheduledInstances(
  classIds: string[]
): Promise<Set<string>> {
  if (classIds.length === 0) return new Set();

  const groups = await prisma.classInstance.groupBy({
    by: ["classId"],
    where: upcomingScheduledInstanceWhere(classIds),
  });

  return new Set(groups.map((group) => group.classId));
}

export async function assertClassHasUpcomingScheduledInstances(
  classId: string
): Promise<void> {
  const count = await prisma.classInstance.count({
    where: upcomingScheduledInstanceWhere([classId]),
  });

  if (count === 0) {
    throw new ValidationError(
      "Cannot unenroll from a class with no upcoming sessions"
    );
  }
}
