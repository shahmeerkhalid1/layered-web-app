import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import type {
  CreateClassPlanInput,
  ListClassPlansQuery,
  UpdateClassPlanInput,
} from "./class-plan.validation";

const activeFilter = { deletedAt: null };

const templateDetailInclude = {
  folder: true,
  sections: {
    orderBy: { order: "asc" as const },
    include: {
      exercises: {
        orderBy: { order: "asc" as const },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              spinalMovement: true,
              chainType: true,
              jointLoading: true,
            },
          },
        },
      },
    },
  },
} as const;

async function assertFolderOwned(
  folderId: string,
  instructorId: string
): Promise<void> {
  const folder = await prisma.classPlanFolder.findFirst({
    where: { id: folderId, instructorId, ...activeFilter },
  });
  if (!folder) throw new NotFoundError("Folder");
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
      ...activeFilter,
    },
  });
  if (count !== unique.length) throw new NotFoundError("Exercise");
}

function collectExerciseIdsFromSections(
  sections: { exercises?: { exerciseId: string }[] }[] | undefined
): string[] {
  if (!sections?.length) return [];
  const ids: string[] = [];
  for (const s of sections) {
    for (const e of s.exercises ?? []) {
      ids.push(e.exerciseId);
    }
  }
  return ids;
}

export async function createClassPlan(
  instructorId: string,
  data: CreateClassPlanInput
) {
  const { sections, folderId, ...rest } = data;

  if (folderId) {
    await assertFolderOwned(folderId, instructorId);
  }

  await assertExercisesOwned(
    instructorId,
    collectExerciseIdsFromSections(sections)
  );

  const template = await prisma.classPlanTemplate.create({
    data: {
      ...rest,
      instructorId,
      ...(folderId !== undefined && { folderId }),
      sections:
        sections && sections.length > 0
          ? {
              create: sections.map((s) => ({
                name: s.name,
                order: s.order,
                exercises: {
                  create: (s.exercises ?? []).map((e) => ({
                    exerciseId: e.exerciseId,
                    order: e.order,
                    reps: e.reps,
                    duration: e.duration,
                    notes: e.notes,
                  })),
                },
              })),
            }
          : undefined,
    },
    include: templateDetailInclude,
  });

  return template;
}

export async function listClassPlans(
  instructorId: string,
  query: ListClassPlansQuery
) {
  const { page, limit, search, folderId, classType, classStyle, tags } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    instructorId,
    ...activeFilter,
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (folderId === "none") {
    where.folderId = null;
  } else if (folderId) {
    where.folderId = folderId;
  }

  if (classType) where.classType = classType;
  if (classStyle) where.classStyle = classStyle;

  if (tags) {
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length > 0) {
      where.tags = { hasSome: tagList };
    }
  }

  const [data, total] = await Promise.all([
    prisma.classPlanTemplate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        folder: true,
        _count: { select: { sections: true } },
      },
    }),
    prisma.classPlanTemplate.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getClassPlanById(id: string, instructorId: string) {
  const template = await prisma.classPlanTemplate.findFirst({
    where: { id, instructorId, ...activeFilter },
    include: templateDetailInclude,
  });
  if (!template) throw new NotFoundError("Class plan template");
  return template;
}

export async function updateClassPlan(
  id: string,
  instructorId: string,
  data: UpdateClassPlanInput
) {
  const existing = await prisma.classPlanTemplate.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!existing) throw new NotFoundError("Class plan template");

  const { sections, folderId, ...rest } = data;

  if (folderId !== undefined && folderId !== null) {
    await assertFolderOwned(folderId, instructorId);
  }

  if (sections !== undefined) {
    await assertExercisesOwned(
      instructorId,
      collectExerciseIdsFromSections(sections)
    );
  }

  const noop =
    sections === undefined &&
    rest.name === undefined &&
    rest.classType === undefined &&
    rest.classStyle === undefined &&
    rest.durationMinutes === undefined &&
    rest.tags === undefined &&
    folderId === undefined;
  if (noop) {
    return getClassPlanById(id, instructorId);
  }

  await prisma.$transaction(async (tx) => {
    if (sections !== undefined) {
      await tx.planSection.deleteMany({ where: { templateId: id } });
    }

    const dataPatch: Record<string, unknown> = {};
    if (rest.name !== undefined) dataPatch.name = rest.name;
    if (rest.classType !== undefined) dataPatch.classType = rest.classType;
    if (rest.classStyle !== undefined) dataPatch.classStyle = rest.classStyle;
    if (rest.durationMinutes !== undefined) {
      dataPatch.durationMinutes = rest.durationMinutes;
    }
    if (rest.tags !== undefined) dataPatch.tags = rest.tags;
    if (folderId !== undefined) dataPatch.folderId = folderId;

    await tx.classPlanTemplate.update({
      where: { id },
      data: {
        ...dataPatch,
        ...(sections !== undefined && {
          sections: {
            create: sections.map((s) => ({
              name: s.name,
              order: s.order,
              exercises: {
                create: (s.exercises ?? []).map((e) => ({
                  exerciseId: e.exerciseId,
                  order: e.order,
                  reps: e.reps,
                  duration: e.duration,
                  notes: e.notes,
                })),
              },
            })),
          },
        }),
      },
    });
  });

  return getClassPlanById(id, instructorId);
}

export async function deleteClassPlan(id: string, instructorId: string) {
  const template = await prisma.classPlanTemplate.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!template) throw new NotFoundError("Class plan template");

  await prisma.classPlanTemplate.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { message: "Template deleted" };
}

export async function duplicateClassPlan(id: string, instructorId: string) {
  const original = await prisma.classPlanTemplate.findFirst({
    where: { id, instructorId, ...activeFilter },
    include: templateDetailInclude,
  });
  if (!original) throw new NotFoundError("Class plan template");

  const copyName = `${original.name} (Copy)`;

  return prisma.classPlanTemplate.create({
    data: {
      name: copyName,
      classType: original.classType,
      classStyle: original.classStyle,
      durationMinutes: original.durationMinutes,
      folderId: original.folderId,
      tags: [...original.tags],
      instructorId,
      sections: {
        create: original.sections.map((s) => ({
          name: s.name,
          order: s.order,
          exercises: {
            create: s.exercises.map((pse) => ({
              exerciseId: pse.exerciseId,
              order: pse.order,
              reps: pse.reps,
              duration: pse.duration,
              notes: pse.notes,
            })),
          },
        })),
      },
    },
    include: templateDetailInclude,
  });
}
