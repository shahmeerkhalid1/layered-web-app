import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClassPlanTemplate } from "@/lib/types";

interface DeleteClassPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ClassPlanTemplate | null;
  /** Receives the template id at click time (avoids stale closure). */
  onConfirm: (templateId: string) => void | Promise<void>;
}

export function DeleteClassPlanDialog({
  open,
  onOpenChange,
  template,
  onConfirm,
}: DeleteClassPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
            Delete class plan?
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {template
              ? `“${template.name}” will be removed from your library. You can create a new template later.`
              : "This template will be removed from your library."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-border"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={!template}
            onClick={() => {
              if (!template) return;
              void onConfirm(template.id);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
