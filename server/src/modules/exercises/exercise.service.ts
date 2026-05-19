import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { promoteImage, deleteImage } from "../../lib/cloudinary";
import type {
  CreateExerciseInput,
  UpdateExerciseInput,
  ListExercisesQuery,
  SaveToLibraryInput,
} from "./exercise.validation";

const activeFilter = { deletedAt: null };

const DEFAULT_PAGE_SIZE = 24;

export type PaginatedExerciseList = {
  exercises: Awaited<ReturnType<typeof prisma.exercise.findMany>>;
  total: number;
  page: number;
  limit: number;
};

function listExercisesWhere(
  instructorId: string,
  query?: ListExercisesQuery
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    instructorId,
    ...activeFilter,
  };

  if (query?.folderId === "none") {
    where.folderId = null;
  } else if (query?.folderId) {
    where.folderId = query.folderId;
  }
  if (query?.tag) where.tags = { has: query.tag };
  if (query?.savedToLibrary === "true") where.savedToLibrary = true;
  if (query?.savedToLibrary === "false") where.savedToLibrary = false;
  if (query?.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

const exerciseListInclude = {
  images: { orderBy: { order: "asc" as const } },
  folder: true,
  layers: { orderBy: { order: "asc" as const } },
} as const;

export async function listExercises(
  instructorId: string,
  query?: ListExercisesQuery
): Promise<
  | Awaited<ReturnType<typeof prisma.exercise.findMany>>
  | PaginatedExerciseList
> {
  const where = listExercisesWhere(instructorId, query);

  if (query?.page !== undefined) {
    const limit = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, 100);
    const page = query.page;
    const skip = (page - 1) * limit;

    const [total, exercises] = await Promise.all([
      prisma.exercise.count({ where }),
      prisma.exercise.findMany({
        where,
        include: exerciseListInclude,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return { exercises, total, page, limit };
  }

  return prisma.exercise.findMany({
    where,
    include: exerciseListInclude,
    orderBy: { name: "asc" },
  });
}

export async function getExercise(id: string, instructorId: string) {
  const exercise = await prisma.exercise.findFirst({
    where: { id, instructorId, ...activeFilter },
    include: {
      images: { orderBy: { order: "asc" } },
      folder: true,
      layers: { orderBy: { order: "asc" } },
      progressionOf: { select: { id: true, name: true } },
      progressions: { select: { id: true, name: true } },
    },
  });
  if (!exercise) throw new NotFoundError("Exercise");
  return exercise;
}

async function assertExerciseFolderOwned(
  folderId: string,
  instructorId: string
): Promise<void> {
  const folder = await prisma.exerciseFolder.findFirst({
    where: { id: folderId, instructorId, deletedAt: null },
  });
  if (!folder) throw new NotFoundError("Folder");
}

export async function saveExerciseToLibrary(
  id: string,
  instructorId: string,
  data: SaveToLibraryInput
) {
  const exercise = await prisma.exercise.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!exercise) throw new NotFoundError("Exercise");

  if (data.folderId !== undefined && data.folderId !== null) {
    await assertExerciseFolderOwned(data.folderId, instructorId);
  }

  return prisma.exercise.update({
    where: { id },
    data: {
      savedToLibrary: true,
      ...(data.folderId !== undefined && { folderId: data.folderId }),
    },
    include: {
      images: { orderBy: { order: "asc" } },
      folder: true,
      layers: { orderBy: { order: "asc" } },
      progressionOf: { select: { id: true, name: true } },
      progressions: { select: { id: true, name: true } },
    },
  });
}

export async function createExercise(
  instructorId: string,
  data: CreateExerciseInput
) {
  const { layers, savedToLibrary, ...rest } = data;
  return prisma.exercise.create({
    data: {
      ...rest,
      ...(savedToLibrary !== undefined && { savedToLibrary }),
      instructorId,
      layers: {
        create: layers.map((l) => ({
          content: l.content,
          order: l.order,
          isFinisher: l.isFinisher ?? false,
        })),
      },
    },
    include: {
      images: true,
      folder: true,
      layers: { orderBy: { order: "asc" } },
    },
  });
}

export async function updateExercise(
  id: string,
  instructorId: string,
  data: UpdateExerciseInput
) {
  const exercise = await prisma.exercise.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!exercise) throw new NotFoundError("Exercise");

  const { layers, ...rest } = data;

  return prisma.exercise.update({
    where: { id },
    data: {
      ...rest,
      ...(layers !== undefined && {
        layers: {
          deleteMany: {},
          create: layers.map((l) => ({
            content: l.content,
            order: l.order,
            isFinisher: l.isFinisher ?? false,
          })),
        },
      }),
    },
    include: {
      images: true,
      folder: true,
      layers: { orderBy: { order: "asc" } },
    },
  });
}

export async function deleteExercise(id: string, instructorId: string) {
  const exercise = await prisma.exercise.findFirst({
    where: { id, instructorId, ...activeFilter },
    include: { images: true },
  });
  if (!exercise) throw new NotFoundError("Exercise");

  for (const img of exercise.images) {
    if (img.publicId) {
      await deleteImage(img.publicId).catch(() => {});
    }
  }

  await prisma.exerciseImage.deleteMany({ where: { exerciseId: id } });

  return prisma.exercise.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function setProgression(
  id: string,
  instructorId: string,
  progressionOfId: string | null
) {
  const exercise = await prisma.exercise.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!exercise) throw new NotFoundError("Exercise");

  return prisma.exercise.update({
    where: { id },
    data: { progressionOfId },
  });
}

export async function getProgressionChain(id: string, instructorId: string) {
  const chain: { id: string; name: string; level: number }[] = [];

  let current = await prisma.exercise.findFirst({
    where: { id, instructorId, ...activeFilter },
    select: { id: true, name: true, progressionOfId: true },
  });
  if (!current) throw new NotFoundError("Exercise");

  // Walk backward to the root
  const visited = new Set<string>();
  while (current?.progressionOfId && !visited.has(current.progressionOfId)) {
    visited.add(current.id);
    current = await prisma.exercise.findFirst({
      where: { id: current.progressionOfId, ...activeFilter },
      select: { id: true, name: true, progressionOfId: true },
    });
  }

  // Walk forward from root
  if (current) {
    let level = 1;
    let node: typeof current | null = current;
    const forwardVisited = new Set<string>();
    while (node && !forwardVisited.has(node.id)) {
      forwardVisited.add(node.id);
      chain.push({ id: node.id, name: node.name, level });
      level++;
      // need optimization here, will do later
      node = await prisma.exercise.findFirst({
        where: { progressionOfId: node.id, instructorId, ...activeFilter },
        select: { id: true, name: true, progressionOfId: true },
      });
    }
  }

  return chain;
}

// ─── Folder operations ───────────────────────────────────────────────────────

export async function listFolders(instructorId: string) {
  const [folders, totalExercises] = await Promise.all([
    prisma.exerciseFolder.findMany({
      where: { instructorId, ...activeFilter },
      include: { _count: { select: { exercises: { where: activeFilter } } } },
      orderBy: { name: "asc" },
    }),
    prisma.exercise.count({
      where: { instructorId, ...activeFilter },
    }),
  ]);
  return { folders, totalExercises };
}

export async function createFolder(instructorId: string, name: string) {
  return prisma.exerciseFolder.create({
    data: { name, instructorId },
  });
}

export async function updateFolder(
  id: string,
  instructorId: string,
  name: string
) {
  const folder = await prisma.exerciseFolder.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!folder) throw new NotFoundError("Folder");

  return prisma.exerciseFolder.update({ where: { id }, data: { name } });
}

export async function deleteFolder(id: string, instructorId: string) {
  const folder = await prisma.exerciseFolder.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!folder) throw new NotFoundError("Folder");

  await prisma.exercise.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });

  return prisma.exerciseFolder.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ─── Temp image promotion ────────────────────────────────────────────────────

export async function attachTempImagesToExercise(
  exerciseId: string,
  instructorId: string,
  publicIds: string[]
) {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, instructorId, ...activeFilter },
    include: { images: true },
  });
  if (!exercise) throw new NotFoundError("Exercise");

  const invalid = publicIds.filter((id) => !id.startsWith("temp/"));
  if (invalid.length > 0) {
    throw new Error("Only temp/ images can be promoted");
  }

  const currentCount = exercise.images.length;
  if (currentCount + publicIds.length > 3) {
    throw new Error(
      `Maximum 3 images per exercise (currently ${currentCount})`
    );
  }

  const promoted: { url: string; publicId: string }[] = [];

  try {
    for (const tempId of publicIds) {
      const result = await promoteImage(tempId, exerciseId);
      promoted.push(result);
    }
  } catch (err) {
    for (const p of promoted) {
      await deleteImage(p.publicId).catch(() => {});
    }
    throw err;
  }

  try {
    await prisma.$transaction(
      promoted.map((p, i) =>
        prisma.exerciseImage.create({
          data: {
            exerciseId,
            url: p.url,
            publicId: p.publicId,
            order: currentCount + i,
          },
        })
      )
    );
  } catch (err) {
    for (const p of promoted) {
      await deleteImage(p.publicId).catch(() => {});
    }
    throw err;
  }
}

// ─── Image operations ────────────────────────────────────────────────────────

export async function addImage(
  exerciseId: string,
  instructorId: string,
  url: string,
  publicId: string
) {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, instructorId, ...activeFilter },
    include: { images: true },
  });
  if (!exercise) throw new NotFoundError("Exercise");
  if (exercise.images.length >= 3) {
    throw new Error("Maximum 3 images per exercise");
  }

  return prisma.exerciseImage.create({
    data: {
      exerciseId,
      url,
      publicId,
      order: exercise.images.length,
    },
  });
}

export async function removeImage(
  exerciseId: string,
  imageId: string,
  instructorId: string
) {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, instructorId, ...activeFilter },
  });
  if (!exercise) throw new NotFoundError("Exercise");

  const image = await prisma.exerciseImage.findFirst({
    where: { id: imageId, exerciseId },
  });
  if (!image) throw new NotFoundError("Image");

  await prisma.exerciseImage.delete({ where: { id: imageId } });
  return image;
}

export async function reorderImages(
  exerciseId: string,
  instructorId: string,
  imageIds: string[]
) {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, instructorId, ...activeFilter },
    include: { images: true },
  });
  if (!exercise) throw new NotFoundError("Exercise");

  const existingIds = new Set(exercise.images.map((img) => img.id));
  for (const id of imageIds) {
    if (!existingIds.has(id)) throw new NotFoundError("Image");
  }

  await prisma.$transaction(
    imageIds.map((id, index) =>
      prisma.exerciseImage.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return prisma.exerciseImage.findMany({
    where: { exerciseId },
    orderBy: { order: "asc" },
  });
}
