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
  isGroup: boolean
): string {
  if (status === "CANCELLED") {
    return cn(
      "border-l-destructive border-destructive/30 bg-destructive/10 text-destructive",
      "hover:bg-destructive/15 hover:ring-destructive/25"
    );
  }
  if (status === "COMPLETED") {
    return cn(
      "border-l-muted-foreground/60 border-border/60 bg-muted/30 text-muted-foreground",
      "hover:bg-muted/40 hover:ring-muted-foreground/15"
    );
  }
  if (isGroup) {
    return "border-l-primary border-primary/25 bg-primary/12 text-primary hover:bg-primary/18 hover:ring-primary/20";
  }
  return cn(
    "border-l-border border-border bg-accent/40 text-foreground",
    "hover:bg-accent/50 hover:ring-border/80"
  );
}

/** Week overview list card shell — status overrides default secondary styling. */
export function weekOverviewCardStatusClasses(status: InstanceStatus): string {
  if (status === "CANCELLED") {
    return cn(
      "border-destructive/30 bg-destructive/8",
      "hover:border-destructive/45 hover:bg-destructive/12"
    );
  }
  if (status === "COMPLETED") {
    return cn(
      "border-border/70 bg-muted/30",
      "hover:border-border hover:bg-muted/40"
    );
  }
  return cn(
    "border-secondary/25 bg-secondary/80 hover:border-secondary/40 hover:bg-secondary",
    "dark:border-border/80 dark:bg-background/60 dark:hover:border-border dark:hover:bg-muted/30"
  );
}

/** Week overview time column — status-aware pill. */
export function weekOverviewTimePillStatusClasses(status: InstanceStatus): string {
  if (status === "CANCELLED") {
    return "bg-destructive/15 text-destructive";
  }
  if (status === "COMPLETED") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-secondary/20 text-secondary-foreground";
}

/** Title treatment for non-scheduled instances. */
export function weekOverviewTitleStatusClasses(status: InstanceStatus): string {
  if (status === "CANCELLED") {
    return "text-muted-foreground line-through decoration-destructive/60";
  }
  if (status === "COMPLETED") {
    return "text-muted-foreground";
  }
  return "text-foreground group-hover:text-foreground";
}
