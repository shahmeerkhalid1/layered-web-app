"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EnrollmentDialog } from "@/components/scheduling/enrollment-dialog";
import { clientApi } from "@/services/client-api";
import type { AttendanceRow, InstanceStatus } from "@/lib/types";

interface AttendanceChecklistProps {
  instanceId: string;
  classId: string;
  status: InstanceStatus;
}

export function AttendanceChecklist({
  instanceId,
  classId,
  status,
}: AttendanceChecklistProps) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const showAttendance = status === "SCHEDULED" || status === "COMPLETED";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientApi.getAttendance(instanceId);
      setRows(data);
      const initial: Record<string, boolean> = {};
      for (const row of data) {
        initial[row.clientId] = row.present ?? false;
      }
      setDraft(initial);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const attendance = rows.map((row) => ({
        clientId: row.clientId,
        present: draft[row.clientId] ?? false,
      }));
      const updated = await clientApi.markAttendance(instanceId, attendance);
      setRows(updated);
      toast.success("Attendance saved");
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  function togglePresent(clientId: string, checked: boolean) {
    setDraft((prev) => ({ ...prev, [clientId]: checked }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-muted/10 p-4">
        <p className="text-sm font-medium text-foreground">Clients</p>
        <div className="mt-3 flex justify-center py-4">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-muted/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            Clients ({rows.length} enrolled)
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setEnrollOpen(true)}
          >
            <Settings2 className="mr-1.5 size-3.5" />
            Manage enrollment
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/15 px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">
              No clients enrolled in this class yet.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 rounded-full"
              onClick={() => setEnrollOpen(true)}
            >
              <UserPlus className="mr-1.5 size-3.5" />
              Add clients
            </Button>
          </div>
        ) : showAttendance ? (
          <>
            <ul className="mt-3 space-y-2">
              {rows.map((row) => {
                const id = `attendance-${row.clientId}`;
                const checked = draft[row.clientId] ?? false;
                return (
                  <li
                    key={row.clientId}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onChange={(e) =>
                        togglePresent(row.clientId, e.target.checked)
                      }
                    />
                    <Label htmlFor={id} className="flex-1 cursor-pointer text-sm">
                      {row.firstName} {row.lastName}
                    </Label>
                  </li>
                );
              })}
            </ul>
            <Button
              type="button"
              size="sm"
              className="mt-3 rounded-full"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save attendance"}
            </Button>
          </>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {rows.map((row) => (
              <li key={row.clientId} className="text-sm text-foreground">
                {row.firstName} {row.lastName}
              </li>
            ))}
          </ul>
        )}
      </div>

      <EnrollmentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        classId={classId}
        onUpdated={() => void load()}
      />
    </>
  );
}
