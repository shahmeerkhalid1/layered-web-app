import Link from "next/link";
import { Dumbbell, Plus } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseCard } from "@/components/exercises/exercise-card";

interface ExerciseListProps {
  exercises: Exercise[];
  loading: boolean;
  onDeleteExercise: (exerciseId: string) => void;
}

export function ExerciseList({
  exercises,
  loading,
  onDeleteExercise,
}: ExerciseListProps) {
  if (loading) {
    return <ExerciseListSkeleton />;
  }

  if (exercises.length === 0) {
    return <ExerciseEmptyState />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onDelete={onDeleteExercise}
        />
      ))}
    </div>
  );
}

function ExerciseListSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((index) => (
        <Card
          key={index}
          className="animate-pulse border-border bg-card"
        >
          <CardContent className="p-3">
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

function ExerciseEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-lg">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Dumbbell className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
        No exercises yet
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Start with one clear movement cue, then build a library your sessions can breathe with.
      </p>
      <Link href="/exercises/new" className="mt-4">
        <Button
          size="sm"
          className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 size-4" />
          New Exercise
        </Button>
      </Link>
    </div>
  );
}
