import type { ReactNode } from "react";
import { Dumbbell, FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { ExerciseFolder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExerciseFolderSidebarProps {
  folders: ExerciseFolder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: ExerciseFolder) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function ExerciseFolderSidebar({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
}: ExerciseFolderSidebarProps) {
  return (
    <aside className="w-full shrink-0 space-y-2 lg:w-56">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Folders</h3>
        <Button variant="ghost" size="icon-xs" onClick={onCreateFolder}>
          <Plus className="size-4" />
        </Button>
      </div>

      <FolderButton
        active={!selectedFolder}
        icon={<Dumbbell className="size-4" />}
        label="All Exercises"
        onClick={() => onSelectFolder(null)}
      />

      {folders.map((folder) => (
        <div key={folder.id} className="group flex items-center">
          <FolderButton
            active={selectedFolder === folder.id}
            count={folder._count?.exercises}
            icon={<FolderOpen className="size-4" />}
            label={folder.name}
            onClick={() => onSelectFolder(folder.id)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100"
                />
              }
            >
              <MoreHorizontal className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                <Pencil className="mr-2 size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteFolder(folder.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </aside>
  );
}

interface FolderButtonProps {
  active: boolean;
  count?: number;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function FolderButton({ active, count, icon, label, onClick }: FolderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
      type="button"
    >
      {icon}
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="ml-auto text-xs opacity-60">{count}</span>}
    </button>
  );
}
