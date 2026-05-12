import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";

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

export async function createFolder(instructorId: string, name: string) {
  return prisma.classPlanFolder.create({
    data: { name, instructorId },
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

  return prisma.classPlanFolder.update({ where: { id }, data: { name } });
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
