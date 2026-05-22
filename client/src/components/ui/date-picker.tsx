"use client";

import { useState, type MouseEvent } from "react";
import { CalendarIcon, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateToYmd, formatYmdLabel, ymdToDate } from "@/lib/date-ymd";
import { formControlPickerTriggerClasses } from "@/lib/form-control-styles";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

export function DatePicker({
  value,
  onChange,
  id,
  disabled,
  placeholder = "Pick a date",
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const hasValue = Boolean(value?.trim());
  const selected = ymdToDate(value);

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
            data-filled={hasValue ? "" : undefined}
            className={cn(
              formControlPickerTriggerClasses,
              !hasValue && "text-muted-foreground",
              ariaInvalid && "border-destructive",
              className
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left">
              {formatYmdLabel(value, placeholder)}
            </span>
            <span className="flex shrink-0 items-center gap-0.5">
              {hasValue && !disabled ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear date"
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
              <CalendarIcon className="size-4 opacity-60" />
            </span>
          </Button>
        }
      />
      <PopoverContent
        className="w-auto border-border bg-popover p-0 text-popover-foreground shadow-lg ring-1 ring-border/50"
        align="start"
      >
        <Calendar
          key={hasValue ? value : "empty"}
          mode="single"
          captionLayout="dropdown"
          navLayout="around"
          selected={selected}
          onSelect={(date) => {
            if (!date) {
              onChange("");
              return;
            }
            onChange(dateToYmd(date));
            setOpen(false);
          }}
          defaultMonth={selected ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
