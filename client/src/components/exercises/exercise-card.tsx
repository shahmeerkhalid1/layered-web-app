import Link from "next/link";
import Image from "next/image";
import { FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExerciseCardProps {
  exercise: Exercise;
  onDelete: (exerciseId: string) => void;
}

export function ExerciseCard({ exercise, onDelete }: ExerciseCardProps) {
  return (
    <Card className="group relative border-border bg-card shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-ring hover:shadow-xl">
      <Link href={`/exercises/${exercise.id}`} className="block focus-visible:outline-none">
        <CardContent className="p-3">
          {exercise.images?.[0] ? (
            <div className="relative mb-4 aspect-4/3 overflow-hidden rounded-2xl bg-muted">
              <Image
                src={exercise.images[0].url}
                alt={exercise.name}
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-foreground/25 via-transparent to-background/10" />
            </div>
          ) : (
            <div className="relative mb-4 flex aspect-4/3 items-center justify-center overflow-hidden rounded-2xl bg-accent">
              <div className="absolute inset-x-8 top-1/2 h-px -rotate-6 bg-background/70" />
              <FolderOpen className="size-8 text-muted-foreground" />
            </div>
          )}
          <h3 className="text-base font-semibold tracking-[-0.01em] text-card-foreground">
            {exercise.name}
          </h3>
          {exercise.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {exercise.description}
            </p>
          )}
          {exercise.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {exercise.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-border bg-accent text-[11px] font-medium text-accent-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {exercise.folder && (
            <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FolderOpen className="size-3.5" />
              {exercise.folder.name}
            </p>
          )}
        </CardContent>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-4 right-4 bg-background/85 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 data-popup-open:opacity-100"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem render={<Link href={`/exercises/${exercise.id}/edit`} />}>
            <Pencil className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(exercise.id)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
