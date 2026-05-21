"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  type Period,
  type TimePickerType,
  getArrowByType,
  getDateByType,
  setDateByType,
} from "@/lib/time-picker-utils";

export interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  period?: Period;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  (
    {
      className,
      type = "tel",
      value,
      id,
      name,
      date = new Date(new Date().setHours(0, 0, 0, 0)),
      setDate,
      onChange,
      onKeyDown,
      picker,
      period,
      onLeftFocus,
      onRightFocus,
      onFocus,
      ...props
    },
    ref
  ) => {
    const [flag, setFlag] = React.useState(false);
    const [prevIntKey, setPrevIntKey] = React.useState("0");

    React.useEffect(() => {
      if (!flag) return;
      const timer = setTimeout(() => setFlag(false), 2000);
      return () => clearTimeout(timer);
    }, [flag]);

    const calculatedValue = React.useMemo(
      () => getDateByType(date, picker),
      [date, picker]
    );

    const calculateNewValue = (key: string) => {
      if (picker === "12hours") {
        if (flag && calculatedValue.slice(1, 2) === "1" && prevIntKey === "0") {
          return `0${key}`;
        }
      }
      return !flag ? `0${key}` : calculatedValue.slice(1, 2) + key;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") return;
      e.preventDefault();
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
      if (["ArrowUp", "ArrowDown"].includes(e.key)) {
        const step = e.key === "ArrowUp" ? 1 : -1;
        const newValue = getArrowByType(calculatedValue, step, picker);
        if (flag) setFlag(false);
        const tempDate = new Date(date);
        setDate(setDateByType(tempDate, newValue, picker, period));
      }
      if (e.key >= "0" && e.key <= "9") {
        if (picker === "12hours") setPrevIntKey(e.key);
        const newValue = calculateNewValue(e.key);
        if (flag) onRightFocus?.();
        setFlag((prev) => !prev);
        const tempDate = new Date(date);
        setDate(setDateByType(tempDate, newValue, picker, period));
      }
    };

    return (
      <input
        ref={ref}
        id={id || picker}
        name={name || picker}
        className={cn(
          "w-full min-w-[2ch] border-0 bg-transparent p-0 text-center font-mono text-sm tabular-nums text-foreground outline-none",
          "caret-transparent selection:bg-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        value={value ?? calculatedValue}
        onChange={(e) => {
          e.preventDefault();
          onChange?.(e);
        }}
        type={type}
        inputMode="decimal"
        onFocus={(e) => {
          onFocus?.(e);
          e.currentTarget.select();
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          handleKeyDown(e);
        }}
        {...props}
      />
    );
  }
);

TimePickerInput.displayName = "TimePickerInput";

export { TimePickerInput };
