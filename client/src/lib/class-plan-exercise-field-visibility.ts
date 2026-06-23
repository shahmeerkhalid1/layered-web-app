/** Footbar / machine setup applies to Reformer plans only (seed `class_type` value). */
export function showMachineSetupForClassPlanType(
  classType: string | null | undefined
): boolean {
  const trimmed = classType?.trim();
  if (!trimmed) return true;
  return trimmed.toLowerCase() === "reformer";
}
