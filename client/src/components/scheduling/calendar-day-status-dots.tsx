import type { CalendarClassInstance } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CalendarDayStatusDots({
  instances,
  className,
  variant = "light",
}: {
  instances: CalendarClassInstance[];
  className?: string;
  variant?: "light" | "dark";
}) {
  const hasScheduled = instances.some((i) => i.status === "SCHEDULED");
  const hasCompleted = instances.some((i) => i.status === "COMPLETED");
  const hasCancelled = instances.some((i) => i.status === "CANCELLED");

  if (!hasScheduled && !hasCompleted && !hasCancelled) return null;

  const scheduledClass =
    variant === "dark" ? "bg-[var(--layered-navy)]" : "bg-[var(--layered-navy)]";
  const completedClass =
    variant === "dark" ? "bg-muted-foreground" : "bg-muted/30";
  const cancelledClass =
    variant === "dark" ? "bg-destructive" : "bg-destructive";

  return (
    <span className={cn("flex gap-0.5", className)}>
      {hasScheduled ? (
        <span className={cn("size-1.5 rounded", scheduledClass)} aria-hidden />
      ) : null}
      {hasCompleted ? (
        <span className={cn("size-1.5 rounded", completedClass)} aria-hidden />
      ) : null}
      {hasCancelled ? (
        <span className={cn("size-1.5 rounded", cancelledClass)} aria-hidden />
      ) : null}
    </span>
  );
}

export function CalendarStatusLegend({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const textClass = variant === "dark" ? "text-white/60" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 text-xs",
        textClass,
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded bg-[var(--layered-navy)]" aria-hidden />
        Scheduled
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn(
            "size-2 rounded",
            variant === "dark" ? "bg-muted-foreground" : "bg-muted/30",
          )}
          aria-hidden
        />
        Completed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded bg-destructive" aria-hidden />
        Cancelled
      </span>
    </div>
  );
}
