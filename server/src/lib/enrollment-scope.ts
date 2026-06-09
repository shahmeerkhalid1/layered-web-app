import type { InstanceStatus } from "../generated/prisma/client";

export const activeEnrollmentFilter = { unenrolledAt: null } as const;

function utcCalendarDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

type EnrollmentScope = {
  unenrolledAt?: Date | null;
};

type InstanceScope = {
  date: Date;
  status: InstanceStatus;
};

/** Whether an enrollment row applies to a specific class instance roster. */
export function enrollmentAppliesToInstance(
  enrollment: EnrollmentScope,
  instance: InstanceScope
): boolean {
  if (!enrollment.unenrolledAt) return true;

  if (instance.status === "COMPLETED" || instance.status === "CANCELLED") {
    return true;
  }

  const instanceDay = utcCalendarDate(instance.date).getTime();
  const unenrollDay = utcCalendarDate(enrollment.unenrolledAt).getTime();
  return instanceDay < unenrollDay;
}

export function unenrollEffectiveAt(): Date {
  return utcCalendarDate(new Date());
}
