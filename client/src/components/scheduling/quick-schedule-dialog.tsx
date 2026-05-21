"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { schedulingApi } from "@/services/scheduling-api";
import {
  quickScheduleFormSchema,
  toQuickScheduleApiBody,
  type QuickScheduleFormValues,
} from "@/lib/validation/quick-schedule-form-schema";
import { localDateAndTimeToUtcIso } from "@/lib/datetime-local";
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

const EMPTY_QUICK_SCHEDULE_VALUES: QuickScheduleFormValues = {
  title: "",
  type: "GROUP",
  durationMinutes: 60,
  date: "",
  time: "",
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

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuickScheduleFormValues>({
    resolver: zodResolver(quickScheduleFormSchema),
    defaultValues: EMPTY_QUICK_SCHEDULE_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: templatePrefill?.name ?? "",
      type: "GROUP",
      durationMinutes: templatePrefill?.durationMinutes ?? 60,
      date: slotPrefill?.date ?? "",
      time: slotPrefill?.time ?? "",
    });
  }, [open, templatePrefill, slotPrefill, reset]);

  const typeVal = watch("type");

  const onSubmit = async (values: QuickScheduleFormValues) => {
    try {
      const isoTime = localDateAndTimeToUtcIso(values.date, values.time);
      const body = toQuickScheduleApiBody(
        { ...values, time: isoTime },
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
      onOpenChange(false);
      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not schedule class";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">
            {lockedTemplate ? "Schedule this plan" : "Quick schedule"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {lockedTemplate
              ? "Pick when to teach this template. A dated class is created with a copy of the plan."
              : "Create a one-off class on your calendar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {lockedTemplate && (
            <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Template: </span>
              <span className="font-medium text-foreground">{templatePrefill!.name}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="qs-title">Title</Label>
            <Input
              id="qs-title"
              placeholder={lockedTemplate ? "Uses template name if empty" : "Class title"}
              disabled={isSubmitting}
              className={cn(errors.title && "border-destructive")}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qs-date">Date</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="qs-date"
                    value={field.value}
                    onChange={field.onChange}
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
              <Label htmlFor="qs-time">Start time</Label>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qs-type">Class type</Label>
              <Select
                value={typeVal}
                onValueChange={(v) => setValue("type", v as "GROUP" | "PRIVATE")}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="qs-type"
                  className="w-full min-w-0 justify-between"
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="qs-duration">Duration (min)</Label>
              <Input
                id="qs-duration"
                type="number"
                min={1}
                max={24 * 60}
                disabled={isSubmitting}
                className={cn(errors.durationMinutes && "border-destructive")}
                {...register("durationMinutes", { valueAsNumber: true })}
              />
              {errors.durationMinutes && (
                <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
              )}
            </div>
          </div>

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
