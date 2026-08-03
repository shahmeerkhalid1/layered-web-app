import type { InstanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function instanceStatusLabel(status: InstanceStatus): string | null {
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return null;
}

/** Week grid event block accent — status overrides GROUP/PRIVATE when not scheduled. */
export function weekGridEventStatusClasses(
  status: InstanceStatus,
  _isGroup: boolean
): string {
  if (status === "CANCELLED") {
    return cn(
      "border-destructive  bg-destructive/12 text-destructive capitalize",
      "hover:bg-destructive/15",
    );
  }
  if (status === "COMPLETED") {
    return  "bg-muted/30 dark:bg-muted-foreground text-black hover:bg-muted/40";
  }
  return _isGroup
    ? "bg-[var(--layered-navy)] text-white hover:bg-[var(--layered-navy)]/90"
    : "bg-[var(--layered-espresso)] text-white hover:bg-[var(--layered-espresso)]/90";
}

/** Week overview list card shell — status overrides default secondary styling. */
export function weekOverviewCardStatusClasses(status: InstanceStatus, _isGroup: boolean): string {
  if (status === "CANCELLED") {
    return cn(
      "border-destructive/30 bg-destructive/8",
      "hover:border-destructive/45 hover:bg-destructive/12"
    );
  }
  if (status === "COMPLETED") {
    return cn(
      "border-border/70 bg-muted/30 dark:bg-muted-foreground",
      "hover:border-border hover:bg-muted/40"
    );
  }
  return _isGroup
  ?  "border-secondary/25 bg-[var(--layered-navy)] hover:border-[var(--layered-navy)]/40 hover:bg-[var(--layered-navy)]/90 dark:border-border/80 dark:bg-background/60 dark:hover:border-border dark:hover:bg-muted/30  "
  : "border-secondary/25 bg-[var(--layered-espresso)] hover:border-[var(--layered-espresso)]/40 hover:bg-[var(--layered-espresso)]/90 dark:border-border/80 dark:bg-background/60 dark:hover:border-border dark:hover:bg-muted/30";
}

/** Week overview time column — status-aware pill. */
export function weekOverviewTimePillStatusClasses(status: InstanceStatus): string {
  if (status === "CANCELLED") {
    return "bg-destructive/15 text-destructive";
  }
  if (status === "COMPLETED") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-[var(--layered-light-blue)] dark:bg-secondary/20 text-secondary-foreground";
}

/** Title treatment for non-scheduled instances. */
export function weekOverviewTitleStatusClasses(status: InstanceStatus): string {
  if (status === "CANCELLED") {
    return "text-muted-foreground line-through decoration-destructive/60";
  }
  if (status === "COMPLETED") {
    return "text-muted-foreground dark:text-black";
  }
  return "text-[var(--layered-white)] dark:text-foreground dark:group-hover:text-foreground";
}
