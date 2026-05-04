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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hundred"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the exercise..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cueing">Cueing Ideas</Label>
            <Textarea
              id="cueing"
              value={cueing}
              onChange={(e) => setCueing(e.target.value)}
              placeholder="Cueing notes for teaching..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select
              value={folderId}
              onValueChange={(value) => setFolderId(value ?? "none")}
            >
              <SelectTrigger>
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
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 size-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Saving..." : isEdit ? "Update Exercise" : "Create Exercise"}
        </Button>
      </div>
    </form>
  );
}
