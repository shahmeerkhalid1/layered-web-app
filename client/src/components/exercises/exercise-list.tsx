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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-4">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="mt-2 h-3 w-full rounded bg-muted" />
            <div className="mt-1 h-3 w-1/2 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExerciseEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
      <Dumbbell className="size-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">No exercises yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first exercise to get started
      </p>
      <Link href="/exercises/new" className="mt-4">
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          New Exercise
        </Button>
      </Link>
    </div>
  );
}
