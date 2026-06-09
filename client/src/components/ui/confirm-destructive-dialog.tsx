"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmDestructiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  confirmPendingLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
  confirmDisabled?: boolean;
  confirmVariant?: "destructive" | "default";
}

export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  confirmPendingLabel,
  cancelLabel = "Cancel",
  onConfirm,
  pending = false,
  confirmDisabled = false,
  confirmVariant = "destructive",
}: ConfirmDestructiveDialogProps) {
  const pendingLabel = confirmPendingLabel ?? `${confirmLabel}…`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter >
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-border"
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            className="rounded-full"
            disabled={pending || confirmDisabled}
            onClick={() => void onConfirm()}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
