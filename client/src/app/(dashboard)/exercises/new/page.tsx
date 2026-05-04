"use client";

import { ExerciseForm } from "@/components/exercises/exercise-form";

export default function NewExercisePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Exercise</h2>
        <p className="text-muted-foreground">
          Add a new exercise to your library
        </p>
      </div>
      <ExerciseForm />
    </div>
  );
}
