import { FileText, Plus, SearchX } from "lucide-react";
import type { ClassPlanTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
  duplicateDisabled?: boolean;
  duplicateDisabledTitle?: string;
  createDisabled?: boolean;
  createDisabledTitle?: string;
}

export function ClassPlanList({
  templates,
  loading,
  onDuplicate,
  onRequestDelete,
  onNewPlan,
  showFilteredEmpty,
  onClearFilters,
  duplicateDisabled = false,
  duplicateDisabledTitle = "Upgrade to duplicate class plans",
  createDisabled = false,
  createDisabledTitle = "Upgrade to create more class plans",
}: ClassPlanListProps) {
  if (loading) {
    return <ClassPlanListSkeleton />;
  }

  if (templates.length === 0) {
    if (showFilteredEmpty && onClearFilters) {
      return <ClassPlanFilteredEmptyState onClearFilters={onClearFilters} />;
    }
    return (
      <ClassPlanEmptyState
        onNewPlan={onNewPlan}
        createDisabled={createDisabled}
        createDisabledTitle={createDisabledTitle}
      />
    );
  }

  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {templates.map((template) => (
        <ClassPlanCard
          key={template.id}
          template={template}
          onDuplicate={onDuplicate}
          onRequestDelete={onRequestDelete}
          duplicateDisabled={duplicateDisabled}
          duplicateDisabledTitle={duplicateDisabledTitle}
        />
      ))}
    </div>
  );
}

function ClassPlanListSkeleton() {
  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {[1, 2, 3].map((index) => (
        <div key={index} className="layered-card animate-pulse p-5">
          <div className="h-6 w-2/3 rounded bg-muted" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-10 rounded bg-muted/70" />
            <div className="h-10 rounded bg-muted/70" />
            <div className="h-10 rounded bg-muted/70" />
            <div className="h-10 rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassPlanFilteredEmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded border  border-border bg-muted/30 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded bg-secondary text-muted-foreground">
        <SearchX className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
        No plans match
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Try another folder or clear filters to see everything in your library
        again.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-4 rounded px-4"
        onClick={onClearFilters}
      >
        Clear filters
      </Button>
    </div>
  );
}

function ClassPlanEmptyState({
  onNewPlan,
  createDisabled = false,
  createDisabledTitle = "Upgrade to create more class plans",
}: {
  onNewPlan?: () => void;
  createDisabled?: boolean;
  createDisabledTitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded border  border-border bg-muted/30 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded bg-secondary text-secondary-foreground">
        <FileText className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
        No class plans yet
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Build reusable templates with sections and exercises—then schedule them
        when the calendar is ready.
      </p>
      <div className="mt-5">
        {onNewPlan && (
          <Button
            type="button"
            className="rounded bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary/90"
            onClick={createDisabled ? undefined : onNewPlan}
            disabled={createDisabled}
            title={createDisabled ? createDisabledTitle : undefined}
          >
            <Plus className="mr-2 size-4" />
            New plan
          </Button>
        )}
      </div>
    </div>
  );
}
