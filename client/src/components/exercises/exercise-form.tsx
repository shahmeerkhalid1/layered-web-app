"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";
import { exerciseApi } from "@/services/exercise-api";
import type { TempUploadedImage } from "@/services/exercise-api";
import type {
  DropdownOptionRow,
  Exercise,
  ExerciseFolder,
  ExerciseImage,
} from "@/lib/types";
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
import { X, ArrowLeft, Plus, ImagePlus, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import { useFancybox } from "@/hooks/use-fancybox";
import { Separator } from "@/components/ui/separator";
import { getLayerStepTitle } from "@/lib/exercise-layer-labels";
import { chainTypeTooltipForValue } from "@/lib/chain-type-tooltips";
import {
  buildExerciseFormDefaults,
  exerciseFormSchema,
  type ExerciseFormValues,
} from "@/lib/validation/exercise-form-schema";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 3;
const EXERCISE_FORM_IMAGE_GALLERY = "exercise-form-images";
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

interface ExerciseFormProps {
  exercise?: Exercise;
  /** Create flow inside class plan: omit redirect; optional save-to-library toggle. */
  embedInClassPlan?: boolean;
  onEmbedCreateSuccess?: (exercise: Exercise) => void | Promise<void>;
  /** Edit flow inside class plan: omit redirect after update. */
  onEmbedEditSuccess?: (exercise: Exercise) => void | Promise<void>;
  onEmbedCancel?: () => void;
}

export function ExerciseForm({
  exercise,
  embedInClassPlan = false,
  onEmbedCreateSuccess,
  onEmbedEditSuccess,
  onEmbedCancel,
}: ExerciseFormProps) {
  const router = useRouter();
  const isEdit = !!exercise;
  /** Plan-only create, or plan-only edit while exercise is still not in the library. */
  const showEmbedSaveToLibrary =
    embedInClassPlan && (!exercise || exercise.savedToLibrary === false);
  const [saveToLibrary, setSaveToLibrary] = useState(() => {
    if (embedInClassPlan && (!exercise || exercise.savedToLibrary === false)) return false;
    return true;
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
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
    wOrientation,
    wDirectionFaced,
    wMovementType,
    wMachineSetup,
    wFolderId,
    wEquipment,
    wSpinalMovement,
    wChainType,
    wJointLoading,
  ] = useWatch({
    control,
    name: [
      "name",
      "orientation",
      "directionFaced",
      "movementType",
      "machineSetup",
      "folderId",
      "equipment",
      "spinalMovement",
      "chainType",
      "jointLoading",
    ],
  });

  const wTags = useWatch({ control, name: "tags" }) ?? [];

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

  // ─── Dropzone ────────────────────────────────────────────────────────────

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
          ...res.images.map(
            (img): ImageItem => ({ type: "temp", data: img })
          ),
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

  // ─── Remove images ──────────────────────────────────────────────────────

  const removeImage = async (item: ImageItem) => {
    if (item.type === "temp") {
      try {
        await exerciseApi.deleteTempImage(item.data.publicId);
        setImages((prev) => prev.filter((i) => imageKey(i) !== imageKey(item)));
      } catch {
        toast.error("Failed to remove image — try again");
      }
    } else if (isEdit) {
      try {
        await exerciseApi.deleteImage(exercise.id, item.data.id);
        setImages((prev) => prev.filter((i) => imageKey(i) !== imageKey(item)));
        toast.success("Image removed");
      } catch {
        toast.error("Failed to remove image — try again");
      }
    }
  };

  // ─── Drag-to-sort ───────────────────────────────────────────────────────

  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIdx.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from === null || from === dropIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    setImages(reordered);

    if (isEdit) {
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

  // ─── Submit ──────────────────────────────────────────────────────────────

  const onSubmit = handleSubmit(async (formValues) => {
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
      ...(showEmbedSaveToLibrary ? { savedToLibrary: saveToLibrary } : {}),
    };

    try {
      if (isEdit) {
        const updated = await exerciseApi.updateExercise(exercise.id, body);
        toast.success("Exercise updated");
        if (embedInClassPlan && onEmbedEditSuccess) {
          await onEmbedEditSuccess(updated);
        } else {
          router.push(`/exercises/${exercise.id}`);
        }
      } else if (embedInClassPlan && onEmbedCreateSuccess) {
        const created = await exerciseApi.createExercise(body);
        toast.success("Exercise created");
        await onEmbedCreateSuccess(created);
      } else {
        const created = await exerciseApi.createExercise(body);
        toast.success("Exercise created");
        router.push(`/exercises/${created.id}`);
      }
    } catch {
      toast.error("Failed to save exercise");
    }
  });

  return (
    <form onSubmit={onSubmit} className="w-full min-w-0">
      <Card className="border-border bg-card shadow-xl">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Movement Notes
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-card-foreground">
              {isEdit ? "Refine Exercise" : "Create Exercise"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Keep cues precise, readable, and easy to reuse during class planning.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="pl-1.5 text-sm font-medium text-foreground">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Hundred"
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
                  id="description"
                  label={
                    <Label
                      htmlFor="description"
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
                  bulletsEnabled={false}
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
                  id="startingPosition"
                  label={
                    <Label
                      htmlFor="startingPosition"
                      className="pl-1.5 text-sm font-medium text-foreground"
                    >
                      Starting Position
                    </Label>
                  }
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="e.g., Supine, feet on footbar"
                  rows={3}
                  className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                  bulletsEnabled={false}
                />
              )}
            />
          </div>

          <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="exercise-orientation"
                    className="pl-1.5 text-sm font-medium text-foreground"
                  >
                    Orientation
                  </Label>
                  <Controller
                    control={control}
                    name="orientation"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? "none")}
                        disabled={
                          orientationDd.loading && orientationDd.options.length === 0
                        }
                      >
                        <SelectTrigger
                          id="exercise-orientation"
                          className="box-border h-12 min-h-12 w-full min-w-0 shrink-0 justify-between rounded-2xl border-input bg-background/80 px-4 py-0 leading-snug shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
                        >
                          <SelectValue placeholder="Select orientation">
                            <span
                              className={
                                field.value === "none" ||
                                (orientationDd.loading &&
                                  orientationDd.options.length === 0)
                                  ? "text-muted-foreground"
                                  : undefined
                              }
                            >
                              {orientationLabel}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          sideOffset={6}
                          className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                        >
                          <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                            <span className="text-muted-foreground">Select orientation</span>
                          </SelectItem>
                          {orientationDd.options.length > 0 && (
                            <SelectSeparator className="mx-1 bg-border/70" />
                          )}
                          {orientationDd.options.map((o) => (
                            <SelectItem
                              key={o.id}
                              value={o.value}
                              className="rounded-xl py-2.5 pl-3"
                            >
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="exercise-direction"
                    className="pl-1.5 text-sm font-medium text-foreground"
                  >
                    Direction Faced
                  </Label>
                  <Controller
                    control={control}
                    name="directionFaced"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? "none")}
                        disabled={directionDd.loading && directionDd.options.length === 0}
                      >
                        <SelectTrigger
                          id="exercise-direction"
                          className="box-border h-12 min-h-12 w-full min-w-0 shrink-0 justify-between rounded-2xl border-input bg-background/80 px-4 py-0 leading-snug shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
                        >
                          <SelectValue placeholder="Select direction">
                            <span
                              className={
                                field.value === "none" ||
                                (directionDd.loading && directionDd.options.length === 0)
                                  ? "text-muted-foreground"
                                  : undefined
                              }
                            >
                              {directionLabel}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          sideOffset={6}
                          className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                        >
                          <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                            <span className="text-muted-foreground">Select direction</span>
                          </SelectItem>
                          {directionDd.options.length > 0 && (
                            <SelectSeparator className="mx-1 bg-border/70" />
                          )}
                          {directionDd.options.map((o) => (
                            <SelectItem
                              key={o.id}
                              value={o.value}
                              className="rounded-xl py-2.5 pl-3"
                            >
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="exercise-movement-type"
                  className="pl-1.5 text-sm font-medium text-foreground"
                >
                  Movement Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="movementType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v ?? "none")}
                      disabled={
                        movementTypeDd.loading && movementTypeDd.options.length === 0
                      }
                    >
                      <SelectTrigger
                        id="exercise-movement-type"
                        aria-invalid={errors.movementType ? true : undefined}
                        className={cn(
                          "box-border h-12 min-h-12 w-full min-w-0 shrink-0 justify-between rounded-2xl border-input bg-background/80 px-4 py-0 leading-snug shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground",
                          errors.movementType && "border-destructive",
                        )}
                      >
                        <SelectValue placeholder="Select movement type">
                          <span
                            className={
                              field.value === "none" ||
                              (movementTypeDd.loading &&
                                movementTypeDd.options.length === 0)
                                ? "text-muted-foreground"
                                : undefined
                            }
                          >
                            {movementTypeLabel}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        sideOffset={6}
                        className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                      >
                        <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                          <span className="text-muted-foreground">Select movement type</span>
                        </SelectItem>
                        {movementTypeDd.options.length > 0 && (
                          <SelectSeparator className="mx-1 bg-border/70" />
                        )}
                        {movementTypeDd.options.map((o) => (
                          <SelectItem
                            key={o.id}
                            value={o.value}
                            className="rounded-xl py-2.5 pl-3"
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.movementType && (
                  <p className="pl-1.5 text-sm text-destructive">
                    {errors.movementType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="springs" className="pl-1.5 text-sm font-medium text-foreground">
                  Springs
                </Label>
                <p className="pl-1.5 text-xs text-muted-foreground">
                  Reformer setups vary by studio. For mat work or no springs, type{" "}
                  <span className="font-medium text-foreground">N/A</span> or use the button.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Input
                    id="springs"
                    {...register("springs")}
                    placeholder="e.g., Medium (2 red) or N/A for mat"
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
                  id="exercise-equipment-label"
                  className="pl-1.5 text-sm font-medium text-foreground"
                >
                  Equipment
                </Label>
                <p className="pl-1.5 text-xs text-muted-foreground">
                  Select all that apply, or add custom props. &quot;None&quot; clears other
                  selections.
                </p>
                <fieldset
                  aria-labelledby="exercise-equipment-label"
                  disabled={equipmentDd.loading}
                  className="m-0 min-w-0 space-y-2 border-0 p-0"
                >
                  <div className="space-y-2 pl-1.5">
                    {equipmentDd.options.map((o) => {
                      const disabled = isEquipmentOptionDisabled(o.value);
                      return (
                        <label
                          key={o.id}
                          className={`flex cursor-pointer items-center gap-2 text-sm text-foreground ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            name={`equipment-${o.value}`}
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
                      .filter((v) => !equipmentDd.options.some((o) => o.value === v))
                      .map((val) => (
                        <label
                          key={val}
                          className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                        >
                          <input
                            type="checkbox"
                            name={`equipment-custom-${val}`}
                            checked
                            onChange={() => {
                              const p = getValues("equipment").filter((x) => x !== val);
                              setValue("equipment", p, {
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
                      id="exercise-equipment-custom"
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

              <div className="space-y-2">
                <Label
                  htmlFor="exercise-machine-setup"
                  className="pl-1.5 text-sm font-medium text-foreground"
                >
                  Machine Setup
                </Label>
                <Controller
                  control={control}
                  name="machineSetup"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v ?? "none")}
                      disabled={
                        machineSetupDd.loading && machineSetupDd.options.length === 0
                      }
                    >
                      <SelectTrigger
                        id="exercise-machine-setup"
                        className="box-border h-12 min-h-12 w-full min-w-0 shrink-0 justify-between rounded-2xl border-input bg-background/80 px-4 py-0 leading-snug shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
                      >
                        <SelectValue placeholder="Select setup">
                          <span
                            className={
                              field.value === "none" ||
                              (machineSetupDd.loading &&
                                machineSetupDd.options.length === 0)
                                ? "text-muted-foreground"
                                : undefined
                            }
                          >
                            {machineSetupLabel}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        sideOffset={6}
                        className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                      >
                        <SelectItem value="none" className="rounded-xl py-2.5 pl-3">
                          <span className="text-muted-foreground">Select setup</span>
                        </SelectItem>
                        {machineSetupDd.options.length > 0 && (
                          <SelectSeparator className="mx-1 bg-border/70" />
                        )}
                        {machineSetupDd.options.map((o) => (
                          <SelectItem
                            key={o.id}
                            value={o.value}
                            className="rounded-xl py-2.5 pl-3"
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
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
                Add Layer
              </Button>
            </div>
            {layerFields.map((fa, index) => {
              const row = layersWatch[index] ?? { content: "", isFinisher: false };
              const total = layerFields.length;
              const isLast = index === total - 1;
              const stepTitle = getLayerStepTitle(index);
              const showFinisherStyle = isLast && row.isFinisher;
              return (
                <div
                  key={fa.id}
                  className={showFinisherStyle ? "space-y-3" : "space-y-1.5"}
                >
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
                            ? "e.g., Press out halfway, pause, return"
                            : showFinisherStyle
                              ? "e.g., Add finisher movement"
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
            <Label htmlFor="transitionCues" className="pl-1.5 text-sm font-medium text-foreground">
              Transition Cues
            </Label>
            <Input
              id="transitionCues"
              {...register("transitionCues")}
              placeholder="e.g., Coming down from lunge"
              className="h-12 rounded-2xl border-input bg-background/70 px-4 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
            />
          </div>

          <div className="space-y-2">
            <Controller
              control={control}
              name="cueing"
              render={({ field }) => (
                <BulletTextarea
                bulletsEnabled={false}
                  id="cueing"
                  label={
                    <Label
                      htmlFor="cueing"
                      className="pl-1.5 text-sm font-medium text-foreground"
                    >
                      Cues / Notes
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

          <Separator className="bg-border/70" />

          <div className="space-y-6">
            <h3 className="text-base font-semibold text-foreground">Movement Analysis</h3>

            <fieldset className="space-y-2" disabled={spinalDd.loading}>
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Spinal Movement
              </legend>
              <p className="mb-2 pl-1.5 text-xs text-muted-foreground">
                Select all that apply. &quot;None&quot; clears other selections (same as Equipment).
              </p>
              <div className="space-y-2 pl-1">
                {spinalDd.options.map((o) => {
                  const disabled = isSpinalMovementOptionDisabled(o.value);
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center gap-2 text-sm text-foreground ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name={`spinalMovement-${o.value}`}
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

            <fieldset className="space-y-2" disabled={chainDd.loading}>
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Chain Type
              </legend>
              <p className="mb-2 pl-1.5 text-xs text-muted-foreground">
                Up to two options, or &quot;Both&quot; alone. Hover a label for a short description.
              </p>
              <div className="space-y-2 pl-1">
                {chainDd.options.map((o) => {
                  const checked = (wChainType ?? []).includes(o.value);
                  const disabled = isChainTypeOptionDisabled(o.value);
                  const tip = chainTypeTooltipForValue(o.value);
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center gap-2 text-sm text-foreground ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name={`chainType-${o.value}`}
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleChainTypeValue(o.value)}
                        className="size-4 rounded border-input accent-primary disabled:cursor-not-allowed"
                      />
                      <span title={tip}>{o.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {errors.chainType && (
              <p className="pl-1.5 text-sm text-destructive">{errors.chainType.message}</p>
            )}

            <fieldset className="space-y-2" disabled={jointDd.loading}>
              <legend className="mb-2 pl-1.5 text-sm font-medium text-foreground">
                Joint Loading
              </legend>
              <p className="mb-2 pl-1.5 text-xs text-muted-foreground">
                Alternating loaded vs unloaded positions reduces cumulative stress and
                supports client comfort, confidence, and joint resilience.
              </p>
              <div className="space-y-2 pl-1">
                {jointDd.options.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      name={`jointLoading-${o.value}`}
                      checked={(wJointLoading ?? []).includes(o.value)}
                      onChange={() => toggleJointLoading(o.value)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder" className="pl-1.5 text-sm font-medium text-foreground">
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
                    id="folder"
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

          {/* <div className="space-y-2">
            <Label htmlFor="progression" className="pl-1.5 text-sm font-medium text-foreground">
              Easier version (progression)
            </Label>
            <Select
              value={progressionOfId}
              onValueChange={(value) => setProgressionOfId(value ?? "none")}
            >
              <SelectTrigger
                id="progression"
                className="h-12 w-full min-w-0 rounded-2xl border-input bg-background/70 px-4 shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground"
              >
                <SelectValue placeholder="None — root level">
                  {progressionTriggerLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                align="start"
                sideOffset={6}
                className="max-h-72 rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
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
                      {orphanProgressionParent.name ?? "Missing exercise"} (restore
                      or clear)
                    </SelectItem>
                  </>
                )}
                {progressionParentOptions.length > 0 && (
                  <>
                    <SelectSeparator className="mx-1 bg-border/70" />
                    {progressionParentOptions.map((ex) => (
                      <SelectItem
                        key={ex.id}
                        value={ex.id}
                        className="rounded-xl py-2.5 pl-3"
                      >
                        {ex.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="pl-1.5 text-xs leading-relaxed text-muted-foreground">
              Pick the movement clients do before this one. The detail page shows a
              Level 1 → 2 → 3 chain from root to harder steps.
            </p>
          </div> */}

          <div className="space-y-2">
            <Controller
              control={control}
              name="progressionNotes"
              render={({ field }) => (
                <BulletTextarea
                bulletsEnabled={false}
                  id="progressionNotes"
                  label={
                    <Label
                      htmlFor="progressionNotes"
                      className="pl-1.5 text-sm font-medium text-foreground"
                    >
                      Progression notes
                    </Label>
                  }
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="How to make this exercise harder (load, range, tempo, props…)"
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
                bulletsEnabled={false}
                  id="regressionNotes"
                  label={
                    <Label
                      htmlFor="regressionNotes"
                      className="pl-1.5 text-sm font-medium text-foreground"
                    >
                      Regression notes
                    </Label>
                  }
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="How to make this exercise easier (modifications, support, range…)"
                  rows={3}
                  className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="pl-1.5 text-sm font-medium text-foreground">
              Tags
            </Label>
            <div className="flex items-center gap-2">
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
            {wTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {wTags.map((tag) => (
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

          {showEmbedSaveToLibrary && (
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <input
                  id="exercise-save-to-library-embed"
                  type="checkbox"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
                />
                <div className="min-w-0 space-y-1">
                  <Label
                    htmlFor="exercise-save-to-library-embed"
                    className="cursor-pointer text-sm font-medium text-foreground"
                  >
                    Save to Exercise Library
                  </Label>
                  {!isEdit ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      When off, this exercise stays available in class plans but won&apos;t appear on
                      your Exercise Library page. You can promote it later from the exercise editor.
                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Check to list this exercise on your Exercise Library page so you can pick it
                      from &quot;Pick from library&quot; in class plans. Unchecked keeps it only on
                      plans until you save it to the library later.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Image Dropzone ──────────────────────────────────────── */}
          <div className="space-y-2">
            <Label className="pl-1.5 text-sm font-medium text-foreground">
              Images
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({totalImages}/{MAX_IMAGES})
              </span>
            </Label>

            {totalImages > 0 && (
              <div
                ref={bindExerciseImageGallery}
                className="grid grid-cols-3 gap-3"
              >
                {images.map((item, index) => (
                  <div
                    key={imageKey(item)}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group relative aspect-square overflow-hidden rounded-2xl border bg-muted transition-all ${
                      dragOverIdx === index
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border"
                    }`}
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
                      <img
                        src={item.data.url}
                        alt=""
                        className="size-full object-cover"
                        draggable={false}
                      />
                    </a>
                    <div className="pointer-events-none absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="pointer-events-auto absolute left-1.5 top-1.5 flex size-6 cursor-grab items-center justify-center rounded-full bg-black text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                      <GripVertical className="size-3.5" aria-hidden />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(item)}
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
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-input bg-background/70 hover:border-muted-foreground/40"
                } ${uploading ? "pointer-events-none opacity-60" : ""}`}
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
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-row flex-wrap items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (onEmbedCancel) onEmbedCancel();
            else router.back();
          }}
          className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="mr-2 size-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          // disabled={
          //   isSubmitting ||
          //   uploading ||
          //   !(wName ?? "").trim() ||
          //   (wMovementType ?? "none") === "none"
          // }
          className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        >
          {isSubmitting
            ? "Saving..."
            : isEdit
              ? "Update Exercise"
              : embedInClassPlan
                ? "Create & use exercise"
                : "Create Exercise"}
        </Button>
      </div>
    </form>
  );
}
