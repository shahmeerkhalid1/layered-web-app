import { prisma } from "./prisma";
import { ConflictError } from "./errors";

export const DUPLICATE_PLAN_SECTION_NAME_MESSAGE =
  "A section with this name already exists in this class plan";

type PlanSectionScope =
  | { templateId: string }
  | { classInstanceId: string };

export function assertUniqueSectionNamesInPayload(
  sections: { name: string }[]
): void {
  const seen = new Set<string>();
  for (const section of sections) {
    const normalized = section.name.trim().toLowerCase();
    if (!normalized) continue;
    if (seen.has(normalized)) {
      throw new ConflictError(DUPLICATE_PLAN_SECTION_NAME_MESSAGE);
    }
    seen.add(normalized);
  }
}

export async function assertUniquePlanSectionName(
  name: string,
  scope: PlanSectionScope,
  excludeSectionId?: string
): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.planSection.findFirst({
    where: {
      ...scope,
      name: { equals: trimmed, mode: "insensitive" },
      ...(excludeSectionId ? { id: { not: excludeSectionId } } : {}),
    },
  });
  if (existing) {
    throw new ConflictError(DUPLICATE_PLAN_SECTION_NAME_MESSAGE);
  }
  return trimmed;
}
