"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Period,
  display12HourValue,
  setDateByType,
} from "@/lib/time-picker-utils";

export interface TimePeriodSelectProps {
  period: Period;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

export const TimePeriodSelect = React.forwardRef<HTMLButtonElement, TimePeriodSelectProps>(
  ({ period, date, setDate, disabled, onLeftFocus, onRightFocus }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
    };

    const handleValueChange = (newPeriod: Period) => {
      if (!date) return;
      const tempDate = new Date(date);
      const hours = display12HourValue(date.getHours());
      setDate(setDateByType(tempDate, hours.toString(), "12hours", newPeriod));
    };

    return (
      <Select
        value={period}
        onValueChange={(v) => handleValueChange(v as Period)}
        disabled={disabled}
      >
        <SelectTrigger
          ref={ref}
          size="sm"
          className="h-8 w-full min-w-0 shrink-0 border-0 bg-transparent px-2 shadow-none focus-visible:border-0 focus-visible:ring-0"
          onKeyDown={handleKeyDown}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-17">
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    );
  }
);

TimePeriodSelect.displayName = "TimePeriodSelect";
