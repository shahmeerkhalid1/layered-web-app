"use client";

import { useState, type MouseEvent } from "react";
import { Clock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePickerPanel } from "@/components/ui/time-picker-panel";
import { formatHmLabel12 } from "@/lib/datetime-local";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  /** 24-hour `HH:mm` value (stored format for API/forms). */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

/**
 * Popover time picker — hour, minute, and AM/PM selectable together (native-style).
 * Emits 24-hour `HH:mm` for forms and APIs.
 */
export function TimePicker({
  value,
  onChange,
  id,
  disabled,
  placeholder = "Pick a time",
  className,
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const hasValue = Boolean(value?.trim());

  const handleClear = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            id={id}
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            className={cn(
              "h-8 w-full justify-between gap-1 rounded-lg px-2.5 font-normal",
              !hasValue && "text-muted-foreground",
              ariaInvalid && "border-destructive",
              className
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left font-mono tabular-nums">
              {formatHmLabel12(value, placeholder)}
            </span>
            <span className="flex shrink-0 items-center gap-0.5">
              {hasValue && !disabled ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear time"
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange("");
                      setOpen(false);
                    }
                  }}
                >
                  <X className="size-3.5" />
                </span>
              ) : null}
              <Clock className="size-4 opacity-60" />
            </span>
          </Button>
        }
      />
      <PopoverContent
        className="w-auto border-border bg-popover p-0 text-popover-foreground shadow-lg ring-1 ring-border/50"
        align="start"
      >
        <TimePickerPanel value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
