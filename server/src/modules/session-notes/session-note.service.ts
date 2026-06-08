import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { sendSessionNoteEmail } from "../../lib/mail";
import type {
  AttachExercisesInput,
  CreateSessionNoteInput,
  ListClientNotesQuery,
  UpdateSessionNoteInput,
} from "./session-note.validation";

const activeFilter = { deletedAt: null };

const noteInclude = {
  client: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  exercises: {
    include: {
      exercise: { select: { id: true, name: true } },
    },
    orderBy: { exercise: { name: "asc" as const } },
  },
} as const;

const timelineInclude = {
  exercises: {
    include: {
      exercise: { select: { id: true, name: true } },
    },
    orderBy: { exercise: { name: "asc" as const } },
  },
  classInstance: {
    select: {
      id: true,
      date: true,
      time: true,
      status: true,
      class: {
        select: {
          id: true,
          title: true,
          type: true,
          durationMinutes: true,
        },
      },
    },
  },
} as const;

async function getOwnedInstance(instanceId: string, instructorId: string) {
  const instance = await prisma.classInstance.findFirst({
    where: {
      id: instanceId,
      instructorId,
      ...activeFilter,
      class: activeFilter,
    },
    select: { id: true, classId: true },
  });
  if (!instance) throw new NotFoundError("Class instance");
  return instance;
}

async function assertClientPresentOnInstance(
  instanceId: string,
  classId: string,
  clientId: string,
  instructorId: string
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, instructorId, ...activeFilter },
    select: { id: true },
  });
  if (!client) throw new NotFoundError("Client");

  const attendance = await prisma.attendance.findUnique({
    where: {
      clientId_classInstanceId: { clientId, classInstanceId: instanceId },
    },
    select: { present: true },
  });

  if (!attendance?.present) {
    const enrolled = await prisma.enrollment.findFirst({
      where: { classId, clientId },
      select: { id: true },
    });
    if (!enrolled) {
      throw new ValidationError("Client is not enrolled in this class");
    }
    throw new ValidationError(
      "Session notes can only be created for clients marked as present"
    );
  }
}

async function getOwnedNote(noteId: string, instructorId: string) {
  const note = await prisma.sessionNote.findFirst({
    where: { id: noteId, instructorId, ...activeFilter },
    include: noteInclude,
  });
  if (!note) throw new NotFoundError("Session note");
  return note;
}

async function assertExercisesOwned(exerciseIds: string[], instructorId: string) {
  if (exerciseIds.length === 0) return;
  const uniqueIds = [...new Set(exerciseIds)];
  const count = await prisma.exercise.count({
    where: {
      id: { in: uniqueIds },
      instructorId,
      ...activeFilter,
    },
  });
  if (count !== uniqueIds.length) {
    throw new ValidationError("One or more exercises were not found");
  }
}

async function syncNoteExercises(
  sessionNoteId: string,
  exerciseIds: string[],
  instructorId: string
) {
  if (exerciseIds.length === 0) return;
  await assertExercisesOwned(exerciseIds, instructorId);
  const uniqueIds = [...new Set(exerciseIds)];
  await prisma.sessionNoteExercise.createMany({
    data: uniqueIds.map((exerciseId) => ({ sessionNoteId, exerciseId })),
    skipDuplicates: true,
  });
}

export async function createOrUpsertSessionNote(
  instanceId: string,
  instructorId: string,
  input: CreateSessionNoteInput
) {
  const instance = await getOwnedInstance(instanceId, instructorId);
  await assertClientPresentOnInstance(
    instanceId,
    instance.classId,
    input.clientId,
    instructorId
  );

  const content = input.content ?? "";

  const existing = await prisma.sessionNote.findFirst({
    where: {
      classInstanceId: instanceId,
      clientId: input.clientId,
      ...activeFilter,
    },
    select: { id: true },
  });

  let noteId: string;

  if (existing) {
    await prisma.sessionNote.update({
      where: { id: existing.id },
      data: { content },
    });
    noteId = existing.id;
  } else {
    // Clear any legacy soft-deleted row blocking the unique (instance, client) slot
    await prisma.sessionNote.deleteMany({
      where: {
        classInstanceId: instanceId,
        clientId: input.clientId,
        deletedAt: { not: null },
      },
    });

    const created = await prisma.sessionNote.create({
      data: {
        classInstanceId: instanceId,
        clientId: input.clientId,
        content,
        instructorId,
      },
      select: { id: true },
    });
    noteId = created.id;
  }

  if (input.exerciseIds && input.exerciseIds.length > 0) {
    await syncNoteExercises(noteId, input.exerciseIds, instructorId);
  }

  return getSessionNoteById(noteId, instructorId);
}

export async function listSessionNotesForInstance(
  instanceId: string,
  instructorId: string
) {
  await getOwnedInstance(instanceId, instructorId);

  return prisma.sessionNote.findMany({
    where: { classInstanceId: instanceId, instructorId, ...activeFilter },
    include: noteInclude,
    orderBy: [{ client: { lastName: "asc" } }, { client: { firstName: "asc" } }],
  });
}

export async function getClientSessionNotesTimeline(
  clientId: string,
  instructorId: string,
  query: ListClientNotesQuery
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, instructorId, ...activeFilter },
    select: { id: true },
  });
  if (!client) throw new NotFoundError("Client");

  const where: Record<string, unknown> = {
    clientId,
    instructorId,
    ...activeFilter,
    classInstance: activeFilter,
  };

  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) {
      dateFilter.gte = new Date(`${query.startDate.slice(0, 10)}T00:00:00.000Z`);
    }
    if (query.endDate) {
      dateFilter.lte = new Date(`${query.endDate.slice(0, 10)}T23:59:59.999Z`);
    }
    where.classInstance = { ...activeFilter, date: dateFilter };
  }

  const limit = Math.min(query.limit ?? 20, 100);
  const page = query.page;
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    prisma.sessionNote.count({ where }),
    prisma.sessionNote.findMany({
      where,
      include: timelineInclude,
      orderBy: { classInstance: { date: "desc" } },
      skip,
      take: limit,
    }),
  ]);

  return { data, total, page, limit };
}

export async function getSessionNoteById(noteId: string, instructorId: string) {
  return getOwnedNote(noteId, instructorId);
}

export async function updateSessionNote(
  noteId: string,
  instructorId: string,
  input: UpdateSessionNoteInput
) {
  await getOwnedNote(noteId, instructorId);

  if (input.content === undefined) {
    return getSessionNoteById(noteId, instructorId);
  }

  await prisma.sessionNote.update({
    where: { id: noteId },
    data: { content: input.content },
  });

  return getSessionNoteById(noteId, instructorId);
}

export async function deleteSessionNote(noteId: string, instructorId: string) {
  await getOwnedNote(noteId, instructorId);
  await prisma.sessionNote.delete({ where: { id: noteId } });
  return { message: "Session note deleted" };
}

export async function attachExercisesToNote(
  noteId: string,
  instructorId: string,
  input: AttachExercisesInput
) {
  await getOwnedNote(noteId, instructorId);
  await syncNoteExercises(noteId, input.exerciseIds, instructorId);
  return getSessionNoteById(noteId, instructorId);
}

export async function detachExerciseFromNote(
  noteId: string,
  exerciseId: string,
  instructorId: string
) {
  await getOwnedNote(noteId, instructorId);

  const row = await prisma.sessionNoteExercise.findFirst({
    where: { sessionNoteId: noteId, exerciseId },
  });
  if (!row) throw new NotFoundError("Exercise attachment");

  await prisma.sessionNoteExercise.delete({ where: { id: row.id } });
  return getSessionNoteById(noteId, instructorId);
}

function formatSessionDateLabel(date: Date, time: Date): string {
  const datePart = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const timePart = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${datePart} · ${timePart}`;
}

export async function shareSessionNote(noteId: string, instructorId: string) {
  const note = await prisma.sessionNote.findFirst({
    where: { id: noteId, instructorId, ...activeFilter },
    include: {
      client: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      exercises: {
        include: { exercise: { select: { name: true } } },
        orderBy: { exercise: { name: "asc" as const } },
      },
      classInstance: {
        select: {
          date: true,
          time: true,
          class: { select: { title: true, type: true } },
        },
      },
    },
  });

  if (!note) throw new NotFoundError("Session note");

  if (note.classInstance.class.type !== "PRIVATE") {
    throw new ValidationError("Session notes can only be shared for private sessions");
  }

  const content = note.content.trim();
  if (!content) {
    throw new ValidationError("Add note content before sharing with the client");
  }

  const clientEmail = note.client.email.trim();
  if (!clientEmail) {
    throw new ValidationError("Client does not have an email address on file");
  }

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { name: true },
  });
  const instructorName = instructor?.name?.trim() || "Your instructor";

  const sessionDate = formatSessionDateLabel(note.classInstance.date, note.classInstance.time);
  const exerciseNames = note.exercises.map((row) => row.exercise.name);

  const result = await sendSessionNoteEmail({
    to: clientEmail,
    clientFirstName: note.client.firstName,
    instructorName,
    classTitle: note.classInstance.class.title,
    sessionDate,
    content,
    exercises: exerciseNames,
  });

  if (!result.ok) {
    return { emailSent: false, emailError: result.message };
  }

  return { emailSent: true };
}
