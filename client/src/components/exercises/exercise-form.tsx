"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { exerciseApi } from "@/services/exercise-api";
import type { Exercise, ExerciseFolder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
  const [folders, setFolders] = useState<ExerciseFolder[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    exerciseApi.getFolders().then(setFolders).catch(() => {});
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      name,
      description: description || undefined,
      cueing: cueing || undefined,
      tags,
      folderId: folderId === "none" ? null : folderId,
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
    <form onSubmit={handleSubmit} className="max-w-3xl">
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
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hundred"
              required
              className="h-11 rounded-2xl border-input bg-background/70 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the movement, setup, and intention..."
              rows={4}
              className="rounded-2xl border-input bg-background/70 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cueing" className="text-sm font-medium text-foreground">
              Cueing Ideas
            </Label>
            <Textarea
              id="cueing"
              value={cueing}
              onChange={(e) => setCueing(e.target.value)}
              placeholder="Breath, tempo, tactile cues, and common corrections..."
              rows={3}
              className="rounded-2xl border-input bg-background/70 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder" className="text-sm font-medium text-foreground">
              Folder
            </Label>
            <Select
              value={folderId}
              onValueChange={(value) => setFolderId(value ?? "none")}
            >
              <SelectTrigger className="h-11 rounded-2xl border-input bg-background/70 shadow-none focus-visible:ring-ring/35">
                <SelectValue placeholder="No folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Tags
            </Label>
            <div className="flex gap-2">
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
                className="h-11 rounded-2xl border-input bg-background/70 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                className="rounded-full border-border bg-transparent px-5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
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
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          disabled={saving || !name.trim()}
          className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        >
          {saving ? "Saving..." : isEdit ? "Update Exercise" : "Create Exercise"}
        </Button>
      </div>
    </form>
  );
}
