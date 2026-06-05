import { prisma } from "../../lib/prisma";

const active = { deletedAt: null };

function utcCalendarDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function todayUtcDate(): Date {
  return utcCalendarDate(new Date());
}

function mapNotificationItem(
  instance: {
    id: string;
    date: Date;
    time: Date;
    classType: string | null;
    class: { title: string; type: string };
  },
  clientName?: string
) {
  return {
    instanceId: instance.id,
    classTitle: instance.class.title,
    date: instance.date,
    time: instance.time,
    classType: instance.class.type,
    clientName,
  };
}

export async function getDashboardStats(instructorId: string) {
  const today = todayUtcDate();

  const [todayClasses, totalExercises, totalTemplates, totalClients] = await Promise.all([
    prisma.classInstance.count({
      where: { instructorId, ...active, date: today, class: active },
    }),
    prisma.exercise.count({
      where: { instructorId, ...active, savedToLibrary: true },
    }),
    prisma.classPlanTemplate.count({
      where: { instructorId, ...active },
    }),
    prisma.client.count({
      where: { instructorId, ...active },
    }),
  ]);

  return { todayClasses, totalExercises, totalTemplates, totalClients };
}

export async function getDashboardNotifications(instructorId: string) {
  const today = todayUtcDate();
  const now = new Date();

  const [noPlanRows, missingNoteRows, upcomingRows] = await Promise.all([
    prisma.classInstance.findMany({
      where: {
        instructorId,
        ...active,
        status: "SCHEDULED",
        date: { gte: today },
        templateId: null,
        class: active,
        sections: { none: {} },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        class: { select: { title: true, type: true } },
      },
    }),
    prisma.classInstance.findMany({
      where: {
        instructorId,
        ...active,
        status: "COMPLETED",
        class: { ...active, type: "PRIVATE" },
        attendances: { some: { present: true } },
      },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: 50,
      include: {
        class: { select: { title: true, type: true } },
        attendances: {
          where: { present: true },
          include: {
            client: { select: { firstName: true, lastName: true } },
          },
        },
        sessionNotes: {
          where: active,
          select: { clientId: true },
        },
      },
    }),
    prisma.classInstance.findMany({
      where: {
        instructorId,
        ...active,
        status: "SCHEDULED",
        class: active,
        OR: [
          { date: { gt: today } },
          { date: today, time: { gt: now } },
        ],
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 3,
      include: {
        class: { select: { title: true, type: true } },
      },
    }),
  ]);

  const noPlan = noPlanRows.map((row) => mapNotificationItem(row));

  const missingNotes = missingNoteRows.flatMap((instance) => {
    const notedClientIds = new Set(instance.sessionNotes.map((n) => n.clientId));
    return instance.attendances
      .filter((a) => !notedClientIds.has(a.clientId))
      .map((a) =>
        mapNotificationItem(
          instance,
          `${a.client.firstName} ${a.client.lastName}`.trim()
        )
      );
  });

  const upcoming = upcomingRows.map((row) => mapNotificationItem(row));

  return { noPlan, missingNotes, upcoming };
}
