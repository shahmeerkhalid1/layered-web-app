"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type EditScope = "this" | "future";

export interface EditScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (scope: EditScope) => void;
}

export function EditScopeDialog({ open, onOpenChange, onChoose }: EditScopeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Apply to which classes?</DialogTitle>
          <DialogDescription>
            This class is part of a recurring series. Choose whether changes affect only this
            session or every scheduled session from this date forward.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              onChoose("this");
              onOpenChange(false);
            }}
          >
            Just this class
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => {
              onChoose("future");
              onOpenChange(false);
            }}
          >
            All future classes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
