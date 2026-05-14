import Link from "next/link";
import { FileText, SearchX } from "lucide-react";
import type { ClassPlanTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClassPlanCard } from "@/components/class-plans/class-plan-card";

interface ClassPlanListProps {
  templates: ClassPlanTemplate[];
  loading: boolean;
  onDuplicate: (id: string) => void;
  onRequestDelete: (template: ClassPlanTemplate) => void;
  onNewPlan?: () => void;
  /** True when the library has plans but the current filters yield none */
  showFilteredEmpty?: boolean;
  onClearFilters?: () => void;
}

export function ClassPlanList({
  templates,
  loading,
  onDuplicate,
  onRequestDelete,
  onNewPlan,
  showFilteredEmpty,
  onClearFilters,
}: ClassPlanListProps) {
  if (loading) {
    return <ClassPlanListSkeleton />;
  }

  if (templates.length === 0) {
    if (showFilteredEmpty && onClearFilters) {
      return <ClassPlanFilteredEmptyState onClearFilters={onClearFilters} />;
    }
    return <ClassPlanEmptyState onNewPlan={onNewPlan} />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <ClassPlanCard
          key={template.id}
          template={template}
          onDuplicate={onDuplicate}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </div>
  );
}

function ClassPlanListSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((index) => (
        <Card key={index} className="animate-pulse border-border bg-card">
          <CardContent className="p-4">
            <div className="aspect-4/3 rounded-2xl bg-muted" />
            <div className="mt-4 h-4 w-2/3 rounded-full bg-muted" />
            <div className="mt-3 h-3 w-full rounded-full bg-muted/70" />
            <div className="mt-2 h-3 w-1/2 rounded-full bg-muted/70" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ClassPlanFilteredEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-lg">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
        No plans match
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Try another folder or clear filters to see everything in your library again.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-4 rounded-full px-4"
        onClick={onClearFilters}
      >
        Clear filters
      </Button>
    </div>
  );
}

function ClassPlanEmptyState({ onNewPlan }: { onNewPlan?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-lg">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <FileText className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
        No class plans yet
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Build reusable templates with sections and exercises—then schedule them when the calendar
        is ready.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {onNewPlan && (
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
            onClick={onNewPlan}
          >
            New plan
          </Button>
        )}
        <Link href="/exercises">
          <Button variant="outline" size="sm" className="rounded-full border-border px-4">
            Browse exercises
          </Button>
        </Link>
      </div>
    </div>
  );
}
