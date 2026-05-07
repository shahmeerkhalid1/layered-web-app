"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";
import { exerciseApi } from "@/services/exercise-api";
import type { TempUploadedImage } from "@/services/exercise-api";
import type {
  Exercise,
  ExerciseFolder,
  ExerciseImage,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ImageItem =
  | { type: "saved"; data: ExerciseImage }
  | { type: "temp"; data: TempUploadedImage };

function imageKey(item: ImageItem): string {
  return item.type === "saved" ? item.data.id : item.data.publicId;
}

interface ExerciseFormProps {
  exercise?: Exercise;
}

export function ExerciseForm({ exercise }: ExerciseFormProps) {
  const router = useRouter();
  const isEdit = !!exercise;

  const [name, setName] = useState(exercise?.name ?? "");
  const [description, setDescription] = useState(exercise?.description ?? "");
  const [cueing, setCueing] = useState(exercise?.cueing ?? "");
  const [tags, setTags] = useState<string[]>(exercise?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [folderId, setFolderId] = useState<string>(exercise?.folderId ?? "none");
  const [progressionOfId, setProgressionOfId] = useState<string>(
    exercise?.progressionOfId ?? "none"
  );
  const [folders, setFolders] = useState<ExerciseFolder[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  /** Edit only: cannot pick self or a harder step in the same chain (would cycle). */
  const [blockedParentIds, setBlockedParentIds] = useState<Set<string>>(() =>
    exercise?.id ? new Set([exercise.id]) : new Set()
  );
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    exerciseApi.getFolders().then(setFolders).catch(() => {});
    exerciseApi.getExercises().then(setAllExercises).catch(() => {});
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
    if (folderId === "none") return "No folder";
    const fromList = folders.find((f) => f.id === folderId);
    if (fromList) return fromList.name;
    if (exercise?.folder?.id === folderId) return exercise.folder.name;
    return "No folder";
  }, [folderId, folders, exercise?.folder?.id, exercise?.folder?.name]);

  const progressionParentOptions = useMemo(() => {
    return allExercises
      .filter((ex) => !blockedParentIds.has(ex.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allExercises, blockedParentIds]);

  const progressionTriggerLabel = useMemo(() => {
    if (progressionOfId === "none") return "None — root level";
    const ex = allExercises.find((e) => e.id === progressionOfId);
    if (ex) return ex.name;
    if (exercise?.progressionOf?.id === progressionOfId) {
      return exercise.progressionOf.name;
    }
    return "Unknown exercise";
  }, [progressionOfId, allExercises, exercise]);

  const orphanProgressionParent = useMemo(() => {
    if (
      progressionOfId === "none" ||
      allExercises.some((e) => e.id === progressionOfId)
    ) {
      return null;
    }
    return {
      id: progressionOfId,
      name: exercise?.progressionOf?.name ?? null,
    };
  }, [progressionOfId, allExercises, exercise]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const tempPublicIds = images
      .filter((i): i is ImageItem & { type: "temp" } => i.type === "temp")
      .map((i) => i.data.publicId);

    const nextProgressionOfId =
      progressionOfId === "none" ? null : progressionOfId;

    if (isEdit && nextProgressionOfId && blockedParentIds.has(nextProgressionOfId)) {
      toast.error("That easier exercise would break the progression chain");
      setSaving(false);
      return;
    }

    const body = {
      name,
      description: description || undefined,
      cueing: cueing || undefined,
      tags,
      folderId: folderId === "none" ? null : folderId,
      progressionOfId: nextProgressionOfId,
      ...(tempPublicIds.length > 0 ? { publicIds: tempPublicIds } : {}),
    };

    try {
      if (isEdit) {
        await exerciseApi.updateExercise(exercise.id, body);
        toast.success("Exercise updated");
        router.push(`/exercises/${exercise.id}`);
      } else {
        const created = await exerciseApi.createExercise(body);
        toast.success("Exercise created");
        router.push(`/exercises/${created.id}`);
      }
    } catch {
      toast.error("Failed to save exercise");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-fullmax-w-4xl">
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
              Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hundred"
              required
              className="h-12 rounded-2xl border-input bg-background/70 px-4 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="pl-1.5 text-sm font-medium text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the movement, setup, and intention..."
              rows={4}
              className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cueing" className="pl-1.5 text-sm font-medium text-foreground">
              Cueing Ideas
            </Label>
            <Textarea
              id="cueing"
              value={cueing}
              onChange={(e) => setCueing(e.target.value)}
              placeholder="Breath, tempo, tactile cues, and common corrections..."
              rows={3}
              className="rounded-2xl border-input bg-background/70 px-4 py-3.5 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder" className="pl-1.5 text-sm font-medium text-foreground">
              Folder
            </Label>
            <Select
              value={folderId}
              onValueChange={(value) => setFolderId(value ?? "none")}
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
          </div>

          <div className="space-y-2">
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
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.map((tag) => (
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

          {/* ─── Image Dropzone ──────────────────────────────────────── */}
          <div className="space-y-2">
            <Label className="pl-1.5 text-sm font-medium text-foreground">
              Images
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({totalImages}/{MAX_IMAGES})
              </span>
            </Label>

            {totalImages > 0 && (
              <div className="grid grid-cols-3 gap-3">
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
                    <img
                      src={item.data.url}
                      alt=""
                      className="size-full object-cover"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute left-1.5 top-1.5 flex size-6 cursor-grab items-center justify-center rounded-full bg-black text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                      <GripVertical className="size-3.5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(item)}
                      className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="size-3.5 text-white" />
                    </button>
                    {item.type === "temp" && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
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
          onClick={() => router.back()}
          className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="mr-2 size-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || uploading || !name.trim()}
          className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        >
          {saving ? "Saving..." : isEdit ? "Update Exercise" : "Create Exercise"}
        </Button>
      </div>
    </form>
  );
}
