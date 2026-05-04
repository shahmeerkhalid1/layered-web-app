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
    <Card className="group relative">
      <Link href={`/exercises/${exercise.id}`}>
        <CardContent className="p-4">
          {exercise.images?.[0] && (
            <div className="relative mb-3 aspect-video overflow-hidden rounded-md bg-muted">
              <Image
                src={exercise.images[0].url}
                alt={exercise.name}
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <h3 className="font-semibold">{exercise.name}</h3>
          {exercise.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {exercise.description}
            </p>
          )}
          {exercise.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {exercise.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {exercise.folder && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <FolderOpen className="size-3" />
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
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
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
