"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { classPlanApi } from "@/services/class-plan-api";
import type { ClassPlanFolder, DropdownOptionRow } from "@/lib/types";
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

const TAG_PRESETS = ["Easy Teach", "Moderate", "Challenging"] as const;
const MAX_TAGS = 10;
const MAX_TAG_LEN = 50;

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

  const [name, setName] = useState("");
  const [classType, setClassType] = useState("none");
  const [classStyle, setClassStyle] = useState("none");
  const [durationStr, setDurationStr] = useState("60");
  const [folderId, setFolderId] = useState("none");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const classTypeLabel = optionLabel(
    classType,
    "Optional",
    classTypeDd.options,
    classTypeDd.loading
  );
  const classStyleLabel = optionLabel(
    classStyle,
    "Optional",
    classStyleDd.options,
    classStyleDd.loading
  );

  const togglePreset = (preset: string) => {
    setTags((prev) =>
      prev.includes(preset) ? prev.filter((t) => t !== preset) : [...prev, preset].slice(0, MAX_TAGS)
    );
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (!t || t.length > MAX_TAG_LEN) return;
    if (tags.length >= MAX_TAGS) {
      toast.error(`At most ${MAX_TAGS} tags`);
      return;
    }
    if (tags.includes(t)) {
      setCustomTag("");
      return;
    }
    setTags((prev) => [...prev, t]);
    setCustomTag("");
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }
    const durationMinutes = Math.max(1, Number.parseInt(durationStr, 10) || 60);

    setSubmitting(true);
    try {
      const body: Parameters<typeof classPlanApi.createClassPlan>[0] = {
        name: trimmed,
        durationMinutes,
        tags,
      };
      if (classType !== "none") body.classType = classType;
      if (classStyle !== "none") body.classStyle = classStyle;
      body.folderId = folderId === "none" ? null : folderId;

      const created = await classPlanApi.createClassPlan(body);
      toast.success("Class plan created");
      onOpenChange(false);
      onCreated?.();
      router.push(`/class-plans/${created.id}`);
    } catch {
      toast.error("Failed to create class plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-lg">
        <DialogHeader>
          <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Class template
          </p>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
            New class plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="plan-title" className="text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="plan-title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reformer Flow — Tuesday"
              className="h-11 rounded-2xl border-input bg-background/70 shadow-none focus-visible:ring-ring/35"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Class type</Label>
              <Select
                value={classType}
                onValueChange={(v) => setClassType(v ?? "none")}
                disabled={classTypeDd.loading && classTypeDd.options.length === 0}
              >
                <SelectTrigger className="box-border h-11 w-full justify-between rounded-2xl border-input bg-background/70 px-3 shadow-none focus-visible:ring-ring/35">
                  <SelectValue>
                    <span
                      className={cn(
                        classType === "none" || classTypeDd.loading
                          ? "text-muted-foreground"
                          : undefined
                      )}
                    >
                      {classTypeLabel}
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
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Class style</Label>
              <Select
                value={classStyle}
                onValueChange={(v) => setClassStyle(v ?? "none")}
                disabled={classStyleDd.loading && classStyleDd.options.length === 0}
              >
                <SelectTrigger className="box-border h-11 w-full justify-between rounded-2xl border-input bg-background/70 px-3 shadow-none focus-visible:ring-ring/35">
                  <SelectValue>
                    <span
                      className={cn(
                        classStyle === "none" || classStyleDd.loading
                          ? "text-muted-foreground"
                          : undefined
                      )}
                    >
                      {classStyleLabel}
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
              value={durationStr}
              onChange={(e) => setDurationStr(e.target.value)}
              className="h-11 rounded-2xl border-input bg-background/70 shadow-none focus-visible:ring-ring/35"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Folder</Label>
            <Select value={folderId} onValueChange={(v) => setFolderId(v ?? "none")}>
              <SelectTrigger className="box-border h-11 w-full justify-between rounded-2xl border-input bg-background/70 px-3 shadow-none focus-visible:ring-ring/35">
                <SelectValue>
                  {folderId === "none"
                    ? "No folder"
                    : (folders.find((f) => f.id === folderId)?.name ?? "Folder")}
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
                    addCustomTag();
                  }
                }}
                placeholder="Custom tag + Enter"
                maxLength={MAX_TAG_LEN}
                className="h-10 flex-1 rounded-2xl border-input bg-background/70 text-sm shadow-none focus-visible:ring-ring/35"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                onClick={addCustomTag}
                disabled={tags.length >= MAX_TAGS || !customTag.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {tags.length}/{MAX_TAGS} tags: {tags.join(", ")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-border"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !name.trim()}
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
