"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ClassInstanceDetail, ClassPlanTemplate, PlanSectionDetail } from "@/lib/types";
import { classPlanApi } from "@/services/class-plan-api";
import { schedulingApi } from "@/services/scheduling-api";
import { InstanceExerciseRow } from "@/components/scheduling/instance-exercise-row";
import { EditScopeDialog, type EditScope } from "@/components/scheduling/edit-scope-dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { localDateAndTimeToUtcIso } from "@/lib/datetime-local";
import { cn } from "@/lib/utils";

function sortSections(sections: PlanSectionDetail[]): PlanSectionDetail[] {
  return [...sections].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
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
  const [pending, setPending] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const pendingRef = useRef<{ anchorYmd: string; newIso: string; newDateStr: string } | null>(null);
  const [reschedule, setReschedule] = useState({ date: "", time: "" });

  useEffect(() => {
    if (!detail) return;
    const t = new Date(detail.time);
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    setReschedule({
      date: detail.date.slice(0, 10),
      time: `${hh}:${mm}`,
    });
  }, [detail?.id, detail?.time, detail?.date]);

  const load = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const d = await schedulingApi.getClassInstanceById(instanceId);
      setDetail(d);
    } catch {
      toast.error("Could not load class");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    if (!open || !instanceId) return;
    void load();
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

  useEffect(() => {
    if (!assignOpen || !selectedTemplateId) return;
    if (!filteredTemplates.some((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(null);
    }
  }, [assignOpen, selectedTemplateId, filteredTemplates]);

  const start = detail ? new Date(detail.time) : null;

  const submitAddSection = async () => {
    if (!instanceId) return;
    const name = newSectionName.trim();
    if (!name) {
      toast.error("Section name is required");
      return;
    }
    setPending(true);
    try {
      await schedulingApi.addInstanceSection(instanceId, { name });
      toast.success("Section added");
      setAddSectionOpen(false);
      setNewSectionName("");
      await refresh();
    } catch {
      toast.error("Failed to add section");
    } finally {
      setPending(false);
    }
  };

  const saveReschedule = async () => {
    if (!detail || !instanceId) return;
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
            />
          </div>
          <div
            className="max-h-72 overflow-y-auto pr-1"
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
                  const selected = selectedTemplateId === t.id;
                  const meta = [t.classType, t.classStyle].filter(Boolean).join(" · ");
                  const sectionCount = t._count?.sections;
                  return (
                    <li key={t.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
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
              disabled={!selectedTemplateId || assigningId !== null}
              onClick={() => {
                if (selectedTemplateId) void assign(selectedTemplateId);
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
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" disabled={pending} onClick={() => void submitAddSection()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
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
                  })} · ${detail?.class.durationMinutes ?? 60} min`
                : " "}
            </SheetDescription>
            {detail && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={detail.class.type === "GROUP" ? "default" : "secondary"}>
                  {detail.class.type}
                </Badge>
                <Badge variant="outline">{detail.status}</Badge>
                {detail.isCustomised && (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                    Customised
                  </Badge>
                )}
                <Badge variant="outline" className="tabular-nums">
                  {detail.sections?.length ?? 0} sections
                </Badge>
              </div>
            )}
          </SheetHeader>

          <div className="space-y-4 p-4">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!loading && detail && (
              <>
                <div className="space-y-2">
                  <div >
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
                      disabled={pending}
                      onClick={() => void openAssign()}
                    >
                      Assign / swap template
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={pending}
                      onClick={() => setAddSectionOpen(true)}
                    >
                      Add section
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      disabled={pending || detail.status === "CANCELLED"}
                      onClick={async () => {
                        setPending(true);
                        try {
                          await schedulingApi.updateClassInstance(detail.id, { status: "CANCELLED" });
                          toast.success("Class cancelled");
                          await refresh();
                        } catch {
                          toast.error("Update failed");
                        } finally {
                          setPending(false);
                        }
                      }}
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
                      <Input
                        id="rs-date"
                        type="date"
                        value={reschedule.date}
                        onChange={(e) => setReschedule((r) => ({ ...r, date: e.target.value }))}
                        disabled={pending}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rs-time" className="text-xs">
                        Start
                      </Label>
                      <Input
                        id="rs-time"
                        type="time"
                        value={reschedule.time}
                        onChange={(e) => setReschedule((r) => ({ ...r, time: e.target.value }))}
                        disabled={pending}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 rounded-full"
                    disabled={pending}
                    onClick={() => void saveReschedule()}
                  >
                    Save schedule
                  </Button>
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-muted/15 p-4">
                  <p className="text-sm font-medium text-foreground">Clients</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Client roster and attendance will be available in a later release.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Plan</h3>
                  {sortSections(detail.sections ?? []).length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No sections yet. Attach a template or add a section.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-4">
                      {sortSections(detail.sections ?? []).map((section, idx) => (
                        <li key={section.id} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-muted-foreground">Section {idx + 1}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-destructive hover:text-destructive"
                              disabled={pending}
                              onClick={async () => {
                                if (!instanceId) return;
                                setPending(true);
                                try {
                                  await schedulingApi.deleteInstanceSection(instanceId, section.id);
                                  toast.success("Section removed");
                                  await refresh();
                                } catch {
                                  toast.error("Failed to remove section");
                                } finally {
                                  setPending(false);
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                          <p className="mt-1 font-semibold text-foreground">{section.name}</p>
                          <ul className="mt-3 space-y-2">
                            {(section.exercises ?? []).map((row) => (
                              <InstanceExerciseRow
                                key={row.id}
                                instanceId={instanceId!}
                                sectionId={section.id}
                                row={row}
                                disabled={pending}
                                onUpdated={refresh}
                              />
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
