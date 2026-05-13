"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BulletTextarea } from "@/components/exercises/bullet-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getLayerStepTitle } from "@/lib/exercise-layer-labels";
import {
  buildExerciseFormDefaults,
  exerciseFormSchema,
  type ExerciseFormValues,
} from "@/lib/validation/exercise-form-schema";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  ListChecks,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

/** Local-only demo options — no API calls. */
const DEMO_ORIENTATION = [
  { value: "none", label: "Not specified" },
  { value: "supine", label: "Supine" },
  { value: "prone", label: "Prone" },
  { value: "side_lying", label: "Side lying" },
  { value: "seated", label: "Seated" },
];

const DEMO_DIRECTION = [
  { value: "none", label: "Not specified" },
  { value: "facing_front", label: "Facing front" },
  { value: "facing_side", label: "Facing side" },
  { value: "facing_reformer", label: "Facing reformer" },
];

const DEMO_MOVEMENT_TYPES = [
  { value: "stability", label: "Stability" },
  { value: "mobility", label: "Mobility" },
  { value: "strength", label: "Strength" },
  { value: "coordination", label: "Coordination" },
];

const DEMO_MACHINE_SETUP = [
  { value: "none", label: "Not specified" },
  { value: "footbar_mid", label: "Footbar — mid" },
  { value: "footbar_high", label: "Footbar — high" },
  { value: "long_box", label: "Long box" },
];

const DEMO_EQUIPMENT = [
  { value: "None", label: "None" },
  { value: "Reformer", label: "Reformer" },
  { value: "Mat", label: "Mat" },
  { value: "Chair", label: "Chair" },
  { value: "Magic_circle", label: "Magic circle" },
];

const DEMO_SPINAL = [
  { value: "None", label: "None" },
  { value: "Flexion", label: "Flexion" },
  { value: "Extension", label: "Extension" },
  { value: "Rotation", label: "Rotation" },
  { value: "Lateral_flexion", label: "Lateral flexion" },
];

const DEMO_CHAIN = [
  { value: "Long", label: "Long" },
  { value: "Short", label: "Short" },
  { value: "Both", label: "Both" },
];

const DEMO_JOINT = [
  { value: "Closed_chain", label: "Closed chain" },
  { value: "Open_chain", label: "Open chain" },
  { value: "Mixed", label: "Mixed" },
];

const NONE_EQUIPMENT = "None";
const NONE_SPINAL = "None";
const BOTH_CHAIN = "Both";

const STEPS = [
  {
    id: "basics",
    title: "Basics",
    caption: "Identity & narrative",
    icon: Sparkles,
  },
  {
    id: "equipment",
    title: "Equipment",
    caption: "Machine & setup",
    icon: Wrench,
  },
  {
    id: "layers",
    title: "Layers & cues",
    caption: "Teaching flow",
    icon: Layers,
  },
  {
    id: "analysis",
    title: "Movement analysis",
    caption: "Tags & classification",
    icon: ListChecks,
  },
  {
    id: "progression",
    title: "Progression",
    caption: "Scaling notes",
    icon: Check,
  },
] as const;

type ExerciseStringSelectField =
  | "orientation"
  | "directionFaced"
  | "movementType"
  | "machineSetup";

const STEP_FIELD_GROUPS: (keyof ExerciseFormValues)[][] = [
  ["name", "description", "startingPosition"],
  ["orientation", "directionFaced", "movementType", "springs", "equipment", "machineSetup"],
  ["layers", "transitionCues", "cueing"],
  ["spinalMovement", "chainType", "jointLoading", "tags"],
  ["progressionNotes", "regressionNotes", "progressionOfId"],
];

const selectTriggerClass =
  "box-border h-12 min-h-12 w-full min-w-0 shrink-0 justify-between rounded-2xl border-input bg-background/80 px-4 py-0 leading-snug shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground";

export function ExerciseFormMultistep() {
  const [stepIndex, setStepIndex] = useState(0);

  const defaultValues = useMemo((): ExerciseFormValues => {
    const base = buildExerciseFormDefaults();
    return {
      ...base,
      movementType: DEMO_MOVEMENT_TYPES[0]?.value ?? "stability",
    };
  }, []);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues,
  });

  const { fields: layerFields, append, remove, update } = useFieldArray({
    control,
    name: "layers",
  });

  const [wEquipment, wSpinalMovement, wChainType, wTags, wJointLoading] = useWatch({
    control,
    name: ["equipment", "spinalMovement", "chainType", "tags", "jointLoading"],
  });

  const layersWatch = useWatch({ control, name: "layers" }) ?? [];

  const [equipmentCustomInput, setEquipmentCustomInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const toggleEquipmentValue = (value: string) => {
    const equipment = getValues("equipment");
    setValue(
      "equipment",
      (() => {
        const isNone = value === NONE_EQUIPMENT;
        if (isNone) {
          if (equipment.includes(value)) return [];
          return [value];
        }
        const withoutNone = equipment.filter((v) => v !== NONE_EQUIPMENT);
        if (withoutNone.includes(value)) {
          return withoutNone.filter((v) => v !== value);
        }
        return [...withoutNone, value];
      })(),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const isEquipmentOptionDisabled = (value: string): boolean => {
    if (value === NONE_EQUIPMENT) return false;
    return (wEquipment ?? []).includes(NONE_EQUIPMENT);
  };

  const addCustomEquipment = () => {
    const raw = equipmentCustomInput.trim();
    if (!raw) return;
    const equipment = getValues("equipment");
    setValue(
      "equipment",
      (() => {
        const withoutNone = equipment.filter((v) => v !== NONE_EQUIPMENT);
        if (withoutNone.includes(raw)) return withoutNone;
        return [...withoutNone, raw];
      })(),
      { shouldDirty: true, shouldValidate: true }
    );
    setEquipmentCustomInput("");
  };

  const toggleChainTypeValue = (value: string) => {
    const chainType = getValues("chainType");
    setValue(
      "chainType",
      (() => {
        const has = chainType.includes(value);
        if (has) return chainType.filter((v) => v !== value);
        if (value === BOTH_CHAIN) return [BOTH_CHAIN];
        if (chainType.includes(BOTH_CHAIN)) return chainType;
        if (chainType.length >= 2) return chainType;
        return [...chainType, value];
      })(),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const isChainTypeOptionDisabled = (value: string): boolean => {
    const chainType = wChainType ?? [];
    const checked = chainType.includes(value);
    if (checked) return false;
    if (chainType.includes(BOTH_CHAIN) && value !== BOTH_CHAIN) return true;
    if (value === BOTH_CHAIN && chainType.some((v) => v !== BOTH_CHAIN)) return true;
    if (chainType.length >= 2) return true;
    return false;
  };

  const toggleSpinalMovementValue = (value: string) => {
    const spinalMovement = getValues("spinalMovement");
    setValue(
      "spinalMovement",
      (() => {
        const isNone = value === NONE_SPINAL;
        if (isNone) {
          if (spinalMovement.includes(value)) return [];
          return [value];
        }
        const withoutNone = spinalMovement.filter((v) => v !== NONE_SPINAL);
        if (withoutNone.includes(value)) {
          return withoutNone.filter((v) => v !== value);
        }
        return [...withoutNone, value];
      })(),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const isSpinalMovementOptionDisabled = (value: string): boolean => {
    if (value === NONE_SPINAL) return false;
    return (wSpinalMovement ?? []).includes(NONE_SPINAL);
  };

  const toggleJointLoading = (value: string) => {
    const jointLoading = getValues("jointLoading");
    setValue(
      "jointLoading",
      jointLoading.includes(value)
        ? jointLoading.filter((v) => v !== value)
        : [...jointLoading, value],
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const addTag = () => {
    const tag = tagInput.trim();
    const tags = getValues("tags");
    if (tag && !tags.includes(tag)) {
      setValue("tags", [...tags, tag], { shouldDirty: true, shouldValidate: true });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    const tags = getValues("tags").filter((t) => t !== tag);
    setValue("tags", tags, { shouldDirty: true, shouldValidate: true });
  };

  const lastStep = stepIndex === STEPS.length - 1;

  const goNext = async () => {
    const fields = STEP_FIELD_GROUPS[stepIndex];
    const ok = await trigger(fields);
    if (!ok) {
      toast.error("Fix the highlighted fields before continuing.");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const onDemoSubmit = handleSubmit((values) => {
    toast.success("Form is valid — demo only (nothing was saved).", {
      description: `Captured “${values.name.trim() || "Untitled"}” with ${values.layers.length} layer(s).`,
    });
  });

  function renderSelect(
    name: ExerciseStringSelectField,
    label: string,
    options: { value: string; label: string }[],
    required?: boolean
  ) {
    return (
      <div className="space-y-2">
        <Label className="pl-1.5 text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent
                align="start"
                sideOffset={6}
                className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
              >
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="rounded-xl py-2.5 pl-3">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors[name] && (
          <p className="pl-1.5 text-sm text-destructive">
            {(errors[name] as { message?: string })?.message}
          </p>
        )}
      </div>
    );
  }

  const stepContent = (() => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              This multistep layout mirrors the full exercise form fields with{" "}
              <span className="font-medium text-foreground">no server calls</span>. Use it to
              compare pacing and density before wiring save behavior.
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-name" className="pl-1.5 text-sm font-medium text-foreground">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ms-name"
                {...register("name")}
                placeholder="e.g. Short spine massage"
                aria-invalid={errors.name ? true : undefined}
                className="h-12 rounded-2xl border-input bg-background/70 px-4 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
              />
              {errors.name && (
                <p className="pl-1.5 text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <BulletTextarea
                    id="ms-description"
                    label={
                      <Label
                        htmlFor="ms-description"
                        className="pl-1.5 text-sm font-medium text-foreground"
                      >
                        Description
                      </Label>
                    }
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Describe the movement, setup, and intention..."
                    rows={4}
                    className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Controller
                control={control}
                name="startingPosition"
                render={({ field }) => (
                  <BulletTextarea
                    id="ms-starting"
                    label={
                      <Label
                        htmlFor="ms-starting"
                        className="pl-1.5 text-sm font-medium text-foreground"
                      >
                        Starting position
                      </Label>
                    }
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="e.g. Supine, headpiece flat, straps in hands"
                    rows={3}
                    className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                  />
                )}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {renderSelect("orientation", "Orientation", DEMO_ORIENTATION)}
              {renderSelect("directionFaced", "Direction faced", DEMO_DIRECTION)}
            </div>
            {renderSelect("movementType", "Movement type", DEMO_MOVEMENT_TYPES, true)}
            <div className="space-y-2">
              <Label htmlFor="ms-springs" className="pl-1.5 text-sm font-medium text-foreground">
                Springs
              </Label>
              <p className="pl-1.5 text-xs text-muted-foreground">
                Reformer setups vary. For mat or no springs, use{" "}
                <span className="font-medium text-foreground">N/A</span>.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input
                  id="ms-springs"
                  {...register("springs")}
                  placeholder="e.g. Medium (2 red) or N/A"
                  className="box-border h-12 min-h-12 w-full min-w-0 rounded-2xl border-input bg-background/80 px-4 py-0 leading-snug shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35 sm:flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setValue("springs", "N/A", { shouldDirty: true, shouldValidate: true })
                  }
                  className="h-12 w-full shrink-0 rounded-2xl border-input px-4 text-sm font-medium sm:w-auto sm:min-w-22"
                >
                  N/A
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                id="ms-equipment-label"
                className="pl-1.5 text-sm font-medium text-foreground"
              >
                Equipment
              </Label>
              <p className="pl-1.5 text-xs text-muted-foreground">
                Demo checklist — &quot;None&quot; clears other selections.
              </p>
              <fieldset
                aria-labelledby="ms-equipment-label"
                className="m-0 min-w-0 space-y-2 border-0 p-0"
              >
                <div className="space-y-2 pl-1.5">
                  {DEMO_EQUIPMENT.map((o) => {
                    const disabled = isEquipmentOptionDisabled(o.value);
                    return (
                      <label
                        key={o.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 text-sm text-foreground",
                          disabled && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={(wEquipment ?? []).includes(o.value)}
                          disabled={disabled}
                          onChange={() => toggleEquipmentValue(o.value)}
                          className="size-4 rounded border-input accent-primary disabled:cursor-not-allowed"
                        />
                        {o.label}
                      </label>
                    );
                  })}
                  {(wEquipment ?? [])
                    .filter((v) => !DEMO_EQUIPMENT.some((o) => o.value === v))
                    .map((val) => (
                      <label
                        key={val}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked
                          onChange={() => {
                            const next = getValues("equipment").filter((x) => x !== val);
                            setValue("equipment", next, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          className="size-4 rounded border-input accent-primary"
                        />
                        <span title={val}>{val}</span>
                        <span className="text-xs text-muted-foreground">(custom)</span>
                      </label>
                    ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Input
                    aria-label="Custom equipment"
                    value={equipmentCustomInput}
                    onChange={(e) => setEquipmentCustomInput(e.target.value)}
                    placeholder="Custom equipment…"
                    disabled={(wEquipment ?? []).includes(NONE_EQUIPMENT)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomEquipment();
                      }
                    }}
                    className="box-border h-12 min-h-12 w-full min-w-0 rounded-2xl border-input bg-background/80 px-4 py-0 text-sm leading-snug shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35 sm:flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCustomEquipment}
                    disabled={(wEquipment ?? []).includes(NONE_EQUIPMENT)}
                    className="h-12 w-full shrink-0 rounded-2xl border-input px-4 text-sm font-medium sm:w-auto sm:min-w-22 disabled:cursor-not-allowed"
                  >
                    Add
                  </Button>
                </div>
              </fieldset>
            </div>
            {renderSelect("machineSetup", "Machine setup", DEMO_MACHINE_SETUP)}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="pl-1.5 text-sm font-medium text-foreground">Layers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const len = layerFields.length;
                    for (let i = 0; i < len; i++) {
                      update(i, { ...getValues(`layers.${i}`), isFinisher: false });
                    }
                    append({ content: "", isFinisher: false });
                  }}
                  className="h-9 gap-1.5 rounded-full border-input px-4 text-sm font-medium"
                >
                  Add layer
                </Button>
              </div>
              {errors.layers && (
                <p className="pl-1.5 text-sm text-destructive">{errors.layers.message}</p>
              )}
              {layerFields.map((fa, index) => {
                const row = layersWatch[index] ?? { content: "", isFinisher: false };
                const total = layerFields.length;
                const isLast = index === total - 1;
                const stepTitle = getLayerStepTitle(index);
                const showFinisherStyle = isLast && row.isFinisher;
                return (
                  <div key={fa.id} className={showFinisherStyle ? "space-y-3" : "space-y-1.5"}>
                    <Controller
                      control={control}
                      name={`layers.${index}.content`}
                      render={({ field }) => (
                        <BulletTextarea
                          bulletsEnabled
                          showAddBulletButton
                          label={
                            <div className="flex flex-wrap items-center gap-2 pl-1.5">
                              <span className="text-xs font-medium text-muted-foreground">
                                {stepTitle}
                              </span>
                              {isLast && row.isFinisher && (
                                <Badge variant="secondary" className="text-xs font-semibold">
                                  Finisher
                                </Badge>
                              )}
                              {isLast && (
                                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    checked={row.isFinisher}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const layers = getValues("layers");
                                      setValue(
                                        "layers",
                                        layers.map((r, i) =>
                                          i === layers.length - 1
                                            ? { ...r, isFinisher: checked }
                                            : { ...r, isFinisher: false }
                                        ),
                                        { shouldDirty: true, shouldValidate: true }
                                      );
                                    }}
                                    className="size-4 rounded border-input accent-primary"
                                  />
                                  Mark as finisher
                                </label>
                              )}
                            </div>
                          }
                          toolbarEndSlot={
                            layerFields.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                                aria-label={`Remove ${stepTitle}`}
                              >
                                <X className="size-4" />
                              </button>
                            ) : null
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={
                            index === 0
                              ? "e.g. Press out halfway, pause, return"
                              : showFinisherStyle
                                ? "e.g. Add finisher movement"
                                : "Build on the previous layer..."
                          }
                          rows={showFinisherStyle ? 4 : 3}
                          className="min-h-22 resize-y rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                        />
                      )}
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="ms-transition"
                className="pl-1.5 text-sm font-medium text-foreground"
              >
                Transition cues
              </Label>
              <Input
                id="ms-transition"
                {...register("transitionCues")}
                placeholder="e.g. Coming down from lunge"
                className="h-12 rounded-2xl border-input bg-background/70 px-4 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
              />
            </div>
            <div className="space-y-2">
              <Controller
                control={control}
                name="cueing"
                render={({ field }) => (
                  <BulletTextarea
                    id="ms-cueing"
                    label={
                      <Label
                        htmlFor="ms-cueing"
                        className="pl-1.5 text-sm font-medium text-foreground"
                      >
                        Cues / notes
                      </Label>
                    }
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Key coaching points, modifications, breathing cues..."
                    rows={3}
                    className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                  />
                )}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <fieldset className="space-y-2">
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Spinal movement
              </legend>
              <p className="mb-2 pl-1.5 text-xs text-muted-foreground">
                &quot;None&quot; clears other selections (same pattern as equipment).
              </p>
              <div className="space-y-2 pl-1">
                {DEMO_SPINAL.map((o) => {
                  const disabled = isSpinalMovementOptionDisabled(o.value);
                  return (
                    <label
                      key={o.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 text-sm text-foreground",
                        disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={(wSpinalMovement ?? []).includes(o.value)}
                        disabled={disabled}
                        onChange={() => toggleSpinalMovementValue(o.value)}
                        className="size-4 rounded border-input accent-primary disabled:cursor-not-allowed"
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Separator className="bg-border/70" />
            <fieldset className="space-y-2">
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Chain type
              </legend>
              <p className="mb-2 pl-1.5 text-xs text-muted-foreground">
                At most two types, or &quot;Both&quot; alone (same rules as the main form).
              </p>
              <div className="space-y-2 pl-1">
                {DEMO_CHAIN.map((o) => {
                  const disabled = isChainTypeOptionDisabled(o.value);
                  return (
                    <label
                      key={o.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 text-sm text-foreground",
                        disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={(wChainType ?? []).includes(o.value)}
                        disabled={disabled}
                        onChange={() => toggleChainTypeValue(o.value)}
                        className="size-4 rounded border-input accent-primary disabled:cursor-not-allowed"
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
              {errors.chainType && (
                <p className="pl-1.5 text-sm text-destructive">{errors.chainType.message}</p>
              )}
            </fieldset>
            <Separator className="bg-border/70" />
            <fieldset className="space-y-2">
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Joint loading
              </legend>
              <div className="space-y-2 pl-1">
                {DEMO_JOINT.map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={(wJointLoading ?? []).includes(o.value)}
                      onChange={() => toggleJointLoading(o.value)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <Separator className="bg-border/70" />
            <div className="space-y-2">
              <Label className="pl-1.5 text-sm font-medium text-foreground">Tags</Label>
              <div className="flex flex-wrap gap-2 pl-1.5">
                {(wTags ?? []).map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                    {t}
                    <button
                      type="button"
                      className="ml-0.5 rounded-full p-0.5 hover:bg-background/80"
                      onClick={() => removeTag(t)}
                      aria-label={`Remove tag ${t}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="h-12 rounded-2xl border-input bg-background/70 px-4 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35 sm:flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  className="h-12 shrink-0 rounded-2xl border-input px-4 sm:w-auto"
                >
                  Add tag
                </Button>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Controller
                control={control}
                name="progressionNotes"
                render={({ field }) => (
                  <BulletTextarea
                    id="ms-prog-notes"
                    label={
                      <Label
                        htmlFor="ms-prog-notes"
                        className="pl-1.5 text-sm font-medium text-foreground"
                      >
                        Progression notes
                      </Label>
                    }
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="How to make this harder for confident clients..."
                    rows={3}
                    className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Controller
                control={control}
                name="regressionNotes"
                render={({ field }) => (
                  <BulletTextarea
                    id="ms-reg-notes"
                    label={
                      <Label
                        htmlFor="ms-reg-notes"
                        className="pl-1.5 text-sm font-medium text-foreground"
                      >
                        Regression notes
                      </Label>
                    }
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Support options for beginners or fatigue days..."
                    rows={3}
                    className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label className="pl-1.5 text-sm font-medium text-foreground">
                Easier version (progression)
              </Label>
              <p className="pl-1.5 text-xs text-muted-foreground">
                In this demo, progression stays disconnected from the library.
              </p>
              <Controller
                control={control}
                name="progressionOfId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      sideOffset={6}
                      className="rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                    >
                      <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                        None
                      </SelectItem>
                      <SelectSeparator className="mx-1 bg-border/70" />
                      <SelectItem value="demo-parent" disabled className="rounded-xl py-2.5 pl-3">
                        <span className="text-muted-foreground">Pick from library (demo)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onDemoSubmit();
      }}
      className="w-full min-w-0"
    >
      <Card className="border-border bg-card shadow-xl">
        <CardContent className="p-0">
          <div className="border-b border-border bg-muted/15">
            <div
              className="flex min-h-21 w-full flex-nowrap items-stretch overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:min-h-0 [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Form steps"
            >
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = i === stepIndex;
                const done = i < stepIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStepIndex(i)}
                    className={cn(
                      "flex min-w-21 shrink-0 flex-col items-center justify-start gap-1 border-border/70 px-2 pt-3 pb-3 text-center transition-colors sm:min-w-0 sm:flex-1 sm:border-r sm:px-3 sm:pt-4 sm:pb-4 sm:last:border-r-0",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex  size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums",
                        active
                          ? "border-secondary bg-secondary text-secondary-foreground"
                          : done
                            ? "border-primary/35 bg-primary/10 text-primary"
                            : "border-border bg-background/90 text-muted-foreground"
                      )}
                    >
                      {done ? (
                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                      ) : active ? (
                        <Icon className="size-4" aria-hidden />
                      ) : (
                        <span aria-hidden>{i + 1}</span>
                      )}
                    </span>
                    <span className="line-clamp-2 max-w-26 text-[11px] font-semibold leading-tight sm:max-w-none sm:text-xs">
                      {s.title}
                    </span>
                    <span className="line-clamp-2 max-w-26 text-[10px] leading-snug text-muted-foreground sm:max-w-36 sm:text-[11px]">
                      {s.caption}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                  Multistep (demo)
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-card-foreground">
                  {STEPS[stepIndex]?.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{STEPS[stepIndex]?.caption}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground">
                Step {stepIndex + 1} of {STEPS.length}
              </div>
            </div>

            {stepContent}

            <Separator className="bg-border/70" />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  disabled={stepIndex === 0}
                  onClick={goPrev}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Back
                </Button>
                {!lastStep ? (
                  <Button type="button" className="rounded-2xl" onClick={() => void goNext()}>
                    Continue
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="rounded-2xl" disabled={isSubmitting}>
                    Validate draft
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground sm:text-right">
                Steps in the row above jump freely;{" "}
                <span className="font-medium text-foreground">Continue</span> validates this
                section only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
