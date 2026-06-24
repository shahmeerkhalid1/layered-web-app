/** Footbar / machine setup applies to Reformer plans only (seed `class_type` value). */
export function showMachineSetupForClassPlanType(
  classType: string | null | undefined
): boolean {
  const trimmed = classType?.trim();
  if (!trimmed) return true;
  return trimmed.toLowerCase() === "reformer";
}

/** Springs apply to apparatus plans — not Mat (seed `class_type` value). */
export function showSpringsForClassPlanType(
  classType: string | null | undefined
): boolean {
  const trimmed = classType?.trim();
  if (!trimmed) return true;
  return trimmed.toLowerCase() !== "mat";
}
