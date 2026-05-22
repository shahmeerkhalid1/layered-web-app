"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
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

const EMPTY_CREATE_CLASS_VALUES: CreateClassFormValues = {
  title: "",
  type: "GROUP",
  durationMinutes: 60,
  templateId: "",
  isRecurring: false,
  startDate: "",
  endDate: "",
  clockTime: "",
};

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateClassDialog({ open, onOpenChange, onSuccess }: CreateClassDialogProps) {
  const [daySet, setDaySet] = useState<Set<number>>(new Set([1, 3, 5]));

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassFormSchema),
    defaultValues: EMPTY_CREATE_CLASS_VALUES,
  });

  const isRecurring = useWatch({ control, name: "isRecurring", defaultValue: false });
  const classType = useWatch({ control, name: "type", defaultValue: "GROUP" });

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setDaySet(new Set([1, 3, 5]));
      reset(EMPTY_CREATE_CLASS_VALUES);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, reset]);

  const toggleDay = (v: number) => {
    setDaySet((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const onSubmit = async (values: CreateClassFormValues) => {
    if (values.isRecurring && daySet.size === 0) {
      toast.error("Select at least one weekday for recurring classes");
      return;
    }
    try {
      const timeIso = localDateAndTimeToUtcIso(values.startDate, values.clockTime);
      const startIso = localYmdToUtcIsoMidday(values.startDate);
      const endIso =
        values.isRecurring && values.endDate?.trim()
          ? localYmdToUtcIsoMidday(values.endDate.trim())
          : undefined;

      await schedulingApi.createClass({
        title: values.title.trim(),
        type: values.type,
        isRecurring: values.isRecurring,
        recurrenceRule: values.isRecurring
          ? { daysOfWeek: [...daySet].sort((a, b) => a - b) }
          : undefined,
        startDate: startIso,
        endDate: endIso ?? null,
        time: timeIso,
        durationMinutes: values.durationMinutes,
        templateId: values.templateId?.trim() || undefined,
      });
      toast.success(values.isRecurring ? "Recurring class created" : "Class created");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not create class";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New class</DialogTitle>
          <DialogDescription>
            Create a one-off session or a recurring series.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cc-title">Title</Label>
            <Input
              id="cc-title"
              placeholder="e.g. Morning Reformer"
              {...register("title")}
              className={cn(errors.title && "border-destructive")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={classType}
                onValueChange={(v) => setValue("type", v as "GROUP" | "PRIVATE")}
              >
                <SelectTrigger className="w-full min-w-0 justify-between">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent  className="min-w-(--anchor-width)  border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50">
                  <SelectItem className="rounded-xl py-2.5 pl-3" value="GROUP">Group</SelectItem>
                  <SelectItem className="rounded-xl py-2.5 pl-3" value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-dur">Duration (min)</Label>
              <Input
                id="cc-dur"
                type="number"
                {...register("durationMinutes", { valueAsNumber: true })}
                className={cn(errors.durationMinutes && "border-destructive")}
              />
            </div>
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="cc-tpl">Template ID (optional)</Label>
            <Input id="cc-tpl" placeholder="Paste template id or leave blank" {...register("templateId")} />
            <p className="text-[11px] text-muted-foreground">
              Tip: open a class plan in another tab and paste its URL id here to copy sections.
            </p>
          </div> */}

          <div className="flex items-center gap-2">
            <Checkbox
              id="cc-rec"
              checked={isRecurring}
              onChange={(e) => setValue("isRecurring", e.target.checked)}
            />
            <Label htmlFor="cc-rec" className="font-medium">
              Recurring class
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cc-start">Start date</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="cc-start"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={!!errors.startDate}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-clock">Time</Label>
              <Controller
                name="clockTime"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    id="cc-clock"
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
                <Label htmlFor="cc-end">End date</Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="cc-end"
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
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
