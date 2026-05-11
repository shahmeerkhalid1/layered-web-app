import Link from "next/link";
import Image from "next/image";
import { FolderOpen, Pencil, Trash2 } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_TAGS_VISIBLE = 4;

interface ExerciseCardProps {
  exercise: Exercise;
  onDelete: (exerciseId: string) => void;
}

export function ExerciseCard({ exercise, onDelete }: ExerciseCardProps) {
  const tags = exercise.tags ?? [];
  const visibleTags = tags.slice(0, MAX_TAGS_VISIBLE);
  const overflowCount = tags.length - visibleTags.length;
  const overflowLabels = tags.slice(MAX_TAGS_VISIBLE);
  const hasFooter = tags.length > 0 || Boolean(exercise.folder);

  return (
    <Card
      className={cn(
        "group relative h-full gap-0 overflow-hidden border-border bg-card py-0 shadow-lg ring-1 ring-foreground/10",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-ring hover:shadow-xl",
      )}
    >
      <div className="relative flex h-full min-h-0 flex-col">
        <Link
          href={`/exercises/${exercise.id}`}
          className="flex min-h-0 flex-1 flex-col rounded-t-xl outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <CardContent className="flex flex-1 flex-col p-3 pb-3">
            {exercise.images?.[0] ? (
              <div className="relative mb-4 shrink-0 aspect-4/3 overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={exercise.images[0].url}
                  alt={exercise.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-foreground/25 via-transparent to-background/10" />
              </div>
            ) : (
              <div className="relative mb-4 flex shrink-0 aspect-4/3 items-center justify-center overflow-hidden rounded-2xl bg-muted/80 ring-1 ring-border/60">
                <div className="absolute inset-x-8 top-1/2 h-px -rotate-6 bg-border/80" />
                <FolderOpen className="size-8 text-muted-foreground/70" aria-hidden />
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col text-left">
              <h3 className="line-clamp-2 min-h-11 text-base font-semibold leading-snug tracking-[-0.02em] text-card-foreground">
                {exercise.name}
              </h3>

              <div className="min-h-11 shrink-0">
                {exercise.description ? (
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {exercise.description}
                  </p>
                ) : (
                  <span className="sr-only">No description</span>
                )}
              </div>

              {hasFooter && (
                <div className="mt-auto flex flex-col gap-3 pt-3">
                  {tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
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

                  {exercise.folder && (
                    <p className="flex min-h-4.5 items-start gap-1.5 text-left text-xs font-medium leading-snug text-muted-foreground">
                      <FolderOpen
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/80"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 wrap-break-word">{exercise.folder.name}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Link>

        <div
          className="flex shrink-0 items-center justify-end gap-0.5 border-t border-border/60 bg-muted/30 px-2 py-1.5"
          role="toolbar"
          aria-label="Exercise actions"
        >
          <Link
            href={`/exercises/${exercise.id}/edit`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "text-muted-foreground hover:bg-background/80 hover:text-foreground",
            )}
            aria-label="Edit exercise"
          >
            <Pencil className="size-3.5" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete exercise"
            onClick={() => onDelete(exercise.id)}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </Card>
  );
}
