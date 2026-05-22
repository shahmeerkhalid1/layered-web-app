"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  Controller,
  useWatch,
  type SubmitErrorHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { exerciseApi } from "@/services/exercise-api";
import type { TempUploadedImage } from "@/services/exercise-api";
import type { DropdownOptionRow, Exercise, ExerciseFolder, ExerciseImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ChainTypeOptionLabel } from "@/components/exercises/chain-type-option-label";
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
  GripVertical,
  ImagePlus,
  Layers,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import { useFancybox } from "@/hooks/use-fancybox";

const MAX_IMAGES = 3;
const EXERCISE_FORM_IMAGE_GALLERY = "exercise-form-multistep-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ImageItem =
  | { type: "saved"; data: ExerciseImage }
  | { type: "temp"; data: TempUploadedImage };

function imageKey(item: ImageItem): string {
  return item.type === "saved" ? item.data.id : item.data.publicId;
}

function optionalField(s: string): string | undefined {
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}

function setupDropdownLabel(
  value: string,
  placeholder: string,
  options: DropdownOptionRow[],
  loading: boolean
): string {
  if (loading && options.length === 0) return "Loading options…";
  if (value === "none" || value === "") return placeholder;
  const found = options.find((o) => o.value === value);
  return found?.label ?? value;
}

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
  ["name", "description", "startingPosition", "folderId"],
  ["orientation", "directionFaced", "movementType", "springs", "equipment", "machineSetup"],
  ["layers", "transitionCues", "cueing"],
  ["spinalMovement", "chainType", "jointLoading", "tags"],
  ["progressionNotes", "regressionNotes", "progressionOfId"],
];

const selectTriggerClass =
  "box-border h-12 min-h-12 w-full min-w-0 shrink-0 justify-between rounded-2xl border-input bg-background/80 px-4 py-0 leading-snug shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground";

export interface ExerciseFormMultistepProps {
  exercise?: Exercise;
}

export function ExerciseFormMultistep({ exercise }: ExerciseFormMultistepProps) {
  const router = useRouter();
  const isEdit = !!exercise;
  const [stepIndex, setStepIndex] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: buildExerciseFormDefaults(exercise),
  });

  useEffect(() => {
    reset(buildExerciseFormDefaults(exercise));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when switching exercises by id only; avoid wiping edits on parent re-renders
  }, [exercise?.id, reset]);

  const { fields: layerFields, append, remove, update } = useFieldArray({
    control,
    name: "layers",
  });

  const [
    wName,
    wFolderId,
    wOrientation,
    wDirectionFaced,
    wMovementType,
    wMachineSetup,
    wEquipment,
    wSpinalMovement,
    wChainType,
    wTags,
    wJointLoading,
  ] = useWatch({
    control,
    name: [
      "name",
      "folderId",
      "orientation",
      "directionFaced",
      "movementType",
      "machineSetup",
      "equipment",
      "spinalMovement",
      "chainType",
      "tags",
      "jointLoading",
    ],
  });

  const layersWatch = useWatch({ control, name: "layers" }) ?? [];

  const [equipmentCustomInput, setEquipmentCustomInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [folders, setFolders] = useState<ExerciseFolder[]>([]);
  /** Edit only: cannot pick self or a harder step in the same chain (would cycle). */
  const [blockedParentIds, setBlockedParentIds] = useState<Set<string>>(() =>
    exercise?.id ? new Set([exercise.id]) : new Set()
  );
  const [uploading, setUploading] = useState(false);

  const [images, setImages] = useState<ImageItem[]>(() => {
    const saved: ImageItem[] = (exercise?.images ?? []).map((img) => ({
      type: "saved",
      data: img,
    }));
    return saved;
  });

  const totalImages = images.length;
  const availableSlots = MAX_IMAGES - totalImages;

  const imageGalleryFancyboxKey = useMemo(
    () => images.map(imageKey).join("|"),
    [images]
  );
  const bindExerciseImageGallery = useFancybox(imageGalleryFancyboxKey);

  const orientationDd = useDropdownOptions("orientation");
  const directionDd = useDropdownOptions("direction_faced");
  const movementTypeDd = useDropdownOptions("movement_type");
  const equipmentDd = useDropdownOptions("equipment");
  const machineSetupDd = useDropdownOptions("machine_setup");
  const spinalDd = useDropdownOptions("spinal_movement");
  const chainDd = useDropdownOptions("chain_type");
  const jointDd = useDropdownOptions("joint_loading");

  useEffect(() => {
    exerciseApi
      .getFolders()
      .then((data) => setFolders(data.folders))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!exercise?.id) {
        setImages([]);
        setBlockedParentIds(new Set());
        return;
      }
      setImages(
        (exercise.images ?? []).map((img): ImageItem => ({ type: "saved", data: img }))
      );
    }, 0);
    return () => window.clearTimeout(t);
  }, [exercise?.id, exercise?.images]);

  useEffect(() => {
    if (!exercise?.id) return;
    exerciseApi
      .getProgressionChain(exercise.id)
      .then((chain) => {
        const i = chain.findIndex((c) => c.id === exercise.id);
        const blocked = new Set<string>([exercise.id]);
        if (i >= 0) {
          for (let j = i + 1; j < chain.length; j++) {
            blocked.add(chain[j].id);
          }
        }
        setBlockedParentIds(blocked);
      })
      .catch(() => {
        setBlockedParentIds(new Set([exercise.id]));
      });
  }, [exercise?.id]);

  const folderTriggerLabel = useMemo(() => {
    const folderId = wFolderId ?? "none";
    if (folderId === "none") return "No folder";
    const fromList = folders.find((f) => f.id === folderId);
    if (fromList) return fromList.name;
    if (exercise?.folder?.id === folderId) return exercise.folder.name;
    return "No folder";
  }, [wFolderId, folders, exercise?.folder?.id, exercise?.folder?.name]);

  const orientationLabel = useMemo(
    () =>
      setupDropdownLabel(
        wOrientation ?? "none",
        "Select orientation",
        orientationDd.options,
        orientationDd.loading
      ),
    [wOrientation, orientationDd.options, orientationDd.loading]
  );

  const directionLabel = useMemo(
    () =>
      setupDropdownLabel(
        wDirectionFaced ?? "none",
        "Select direction",
        directionDd.options,
        directionDd.loading
      ),
    [wDirectionFaced, directionDd.options, directionDd.loading]
  );

  const movementTypeLabel = useMemo(
    () =>
      setupDropdownLabel(
        wMovementType ?? "none",
        "Select movement type",
        movementTypeDd.options,
        movementTypeDd.loading
      ),
    [wMovementType, movementTypeDd.options, movementTypeDd.loading]
  );

  const machineSetupLabel = useMemo(
    () =>
      setupDropdownLabel(
        wMachineSetup ?? "none",
        "Select setup",
        machineSetupDd.options,
        machineSetupDd.loading
      ),
    [wMachineSetup, machineSetupDd.options, machineSetupDd.loading]
  );

  const noneEquipmentValue = useMemo(() => {
    const o = equipmentDd.options.find(
      (x) => x.label === "None" || x.value === "None" || x.value === "none"
    );
    return o?.value ?? "None";
  }, [equipmentDd.options]);

  const noneSpinalMovementValue = useMemo(() => {
    const o = spinalDd.options.find(
      (x) => x.label === "None" || x.value === "None" || x.value === "none"
    );
    return o?.value ?? "None";
  }, [spinalDd.options]);

  const bothChainValue = useMemo(() => {
    const o = chainDd.options.find((x) => x.label === "Both" || x.value === "Both");
    return o?.value ?? "Both";
  }, [chainDd.options]);

  const toggleEquipmentValue = (value: string) => {
    const equipment = getValues("equipment");
    setValue(
      "equipment",
      (() => {
        const isNone = value === noneEquipmentValue;
        if (isNone) {
          if (equipment.includes(value)) return [];
          return [value];
        }
        const withoutNone = equipment.filter((v) => v !== noneEquipmentValue);
        if (withoutNone.includes(value)) {
          return withoutNone.filter((v) => v !== value);
        }
        return [...withoutNone, value];
      })(),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const isEquipmentOptionDisabled = (value: string): boolean => {
    if (value === noneEquipmentValue) return false;
    return (wEquipment ?? []).includes(noneEquipmentValue);
  };

  const addCustomEquipment = () => {
    const raw = equipmentCustomInput.trim();
    if (!raw) return;
    const equipment = getValues("equipment");
    setValue(
      "equipment",
      (() => {
        const withoutNone = equipment.filter((v) => v !== noneEquipmentValue);
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
        if (value === bothChainValue) return [bothChainValue];
        if (chainType.includes(bothChainValue)) return chainType;
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
    if (chainType.includes(bothChainValue) && value !== bothChainValue) return true;
    if (value === bothChainValue && chainType.some((v) => v !== bothChainValue)) return true;
    if (chainType.length >= 2) return true;
    return false;
  };

  const toggleSpinalMovementValue = (value: string) => {
    const spinalMovement = getValues("spinalMovement");
    setValue(
      "spinalMovement",
      (() => {
        const isNone = value === noneSpinalMovementValue;
        if (isNone) {
          if (spinalMovement.includes(value)) return [];
          return [value];
        }
        const withoutNone = spinalMovement.filter((v) => v !== noneSpinalMovementValue);
        if (withoutNone.includes(value)) {
          return withoutNone.filter((v) => v !== value);
        }
        return [...withoutNone, value];
      })(),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const isSpinalMovementOptionDisabled = (value: string): boolean => {
    if (value === noneSpinalMovementValue) return false;
    return (wSpinalMovement ?? []).includes(noneSpinalMovementValue);
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

  const onDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      for (const r of rejections) {
        for (const err of r.errors) {
          if (err.code === "file-too-large") {
            toast.error(`${r.file.name} exceeds the 5 MB limit`);
          } else if (err.code === "file-invalid-type") {
            toast.error(`${r.file.name} is not a supported image type`);
          } else if (err.code === "too-many-files") {
            toast.error(`You can add up to ${availableSlots} more image(s)`);
          } else {
            toast.error(err.message);
          }
        }
      }

      if (accepted.length === 0) return;

      const formData = new FormData();
      for (const file of accepted) {
        formData.append("images", file);
      }

      setUploading(true);
      try {
        const res = await exerciseApi.uploadTempImages(formData);
        setImages((prev) => [
          ...prev,
          ...res.images.map((img): ImageItem => ({ type: "temp", data: img })),
        ]);
      } catch {
        toast.error("Failed to upload images");
      } finally {
        setUploading(false);
      }
    },
    [availableSlots]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: Math.max(availableSlots, 0),
    multiple: true,
    disabled: uploading || availableSlots <= 0,
  });

  const removeImage = async (item: ImageItem) => {
    if (item.type === "temp") {
      try {
        await exerciseApi.deleteTempImage(item.data.publicId);
        setImages((prev) => prev.filter((i) => imageKey(i) !== imageKey(item)));
      } catch {
        toast.error("Failed to remove image — try again");
      }
    } else if (isEdit && exercise) {
      try {
        await exerciseApi.deleteImage(exercise.id, item.data.id);
        setImages((prev) => prev.filter((i) => imageKey(i) !== imageKey(item)));
        toast.success("Image removed");
      } catch {
        toast.error("Failed to remove image — try again");
      }
    }
  };

  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIdx.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDropReorder = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from === null || from === dropIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    setImages(reordered);

    if (isEdit && exercise) {
      const savedIds = reordered
        .filter((i): i is ImageItem & { type: "saved" } => i.type === "saved")
        .map((i) => i.data.id);
      if (savedIds.length > 1) {
        try {
          await exerciseApi.reorderImages(exercise.id, savedIds);
        } catch {
          toast.error("Failed to save new image order");
        }
      }
    }
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const lastStep = stepIndex === STEPS.length - 1;

  const goNext = async () => {
    const fields = STEP_FIELD_GROUPS[stepIndex];
    const ok = await trigger(fields);
    if (!ok) {
      toast.error("Fill the highlighted fields before continuing.");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const onSubmitInvalid: SubmitErrorHandler<ExerciseFormValues> = (errors) => {
    for (let i = 0; i < STEP_FIELD_GROUPS.length; i++) {
      const hasError = STEP_FIELD_GROUPS[i].some((field) => errors[field] != null);
      if (hasError) {
        setStepIndex(i);
        toast.error("Fix the highlighted fields before saving.");
        return;
      }
    }
    toast.error("Fix the highlighted fields before saving.");
  };

  const submitForm = handleSubmit(
    async (formValues) => {
    const tempPublicIds = images
      .filter((i): i is ImageItem & { type: "temp" } => i.type === "temp")
      .map((i) => i.data.publicId);

    const nextProgressionOfId =
      formValues.progressionOfId === "none" ? null : formValues.progressionOfId;

    if (isEdit && nextProgressionOfId && blockedParentIds.has(nextProgressionOfId)) {
      toast.error("That easier exercise would break the progression chain");
      return;
    }

    const body = {
      name: formValues.name,
      description: optionalField(formValues.description) ?? null,
      startingPosition: optionalField(formValues.startingPosition) ?? null,
      orientation: formValues.orientation === "none" ? null : formValues.orientation,
      directionFaced:
        formValues.directionFaced === "none" ? null : formValues.directionFaced,
      movementType:
        formValues.movementType === "none" ? null : formValues.movementType,
      springs: optionalField(formValues.springs) ?? null,
      equipment: formValues.equipment,
      machineSetup:
        formValues.machineSetup === "none" ? null : formValues.machineSetup,
      transitionCues: optionalField(formValues.transitionCues) ?? null,
      cueing: optionalField(formValues.cueing) ?? null,
      spinalMovement: formValues.spinalMovement,
      chainType: formValues.chainType,
      jointLoading: formValues.jointLoading,
      progressionNotes: optionalField(formValues.progressionNotes) ?? null,
      regressionNotes: optionalField(formValues.regressionNotes) ?? null,
      tags: formValues.tags,
      folderId: formValues.folderId === "none" ? null : formValues.folderId,
      progressionOfId: nextProgressionOfId,
      layers: (() => {
        const trimmed = formValues.layers
          .map((r) => ({ ...r, content: r.content.trim() }))
          .filter((r) => r.content.length > 0);
        const last = trimmed.length - 1;
        return trimmed.map((r, i) => ({
          content: r.content,
          order: i,
          isFinisher: i === last ? r.isFinisher : false,
        }));
      })(),
      ...(tempPublicIds.length > 0 ? { publicIds: tempPublicIds } : {}),
    };

    try {
      if (isEdit && exercise) {
        const updated = await exerciseApi.updateExercise(exercise.id, body);
        toast.success("Exercise updated");
        router.push(`/exercises/${updated.id}`);
      } else {
        const created = await exerciseApi.createExercise(body);
        toast.success("Exercise created");
        router.push(`/exercises/${created.id}`);
      }
    } catch {
      toast.error("Failed to save exercise");
    }
  },
    onSubmitInvalid
  );

  /** Block native submit (e.g. Enter in inputs) until the final step — avoids save firing while using Continue. */
  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!lastStep) {
      e.preventDefault();
      return;
    }
    void submitForm(e);
  };

  const renderCatalogSelect = (
    name: ExerciseStringSelectField,
    label: string,
    options: DropdownOptionRow[],
    loading: boolean,
    displayLabel: string,
    nonePlaceholder: string,
    required?: boolean
  ) => (
    <div className="space-y-2">
      <Label className="pl-1.5 text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(v) => field.onChange(v ?? "none")}
            disabled={loading && options.length === 0}
          >
            <SelectTrigger
              aria-invalid={errors[name] ? true : undefined}
              className={cn(selectTriggerClass, errors[name] && "border-destructive")}
            >
              <SelectValue placeholder={nonePlaceholder}>
                <span
                  className={
                    field.value === "none" || (loading && options.length === 0)
                      ? "text-muted-foreground"
                      : undefined
                  }
                >
                  {displayLabel}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={6}
              className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
            >
              <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                <span className="text-muted-foreground">{nonePlaceholder}</span>
              </SelectItem>
              {options.length > 0 && <SelectSeparator className="mx-1 bg-border/70" />}
              {options.map((o) => (
                <SelectItem key={o.id} value={o.value} className="rounded-xl py-2.5 pl-3">
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

  const stepContent = (() => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-6">
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
                    bulletsEnabled={false}
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
                    bulletsEnabled={false}
                    className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-folder" className="pl-1.5 text-sm font-medium text-foreground">
                Folder
              </Label>
              <Controller
                control={control}
                name="folderId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "none")}
                  >
                    <SelectTrigger
                      id="ms-folder"
                      className="h-12 w-full min-w-0 rounded-2xl border-input bg-background/70 px-4 shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
                    >
                      <SelectValue placeholder="No folder">{folderTriggerLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      sideOffset={6}
                      className="max-h-72 rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                    >
                      <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                        No folder
                      </SelectItem>
                      {folders.length > 0 && (
                        <>
                          <SelectSeparator className="mx-1 bg-border/70" />
                          {folders.map((f) => (
                            <SelectItem key={f.id} value={f.id} className="rounded-xl py-2.5 pl-3">
                              {f.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="pl-1.5 text-sm font-medium text-foreground">
                Images
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({totalImages}/{MAX_IMAGES})
                </span>
              </Label>

              {totalImages > 0 && (
                <div ref={bindExerciseImageGallery} className="grid grid-cols-3 gap-3">
                  {images.map((item, index) => (
                    <div
                      key={imageKey(item)}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDropReorder(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-2xl border bg-muted transition-all",
                        dragOverIdx === index
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border"
                      )}
                    >
                      <a
                        href={item.data.url}
                        data-fancybox={EXERCISE_FORM_IMAGE_GALLERY}
                        data-caption={
                          (wName ?? "").trim().length > 0
                            ? `${(wName ?? "").trim()} — Image ${index + 1}${item.type === "temp" ? " (unsaved)" : ""}`
                            : `Image ${index + 1}${item.type === "temp" ? " (unsaved)" : ""}`
                        }
                        title="View full size"
                        className="relative block size-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- sortable preview + fancybox */}
                        <img
                          src={item.data.url}
                          alt=""
                          className="size-full object-cover"
                          draggable={false}
                        />
                      </a>
                      <div className="pointer-events-none absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="pointer-events-none absolute left-1.5 top-1.5 flex size-6 cursor-grab items-center justify-center rounded-full bg-black text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                        <GripVertical className="size-3.5" aria-hidden />
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeImage(item)}
                        className="pointer-events-auto absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X className="size-3.5 text-white" />
                      </button>
                      {item.type === "temp" && (
                        <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          New
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {availableSlots > 0 && (
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-input bg-background/70 hover:border-muted-foreground/40",
                    uploading && "pointer-events-none opacity-60"
                  )}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="size-6 text-muted-foreground" />
                  )}
                  <p className="text-center text-sm text-muted-foreground">
                    {uploading
                      ? "Uploading..."
                      : isDragActive
                        ? "Drop images here"
                        : `Drag & drop or click to add (max ${availableSlots} more)`}
                  </p>
                  <p className="text-center text-xs text-muted-foreground/70">
                    JPG, PNG, or WebP up to 5 MB each
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {renderCatalogSelect(
                "orientation",
                "Orientation",
                orientationDd.options,
                orientationDd.loading,
                orientationLabel,
                "Select orientation"
              )}
              {renderCatalogSelect(
                "directionFaced",
                "Direction faced",
                directionDd.options,
                directionDd.loading,
                directionLabel,
                "Select direction"
              )}
            </div>
            {renderCatalogSelect(
              "movementType",
              "Movement type",
              movementTypeDd.options,
              movementTypeDd.loading,
              movementTypeLabel,
              "Select movement type",
              true
            )}
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
                Select all that apply, or add custom props. &quot;None&quot; clears other selections.
              </p>
              <fieldset
                aria-labelledby="ms-equipment-label"
                disabled={equipmentDd.loading}
                className="m-0 min-w-0 space-y-2 border-0 p-0"
              >
                <div className="space-y-2 pl-1.5 w-fit">
                  {equipmentDd.options.map((o) => {
                    const disabled = isEquipmentOptionDisabled(o.value);
                    return (
                      <label
                        key={o.id}
                        className={cn(
                          "flex items-center gap-2 text-sm text-foreground",
                          disabled ? "cursor-default opacity-50" : "cursor-pointer"
                        )}
                      >
                        <Checkbox
                          checked={(wEquipment ?? []).includes(o.value)}
                          disabled={disabled}
                          onChange={() => toggleEquipmentValue(o.value)}
                        />
                        {o.label}
                      </label>
                    );
                  })}
                  {(wEquipment ?? [])
                    .filter((v) => !equipmentDd.options.some((o) => o.value === v))
                    .map((val) => (
                      <label
                        key={val}
                        className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                      >
                        <Checkbox
                          checked
                          onChange={() => {
                            const next = getValues("equipment").filter((x) => x !== val);
                            setValue("equipment", next, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
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
                    disabled={(wEquipment ?? []).includes(noneEquipmentValue)}
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
                    disabled={(wEquipment ?? []).includes(noneEquipmentValue)}
                    className="h-12 w-full shrink-0 rounded-2xl border-input px-4 text-sm font-medium sm:w-auto sm:min-w-22 disabled:cursor-not-allowed"
                  >
                    Add
                  </Button>
                </div>
              </fieldset>
            </div>
            {renderCatalogSelect(
              "machineSetup",
              "Machine setup",
              machineSetupDd.options,
              machineSetupDd.loading,
              machineSetupLabel,
              "Select setup"
            )}
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
                  <Plus className="size-4 shrink-0" aria-hidden />
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
                          bulletsEnabled={false}
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
                                  <Checkbox
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
                                  />
                                  Mark as finisher
                                </label>
                              )}
                            </div>
                          }
                          toolbarEndSlot={
                            index > 0 && layerFields.length > 1 ? (
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
                    bulletsEnabled={false}
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
            <fieldset className="space-y-2" disabled={spinalDd.loading}>
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Spinal movement
              </legend>
              <p className="mb-2 pl-1.5 text-xs text-muted-foreground">
                Select all that apply. &quot;None&quot; clears other selections (same as equipment).
              </p>
              <div className="space-y-2 pl-1 w-fit">
                {spinalDd.options.map((o) => {
                  const disabled = isSpinalMovementOptionDisabled(o.value);
                  return (
                    <label
                      key={o.id}
                      className={cn(
                        "flex items-center gap-2 text-sm text-foreground",
                        disabled ? "cursor-default opacity-50" : "cursor-pointer"
                      )}
                    >
                      <Checkbox
                        checked={(wSpinalMovement ?? []).includes(o.value)}
                        disabled={disabled}
                        onChange={() => toggleSpinalMovementValue(o.value)}
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Separator className="bg-border/70" />
            <fieldset className="space-y-2" disabled={chainDd.loading}>
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Chain type
              </legend>
              <p className="mb-2 pl-1.5 text-xs text-muted-foreground">
                Up to two options, or &quot;Both&quot; alone. Hover a label for a short description.
              </p>
              <div className="space-y-2 pl-1 w-fit">
                {chainDd.options.map((o) => {
                  const checked = (wChainType ?? []).includes(o.value);
                  const disabled = isChainTypeOptionDisabled(o.value);
                  return (
                    <label
                      key={o.id}
                      className={cn(
                        "flex items-center gap-2 text-sm text-foreground",
                        disabled ? "cursor-default opacity-50" : "cursor-pointer"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleChainTypeValue(o.value)}
                      />
                      <ChainTypeOptionLabel value={o.value} label={o.label} />
                    </label>
                  );
                })}
              </div>
              {errors.chainType && (
                <p className="pl-1.5 text-sm text-destructive">{errors.chainType.message}</p>
              )}
            </fieldset>
            <Separator className="bg-border/70" />
            <fieldset className="space-y-2" disabled={jointDd.loading}>
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Joint loading
              </legend>
              <p className="mb-2 pl-1.5 text-xs text-muted-foreground">
                Alternating loaded vs unloaded positions reduces cumulative stress and supports client
                comfort, confidence, and joint resilience.
              </p>
              <div className="space-y-2 pl-1 w-fit">
                {jointDd.options.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <Checkbox
                      checked={(wJointLoading ?? []).includes(o.value)}
                      onChange={() => toggleJointLoading(o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <Separator className="bg-border/70" />
            <div className="space-y-2">
              <Label className="pl-1.5 text-sm font-medium text-foreground">Tags</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add apparatus, level, or focus..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="h-12 min-w-0 flex-1 rounded-2xl border-input bg-background/70 px-4 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  className="h-12 shrink-0 gap-2 rounded-2xl border-input bg-background/70 px-5 text-sm font-medium text-foreground shadow-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/35"
                >
                  <Plus className="size-5 shrink-0" aria-hidden />
                  Add
                </Button>
              </div>
              {(wTags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(wTags ?? []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="gap-1 border-border bg-accent text-accent-foreground"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
                    placeholder="How to make this exercise harder (load, range, tempo, props…)"
                    rows={3}
                    bulletsEnabled={false}
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
                    placeholder="How to make this exercise easier (modifications, support, range…)"
                    rows={3}
                    bulletsEnabled={false}
                    className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                  />
                )}
              />
            </div>
            {/*
            Easier-version (progression) Select — same intent as single-page ExerciseForm (commented).
            Restore this block + progressionPickList/getExercises + useWatch(progressionOfId) + related useMemos when re-enabling the picker.

            <div className="space-y-2">
              <Label className="pl-1.5 text-sm font-medium text-foreground">
                Easier version (progression)
              </Label>
              <p className="pl-1.5 text-xs text-muted-foreground">
                Pick the movement clients do before this one. The detail page shows a Level 1 → 2 →
                3 chain from root to harder steps.
              </p>
              <Controller
                control={control}
                name="progressionOfId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="None — root level">
                        {progressionTriggerLabel}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      sideOffset={6}
                      className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                    >
                      <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                        None — this is the easiest step (root)
                      </SelectItem>
                      {orphanProgressionParent && (
                        <>
                          <SelectSeparator className="mx-1 bg-border/70" />
                          <SelectItem
                            value={orphanProgressionParent.id}
                            className="rounded-xl py-2.5 pl-3 text-muted-foreground italic"
                          >
                            {orphanProgressionParent.name} (restore or clear)
                          </SelectItem>
                        </>
                      )}
                      {progressionSelectable.length > 0 && (
                        <>
                          <SelectSeparator className="mx-1 bg-border/70" />
                          {progressionSelectable.map((ex) => (
                            <SelectItem key={ex.id} value={ex.id} className="rounded-xl py-2.5 pl-3">
                              {ex.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            */}
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <form onSubmit={onFormSubmit} className="w-full min-w-0">
      <Card className="gap-0 border-border bg-card py-0 shadow-xl">
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
                  {isEdit ? "Edit exercise" : "New exercise"}
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
              <div className="flex flex-wrap gap-2">
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
                  <Button
                    type="button"
                    className="rounded-2xl"
                    disabled={isSubmitting || uploading}
                    onClick={() => void submitForm()}
                  >
                    {isSubmitting ? "Saving…" : isEdit ? "Update exercise" : "Create exercise"}
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl text-muted-foreground"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
              {/* <p className="text-xs text-muted-foreground sm:text-right">
                Steps in the row above jump freely;{" "}
                <span className="font-medium text-foreground">Continue</span> validates this section
                only.
              </p> */}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
