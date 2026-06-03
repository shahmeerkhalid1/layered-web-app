"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Exercise } from "@/lib/types";
import { exerciseApi } from "@/services/exercise-api";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export interface SessionNoteExercisePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already attached — hidden from selection list */
  attachedExerciseIds?: string[];
  onConfirm: (exerciseIds: string[]) => void | Promise<void>;
}

export function SessionNoteExercisePickerDialog({
  open,
  onOpenChange,
  attachedExerciseIds = [],
  onConfirm,
}: SessionNoteExercisePickerDialogProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState(false);

  const loadLibrary = useCallback(
    async (signal?: AbortSignal) => {
      const attached = new Set(attachedExerciseIds);
      setLoading(true);
      try {
        const data = await exerciseApi.getExercises(
          {
            search: debouncedSearch.trim() || undefined,
            savedToLibrary: true,
          },
          signal
        );
        setLibrary(data.filter((ex) => !attached.has(ex.id)));
      } catch {
        if (!signal?.aborted) toast.error("Failed to load exercises");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [debouncedSearch, attachedExerciseIds.join(",")]
  );

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    const t = window.setTimeout(() => void loadLibrary(ac.signal), 0);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [open, loadLibrary]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setSearch("");
      setSelectedIds(new Set());
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  function toggleSelected(exerciseId: string) {
    if (pending) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }

  async function handleConfirm() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setPending(true);
    try {
      await onConfirm(ids);
      onOpenChange(false);
    } catch {
      toast.error("Could not add exercises");
    } finally {
      setPending(false);
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>Attach exercises</DialogTitle>
          <DialogDescription>
            Select exercises from your library to link to this session note.
          </DialogDescription>
        </DialogHeader>
        <ExerciseSearch
          id="session-note-exercise-search"
          value={search}
          onChange={setSearch}
          placeholder="Search by name or description…"
        />
        <div className="max-h-64 overflow-y-auto rounded-2xl bg-muted/15 p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : library.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {debouncedSearch.trim()
                ? "No exercises match your search."
                : "No library exercises available to attach."}
            </p>
          ) : (
            <ul className="space-y-2">
              {library.map((ex) => {
                const selected = selectedIds.has(ex.id);
                return (
                  <li key={ex.id}>
                    <div
                      role="button"
                      tabIndex={pending ? -1 : 0}
                      aria-pressed={selected}
                      onClick={() => toggleSelected(ex.id)}
                      onKeyDown={(e) => {
                        if (pending) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSelected(ex.id);
                        }
                      }}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-2xl border bg-card p-3 transition-colors",
                        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                      )}
                    >
                      <Checkbox checked={selected} tabIndex={-1} aria-hidden />
                      <span className="min-w-0 flex-1 text-sm font-medium">{ex.name}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={pending || selectedCount === 0}
            onClick={() => void handleConfirm()}
          >
            {pending
              ? "Adding…"
              : selectedCount === 1
                ? "Add 1 exercise"
                : `Add ${selectedCount} exercises`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
