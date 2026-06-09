import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";

const activeFilter = { deletedAt: null };

export async function listFolders(instructorId: string) {
  const [folders, totalTemplates] = await Promise.all([
    prisma.classPlanFolder.findMany({
      where: { instructorId, ...activeFilter },
      include: {
        _count: { select: { templates: { where: activeFilter } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.classPlanTemplate.count({
      where: { instructorId, ...activeFilter },
    }),
  ]);
  return { folders, totalTemplates };
}

async function assertUniqueClassPlanFolderName(
  instructorId: string,
  name: string,
  excludeId?: string
) {
  const existing = await prisma.classPlanFolder.findFirst({
    where: {
      instructorId,
      ...activeFilter,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (existing) {
    throw new ConflictError("A folder with this name already exists");
  }
}

export async function createFolder(instructorId: string, name: string) {
  const trimmed = name.trim();
  await assertUniqueClassPlanFolderName(instructorId, trimmed);
  return prisma.classPlanFolder.create({
    data: { name: trimmed, instructorId },
  });
}

export async function updateFolder(
  id: string,
  instructorId: string,
  name: string
) {
  const folder = await prisma.classPlanFolder.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!folder) throw new NotFoundError("Folder");

  const trimmed = name.trim();
  await assertUniqueClassPlanFolderName(instructorId, trimmed, id);
  return prisma.classPlanFolder.update({ where: { id }, data: { name: trimmed } });
}

export async function deleteFolder(id: string, instructorId: string) {
  const folder = await prisma.classPlanFolder.findFirst({
    where: { id, instructorId, ...activeFilter },
  });
  if (!folder) throw new NotFoundError("Folder");

  await prisma.classPlanTemplate.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });

  return prisma.classPlanFolder.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
