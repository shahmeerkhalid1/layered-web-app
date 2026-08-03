"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, Copy, Pencil, Trash2 } from "lucide-react";
import type { ClassPlanTemplate } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { QuickScheduleDialog } from "@/components/scheduling/quick-schedule-dialog";
import { cn } from "@/lib/utils";

interface ClassPlanCardProps {
  template: ClassPlanTemplate;
  onDuplicate: (id: string) => void;
  onRequestDelete: (template: ClassPlanTemplate) => void;
  duplicateDisabled?: boolean;
  duplicateDisabledTitle?: string;
}

export function ClassPlanCard({
  template,
  onDuplicate,
  onRequestDelete,
  duplicateDisabled = false,
  duplicateDisabledTitle = "Upgrade to duplicate class plans",
}: ClassPlanCardProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const sectionCount = template._count?.sections ?? 0;
  const durationLabel =
    template.durationMinutes != null ? `${template.durationMinutes} min` : "—";
  const classTypeLabel = template.classType?.trim() || "—";
  const classStyleLabel = template.classStyle?.trim() || "—";
  const updatedLabel = new Date(template.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <QuickScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        templatePrefill={{
          id: template.id,
          name: template.name,
          durationMinutes: template.durationMinutes,
        }}
      />
      <article className="layered-card-interactive flex h-full flex-col p-5">
        <Link
          href={`/class-plans/${template.id}`}
          className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="line-clamp-2 text-xl font-semibold leading-snug text-foreground">
            {template.name}
          </h3>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="min-w-0">
              <dt className="text-sm text-muted-foreground">Class type</dt>
              <dd
                className={cn(
                  "mt-0.5 truncate text-sm font-semibold text-foreground",
                  classTypeLabel === "—" && "text-muted-foreground",
                )}
              >
                {classTypeLabel}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sm text-muted-foreground">Class style</dt>
              <dd
                className={cn(
                  "mt-0.5 truncate text-sm font-semibold text-foreground",
                  classStyleLabel === "—" && "text-muted-foreground",
                )}
              >
                {classStyleLabel}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Duration</dt>
              <dd
                className={cn(
                  "mt-0.5 text-sm font-semibold tabular-nums text-foreground",
                  template.durationMinutes == null && "text-muted-foreground",
                )}
              >
                {durationLabel}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Sections</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                {sectionCount}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-sm text-muted-foreground">
            Last updated {updatedLabel}
          </p>

          {template.folder ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Folder: {template.folder.name}
            </p>
          ) : null}
        </Link>

        <div
          className="mt-4 flex items-center justify-end gap-0.5 border-t border-border pt-3"
          role="toolbar"
          aria-label="Class plan actions"
        >
          <Link
            href={`/class-plans/${template.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="View or edit plan"
          >
            <Pencil className="size-4" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Schedule class"
            onClick={() => setScheduleOpen(true)}
          >
            <CalendarPlus className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Duplicate plan"
            disabled={duplicateDisabled}
            title={duplicateDisabled ? duplicateDisabledTitle : undefined}
            onClick={() => {
              if (!duplicateDisabled) onDuplicate(template.id);
            }}
          >
            <Copy className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete plan"
            onClick={() => onRequestDelete(template)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </article>
    </>
  );
}
