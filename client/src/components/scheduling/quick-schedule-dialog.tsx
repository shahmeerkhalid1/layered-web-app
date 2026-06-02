"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { schedulingApi } from "@/services/scheduling-api";
import {
  quickScheduleFormSchema,
  RECURRING_DAYS_OF_WEEK_MESSAGE,
  RECURRING_END_DATE_MESSAGE,
  TITLE_REQUIRED_MESSAGE,
  toQuickScheduleApiBody,
  type QuickScheduleFormValues,
} from "@/lib/validation/quick-schedule-form-schema";
import {
  parseDurationMinutesStr,
  SCHEDULING_MAX_DURATION_MINUTES,
} from "@/lib/validation/duration-minutes-form-schema";
import { localDateAndTimeToUtcIso, localYmdToUtcIsoMidday } from "@/lib/datetime-local";
import { todayYmd } from "@/lib/calendar-utils";
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

export type QuickScheduleTemplatePrefill = {
  id: string;
  name: string;
  durationMinutes?: number | null;
};

export type QuickScheduleSlotPrefill = {
  /** YYYY-MM-DD (local calendar day) */
  date: string;
  /** HH:mm local, optional */
  time?: string;
};

const CLASS_TYPE_LABELS: Record<"GROUP" | "PRIVATE", string> = {
  GROUP: "Group",
  PRIVATE: "Private",
};

const WEEKDAY_OPTS: { label: string; value: number }[] = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

const EMPTY_QUICK_SCHEDULE_VALUES: QuickScheduleFormValues = {
  title: "",
  type: "GROUP",
  durationMinutesStr: "60",
  date: "",
  time: "",
  isRecurring: false,
  endDate: "",
};

interface QuickScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  templatePrefill?: QuickScheduleTemplatePrefill | null;
  slotPrefill?: QuickScheduleSlotPrefill | null;
}

export function QuickScheduleDialog({
  open,
  onOpenChange,
  onSuccess,
  templatePrefill,
  slotPrefill,
}: QuickScheduleDialogProps) {
  const lockedTemplate = Boolean(templatePrefill);
  const [daySet, setDaySet] = useState<Set<number>>(new Set([1, 3, 5]));
  const [daysOfWeekError, setDaysOfWeekError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<QuickScheduleFormValues>({
    resolver: zodResolver(quickScheduleFormSchema),
    defaultValues: EMPTY_QUICK_SCHEDULE_VALUES,
    shouldUnregister: false,
    criteriaMode: "all",
  });

  const isRecurringField = register("isRecurring");

  useEffect(() => {
    if (!open) return;
    const prefillDate = slotPrefill?.date ?? "";
    const scheduleDate =
      prefillDate && prefillDate >= todayYmd() ? prefillDate : prefillDate ? todayYmd() : "";
    reset({
      title: templatePrefill?.name ?? "",
      type: "GROUP",
      durationMinutesStr:
        templatePrefill?.durationMinutes != null && templatePrefill.durationMinutes > 0
          ? String(templatePrefill.durationMinutes)
          : "60",
      date: scheduleDate,
      time: slotPrefill?.time ?? "",
      isRecurring: false,
      endDate: "",
    });
    setDaySet(new Set([1, 3, 5]));
    setDaysOfWeekError(null);
  }, [open, templatePrefill, slotPrefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateSubmitExtras = (): boolean => {
    const values = getValues();
    let valid = true;

    if (!lockedTemplate && !values.title?.trim()) {
      setError("title", {
        type: "manual",
        message: TITLE_REQUIRED_MESSAGE,
      });
      valid = false;
    }

    if (!values.isRecurring) {
      setDaysOfWeekError(null);
      return valid;
    }

    if (!values.endDate.trim()) {
      setError("endDate", {
        type: "manual",
        message: RECURRING_END_DATE_MESSAGE,
      });
      valid = false;
    }

    if (daySet.size === 0) {
      setDaysOfWeekError(RECURRING_DAYS_OF_WEEK_MESSAGE);
      valid = false;
    } else {
      setDaysOfWeekError(null);
    }

    return valid;
  };

  const typeVal = useWatch({ control, name: "type", defaultValue: "GROUP" });
  const isRecurring = useWatch({ control, name: "isRecurring", defaultValue: false });

  const toggleDay = (v: number) => {
    setDaySet((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      if (next.size > 0) setDaysOfWeekError(null);
      return next;
    });
  };

  const onSubmit = async (values: QuickScheduleFormValues) => {
    if (!validateSubmitExtras()) {
      return;
    }

    try {
      const timeIso = localDateAndTimeToUtcIso(values.date, values.time);
      const title = values.title?.trim() || templatePrefill?.name || "";

      if (values.isRecurring) {
        await schedulingApi.createClass({
          title,
          type: values.type,
          isRecurring: true,
          recurrenceRule: { daysOfWeek: [...daySet].sort((a, b) => a - b) },
          startDate: localYmdToUtcIsoMidday(values.date),
          endDate: localYmdToUtcIsoMidday(values.endDate!.trim()),
          time: timeIso,
          durationMinutes: parseDurationMinutesStr(values.durationMinutesStr),
          templateId: templatePrefill?.id,
        });
        toast.success("Recurring class created");
      } else {
        const body = toQuickScheduleApiBody(
          { ...values, time: timeIso },
          templatePrefill?.id
        );
        await schedulingApi.quickSchedule(body);
        toast.success("Class scheduled!", {
          description: (
            <span>
              View it on the{" "}
              <Link href="/calendar" className="font-medium underline underline-offset-2">
                calendar
              </Link>
              .
            </span>
          ),
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not schedule class";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto rounded-3xl border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
            {lockedTemplate ? "Schedule this plan" : "Quick schedule"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {lockedTemplate
              ? "Pick when to teach this template. A dated class is created with a copy of the plan."
              : "Create a one-off class or a recurring series on your calendar."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit, validateSubmitExtras)}
          className="space-y-4"
        >
          {lockedTemplate && (
            <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Template: </span>
              <span className="font-medium text-foreground">{templatePrefill!.name}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="qs-title">
              Title{" "}
              {!lockedTemplate || isRecurring ? (
                <span className="text-destructive">*</span>
              ) : null}
            </Label>
            <Input
              id="qs-title"
              placeholder={lockedTemplate ? "Uses template name if empty" : "Class title"}
              disabled={isSubmitting}
              aria-invalid={errors.title ? true : undefined}
              {...register("title")}
              className={cn(errors.title && "border-destructive")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

         

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qs-type">
                Class type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={typeVal}
                onValueChange={(v) => setValue("type", v as "GROUP" | "PRIVATE")}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="qs-type"
                  className={cn(
                    "w-full min-w-0 justify-between",
                    errors.type && "border-destructive"
                  )}
                  aria-invalid={errors.type ? true : undefined}
                >
                  <SelectValue>{CLASS_TYPE_LABELS[typeVal]}</SelectValue>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  sideOffset={6}
                  alignItemWithTrigger={false}
                  className="min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                >
                  <SelectItem value="GROUP" className="rounded-xl py-2.5 pl-3">
                    Group
                  </SelectItem>
                  <SelectItem value="PRIVATE" className="rounded-xl py-2.5 pl-3">
                    Private
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="qs-duration">
                Duration (min) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="qs-duration"
                type="number"
                min={1}
                step={1}
                disabled={isSubmitting}
                aria-invalid={errors.durationMinutesStr ? true : undefined}
                {...register("durationMinutesStr")}
                className={cn(errors.durationMinutesStr && "border-destructive")}
              />
              {errors.durationMinutesStr && (
                <p className="text-xs text-destructive">{errors.durationMinutesStr.message}</p>
              )}
            </div>
          </div>

           <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qs-date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="qs-date"
                    value={field.value}
                    onChange={field.onChange}
                    minDate={todayYmd()}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.date}
                  />
                )}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="qs-time">
                Start time <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="time"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    id="qs-time"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.time}
                  />
                )}
              />
              {errors.time && (
                <p className="text-xs text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="qs-rec"
              {...isRecurringField}
              disabled={isSubmitting}
              onChange={(e) => {
                isRecurringField.onChange(e);
                if (!e.target.checked) {
                  clearErrors("endDate");
                  setDaysOfWeekError(null);
                }
              }}
            />
            <Label htmlFor="qs-rec" className="font-medium">
              Recurring class
            </Label>
          </div>

          {isRecurring && (
            <>
              <div className="space-y-2">
                <Label>
                  Days of week <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_OPTS.map((d) => (
                    <Button
                      key={d.value}
                      type="button"
                      size="sm"
                      variant={daySet.has(d.value) ? "default" : "outline"}
                      className="rounded-full px-3"
                      onClick={() => toggleDay(d.value)}
                      disabled={isSubmitting}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
                {daysOfWeekError && (
                  <p className="text-xs text-destructive">{daysOfWeekError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="qs-end">
                  End date <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="qs-end"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isSubmitting}
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

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-full" disabled={isSubmitting}>
              {isSubmitting ? "Scheduling…" : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
