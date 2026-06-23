"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { dateToHm, hmToDate, compareHm } from "@/lib/datetime-local";
import {
  type Period,
  getDateByType,
  setDateByType,
} from "@/lib/time-picker-utils";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function applyTimeParts(hour12: string, minute: string, period: Period): string {
  let d = hmToDate("00:00");
  d = setDateByType(d, hour12, "12hours", period);
  d = setDateByType(d, minute, "minutes");
  return dateToHm(d);
}

function TimeSelectField({
  label,
  value,
  onValueChange,
  items,
  triggerClassName,
  placeholder = "--",
  disabledItems,
}: {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  items: string[];
  triggerClassName?: string;
  placeholder?: string;
  disabledItems?: Set<string>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select
        value={value ?? null}
        onValueChange={(v) => {
          if (v) onValueChange(v);
        }}
      >
        <SelectTrigger
          className={`h-8 w-full min-w-0 font-mono tabular-nums ${triggerClassName ?? ""}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {items.map((item) => (
            <SelectItem
              key={item}
              value={item}
              disabled={disabledItems?.has(item)}
              className="font-mono tabular-nums"
            >
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function hour12ToHm(hour12: string, minute: string, period: Period): string {
  return applyTimeParts(hour12, minute, period);
}

function isHour12Disabled(
  hour12: string,
  period: Period,
  minute: string,
  minTime?: string
): boolean {
  if (!minTime) return false;
  return compareHm(hour12ToHm(hour12, minute, period), minTime) < 0;
}

function isMinuteDisabled(
  hour12: string,
  minute: string,
  period: Period,
  minTime?: string
): boolean {
  if (!minTime) return false;
  return compareHm(hour12ToHm(hour12, minute, period), minTime) < 0;
}

function isPeriodDisabled(
  hour12: string,
  minute: string,
  period: Period,
  minTime?: string
): boolean {
  if (!minTime) return false;
  return compareHm(hour12ToHm(hour12, minute, period), minTime) < 0;
}

export interface TimePickerPanelProps {
  value: string;
  onChange: (value: string) => void;
  minTime?: string;
}

export function TimePickerPanel({ value, onChange, minTime }: TimePickerPanelProps) {
  const hasValue = Boolean(value?.trim());
  const date = hasValue ? hmToDate(value) : null;
  const hour12 = date ? getDateByType(date, "12hours") : undefined;
  const minute = date ? getDateByType(date, "minutes") : undefined;
  const period: Period | undefined = date
    ? date.getHours() >= 12
      ? "PM"
      : "AM"
    : undefined;

  const update = (
    nextHour?: string,
    nextMinute?: string,
    nextPeriod?: Period
  ) => {
    const result = applyTimeParts(
      nextHour ?? hour12 ?? "12",
      nextMinute ?? minute ?? "00",
      nextPeriod ?? period ?? "AM"
    );
    if (minTime && compareHm(result, minTime) < 0) {
      onChange(minTime);
      return;
    }
    onChange(result);
  };

  const disabledHours = new Set(
    HOURS_12.filter((h) =>
      (["AM", "PM"] as Period[]).every((p) =>
        isHour12Disabled(h, p, minute ?? "00", minTime)
      )
    )
  );
  const disabledMinutes = new Set(
    MINUTES.filter((m) => isMinuteDisabled(hour12 ?? "12", m, period ?? "AM", minTime))
  );
  const disabledPeriods = new Set(
    (["AM", "PM"] as Period[]).filter((p) =>
      isPeriodDisabled(hour12 ?? "12", minute ?? "00", p, minTime)
    )
  );

  return (
    <div
      key={hasValue ? value : "empty"}
      className="grid grid-cols-[1fr_auto_1fr_1fr] items-end gap-2 p-3"
    >
      <TimeSelectField
        label="Hour"
        value={hour12}
        items={HOURS_12}
        triggerClassName="w-16"
        disabledItems={disabledHours}
        onValueChange={(h) => update(h, minute, period)}
      />
      <span
        className="flex h-8 items-center justify-center pb-0 font-mono text-base text-muted-foreground"
        aria-hidden
      >
        :
      </span>
      <TimeSelectField
        label="Minute"
        value={minute}
        items={MINUTES}
        triggerClassName="w-16"
        disabledItems={disabledMinutes}
        onValueChange={(m) => update(hour12, m, period)}
      />
      <TimeSelectField
        label="Period"
        value={period}
        items={["AM", "PM"]}
        triggerClassName="w-17"
        disabledItems={disabledPeriods}
        onValueChange={(p) => update(hour12, minute, p as Period)}
      />
    </div>
  );
}
