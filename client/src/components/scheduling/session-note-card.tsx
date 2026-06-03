"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { SessionNote } from "@/lib/types";
import { sessionNoteApi } from "@/services/session-note-api";
import { SessionNoteExercisePickerDialog } from "@/components/scheduling/session-note-exercise-picker-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formControlTextareaClasses } from "@/lib/form-control-styles";
import { cn } from "@/lib/utils";

export interface SessionNoteCardProps {
  instanceId: string;
  clientId: string;
  clientName: string;
  existingNote?: SessionNote;
  defaultExpanded?: boolean;
  statusHint?: string;
  onUpdated: () => void;
}

export function SessionNoteCard({
  instanceId,
  clientId,
  clientName,
  existingNote,
  defaultExpanded = false,
  statusHint,
  onUpdated,
}: SessionNoteCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || Boolean(existingNote));
  const [content, setContent] = useState(existingNote?.content ?? "");
  const [note, setNote] = useState<SessionNote | undefined>(existingNote);
  const [pending, setPending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setNote(existingNote);
    setContent(existingNote?.content ?? "");
    if (existingNote) setExpanded(true);
  }, [existingNote?.id, existingNote?.content, existingNote?.updatedAt]);

  const noteId = note?.id;
  const exercises = note?.exercises ?? [];

  async function handleSave() {
    setPending(true);
    try {
      if (noteId) {
        const updated = await sessionNoteApi.updateNote(noteId, {
          content: content.trim(),
        });
        setNote(updated);
        toast.success("Note saved");
      } else {
        const created = await sessionNoteApi.createNote(instanceId, {
          clientId,
          content: content.trim(),
        });
        setNote(created);
        toast.success("Note saved");
      }
      onUpdated();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save note";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!noteId) {
      setExpanded(false);
      setContent("");
      return;
    }
    setPending(true);
    try {
      await sessionNoteApi.deleteNote(noteId);
      setNote(undefined);
      setContent("");
      setExpanded(false);
      toast.success("Note deleted");
      onUpdated();
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setPending(false);
    }
  }

  async function handleAttachExercises(exerciseIds: string[]) {
    let currentId = noteId;
    if (!currentId) {
      const created = await sessionNoteApi.createNote(instanceId, {
        clientId,
        content: content.trim(),
        exerciseIds,
      });
      setNote(created);
      setExpanded(true);
      onUpdated();
      toast.success("Exercises attached");
      return;
    }
    const updated = await sessionNoteApi.attachExercises(currentId, exerciseIds);
    setNote(updated);
    onUpdated();
    toast.success(
      exerciseIds.length === 1 ? "Exercise attached" : "Exercises attached"
    );
  }

  async function handleDetach(exerciseId: string) {
    if (!noteId) return;
    setPending(true);
    try {
      const updated = await sessionNoteApi.detachExercise(noteId, exerciseId);
      setNote(updated);
      onUpdated();
    } catch {
      toast.error("Failed to remove exercise");
    } finally {
      setPending(false);
    }
  }

  if (!expanded) {
    return (
      <li className="rounded-2xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{clientName}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setExpanded(true)}
          >
            Write note
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{clientName}</p>
        {statusHint ? (
          <p className="text-xs text-muted-foreground">{statusHint}</p>
        ) : null}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Session observations, progress, cues for next time…"
        disabled={pending}
        className={cn(formControlTextareaClasses, "mt-3 min-h-24")}
        data-filled={content.trim() ? "true" : undefined}
      />

      <div className="mt-3">
        <p className="text-xs font-medium text-muted-foreground">Exercises</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {exercises.map((row) => (
            <Badge key={row.id} variant="secondary" className="gap-1 pr-1">
              {row.exercise.name}
              {noteId ? (
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ${row.exercise.name}`}
                  disabled={pending}
                  onClick={() => void handleDetach(row.exerciseId)}
                >
                  <X className="size-3" aria-hidden />
                </button>
              ) : null}
            </Badge>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 rounded-full px-2 text-xs"
            disabled={pending}
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="mr-0.5 size-3" aria-hidden />
            Add
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          disabled={pending}
          onClick={() => void handleSave()}
        >
          {pending ? "Saving…" : "Save note"}
        </Button>
        {noteId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => void handleDelete()}
          >
            Delete
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={() => {
              setExpanded(false);
              setContent("");
            }}
          >
            Cancel
          </Button>
        )}
      </div>

      <SessionNoteExercisePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        attachedExerciseIds={exercises.map((e) => e.exerciseId)}
        onConfirm={handleAttachExercises}
      />
    </li>
  );
}
