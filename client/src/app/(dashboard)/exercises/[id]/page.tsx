"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Exercise, ProgressionChainItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [chain, setChain] = useState<ProgressionChainItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ex, ch] = await Promise.all([
          api.get<Exercise>(`/exercises/${params.id}`),
          api.get<ProgressionChainItem[]>(
            `/exercises/${params.id}/progression-chain`
          ),
        ]);
        setExercise(ex);
        setChain(ch);
      } catch {
        toast.error("Exercise not found");
        router.push("/exercises");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  const handleDelete = async () => {
    try {
      await api.delete(`/exercises/${params.id}`);
      toast.success("Exercise deleted");
      router.push("/exercises");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{exercise.name}</h2>
          {exercise.folder && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <FolderOpen className="size-3" />
              {exercise.folder.name}
            </p>
          )}
        </div>
        <Link href={`/exercises/${exercise.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
        </Link>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {exercise.images.length > 0 && (
            <div className="flex gap-4 overflow-x-auto">
              {exercise.images.map((img) => (
                <div
                  key={img.id}
                  className="h-48 w-64 shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <img
                    src={img.url}
                    alt={exercise.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {exercise.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {exercise.description}
                </p>
              </CardContent>
            </Card>
          )}

          {exercise.cueing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cueing Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{exercise.cueing}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {exercise.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {exercise.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {chain.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Progression Chain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chain.map((item, idx) => (
                    <div key={item.id}>
                      <Link
                        href={`/exercises/${item.id}`}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          item.id === exercise.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span className="font-medium">
                          Level {item.level}
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span>{item.name}</span>
                      </Link>
                      {idx < chain.length - 1 && (
                        <div className="flex justify-center py-1">
                          <ArrowRight className="size-3 rotate-90 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
