"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, Copy, Pencil, Trash2 } from "lucide-react";
import type { ClassPlanTemplate } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickScheduleDialog } from "@/components/scheduling/quick-schedule-dialog";
import { cn } from "@/lib/utils";

const MAX_TAGS_VISIBLE = 4;

interface ClassPlanCardProps {
  template: ClassPlanTemplate;
  onDuplicate: (id: string) => void;
  onRequestDelete: (template: ClassPlanTemplate) => void;
}

export function ClassPlanCard({
  template,
  onDuplicate,
  onRequestDelete,
}: ClassPlanCardProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const tags = template.tags ?? [];
  const visibleTags = tags.slice(0, MAX_TAGS_VISIBLE);
  const overflowCount = tags.length - visibleTags.length;
  const overflowLabels = tags.slice(MAX_TAGS_VISIBLE);
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
      <Card
      className={cn(
        "group relative h-full gap-0 overflow-hidden border-border bg-card py-0 shadow-lg ring-1 ring-foreground/10",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-ring hover:shadow-xl"
      )}
    >
      <div className="relative flex h-full min-h-0 flex-col">
        <Link
          href={`/class-plans/${template.id}`}
          className="flex min-h-0 flex-1 flex-col rounded-t-xl outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <CardContent className="flex flex-1 flex-col p-4 pb-3">
            <h3 className="line-clamp-2 min-h-11 text-base font-semibold leading-snug tracking-[-0.02em] text-card-foreground">
              {template.name}
            </h3>

            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="font-medium text-muted-foreground">Class type</dt>
                <dd
                  className={cn(
                    "mt-0.5 truncate font-medium leading-snug text-foreground",
                    classTypeLabel === "—" && "text-muted-foreground"
                  )}
                  title={classTypeLabel === "—" ? undefined : classTypeLabel}
                >
                  {classTypeLabel}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="font-medium text-muted-foreground">Class style</dt>
                <dd
                  className={cn(
                    "mt-0.5 truncate font-medium leading-snug text-foreground",
                    classStyleLabel === "—" && "text-muted-foreground"
                  )}
                  title={classStyleLabel === "—" ? undefined : classStyleLabel}
                >
                  {classStyleLabel}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Duration</dt>
                <dd
                  className={cn(
                    "mt-0.5 font-medium tabular-nums leading-snug text-foreground",
                    template.durationMinutes == null && "text-muted-foreground"
                  )}
                >
                  {durationLabel}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Sections</dt>
                <dd className="mt-0.5 font-medium tabular-nums leading-snug text-foreground">
                  {sectionCount} section{sectionCount === 1 ? "" : "s"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-muted-foreground">Last updated</dt>
                <dd className="mt-0.5 font-medium leading-snug text-foreground">{updatedLabel}</dd>
              </div>
            </dl>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {visibleTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="max-w-[min(100%,10rem)] truncate border-border bg-muted/40 text-[11px] font-medium text-foreground"
                    title={tag}
                  >
                    {tag}
                  </Badge>
                ))}
                {overflowCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 border-transparent bg-secondary/90 text-[11px] font-medium tabular-nums text-secondary-foreground"
                    title={overflowLabels.join(", ")}
                    aria-label={`${overflowCount} more tags: ${overflowLabels.join(", ")}`}
                  >
                    +{overflowCount}
                  </Badge>
                )}
              </div>
            )}

            {template.folder && (
              <p className="mt-auto pt-3 text-xs font-medium leading-snug text-muted-foreground">
                Folder: {template.folder.name}
              </p>
            )}
          </CardContent>
        </Link>

        <div
          className="flex shrink-0 flex-wrap items-center justify-end gap-0.5 border-t border-border/60 bg-muted/30 px-2 py-1.5"
          role="toolbar"
          aria-label="Class plan actions"
        >
          <Link
            href={`/class-plans/${template.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "text-muted-foreground hover:bg-background/80 hover:text-foreground"
            )}
            aria-label="View or edit plan"
          >
            <Pencil className="size-3.5" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:bg-background/80 hover:text-foreground"
            aria-label="Schedule class"
            onClick={() => setScheduleOpen(true)}
          >
            <CalendarPlus className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:bg-background/80 hover:text-foreground"
            aria-label="Duplicate plan"
            onClick={() => onDuplicate(template.id)}
          >
            <Copy className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete plan"
            onClick={() => onRequestDelete(template)}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </Card>
    </>
  );
}
