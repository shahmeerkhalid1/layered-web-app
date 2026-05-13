import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Minimal folder shape for create/rename dialogs (exercise or class plan folders). */
export type FolderDialogFolder = { id: string; name: string };

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onFolderNameChange: (value: string) => void;
  editingFolder: FolderDialogFolder | null;
  onSave: () => void;
}

export function FolderDialog({
  open,
  onOpenChange,
  folderName,
  onFolderNameChange,
  editingFolder,
  onSave,
}: FolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl">
        <DialogHeader>
          <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Studio Set
          </p>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
            {editingFolder ? "Rename Folder" : "New Folder"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-5">
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-sm font-medium text-foreground">
              Folder Name
            </Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(event) => onFolderNameChange(event.target.value)}
              placeholder="e.g. Reformer, Mat, Chair"
              className="h-11 rounded-2xl border-input bg-background/70 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!folderName.trim()}
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
          >
            {editingFolder ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
