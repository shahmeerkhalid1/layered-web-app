import { prisma } from "../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../lib/errors";

function slugValue(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
  return base.length > 0 ? base : `custom_${Date.now()}`;
}

export async function listOptionsByCategoryKey(
  categoryKey: string,
  instructorId: string
) {
  const category = await prisma.dropdownCategory.findUnique({
    where: { key: categoryKey },
  });
  if (!category) throw new NotFoundError("Dropdown category");

  return prisma.dropdownOption.findMany({
    where: {
      categoryId: category.id,
      OR: [{ instructorId: null }, { instructorId }],
    },
    orderBy: [{ order: "asc" }, { label: "asc" }],
    select: {
      id: true,
      label: true,
      value: true,
      order: true,
    },
  });
}

export async function addInstructorOption(
  categoryKey: string,
  instructorId: string,
  label: string
) {
  const category = await prisma.dropdownCategory.findUnique({
    where: { key: categoryKey },
  });
  if (!category) throw new NotFoundError("Dropdown category");

  const trimmed = label.trim();
  let value = slugValue(trimmed);
  const existingSame = await prisma.dropdownOption.findFirst({
    where: {
      categoryId: category.id,
      value,
      OR: [{ instructorId: null }, { instructorId }],
    },
  });
  if (existingSame) {
    value = `${value}_${Date.now()}`;
  }

  const maxOrder = await prisma.dropdownOption.aggregate({
    where: { categoryId: category.id, instructorId },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  return prisma.dropdownOption.create({
    data: {
      categoryId: category.id,
      label: trimmed,
      value,
      order: nextOrder,
      instructorId,
    },
    select: {
      id: true,
      label: true,
      value: true,
      order: true,
    },
  });
}

export async function deleteInstructorOption(
  optionId: string,
  instructorId: string
) {
  const option = await prisma.dropdownOption.findUnique({
    where: { id: optionId },
  });
  if (!option) throw new NotFoundError("Dropdown option");

  if (option.instructorId === null) {
    throw new ForbiddenError("Cannot delete global dropdown options");
  }
  if (option.instructorId !== instructorId) {
    throw new ForbiddenError("Cannot delete another instructor's options");
  }

  await prisma.dropdownOption.delete({ where: { id: optionId } });
}
