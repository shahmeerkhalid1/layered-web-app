"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import type { ClassInstanceDetail, ClassPlanTemplate, PlanSectionDetail, PlanSectionExerciseRow } from "@/lib/types";
import { classPlanApi } from "@/services/class-plan-api";
import { schedulingApi } from "@/services/scheduling-api";
import {
  DUPLICATE_CLASS_PLAN_SECTION_NAME_MESSAGE,
  isDuplicateDisplayName,
} from "@/lib/validation/unique-display-name";
import { ExercisePickerDialog } from "@/components/class-plans/exercise-picker-dialog";
import { InstanceExerciseRow } from "@/components/scheduling/instance-exercise-row";
import { AttendanceChecklist } from "@/components/scheduling/attendance-checklist";
import { SessionNotesSection } from "@/components/scheduling/session-notes-section";
import { EditScopeDialog, type EditScope } from "@/components/scheduling/edit-scope-dialog";
import { EditClassDialog } from "@/components/scheduling/edit-class-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { localDateAndTimeToUtcIso } from "@/lib/datetime-local";
import { currentHm, isBeforeToday, isPastScheduleDateTime, todayYmd } from "@/lib/calendar-utils";
import {
  PAST_SCHEDULE_TIME_MESSAGE,
} from "@/lib/validation/scheduling-past-guard";
import { cn } from "@/lib/utils";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";

function sortSections(sections: PlanSectionDetail[]): PlanSectionDetail[] {
  return [...sections].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
}

function sortSectionExercises(rows: PlanSectionExerciseRow[]): PlanSectionExerciseRow[] {
  return [...rows].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
}

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

function formatRecurrenceSummary(cls: ClassInstanceDetail["class"]): string | null {
  if (!cls.isRecurring) return null;
  const rule = cls.recurrenceRule as { daysOfWeek?: number[] } | null | undefined;
  const days = (rule?.daysOfWeek ?? [])
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_LABELS[d] ?? String(d))
    .join(", ");
  const until = cls.endDate
    ? new Date(cls.endDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  return `Repeats: ${days || "—"} · until ${until}`;
}

export interface ClassInstanceDrawerProps {
  instanceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when a series regenerate replaces the open instance with a new row id. */
  onInstanceIdChange?: (id: string) => void;
  onUpdated?: () => void;
}

export function ClassInstanceDrawer({
  instanceId,
  open,
  onOpenChange,
  onInstanceIdChange,
  onUpdated,
}: ClassInstanceDrawerProps) {
  const [detail, setDetail] = useState<ClassInstanceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [templates, setTemplates] = useState<ClassPlanTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PlanSectionDetail | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [sectionRemoveTarget, setSectionRemoveTarget] = useState<PlanSectionDetail | null>(null);
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const pendingRef = useRef<{ anchorYmd: string; newIso: string; newDateStr: string } | null>(null);
  const [reschedule, setReschedule] = useState({ date: "", time: "" });
  const [rescheduleTimeError, setRescheduleTimeError] = useState<string | null>(null);
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const d = await schedulingApi.getClassInstanceById(instanceId);
      setDetail(d);
      const t = new Date(d.time);
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      setReschedule({
        date: d.date.slice(0, 10),
        time: `${hh}:${mm}`,
      });
      setRescheduleTimeError(null);
    } catch {
      toast.error("Could not load class");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    if (!open || !instanceId) return;
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, instanceId, load]);

  const refresh = async () => {
    await load();
    onUpdated?.();
  };

  const openAssign = async () => {
    setAssignOpen(true);
    setTemplateSearch("");
    setSelectedTemplateId(null);
    try {
      const res = await classPlanApi.listClassPlans({ limit: 48 });
      setTemplates(res.data);
    } catch {
      toast.error("Failed to load templates");
      setTemplates([]);
    }
  };

  const assign = async (templateId: string) => {
    if (!instanceId) return;
    setAssigningId(templateId);
    try {
      await schedulingApi.assignTemplate(instanceId, templateId);
      toast.success("Plan attached");
      setAssignOpen(false);
      await refresh();
    } catch {
      toast.error("Could not attach template");
    } finally {
      setAssigningId(null);
    }
  };

  const filteredTemplates = useMemo(
    () =>
      templates.filter((t) =>
        t.name.toLowerCase().includes(templateSearch.trim().toLowerCase())
      ),
    [templates, templateSearch]
  );

  const activeSelectedTemplateId = useMemo(() => {
    if (!selectedTemplateId) return null;
    return filteredTemplates.some((t) => t.id === selectedTemplateId)
      ? selectedTemplateId
      : null;
  }, [selectedTemplateId, filteredTemplates]);

  const start = detail ? new Date(detail.time) : null;
  const isOpen = detail?.status === "SCHEDULED";
  const isPast = detail ? isBeforeToday(new Date(detail.date)) : false;
  const canEditPlanAndSchedule = isOpen && !isPast;
  const rescheduleMinTime = reschedule.date === todayYmd() ? currentHm() : undefined;

  const sortedInstanceSections = useMemo(
    () => sortSections(detail?.sections ?? []),
    [detail?.sections]
  );

  const addSectionDuplicate = isDuplicateDisplayName(
    newSectionName,
    sortedInstanceSections,
    null
  );
  const editSectionDuplicate = isDuplicateDisplayName(
    editSectionName,
    sortedInstanceSections,
    editingSection?.id
  );

  const submitAddSection = async () => {
    if (!instanceId) return;
    const name = newSectionName.trim();
    if (!name) {
      toast.error("Section name is required");
      return;
    }
    if (isDuplicateDisplayName(name, sortedInstanceSections, null)) {
      toast.error(DUPLICATE_CLASS_PLAN_SECTION_NAME_MESSAGE);
      return;
    }
    setPending(true);
    try {
      await schedulingApi.addInstanceSection(instanceId, { name });
      toast.success("Section added");
      setAddSectionOpen(false);
      setNewSectionName("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to add section");
    } finally {
      setPending(false);
    }
  };

  const submitEditSection = async () => {
    if (!instanceId || !editingSection) return;
    const name = editSectionName.trim();
    if (!name) {
      toast.error("Section name is required");
      return;
    }
    if (isDuplicateDisplayName(name, sortedInstanceSections, editingSection.id)) {
      toast.error(DUPLICATE_CLASS_PLAN_SECTION_NAME_MESSAGE);
      return;
    }
    setPending(true);
    try {
      await schedulingApi.updateInstanceSection(instanceId, editingSection.id, { name });
      toast.success("Section renamed");
      setEditSectionOpen(false);
      setEditingSection(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to rename section");
    } finally {
      setPending(false);
    }
  };

  const moveSection = async (sectionId: string, direction: "up" | "down") => {
    if (!detail || !instanceId) return;
    const sorted = sortSections(detail.sections ?? []);
    const idx = sorted.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const curr = sorted[idx];
    const other = sorted[swapWith];
    setPending(true);
    try {
      await schedulingApi.updateInstanceSection(instanceId, curr.id, { order: other.order });
      await schedulingApi.updateInstanceSection(instanceId, other.id, { order: curr.order });
      await refresh();
    } catch {
      toast.error("Could not reorder sections");
    } finally {
      setPending(false);
    }
  };

  const moveExerciseInSection = async (
    sectionId: string,
    exerciseRowId: string,
    direction: "up" | "down"
  ) => {
    if (!detail || !instanceId) return;
    const section = (detail.sections ?? []).find((s) => s.id === sectionId);
    if (!section) return;
    const sorted = sortSectionExercises(section.exercises ?? []);
    const idx = sorted.findIndex((r) => r.id === exerciseRowId);
    if (idx < 0) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const curr = sorted[idx];
    const other = sorted[swapWith];
    setPending(true);
    try {
      await schedulingApi.updateInstanceSectionExercise(instanceId, sectionId, curr.id, {
        order: other.order,
      });
      await schedulingApi.updateInstanceSectionExercise(instanceId, sectionId, other.id, {
        order: curr.order,
      });
      await refresh();
    } catch {
      toast.error("Could not reorder exercises");
    } finally {
      setPending(false);
    }
  };

  const resetToTemplate = async () => {
    if (!instanceId || !detail?.templateId) return;
    setPending(true);
    try {
      await schedulingApi.assignTemplate(instanceId, detail.templateId);
      toast.success("Plan reset to template");
      setResetConfirmOpen(false);
      await refresh();
    } catch {
      toast.error("Could not reset to template");
    } finally {
      setPending(false);
    }
  };

  const templateBadge = useMemo(() => {
    if (!detail?.template) return null;
    if (detail.isCustomised) {
      return `Modified`;
      // return `Modified — based on ${detail.template.name}`;
    }
    return `${detail.template.name}`;
  }, [detail?.template, detail?.isCustomised]);

  const saveReschedule = async () => {
    if (!detail || !instanceId) return;
    if (reschedule.date < todayYmd()) {
      toast.error("Cannot reschedule to a past date");
      return;
    }
    if (isPastScheduleDateTime(reschedule.date, reschedule.time)) {
      setRescheduleTimeError(PAST_SCHEDULE_TIME_MESSAGE);
      toast.error(PAST_SCHEDULE_TIME_MESSAGE);
      return;
    }
    setRescheduleTimeError(null);
    const newIso = localDateAndTimeToUtcIso(reschedule.date, reschedule.time);
    if (!detail.class.isRecurring) {
      setPending(true);
      try {
        await schedulingApi.updateClassInstance(instanceId, {
          time: newIso,
          date: reschedule.date,
        });
        toast.success("Schedule updated");
        await refresh();
      } catch {
        toast.error("Could not update");
      } finally {
        setPending(false);
      }
      return;
    }
    pendingRef.current = {
      anchorYmd: detail.date.slice(0, 10),
      newIso,
      newDateStr: reschedule.date,
    };
    setScopeOpen(true);
  };

  const applyScope = async (scope: EditScope) => {
    const p = pendingRef.current;
    if (!p || !detail || !instanceId) return;
    setPending(true);
    try {
      if (scope === "this") {
        await schedulingApi.updateClassInstance(instanceId, {
          time: p.newIso,
          date: p.newDateStr,
        });
        toast.success("Schedule updated");
        pendingRef.current = null;
        await refresh();
        return;
      }

      const updated = await schedulingApi.updateClass(detail.class.id, {
        time: p.newIso,
        regenerateFutureInstancesFrom: p.anchorYmd,
        rescheduleToDate: p.newDateStr,
      });
      toast.success("Schedule updated");
      pendingRef.current = null;
      onUpdated?.();

      const replacement =
        updated.instances?.find(
          (i) => i.status === "SCHEDULED" && i.date.slice(0, 10) === p.newDateStr
        ) ??
        updated.instances?.find(
          (i) => i.status === "SCHEDULED" && i.date.slice(0, 10) >= p.anchorYmd
        );

      if (replacement) {
        if (onInstanceIdChange) {
          onInstanceIdChange(replacement.id);
        } else {
          onOpenChange(false);
        }
      } else {
        onOpenChange(false);
      }
    } catch {
      toast.error("Could not update schedule");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <EditClassDialog
        classId={detail?.class.id ?? null}
        mode={detail?.class.isRecurring ? "series" : "single"}
        open={editClassOpen}
        onOpenChange={setEditClassOpen}
        onSuccess={() => void refresh()}
      />

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Reset to template?</DialogTitle>
            <DialogDescription>
              This replaces the current plan with a fresh copy from the template. Your custom edits
              will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setResetConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={pending}
              onClick={() => void resetToTemplate()}
            >
              {pending ? "Resetting…" : "Reset plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editSectionOpen} onOpenChange={setEditSectionOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Rename section</DialogTitle>
          </DialogHeader>
          <Input
            value={editSectionName}
            onChange={(e) => setEditSectionName(e.target.value)}
            placeholder="Section name"
            aria-invalid={editSectionDuplicate ? true : undefined}
            className={cn(editSectionDuplicate && "border-destructive")}
          />
          {editSectionDuplicate ? (
            <p className="text-sm text-destructive">
              {DUPLICATE_CLASS_PLAN_SECTION_NAME_MESSAGE}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditSectionOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              disabled={pending || !editSectionName.trim() || editSectionDuplicate}
              onClick={() => void submitEditSection()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {instanceId && (
        <ExercisePickerDialog
          open={pickerSectionId !== null}
          onOpenChange={(open) => {
            if (!open) setPickerSectionId(null);
          }}
          mode="instance"
          instanceId={instanceId}
          sectionId={pickerSectionId ?? ""}
          onExerciseAdded={() => void refresh()}
        />
      )}

      <EditScopeDialog open={scopeOpen} onOpenChange={setScopeOpen} onChoose={(s) => void applyScope(s)} />
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Attach template</DialogTitle>
            <DialogDescription>
              Choose a template, then attach it. This replaces this class&apos;s plan with a fresh copy
              from the template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tpl-search">Search templates</Label>
            <Input
              id="tpl-search"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Filter by name…"
              className="border-border"
            />
          </div>
          <div
            className="max-h-72  pr-1 overflow-y-auto"
            role="radiogroup"
            aria-label="Class plan templates"
          >
            {filteredTemplates.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {templates.length === 0
                  ? "No templates yet. Create one under Class plans."
                  : "No templates match your search."}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredTemplates.map((t) => {
                  const selected = activeSelectedTemplateId === t.id;
                  const meta = [t.classType, t.classStyle].filter(Boolean).join(" · ");
                  const sectionCount = t._count?.sections;
                  return (
                    <li key={t.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40",
                          assigningId !== null && "pointer-events-none opacity-60"
                        )}
                      >
                        <input
                          type="radio"
                          name="attach-class-template"
                          value={t.id}
                          checked={selected}
                          onChange={() => setSelectedTemplateId(t.id)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-background"
                          )}
                          aria-hidden
                        >
                          {selected ? (
                            <span className="size-1.5 rounded-full bg-current" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="line-clamp-2 font-medium text-foreground">{t.name}</span>
                          {(meta || sectionCount != null) && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {[meta, sectionCount != null ? `${sectionCount} sections` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setAssignOpen(false)}
              disabled={assigningId !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={!activeSelectedTemplateId || assigningId !== null}
              onClick={() => {
                if (activeSelectedTemplateId) void assign(activeSelectedTemplateId);
              }}
            >
              {assigningId ? "Attaching…" : "Attach template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add section</DialogTitle>
          </DialogHeader>
          <Input
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="Section name"
            aria-invalid={addSectionDuplicate ? true : undefined}
            className={cn(addSectionDuplicate && "border-destructive")}
          />
          {addSectionDuplicate ? (
            <p className="text-sm text-destructive">
              {DUPLICATE_CLASS_PLAN_SECTION_NAME_MESSAGE}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              disabled={pending || !newSectionName.trim() || addSectionDuplicate}
              onClick={() => void submitAddSection()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-4xl data-[side=right]:lg:max-w-5xl"
        >
          <SheetHeader className="border-b border-border p-4 text-left">
            <SheetTitle className="text-lg">
              {detail?.class.title ?? (loading ? "Loading…" : "Class")}
            </SheetTitle>
            <SheetDescription className="text-left">
              {start
                ? `${start.toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })} · ${detail?.class.durationMinutes ?? 60} min`
                : " "}
            </SheetDescription>
            {detail && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={detail.class.type === "GROUP" ? "secondary" : "default"}>
                  {detail.class.type}
                </Badge>
                <Badge variant="outline">{detail.status}</Badge>
                {templateBadge && (
                  <Badge
                    variant="outline"
                    className={
                      detail.isCustomised
                        ? "border-amber-500/50 text-amber-700 dark:text-amber-400"
                        : undefined
                    }
                  >
                    {templateBadge}
                  </Badge>
                )}
                <Badge variant="outline" className="tabular-nums">
                  {detail.sections?.length ?? 0} sections
                </Badge>
              </div>
            )}
            {detail?.class.isRecurring && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatRecurrenceSummary(detail.class)}
              </p>
            )}
          </SheetHeader>

          <div className="space-y-4 p-4">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!loading && detail && (
              <>
                <div className="space-y-2">
                  {isOpen && isPast && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-50/80 px-4 py-3 dark:bg-amber-950/20">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        This session is past its scheduled date
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/70">
                        Mark it complete if it happened, or cancel if it did not.
                      </p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Session actions</h3>
                    <p className="mt-0.5 max-w-full text-xs text-muted-foreground">
                      Update this occurrence: mark it done, cancel it, load a different class plan template, or
                      extend the plan with another section. Changes here only affect this scheduled session.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="rounded-full"
                      disabled={pending || detail.status !== "SCHEDULED"}
                      onClick={async () => {
                        setPending(true);
                        try {
                          await schedulingApi.updateClassInstance(detail.id, { status: "COMPLETED" });
                          toast.success("Marked complete");
                          await refresh();
                        } catch {
                          toast.error("Update failed");
                        } finally {
                          setPending(false);
                        }
                      }}
                    >
                      Mark complete
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={pending || !canEditPlanAndSchedule}
                      onClick={() => void openAssign()}
                    >
                      Assign / swap template
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={pending || !canEditPlanAndSchedule}
                      onClick={() => setAddSectionOpen(true)}
                    >
                      Add section
                    </Button>
                    {detail.class.isRecurring ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={pending || isPast}
                        onClick={() => setEditClassOpen(true)}
                      >
                        Edit series…
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={pending || isPast}
                        onClick={() => setEditClassOpen(true)}
                      >
                        Edit class…
                      </Button>
                    )}
                    {detail.templateId && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={pending || !canEditPlanAndSchedule || !detail.isCustomised}
                        onClick={() => setResetConfirmOpen(true)}
                      >
                        Reset to template
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      disabled={pending || !isOpen}
                      onClick={() => setCancelConfirmOpen(true)}
                    >
                      Cancel class
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Date and time</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {detail.class.isRecurring
                      ? "Recurring series: saving may ask whether to update only this session or all future sessions."
                      : "Adjust when this class runs."}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="rs-date" className="text-xs">
                        Date
                      </Label>
                      <DatePicker
                        id="rs-date"
                        value={reschedule.date}
                        onChange={(date) => {
                          setRescheduleTimeError(null);
                          setReschedule((r) => ({ ...r, date }));
                        }}
                        minDate={todayYmd()}
                        disabled={pending || !canEditPlanAndSchedule}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rs-time" className="text-xs">
                        Start
                      </Label>
                      <TimePicker
                        id="rs-time"
                        value={reschedule.time}
                        onChange={(time) => {
                          setRescheduleTimeError(null);
                          setReschedule((r) => ({ ...r, time }));
                        }}
                        minTime={rescheduleMinTime}
                        disabled={pending || !canEditPlanAndSchedule}
                        aria-invalid={!!rescheduleTimeError}
                        className="mt-1"
                      />
                      {rescheduleTimeError && (
                        <p className="mt-1 text-xs text-destructive">{rescheduleTimeError}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 rounded-full"
                    disabled={pending || !canEditPlanAndSchedule}
                    onClick={() => void saveReschedule()}
                  >
                    Save schedule
                  </Button>
                </div>

                {detail.class.type === "PRIVATE" && (
                  <>
                    <AttendanceChecklist
                      instanceId={detail.id}
                      classId={detail.classId}
                      status={detail.status}
                      onAttendanceSaved={() =>
                        setAttendanceRefreshKey((k) => k + 1)
                      }
                    />

                    <SessionNotesSection
                      instanceId={detail.id}
                      status={detail.status}
                      attendanceRefreshKey={attendanceRefreshKey}
                    />
                  </>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Plan</h3>
                  {sortSections(detail.sections ?? []).length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No sections yet. Attach a template or add a section.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-4">
                      {sortSections(detail.sections ?? []).map((section, idx) => {
                        const exSorted = sortSectionExercises(section.exercises ?? []);
                        const sortedAll = sortSections(detail.sections ?? []);
                        return (
                          <li key={section.id} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Section {idx + 1}
                                </p>
                                <p className="mt-1 font-semibold text-foreground">{section.name}</p>
                              </div>
                              <div
                                className="flex shrink-0 flex-wrap items-center gap-0.5"
                                role="toolbar"
                                aria-label={`Actions for ${section.name}`}
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  disabled={pending || !canEditPlanAndSchedule || idx === 0}
                                  aria-label="Move section up"
                                  onClick={() => void moveSection(section.id, "up")}
                                >
                                  <ArrowUp className="size-4" aria-hidden />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  disabled={pending || !canEditPlanAndSchedule || idx === sortedAll.length - 1}
                                  aria-label="Move section down"
                                  onClick={() => void moveSection(section.id, "down")}
                                >
                                  <ArrowDown className="size-4" aria-hidden />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  disabled={pending || !canEditPlanAndSchedule}
                                  aria-label="Rename section"
                                  onClick={() => {
                                    setEditingSection(section);
                                    setEditSectionName(section.name);
                                    setEditSectionOpen(true);
                                  }}
                                >
                                  <Pencil className="size-4" aria-hidden />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-destructive hover:text-destructive"
                                  disabled={pending || !canEditPlanAndSchedule}
                                  onClick={() => setSectionRemoveTarget(section)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                            <ul className="mt-3 space-y-2">
                              {exSorted.map((row, exIndex) => (
                                <InstanceExerciseRow
                                  key={row.id}
                                  instanceId={instanceId!}
                                  sectionId={section.id}
                                  row={row}
                                  disabled={pending || !canEditPlanAndSchedule}
                                  canMoveUp={exIndex > 0}
                                  canMoveDown={exIndex < exSorted.length - 1}
                                  onMoveUp={() =>
                                    void moveExerciseInSection(section.id, row.id, "up")
                                  }
                                  onMoveDown={() =>
                                    void moveExerciseInSection(section.id, row.id, "down")
                                  }
                                  onUpdated={refresh}
                                />
                              ))}
                            </ul>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3 rounded-full border-dashed border-border"
                              disabled={pending || !canEditPlanAndSchedule}
                              onClick={() => setPickerSectionId(section.id)}
                            >
                              <Plus className="mr-1 size-4" aria-hidden />
                              Add exercise
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDestructiveDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancel this class?"
        description={
          detail
            ? `“${detail.class.title}” will be marked cancelled. You can still view it on the calendar.`
            : "This class will be marked cancelled."
        }
        confirmLabel="Cancel class"
        confirmPendingLabel="Cancelling…"
        pending={pending}
        onConfirm={async () => {
          if (!detail) return;
          setPending(true);
          try {
            await schedulingApi.updateClassInstance(detail.id, { status: "CANCELLED" });
            toast.success("Class cancelled");
            setCancelConfirmOpen(false);
            await refresh();
          } catch {
            toast.error("Update failed");
          } finally {
            setPending(false);
          }
        }}
      />

      <ConfirmDestructiveDialog
        open={sectionRemoveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSectionRemoveTarget(null);
        }}
        title="Remove section?"
        description={
          sectionRemoveTarget
            ? `“${sectionRemoveTarget.name}” and all exercises in it will be removed from this class plan.`
            : "This section will be removed from the class plan."
        }
        confirmLabel="Remove"
        confirmPendingLabel="Removing…"
        pending={pending}
        confirmDisabled={!sectionRemoveTarget || !instanceId}
        onConfirm={async () => {
          if (!instanceId || !sectionRemoveTarget) return;
          setPending(true);
          try {
            await schedulingApi.deleteInstanceSection(instanceId, sectionRemoveTarget.id);
            toast.success("Section removed");
            setSectionRemoveTarget(null);
            await refresh();
          } catch {
            toast.error("Failed to remove section");
          } finally {
            setPending(false);
          }
        }}
      />
    </>
  );
}
