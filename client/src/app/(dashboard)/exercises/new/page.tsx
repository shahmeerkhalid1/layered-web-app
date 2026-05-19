"use client";

import { ExerciseFormMultistep } from "@/components/exercises/exercise-form-multistep";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewExercisePage() {
  const router = useRouter();
  return (
    <div className="relative space-y-6">
      <div className="flex min-w-0 items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/exercises")}
          aria-label="Back to exercise library"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight">New exercise</h2>
          <p className="text-muted-foreground">
            Work through the guided steps below to create a new exercise.
          </p>
        </div>
      </div>
      <ExerciseFormMultistep />
    </div>
  );
}
