"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, GitBranch } from "lucide-react";
import type { ProgressionChainItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProgressionChainViewerProps = {
  chain: ProgressionChainItem[];
  /** Exercise page being viewed — highlighted in the chain */
  currentExerciseId: string;
  /** Hide when there is only one step (no progression to show) */
  minSteps?: number;
  className?: string;
};

export function ProgressionChainViewer({
  chain,
  currentExerciseId,
  minSteps = 2,
  className,
}: ProgressionChainViewerProps) {
  if (chain.length < minSteps) {
    return null;
  }

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <GitBranch className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base">Progression chain</CardTitle>
            <CardDescription>
              Easier to harder — {chain.length} levels
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="flex flex-col items-center gap-1 md:flex-row md:flex-wrap md:items-stretch md:gap-2"
          role="list"
          aria-label="Exercise progression from level 1 to harder variations"
        >
          {chain.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 && (
                <>
                  <ChevronDown
                    className="my-0.5 size-5 shrink-0 text-muted-foreground md:hidden"
                    aria-hidden
                  />
                  <div className="hidden shrink-0 self-center md:flex">
                    <ChevronRight
                      className="size-5 text-muted-foreground/80"
                      aria-hidden
                    />
                  </div>
                </>
              )}
              <Link
                href={`/exercises/${item.id}`}
                role="listitem"
                className={cn(
                  "flex w-full min-h-17 min-w-0 flex-col justify-center rounded-xl border px-3 py-2.5 transition-colors md:w-auto md:min-w-30 md:max-w-44",
                  item.id === currentExerciseId
                    ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/25"
                    : "border-border bg-muted/30 hover:border-ring hover:bg-muted/50"
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Level {item.level}
                </span>
                <span className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {item.name}
                </span>
              </Link>
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
