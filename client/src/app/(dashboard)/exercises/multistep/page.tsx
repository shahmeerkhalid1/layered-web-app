"use client";

import Link from "next/link";
import { ExerciseFormMultistep } from "@/components/exercises/exercise-form-multistep";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExerciseMultistepPage() {
  const router = useRouter();
  return (
    <div className="relative space-y-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
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
            <h2 className="text-2xl font-bold tracking-tight">New exercise (multistep)</h2>
            <p className="text-muted-foreground">
              Demo layout — same fields as the standard form, validated locally only.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Prefer the single-page flow?{" "}
              <Link
                href="/exercises/new"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Open the standard form
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
      <ExerciseFormMultistep />
    </div>
  );
}
