"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { ScheduledClass } from "@/lib/types";
import { schedulingApi } from "@/services/scheduling-api";
import {
  createClassFormSchema,
  type CreateClassFormValues,
} from "@/lib/validation/create-class-form-schema";
import { localDateAndTimeToUtcIso, localYmdToUtcIsoMidday } from "@/lib/datetime-local";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const WEEKDAY_OPTS: { label: string; value: number }[] = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

function ymdFromIso(iso: string): string {
  return iso.slice(0, 10);
}

function clockFromIso(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface EditClassDialogProps {
  classId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditClassDialog({ classId, open, onOpenChange, onSuccess }: EditClassDialogProps) {
  const [daySet, setDaySet] = useState<Set<number>>(new Set());
  const [loadingClass, setLoadingClass] = useState(false);
  const [confirmRegenOpen, setConfirmRegenOpen] = useState(false);
  const originalRef = useRef<ScheduledClass | null>(null);
  const pendingValuesRef = useRef<CreateClassFormValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassFormSchema),
    defaultValues: {
      title: "",
      type: "GROUP",
      durationMinutes: 60,
      templateId: "",
      isRecurring: false,
      startDate: "",
      endDate: "",
      clockTime: "",
    },
  });

  const isRecurring = watch("isRecurring");

  useEffect(() => {
    if (!open || !classId) return;
    let cancelled = false;
    setLoadingClass(true);
    schedulingApi
      .getClassById(classId)
      .then((cls) => {
        if (cancelled) return;
        originalRef.current = cls;
        const rule = cls.recurrenceRule as { daysOfWeek?: number[] } | null | undefined;
        const days = rule?.daysOfWeek ?? [];
        setDaySet(new Set(days));
        reset({
          title: cls.title,
          type: cls.type,
          durationMinutes: cls.durationMinutes,
          templateId: cls.templateId ?? "",
          isRecurring: cls.isRecurring,
          startDate: ymdFromIso(cls.startDate),
          endDate: cls.endDate ? ymdFromIso(cls.endDate) : "",
          clockTime: clockFromIso(cls.time),
        });
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load class series");
      })
      .finally(() => {
        if (!cancelled) setLoadingClass(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, classId, reset]);

  const toggleDay = (v: number) => {
    setDaySet((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const needsRegeneration = (values: CreateClassFormValues, original: ScheduledClass): boolean => {
    if (!original.isRecurring && !values.isRecurring) return false;
    if (original.isRecurring !== values.isRecurring) return true;
    if (!values.isRecurring) return false;

    const origRule = original.recurrenceRule as { daysOfWeek?: number[] } | null | undefined;
    const origDays = [...(origRule?.daysOfWeek ?? [])].sort((a, b) => a - b);
    const newDays = [...daySet].sort((a, b) => a - b);
    if (origDays.length !== newDays.length || origDays.some((d, i) => d !== newDays[i])) return true;

    if (ymdFromIso(original.startDate) !== values.startDate) return true;
    const origEnd = original.endDate ? ymdFromIso(original.endDate) : "";
    const newEnd = values.endDate?.trim() ?? "";
    if (origEnd !== newEnd) return true;
    if (clockFromIso(original.time) !== values.clockTime) return true;

    return false;
  };

  const submitUpdate = async (values: CreateClassFormValues) => {
    if (!classId) return;
    const timeIso = localDateAndTimeToUtcIso(values.startDate, values.clockTime);
    const startIso = localYmdToUtcIsoMidday(values.startDate);
    const endIso =
      values.isRecurring && values.endDate?.trim()
        ? localYmdToUtcIsoMidday(values.endDate.trim())
        : null;

    const body: Parameters<typeof schedulingApi.updateClass>[1] = {
      title: values.title.trim(),
      type: values.type,
      isRecurring: values.isRecurring,
      recurrenceRule: values.isRecurring
        ? { daysOfWeek: [...daySet].sort((a, b) => a - b) }
        : null,
      startDate: startIso,
      endDate: endIso,
      time: timeIso,
      durationMinutes: values.durationMinutes,
    };

    const original = originalRef.current;
    if (original && needsRegeneration(values, original)) {
      const seriesStart = ymdFromIso(original.startDate);
      const regenFrom = todayYmd() >= seriesStart ? todayYmd() : seriesStart;
      body.regenerateFutureInstancesFrom = regenFrom;
    }

    await schedulingApi.updateClass(classId, body);
    toast.success("Class series updated");
    onOpenChange(false);
    onSuccess?.();
  };

  const onSubmit = async (values: CreateClassFormValues) => {
    if (values.isRecurring && daySet.size === 0) {
      toast.error("Select at least one weekday for recurring classes");
      return;
    }

    const original = originalRef.current;
    if (original && needsRegeneration(values, original)) {
      pendingValuesRef.current = values;
      setConfirmRegenOpen(true);
      return;
    }

    try {
      await submitUpdate(values);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not update class";
      toast.error(msg);
    }
  };

  const confirmRegeneration = async () => {
    const values = pendingValuesRef.current;
    if (!values) return;
    setConfirmRegenOpen(false);
    try {
      await submitUpdate(values);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not update class";
      toast.error(msg);
    } finally {
      pendingValuesRef.current = null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit class series</DialogTitle>
            <DialogDescription>
              Update the recurring schedule for all future sessions. Past sessions are not changed.
            </DialogDescription>
          </DialogHeader>

          {loadingClass ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ec-title">Title</Label>
                <Input
                  id="ec-title"
                  {...register("title")}
                  className={cn(errors.title && "border-destructive")}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={watch("type")}
                    onValueChange={(v) => setValue("type", v as "GROUP" | "PRIVATE")}
                  >
                    <SelectTrigger className="w-full min-w-0 justify-between">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-(--anchor-width) border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50">
                      <SelectItem className="rounded-xl py-2.5 pl-3" value="GROUP">
                        Group
                      </SelectItem>
                      <SelectItem className="rounded-xl py-2.5 pl-3" value="PRIVATE">
                        Private
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-dur">Duration (min)</Label>
                  <Input
                    id="ec-dur"
                    type="number"
                    {...register("durationMinutes", { valueAsNumber: true })}
                    className={cn(errors.durationMinutes && "border-destructive")}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="ec-rec"
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={isRecurring}
                  onChange={(e) => setValue("isRecurring", e.target.checked)}
                />
                <Label htmlFor="ec-rec" className="font-medium">
                  Recurring class
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ec-start">Start date</Label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="ec-start"
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={!!errors.startDate}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-clock">Time</Label>
                  <Controller
                    name="clockTime"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        id="ec-clock"
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={!!errors.clockTime}
                      />
                    )}
                  />
                </div>
              </div>

              {isRecurring && (
                <>
                  <div className="space-y-2">
                    <Label>Days of week</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_OPTS.map((d) => (
                        <Button
                          key={d.value}
                          type="button"
                          size="sm"
                          variant={daySet.has(d.value) ? "default" : "outline"}
                          className="rounded-full px-3"
                          onClick={() => toggleDay(d.value)}
                        >
                          {d.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ec-end">End date</Label>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          id="ec-end"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          aria-invalid={!!errors.endDate}
                        />
                      )}
                    />
                    {errors.endDate && (
                      <p className="text-xs text-destructive">{errors.endDate.message}</p>
                    )}
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRegenOpen} onOpenChange={setConfirmRegenOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Update future sessions?</DialogTitle>
            <DialogDescription>
              Changing the recurrence will replace all future scheduled sessions in this series.
              Past sessions will stay unchanged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setConfirmRegenOpen(false);
                pendingValuesRef.current = null;
              }}
            >
              Cancel
            </Button>
            <Button type="button" className="rounded-full" onClick={() => void confirmRegeneration()}>
              Update series
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
