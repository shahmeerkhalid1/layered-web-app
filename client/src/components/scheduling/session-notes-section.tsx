"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AttendanceRow, InstanceStatus, SessionNote } from "@/lib/types";
import { clientApi } from "@/services/client-api";
import { sessionNoteApi } from "@/services/session-note-api";
import { SessionNoteCard } from "@/components/scheduling/session-note-card";

interface SessionNotesSectionProps {
  instanceId: string;
  status: InstanceStatus;
  /** Bump to reload attendance after checklist save */
  attendanceRefreshKey?: number;
}

export function SessionNotesSection({
  instanceId,
  status,
  attendanceRefreshKey = 0,
}: SessionNotesSectionProps) {
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [attendanceRows, noteRows] = await Promise.all([
        clientApi.getAttendance(instanceId),
        sessionNoteApi.getInstanceNotes(instanceId),
      ]);
      setAttendance(attendanceRows);
      setNotes(noteRows);
    } catch {
      toast.error("Failed to load session notes");
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load, attendanceRefreshKey]);

  const presentClients = useMemo(
    () => attendance.filter((row) => row.present === true),
    [attendance]
  );

  const notesByClientId = useMemo(() => {
    const map = new Map<string, SessionNote>();
    for (const note of notes) {
      map.set(note.clientId, note);
    }
    return map;
  }, [notes]);

  const statusHint =
    status === "SCHEDULED"
      ? "Class not marked complete — you can still draft notes."
      : undefined;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-muted/10 p-4">
        <p className="text-sm font-medium text-foreground">Session notes</p>
        <div className="mt-3 flex justify-center py-4">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Session notes</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Write notes for clients marked as present. Each client gets one note per
          class session.
        </p>
      </div>

      {presentClients.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/15 px-3 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Mark clients as present in the checklist above to log session notes.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {presentClients.map((row) => (
            <SessionNoteCard
              key={row.clientId}
              instanceId={instanceId}
              clientId={row.clientId}
              clientName={`${row.firstName} ${row.lastName}`}
              clientEmail={row.email}
              existingNote={notesByClientId.get(row.clientId)}
              statusHint={statusHint}
              onUpdated={() => void load()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
