import { Button } from "@/components/ui/button";

interface ClassPlanLibraryHeaderProps {
  onNewPlan: () => void;
}

export function ClassPlanLibraryHeader({ onNewPlan }: ClassPlanLibraryHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-3xl">
          Class Plans
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Reusable templates with folders, metadata, and sections—ready to schedule when your
          calendar goes live.
        </p>
      </div>
      <Button
        type="button"
        onClick={onNewPlan}
        className="rounded-full bg-primary px-5 text-primary-foreground shadow-md hover:bg-primary/90"
      >
        New Plan
      </Button>
    </div>
  );
}
