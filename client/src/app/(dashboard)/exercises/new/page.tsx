"use client";

import Link from "next/link";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewExercisePage() {
  const router = useRouter();
  return (
    <div className="space-y-6 relative">
      <div className="flex min-w-0 items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/exercises")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight">New Exercise</h2>
          <p className="text-muted-foreground">
            Add a new exercise to your library
          </p>
        </div>
      </div>
      <ExerciseForm />
    </div>
  );
}
