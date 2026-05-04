import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExerciseLibraryHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Exercise Library</h2>
        <p className="text-muted-foreground">Manage your exercise collection</p>
      </div>
      <Link href="/exercises/new">
        <Button>
          <Plus className="mr-2 size-4" />
          New Exercise
        </Button>
      </Link>
    </div>
  );
}
