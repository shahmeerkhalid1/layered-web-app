import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { Prisma } from "../../generated/prisma/client";
import type {
  CreateClassInput,
  ListClassInstancesQuery,
  ListClassesQuery,
  QuickScheduleInput,
  UpdateClassInput,
  UpdateClassInstanceInput,
} from "./scheduling.validation";
import type {
  AddExerciseToSectionInput,
  AddSectionInput,
  UpdateSectionExerciseInput,
  UpdateSectionInput,
} from "../class-plans/class-plan.validation";

const active = { deletedAt: null };

const sectionExerciseInclude = {
  exercise: {
    select: {
      id: true,
      name: true,
      savedToLibrary: true,
      orientation: true,
      directionFaced: true,
      movementType: true,
      springs: true,
      machineSetup: true,
      equipment: true,
      spinalMovement: true,
      chainType: true,
      jointLoading: true,
    },
  },
} as const;

const instanceDetailInclude = {
  class: true,
  sections: {
    orderBy: { order: "asc" as const },
    include: {
      exercises: {
        orderBy: { order: "asc" as const },
        include: sectionExerciseInclude,
      },
    },
  },
} as const;

const MAX_INSTANCES = 520;

type SchedulingTx = Pick<
  typeof prisma,
  "planSection" | "classInstance" | "classPlanTemplate" | "class"
>;

function utcCalendarDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toDateOnlyUTC(d: Date): Date {
  return utcCalendarDate(d);
}

/** ISO weekday: Monday = 1 … Sunday = 7 */
function utcIsoWeekday(d: Date): number {
  const w = d.getUTCDay();
  return w === 0 ? 7 : w;
}

function applyUTCTimeToDay(day: Date, clock: Date): Date {
  return new Date(
    Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      clock.getUTCHours(),
      clock.getUTCMinutes(),
      clock.getUTCSeconds(),
      clock.getUTCMilliseconds()
    )
  );
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Combine calendar date (YYYY-MM-DD) with time field: ISO instant or HH:mm / HH:mm:ss (UTC). */
function parseSlotDateTime(dateStr: string, timeField: string): Date {
  if (timeField.includes("T")) {
    return new Date(timeField);
  }
  const parts = timeField.split(":");
  const h = Number(parts[0] ?? 0);
  const mi = Number(parts[1] ?? 0);
  const s = Number(parts[2] ?? 0);
  const [y, mo, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, day, h, mi, s, 0));
}

function eachUtcCalendarDay(from: Date, to: Date, fn: (day: Date) => void): void {
  let t = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const endT = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  while (t <= endT) {
    fn(new Date(t));
    t += 86400000;
  }
}

async function assertTemplateOwned(id: string, instructorId: string): Promise<void> {
  const ok = await prisma.classPlanTemplate.findFirst({
    where: { id, instructorId, ...active },
    select: { id: true },
  });
  if (!ok) throw new NotFoundError("Class plan template");
}

async function assertExercisesOwned(
  instructorId: string,
  exerciseIds: string[]
): Promise<void> {
  if (exerciseIds.length === 0) return;
  const unique = [...new Set(exerciseIds)];
  const count = await prisma.exercise.count({
    where: {
      id: { in: unique },
      instructorId,
      ...active,
    },
  });
  if (count !== unique.length) throw new NotFoundError("Exercise");
}

function buildOccurrenceSlots(
  isRecurring: boolean,
  startDate: Date,
  endDate: Date | null,
  timeClock: Date,
  recurrenceRule: unknown
): { date: Date; time: Date }[] {
  const slots: { date: Date; time: Date }[] = [];

  if (!isRecurring) {
    const day = utcCalendarDate(startDate);
    slots.push({ date: day, time: applyUTCTimeToDay(day, timeClock) });
    return slots;
  }

  const rule = recurrenceRule as { daysOfWeek?: number[] } | null;
  const days = rule?.daysOfWeek ?? [];
  const daySet = new Set(days);
  if (!endDate) return slots;

  const from = utcCalendarDate(startDate);
  const to = utcCalendarDate(endDate);

  eachUtcCalendarDay(from, to, (day) => {
    if (daySet.has(utcIsoWeekday(day))) {
      slots.push({ date: day, time: applyUTCTimeToDay(day, timeClock) });
    }
  });

  return slots;
}

async function copyTemplateToInstanceInternal(
  tx: SchedulingTx,
  instanceId: string,
  templateId: string,
  instructorId: string
): Promise<void> {
  const template = await tx.classPlanTemplate.findFirst({
    where: { id: templateId, instructorId, ...active },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          exercises: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!template) throw new NotFoundError("Class plan template");

  await tx.planSection.deleteMany({ where: { classInstanceId: instanceId } });

  for (const s of template.sections) {
    await tx.planSection.create({
      data: {
        name: s.name,
        order: s.order,
        classInstanceId: instanceId,
        templateId: null,
        exercises: {
          create: s.exercises.map((pse) => ({
            exerciseId: pse.exerciseId,
            order: pse.order,
            reps: pse.reps,
            duration: pse.duration,
            notes: pse.notes,
          })),
        },
      },
    });
  }

  await tx.classInstance.update({
    where: { id: instanceId },
    data: {
      templateId,
      classType: template.classType,
      classStyle: template.classStyle,
      isCustomised: false,
    },
  });
}

async function assertClassOwned(classId: string, instructorId: string) {
  const row = await prisma.class.findFirst({
    where: { id: classId, instructorId, ...active },
    select: { id: true },
  });
  if (!row) throw new NotFoundError("Class");
}

async function getInstanceWithClass(instanceId: string, instructorId: string) {
  const inst = await prisma.classInstance.findFirst({
    where: { id: instanceId, instructorId, ...active, class: { ...active } },
    include: { class: true },
  });
  if (!inst) throw new NotFoundError("Class instance");
  return inst;
}

export async function quickSchedule(instructorId: string, body: QuickScheduleInput) {
  const startAt = parseSlotDateTime(body.date, body.time);
  const day = utcCalendarDate(startAt);

  let title = body.title?.trim() ?? "";
  let templateId: string | null = body.templateId ?? null;
  let classType: string | null = null;
  let classStyle: string | null = null;

  if (templateId) {
    await assertTemplateOwned(templateId, instructorId);
    const tpl = await prisma.classPlanTemplate.findFirst({
      where: { id: templateId, instructorId, ...active },
      select: { name: true, classType: true, classStyle: true },
    });
    if (!tpl) throw new NotFoundError("Class plan template");
    if (!title) title = tpl.name;
    classType = tpl.classType ?? null;
    classStyle = tpl.classStyle ?? null;
  }

  if (!title) throw new ValidationError("Title is required when no template is selected");

  return prisma.$transaction(async (tx) => {
    const cls = await tx.class.create({
      data: {
        title,
        type: body.type,
        isRecurring: false,
        recurrenceRule: undefined,
        startDate: day,
        endDate: null,
        time: startAt,
        durationMinutes: body.durationMinutes,
        templateId,
        syncWithTemplate: false,
        instructorId,
      },
    });

    const instance = await tx.classInstance.create({
      data: {
        classId: cls.id,
        date: toDateOnlyUTC(startAt),
        time: startAt,
        instructorId,
        templateId,
        classType,
        classStyle,
        isCustomised: false,
      },
    });

    if (templateId) {
      await copyTemplateToInstanceInternal(tx, instance.id, templateId, instructorId);
    }

    const fullInstance = await tx.classInstance.findFirst({
      where: { id: instance.id },
      include: { class: true },
    });

    return { class: cls, instance: fullInstance! };
  });
}

export async function createClass(instructorId: string, data: CreateClassInput) {
  console.log('data', data);
  let templateId: string | null = data.templateId ?? null;
  if (templateId) await assertTemplateOwned(templateId, instructorId);

  const slots = buildOccurrenceSlots(
    data.isRecurring,
    data.startDate,
    data.endDate ?? null,
    data.time,
    data.recurrenceRule
  );

  console.log("slots", slots);

  if (slots.length === 0) {
    throw new ValidationError("No class occurrences match the recurrence rule and date range");
  }
  if (slots.length > MAX_INSTANCES) {
    throw new ValidationError(`Cannot create more than ${MAX_INSTANCES} class instances`);
  }

  let newClassId = "";
  await prisma.$transaction(async (tx) => {
    const cls = await tx.class.create({
      data: {
        title: data.title,
        type: data.type,
        isRecurring: data.isRecurring,
        recurrenceRule:
          data.isRecurring && data.recurrenceRule
            ? (data.recurrenceRule as Prisma.InputJsonValue)
            : undefined,
        startDate: utcCalendarDate(data.startDate),
        endDate: data.endDate ? utcCalendarDate(data.endDate) : null,
        time: data.time,
        durationMinutes: data.durationMinutes,
        templateId,
        syncWithTemplate: false,
        instructorId,
      },
    });
    newClassId = cls.id;

    for (const slot of slots) {
      const inst = await tx.classInstance.create({
        data: {
          classId: cls.id,
          date: toDateOnlyUTC(slot.date),
          time: slot.time,
          instructorId,
          templateId,
          classType: null,
          classStyle: null,
          isCustomised: false,
        },
      });

      if (templateId) {
        await copyTemplateToInstanceInternal(tx, inst.id, templateId, instructorId);
      }
    }
  });

  return getClassById(newClassId, instructorId);
}

export async function listClasses(instructorId: string, query: ListClassesQuery) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const where = { instructorId, ...active };

  const [data, total] = await Promise.all([
    prisma.class.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { instances: { where: active } } },
      },
    }),
    prisma.class.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getClassById(classId: string, instructorId: string) {
  await assertClassOwned(classId, instructorId);
  const cls = await prisma.class.findFirst({
    where: { id: classId, instructorId, ...active },
    include: {
      instances: {
        where: active,
        orderBy: [{ date: "asc" }, { time: "asc" }],
        take: 200,
      },
    },
  });
  if (!cls) throw new NotFoundError("Class");
  return cls;
}

export async function updateClass(classId: string, instructorId: string, data: UpdateClassInput) {
  await assertClassOwned(classId, instructorId);

  if (data.templateId) await assertTemplateOwned(data.templateId, instructorId);

  await prisma.$transaction(async (tx) => {
    await tx.class.update({
      where: { id: classId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.recurrenceRule !== undefined && {
          recurrenceRule:
            data.recurrenceRule === null
              ? Prisma.DbNull
              : (data.recurrenceRule as Prisma.InputJsonValue),
        }),
        ...(data.startDate !== undefined && { startDate: utcCalendarDate(data.startDate) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate === null ? null : utcCalendarDate(data.endDate),
        }),
        ...(data.time !== undefined && { time: data.time }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.templateId !== undefined && { templateId: data.templateId }),
      },
    });

    const updatedRow = await tx.class.findUniqueOrThrow({ where: { id: classId } });

    if (data.regenerateFutureInstancesFrom && updatedRow.isRecurring) {
      const anchor = parseYmd(data.regenerateFutureInstancesFrom);
      await tx.classInstance.deleteMany({
        where: {
          classId,
          status: "SCHEDULED",
          deletedAt: null,
          date: { gte: toDateOnlyUTC(anchor) },
        },
      });

      const endD = updatedRow.endDate ? new Date(updatedRow.endDate) : null;
      if (!endD) {
        throw new ValidationError("endDate is required on the class to regenerate recurring instances");
      }

      const slots = buildOccurrenceSlots(
        true,
        anchor > utcCalendarDate(updatedRow.startDate)
          ? anchor
          : utcCalendarDate(updatedRow.startDate),
        endD,
        updatedRow.time,
        updatedRow.recurrenceRule
      ).filter((s) => utcCalendarDate(s.date) >= utcCalendarDate(anchor));

      if (slots.length > MAX_INSTANCES) {
        throw new ValidationError(`Cannot create more than ${MAX_INSTANCES} class instances`);
      }

      const tplId = updatedRow.templateId;
      if (tplId) await assertTemplateOwned(tplId, instructorId);

      for (const slot of slots) {
        const inst = await tx.classInstance.create({
          data: {
            classId,
            date: toDateOnlyUTC(slot.date),
            time: slot.time,
            instructorId,
            templateId: tplId,
            isCustomised: false,
          },
        });
        if (tplId) {
          await copyTemplateToInstanceInternal(tx, inst.id, tplId, instructorId);
        }
      }
    }
  });

  return getClassById(classId, instructorId);
}

export async function deleteClass(classId: string, instructorId: string) {
  await assertClassOwned(classId, instructorId);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.classInstance.updateMany({
      where: { classId, ...active },
      data: { deletedAt: now },
    });
    await tx.class.update({
      where: { id: classId },
      data: { deletedAt: now },
    });
  });
  return { message: "Class deleted" };
}

export async function listClassInstancesForCalendar(
  instructorId: string,
  query: ListClassInstancesQuery
) {
  const start = parseYmd(query.start);
  const end = parseYmd(query.end);
  if (start > end) throw new ValidationError("start must be on or before end");

  return prisma.classInstance.findMany({
    where: {
      instructorId,
      ...active,
      date: { gte: toDateOnlyUTC(start), lte: toDateOnlyUTC(end) },
      class: { ...active },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    include: {
      class: {
        select: {
          id: true,
          title: true,
          type: true,
          durationMinutes: true,
        },
      },
      _count: { select: { sections: true } },
    },
  });
}

export async function getClassInstanceById(instanceId: string, instructorId: string) {
  const inst = await prisma.classInstance.findFirst({
    where: { id: instanceId, instructorId, ...active, class: { ...active } },
    include: instanceDetailInclude,
  });
  if (!inst) throw new NotFoundError("Class instance");
  return inst;
}

export async function updateClassInstance(
  instanceId: string,
  instructorId: string,
  data: UpdateClassInstanceInput
) {
  const inst = await getInstanceWithClass(instanceId, instructorId);

  let nextTime = inst.time;
  if (data.date !== undefined) {
    const d = parseYmd(data.date);
    const clock = data.time !== undefined ? data.time : inst.time;
    nextTime = applyUTCTimeToDay(d, clock);
  } else if (data.time !== undefined) {
    nextTime = data.time;
  }

  const nextDate = toDateOnlyUTC(nextTime);

  return prisma.classInstance.update({
    where: { id: instanceId },
    data: {
      ...(data.time !== undefined || data.date !== undefined
        ? {
            time: nextTime,
            date: nextDate,
          }
        : {}),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: { class: true },
  });
}

export async function deleteClassInstance(instanceId: string, instructorId: string) {
  await getInstanceWithClass(instanceId, instructorId);
  await prisma.classInstance.update({
    where: { id: instanceId },
    data: { deletedAt: new Date() },
  });
  return { message: "Class instance deleted" };
}

export async function assignTemplateToInstance(
  instanceId: string,
  instructorId: string,
  templateId: string
) {
  await assertTemplateOwned(templateId, instructorId);
  await getInstanceWithClass(instanceId, instructorId);

  await prisma.$transaction(async (tx) => {
    await copyTemplateToInstanceInternal(tx, instanceId, templateId, instructorId);
  });
  return getClassInstanceById(instanceId, instructorId);
}

async function assertSectionInInstance(
  sectionId: string,
  instanceId: string,
  instructorId: string
): Promise<void> {
  await getInstanceWithClass(instanceId, instructorId);
  const section = await prisma.planSection.findFirst({
    where: { id: sectionId, classInstanceId: instanceId },
    select: { id: true },
  });
  if (!section) throw new NotFoundError("Section");
}

export async function addInstanceSection(
  instanceId: string,
  instructorId: string,
  data: AddSectionInput
) {
  await getInstanceWithClass(instanceId, instructorId);

  let order = data.order;
  if (order === undefined) {
    const agg = await prisma.planSection.aggregate({
      where: { classInstanceId: instanceId },
      _max: { order: true },
    });
    order = (agg._max.order ?? -1) + 1;
  }

  const section = await prisma.planSection.create({
    data: {
      name: data.name,
      order,
      classInstanceId: instanceId,
      templateId: null,
    },
  });

  await prisma.classInstance.update({
    where: { id: instanceId },
    data: { isCustomised: true },
  });

  return section;
}

export async function updateInstanceSection(
  instanceId: string,
  sectionId: string,
  instructorId: string,
  data: UpdateSectionInput
) {
  await assertSectionInInstance(sectionId, instanceId, instructorId);

  const row = await prisma.planSection.update({
    where: { id: sectionId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });

  await prisma.classInstance.update({
    where: { id: instanceId },
    data: { isCustomised: true },
  });

  return row;
}

export async function deleteInstanceSection(
  instanceId: string,
  sectionId: string,
  instructorId: string
) {
  await assertSectionInInstance(sectionId, instanceId, instructorId);
  await prisma.planSection.delete({ where: { id: sectionId } });
  await prisma.classInstance.update({
    where: { id: instanceId },
    data: { isCustomised: true },
  });
  return { message: "Section deleted" };
}

export async function addExerciseToInstanceSection(
  instanceId: string,
  sectionId: string,
  instructorId: string,
  data: AddExerciseToSectionInput
) {
  await assertSectionInInstance(sectionId, instanceId, instructorId);
  await assertExercisesOwned(instructorId, [data.exerciseId]);

  let order = data.order;
  if (order === undefined) {
    const agg = await prisma.planSectionExercise.aggregate({
      where: { sectionId },
      _max: { order: true },
    });
    order = (agg._max.order ?? -1) + 1;
  }

  const row = await prisma.planSectionExercise.create({
    data: {
      sectionId,
      exerciseId: data.exerciseId,
      order,
      reps: data.reps,
      duration: data.duration,
      notes: data.notes,
    },
    include: sectionExerciseInclude,
  });

  await prisma.classInstance.update({
    where: { id: instanceId },
    data: { isCustomised: true },
  });

  return row;
}

export async function updateInstanceSectionExercise(
  instanceId: string,
  sectionId: string,
  pseId: string,
  instructorId: string,
  data: UpdateSectionExerciseInput
) {
  await assertSectionInInstance(sectionId, instanceId, instructorId);

  const row = await prisma.planSectionExercise.findFirst({
    where: { id: pseId, sectionId },
  });
  if (!row) throw new NotFoundError("Plan section exercise");

  const updated = await prisma.planSectionExercise.update({
    where: { id: pseId },
    data: {
      ...(data.order !== undefined && { order: data.order }),
      ...(data.reps !== undefined && { reps: data.reps }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: sectionExerciseInclude,
  });

  await prisma.classInstance.update({
    where: { id: instanceId },
    data: { isCustomised: true },
  });

  return updated;
}

export async function removeExerciseFromInstanceSection(
  instanceId: string,
  sectionId: string,
  pseId: string,
  instructorId: string
) {
  await assertSectionInInstance(sectionId, instanceId, instructorId);

  const row = await prisma.planSectionExercise.findFirst({
    where: { id: pseId, sectionId },
  });
  if (!row) throw new NotFoundError("Plan section exercise");

  await prisma.planSectionExercise.delete({ where: { id: pseId } });
  await prisma.classInstance.update({
    where: { id: instanceId },
    data: { isCustomised: true },
  });
  return { message: "Exercise removed from section" };
}
