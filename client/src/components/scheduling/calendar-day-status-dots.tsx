import type { CalendarClassInstance } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CalendarDayStatusDots({
  instances,
  className,
}: {
  instances: CalendarClassInstance[];
  className?: string;
}) {
  const hasScheduled = instances.some((i) => i.status === "SCHEDULED");
  const hasCompleted = instances.some((i) => i.status === "COMPLETED");
  const hasCancelled = instances.some((i) => i.status === "CANCELLED");

  if (!hasScheduled && !hasCompleted && !hasCancelled) return null;

  return (
    <span className={cn("flex gap-0.5", className)}>
      {hasScheduled ? (
        <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      ) : null}
      {hasCompleted ? (
        <span className="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden />
      ) : null}
      {hasCancelled ? (
        <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
      ) : null}
    </span>
  );
}

export function CalendarStatusLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 text-xs text-muted-foreground",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-primary" aria-hidden />
        Scheduled
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-muted-foreground/50" aria-hidden />
        Completed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-destructive" aria-hidden />
        Cancelled
      </span>
    </div>
  );
}
