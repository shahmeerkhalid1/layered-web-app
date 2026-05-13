"use client";

import type { ReactNode } from "react";
import { FileText, FolderOpen, Inbox, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { ClassPlanFolder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClassPlanFolderSidebarProps {
  folders: ClassPlanFolder[];
  totalTemplateCount?: number;
  /** `null` = all, `"none"` = unfiled, else folder id */
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: ClassPlanFolder) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function ClassPlanFolderSidebar({
  folders,
  totalTemplateCount,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
}: ClassPlanFolderSidebarProps) {
  return (
    <aside className="w-full shrink-0 space-y-3 rounded-3xl border border-border bg-card p-3 shadow-lg lg:w-60">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="mt-1 text-md font-semibold text-card-foreground">Folders</h3>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onCreateFolder}
          className="rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          type="button"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex w-full items-center gap-1">
          <FolderButton
            active={selectedFolder === null}
            count={totalTemplateCount}
            icon={<FileText className="size-4" />}
            label="All Plans"
            onClick={() => onSelectFolder(null)}
          />
          <span className="size-6 shrink-0" aria-hidden />
        </div>

        <div className="flex w-full items-center gap-1">
          <FolderButton
            active={selectedFolder === "none"}
            icon={<Inbox className="size-4" />}
            label="Unfiled"
            onClick={() => onSelectFolder("none")}
          />
          <span className="size-6 shrink-0" aria-hidden />
        </div>

        {folders.map((folder) => (
          <div key={folder.id} className="group flex w-full items-center gap-1">
            <FolderButton
              active={selectedFolder === folder.id}
              count={folder._count?.templates}
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
                    className="rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-popup-open:opacity-100"
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
      </div>
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
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition-all ${
        active
          ? "bg-secondary text-secondary-foreground shadow-inner"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      type="button"
    >
      {icon}
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="ml-auto text-xs opacity-60">{count}</span>}
    </button>
  );
}
