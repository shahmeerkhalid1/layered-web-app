"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Exercise, ProgressionChainItem } from "@/lib/types";
import { exerciseApi } from "@/services/exercise-api";
import { ProgressionChainViewer } from "@/components/exercises/progression-chain-viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { getLayerStepTitle } from "@/lib/exercise-layer-labels";
import { useFancybox } from "@/hooks/use-fancybox";

const EXERCISE_DETAIL_IMAGE_GALLERY = "exercise-detail-images";

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [chain, setChain] = useState<ProgressionChainItem[]>([]);
  const [loading, setLoading] = useState(true);

  const imageGalleryFancyboxKey = useMemo(
    () => (exercise?.images ?? []).map((i) => i.id).join("|"),
    [exercise?.images]
  );
  const bindImageGallery = useFancybox(imageGalleryFancyboxKey);

  useEffect(() => {
    async function load() {
      try {
        const [ex, ch] = await Promise.all([
          exerciseApi.getExerciseById(params.id as string),
          exerciseApi.getProgressionChain(params.id as string),
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

  const sortedLayers = [...(exercise.layers ?? [])].sort((a, b) => a.order - b.order);

  const setupRows: { label: string; value: string | null | undefined }[] = [
    { label: "Orientation", value: exercise.orientation },
    { label: "Direction faced", value: exercise.directionFaced },
    { label: "Movement type", value: exercise.movementType },
    { label: "Springs", value: exercise.springs },
    { label: "Machine setup", value: exercise.machineSetup },
  ].filter((r) => r.value != null && String(r.value).trim() !== "");

  const equipmentItems = (exercise.equipment ?? []).filter(
    (s) => s != null && String(s).trim() !== ""
  );

  const chainTypeItems = (exercise.chainType ?? []).filter(
    (s) => s != null && String(s).trim() !== ""
  );

  const spinalItems = (exercise.spinalMovement ?? []).filter(
    (s) => s != null && String(s).trim() !== ""
  );

  const jointLoadingItems = (exercise.jointLoading ?? []).filter(
    (s) => s != null && String(s).trim() !== ""
  );

  const showMovementAnalysis =
    spinalItems.length > 0 ||
    jointLoadingItems.length > 0 ||
    chainTypeItems.length > 0;

  const showProgressionRegression =
    (exercise.progressionNotes != null &&
      String(exercise.progressionNotes).trim() !== "") ||
    (exercise.regressionNotes != null && String(exercise.regressionNotes).trim() !== "");

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
            <div
              ref={bindImageGallery}
              className="flex gap-4 overflow-x-auto pb-1"
            >
              {exercise.images.map((img, index) => (
                <div
                  key={img.id}
                  className="h-48 w-64 shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <a
                    href={img.url}
                    data-fancybox={EXERCISE_DETAIL_IMAGE_GALLERY}
                    data-caption={`${exercise.name} — Image ${index + 1}`}
                    title="View full size"
                    className="block h-full w-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <img
                      src={img.url}
                      alt={exercise.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </a>
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

          {exercise.startingPosition && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Starting Position</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{exercise.startingPosition}</p>
              </CardContent>
            </Card>
          )}

          {(setupRows.length > 0 || equipmentItems.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {setupRows.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {setupRows.map((row) => (
                      <div key={row.label}>
                        <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
                        <p className="text-sm text-foreground">{row.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {equipmentItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Equipment</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {equipmentItems.map((value, i) => (
                        <Badge key={`eq-${value}-${i}`} variant="secondary">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {sortedLayers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Layers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-4">
                  {sortedLayers.map((layer, index) => {
                    const total = sortedLayers.length;
                    const title = getLayerStepTitle(index);
                    const isLast = index === total - 1;
                    const finisher = Boolean(layer.isFinisher && isLast);
                    return (
                      <li
                        key={layer.id}
                        className={
                          finisher
                            ? "rounded-2xl border border-border bg-card/40 p-4 sm:p-5"
                            : "border-b border-border/60 pb-4 last:border-0 last:pb-0"
                        }
                      >
                        <div
                          className={
                            finisher
                              ? "mb-3 flex flex-wrap items-center gap-2"
                              : "mb-1.5 flex flex-wrap items-center gap-2"
                          }
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {title}
                          </p>
                          {finisher && (
                            <Badge variant="secondary" className="text-xs font-semibold">
                              Finisher
                            </Badge>
                          )}
                        </div>
                        <p
                          className={
                            finisher
                              ? "whitespace-pre-wrap text-sm text-foreground"
                              : "mt-1.5 whitespace-pre-wrap text-sm text-foreground"
                          }
                        >
                          {layer.content}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {showProgressionRegression && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progressions & regressions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exercise.progressionNotes != null &&
                  String(exercise.progressionNotes).trim() !== "" && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Progression</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                        {exercise.progressionNotes}
                      </p>
                    </div>
                  )}
                {exercise.regressionNotes != null &&
                  String(exercise.regressionNotes).trim() !== "" && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Regression</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                        {exercise.regressionNotes}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {exercise.transitionCues && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transition Cues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{exercise.transitionCues}</p>
              </CardContent>
            </Card>
          )}

          {exercise.cueing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cues / Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{exercise.cueing}</p>
              </CardContent>
            </Card>
          )}

          {showMovementAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Movement Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {spinalItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Spinal movement</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {spinalItems.map((value, i) => (
                        <Badge key={`${value}-${i}`} variant="secondary">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {jointLoadingItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Joint loading</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {jointLoadingItems.map((value, i) => (
                        <Badge key={`joint-${value}-${i}`} variant="secondary">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {chainTypeItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Chain type</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {chainTypeItems.map((value, i) => (
                        <Badge key={`chain-${value}-${i}`} variant="secondary">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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

          <ProgressionChainViewer
            chain={chain}
            currentExerciseId={exercise.id}
          />
        </div>
      </div>
    </div>
  );
}
