"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { classPlanApi } from "@/services/class-plan-api";
import type { ClassPlanFolder, DropdownOptionRow } from "@/lib/types";
import {
  TAG_PRESETS,
  MAX_TAG_LEN,
  MAX_TAGS,
  buildClassPlanTemplateCreateDefaults,
  classPlanTemplateFormSchema,
  toCreateClassPlanBody,
  type ClassPlanTemplateFormValues,
} from "@/lib/validation/class-plan-template-form-schema";
import {
  DUPLICATE_CLASS_PLAN_NAME_MESSAGE,
  isDuplicateDisplayName,
} from "@/lib/validation/unique-display-name";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import { cn } from "@/lib/utils";

function optionLabel(
  value: string,
  placeholder: string,
  options: DropdownOptionRow[],
  loading: boolean
): string {
  if (loading && options.length === 0) return "Loading…";
  if (value === "none" || value === "") return placeholder;
  const found = options.find((o) => o.value === value);
  return found?.label ?? value;
}

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: ClassPlanFolder[];
  onCreated?: () => void;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  folders,
  onCreated,
}: CreateTemplateDialogProps) {
  const router = useRouter();
  const classTypeDd = useDropdownOptions("class_type");
  const classStyleDd = useDropdownOptions("class_style");
  const [customTag, setCustomTag] = useState("");
  const [existingPlans, setExistingPlans] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<ClassPlanTemplateFormValues>({
    resolver: zodResolver(classPlanTemplateFormSchema),
    defaultValues: buildClassPlanTemplateCreateDefaults(),
  });

  const tags = useWatch({ control, name: "tags", defaultValue: [] }) ?? [];
  const planName = useWatch({ control, name: "name", defaultValue: "" }) ?? "";
  const duplicatePlanName = isDuplicateDisplayName(planName, existingPlans, null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void classPlanApi
      .listClassPlans({ limit: 100, page: 1 })
      .then((res) => {
        if (!cancelled) {
          setExistingPlans(res.data.map((plan) => ({ id: plan.id, name: plan.name })));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      reset(buildClassPlanTemplateCreateDefaults());
      setCustomTag("");
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, reset]);

  const togglePreset = (preset: string) => {
    const prev = getValues("tags");
    const next = prev.includes(preset)
      ? prev.filter((t) => t !== preset)
      : [...prev, preset].slice(0, MAX_TAGS);
    setValue("tags", next, { shouldValidate: true });
    void trigger("tags");
  };

  const addCustomTag = async () => {
    const t = customTag.trim();
    if (!t || t.length > MAX_TAG_LEN) return;
    const prev = getValues("tags");
    if (prev.includes(t)) {
      setCustomTag("");
      return;
    }
    const next = [...prev, t];
    setValue("tags", next, { shouldValidate: true });
    const valid = await trigger("tags");
    if (!valid) {
      setValue("tags", prev, { shouldValidate: false });
      toast.error(getFieldState("tags").error?.message ?? "Could not add tag");
    } else {
      setCustomTag("");
    }
  };

  const onSubmit = async (values: ClassPlanTemplateFormValues) => {
    if (isDuplicateDisplayName(values.name, existingPlans, null)) {
      toast.error(DUPLICATE_CLASS_PLAN_NAME_MESSAGE);
      return;
    }
    try {
      const body = toCreateClassPlanBody(values);
      const created = await classPlanApi.createClassPlan(body);
      toast.success("Class plan created");
      onOpenChange(false);
      onCreated?.();
      router.push(`/class-plans/${created.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create class plan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,40rem)] w-full flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-popover p-0 shadow-xl sm:max-w-lg"
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 pt-6 pr-12 pb-4">
          <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Class template
          </p>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
            New class plan
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(onSubmit)(e);
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-6 py-4 [scrollbar-gutter:stable]">
            <div className="space-y-4">
              <div className="space-y-2">
              <Label htmlFor="plan-title" className="text-sm font-medium text-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plan-title"
                placeholder="e.g. Reformer Flow — Tuesday"
                className={cn(
                  "h-11 rounded-2xl border-input bg-background/70 shadow-none focus-visible:ring-ring/35",
                  (errors.name || duplicatePlanName) && "border-destructive"
                )}
                aria-invalid={errors.name || duplicatePlanName ? true : undefined}
                {...register("name")}
              />
              {errors.name && (
                <p className="pl-1.5 text-sm text-destructive">{errors.name.message}</p>
              )}
              {!errors.name && duplicatePlanName && (
                <p className="pl-1.5 text-sm text-destructive">
                  {DUPLICATE_CLASS_PLAN_NAME_MESSAGE}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Class type</Label>
                <Controller
                  name="classType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v ?? "none")}
                      disabled={classTypeDd.loading && classTypeDd.options.length === 0}
                    >
                      <SelectTrigger
                        className={cn(
                          "box-border h-11 w-full justify-between rounded-2xl border-input bg-background/70 px-3 shadow-none focus-visible:ring-ring/35",
                          errors.classType && "border-destructive"
                        )}
                        aria-invalid={errors.classType ? true : undefined}
                      >
                        <SelectValue>
                          <span
                            className={cn(
                              field.value === "none" || classTypeDd.loading
                                ? "text-muted-foreground"
                                : undefined
                            )}
                          >
                            {optionLabel(
                              field.value,
                              "Optional",
                              classTypeDd.options,
                              classTypeDd.loading
                            )}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        sideOffset={6}
                        className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg"
                      >
                        <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                          <span className="text-muted-foreground">Optional</span>
                        </SelectItem>
                        {classTypeDd.options.map((o) => (
                          <SelectItem key={o.id} value={o.value} className="rounded-xl py-2.5 pl-3">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.classType && (
                  <p className="pl-1.5 text-sm text-destructive">{errors.classType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Class style</Label>
                <Controller
                  name="classStyle"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v ?? "none")}
                      disabled={classStyleDd.loading && classStyleDd.options.length === 0}
                    >
                      <SelectTrigger
                        className={cn(
                          "box-border h-11 w-full justify-between rounded-2xl border-input bg-background/70 px-3 shadow-none focus-visible:ring-ring/35",
                          errors.classStyle && "border-destructive"
                        )}
                        aria-invalid={errors.classStyle ? true : undefined}
                      >
                        <SelectValue>
                          <span
                            className={cn(
                              field.value === "none" || classStyleDd.loading
                                ? "text-muted-foreground"
                                : undefined
                            )}
                          >
                            {optionLabel(
                              field.value,
                              "Optional",
                              classStyleDd.options,
                              classStyleDd.loading
                            )}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        sideOffset={6}
                        className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg"
                      >
                        <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                          <span className="text-muted-foreground">Optional</span>
                        </SelectItem>
                        {classStyleDd.options.map((o) => (
                          <SelectItem key={o.id} value={o.value} className="rounded-xl py-2.5 pl-3">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.classStyle && (
                  <p className="pl-1.5 text-sm text-destructive">{errors.classStyle.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-duration" className="text-sm font-medium text-foreground">
                Duration (minutes)
              </Label>
              <Input
                id="plan-duration"
                type="number"
                min={1}
                step={1}
                className={cn(
                  "h-11 rounded-2xl border-input bg-background/70 shadow-none focus-visible:ring-ring/35",
                  errors.durationMinutesStr && "border-destructive"
                )}
                aria-invalid={errors.durationMinutesStr ? true : undefined}
                {...register("durationMinutesStr")}
              />
              {errors.durationMinutesStr && (
                <p className="pl-1.5 text-sm text-destructive">{errors.durationMinutesStr.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Folder</Label>
              <Controller
                name="folderId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "none")}>
                    <SelectTrigger
                      className={cn(
                        "box-border h-11 w-full justify-between rounded-2xl border-input bg-background/70 px-3 shadow-none focus-visible:ring-ring/35",
                        errors.folderId && "border-destructive"
                      )}
                      aria-invalid={errors.folderId ? true : undefined}
                    >
                      <SelectValue>
                        {field.value === "none"
                          ? "No folder"
                          : (folders.find((f) => f.id === field.value)?.name ?? "Folder")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      sideOffset={6}
                      className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg"
                    >
                      <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                        No folder
                      </SelectItem>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id} className="rounded-xl py-2.5 pl-3">
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.folderId && (
                <p className="pl-1.5 text-sm text-destructive">{errors.folderId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_PRESETS.map((preset) => {
                  const on = tags.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => togglePreset(preset)}
                      disabled={!on && tags.length >= MAX_TAGS}
                      className={cn(
                        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        on
                          ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-border bg-muted/40 text-foreground hover:bg-accent"
                      )}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addCustomTag();
                    }
                  }}
                  placeholder="Custom tag + Enter"
                  maxLength={MAX_TAG_LEN}
                  className={cn(
                    "h-10 flex-1 rounded-2xl border-input bg-background/70 text-sm shadow-none focus-visible:ring-ring/35",
                    errors.tags && "border-destructive"
                  )}
                  aria-invalid={errors.tags ? true : undefined}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full"
                  onClick={() => void addCustomTag()}
                  disabled={tags.length >= MAX_TAGS || !customTag.trim()}
                >
                  Add
                </Button>
              </div>
              {errors.tags && (
                <p className="pl-1.5 text-sm text-destructive">{errors.tags.message}</p>
              )}
              {tags.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {tags.length}/{MAX_TAGS} tags: {tags.join(", ")}
                </p>
              )}
            </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 gap-2 rounded-none rounded-b-3xl border-t border-border/60 bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || duplicatePlanName}
              className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
