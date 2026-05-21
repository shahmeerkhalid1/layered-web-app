"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ExerciseLayer } from "@/lib/types";
import { getLayerStepTitle } from "@/lib/exercise-layer-labels";
import { ExercisePreText } from "@/components/exercises/exercise-pre-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewLayer = Pick<ExerciseLayer, "id" | "order" | "content" | "isFinisher">;

export interface ExercisePlanPreviewFields {
  description?: string | null;
  layers?: PreviewLayer[];
}

function trimText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function sortedLayersWithContent(layers: PreviewLayer[] | undefined): PreviewLayer[] {
  return [...(layers ?? [])]
    .sort((a, b) => a.order - b.order)
    .filter((layer) => trimText(layer.content) != null);
}

export function exercisePlanPreviewHasContent(
  exercise: ExercisePlanPreviewFields
): boolean {
  return (
    trimText(exercise.description) != null ||
    sortedLayersWithContent(exercise.layers).length > 0
  );
}

export interface ExercisePlanPreviewProps {
  exercise: ExercisePlanPreviewFields;
  /** Unique id for aria-controls (e.g. section-exercise row id). */
  previewId: string;
  className?: string;
}

/** Collapsed-by-default description + layer preview for planner exercise rows. */
export function ExercisePlanPreview({
  exercise,
  previewId,
  className,
}: ExercisePlanPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  const description = useMemo(() => trimText(exercise.description), [exercise.description]);
  const layers = useMemo(
    () => sortedLayersWithContent(exercise.layers),
    [exercise.layers]
  );

  if (!description && layers.length === 0) return null;

  const panelId = `exercise-preview-${previewId}`;

  return (
    <div className={cn("min-w-0", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 rounded-full px-2 text-sm text-muted-foreground hover:text-foreground"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
      >
        {expanded ? "Hide details" : "Show details"}
        <ChevronDown
          className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </Button>

      {expanded && (
        <div
          id={panelId}
          className="mt-2 space-y-3 rounded-xl border border-border/70 p-3 text-sm "
        >
          {description && (
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <ExercisePreText className="text-sm leading-relaxed text-foreground">
                {description}
              </ExercisePreText>
            </div>
          )}

          {layers.length > 0 && (
            <div className="min-w-0 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Layers
              </p>
              <ul className="space-y-2.5">
                {layers.map((layer, index) => {
                  const total = layers.length;
                  const isLast = index === total - 1;
                  const finisher = Boolean(layer.isFinisher && isLast);
                  const content = trimText(layer.content)!;

                  return (
                    <li
                      key={layer.id}
                      className={cn(
                        "min-w-0 border-b p-2.5",
                        finisher && "rounded-xl border border-border p-2.5"
                      )}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {getLayerStepTitle(index)}
                        </span>
                        {finisher && (
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            Finisher
                          </Badge>
                        )}
                      </div>
                      <ExercisePreText className="text-sm leading-relaxed text-foreground">
                        {content}
                      </ExercisePreText>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
