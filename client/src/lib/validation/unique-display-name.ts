export function isDuplicateDisplayName(
  name: string,
  existing: readonly { id: string; name: string }[],
  excludeId?: string | null
): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const normalized = trimmed.toLowerCase();
  return existing.some(
    (item) =>
      item.name.toLowerCase() === normalized && item.id !== excludeId
  );
}

export const DUPLICATE_EXERCISE_NAME_MESSAGE =
  "An exercise with this name already exists";

export const DUPLICATE_CLASS_PLAN_NAME_MESSAGE =
  "A class plan with this name already exists";

export const DUPLICATE_CLASS_PLAN_SECTION_NAME_MESSAGE =
  "A section with this name already exists in this class plan";
