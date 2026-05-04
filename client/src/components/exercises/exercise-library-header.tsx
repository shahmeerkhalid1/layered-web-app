import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExerciseLibraryHeader() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-3xl">
          Exercise Library
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Curate calm, precise movement notes for every mat, reformer, and studio session.
        </p>
      </div>
      <Link href="/exercises/new">
        <Button className="rounded-full bg-primary px-5 text-primary-foreground shadow-md hover:bg-primary/90">
          <Plus className="mr-2 size-4" />
          New Exercise
        </Button>
      </Link>
    </div>
  );
}
