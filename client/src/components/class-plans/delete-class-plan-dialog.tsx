import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
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
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete class plan?"
      description={
        template
          ? `“${template.name}” will be removed from your library. You can create a new template later.`
          : "This template will be removed from your library."
      }
      confirmLabel="Delete"
      confirmDisabled={!template}
      onConfirm={async () => {
        if (!template) return;
        await onConfirm(template.id);
      }}
    />
  );
}
