"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Exercise } from "@/lib/types";
import { exerciseApi } from "@/services/exercise-api";
import { ExerciseFormMultistep } from "@/components/exercises/exercise-form-multistep";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditExercisePage() {
  const params = useParams();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    exerciseApi
      .getExerciseById(params.id as string)
      .then(setExercise)
      .catch(() => {
        toast.error("Exercise not found");
        router.push("/exercises");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="relative space-y-6">
      <div className="flex min-w-0 items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Edit exercise</h2>
          <p className="text-muted-foreground">Update {exercise.name}</p>
        </div>
      </div>
      <ExerciseFormMultistep exercise={exercise} />
    </div>
  );
}
