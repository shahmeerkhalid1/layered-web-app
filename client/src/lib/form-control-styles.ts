import { cn } from "@/lib/utils";

/** Shared interaction styles for text fields, selects, and picker triggers. */
const formControlInteraction = [
  "border border-input outline-none transition-[color,box-shadow,background-color,border-color] duration-150",
  "bg-field-empty",
  "hover:border-ring/70 hover:ring-3 hover:ring-ring/30",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/30",
  "aria-invalid:hover:border-destructive aria-invalid:hover:ring-3 aria-invalid:hover:ring-destructive/40",
  "aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-3 aria-invalid:focus-visible:ring-destructive/50",
  "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/45",
  "dark:aria-invalid:hover:ring-destructive/50 dark:aria-invalid:focus-visible:ring-destructive/55",
] as const;

/** Filled state when the control has a value (Input/Textarea set `data-filled`). */
const formControlFilled = [
  "data-filled:bg-field-filled data-filled:border-input/90",
  "data-filled:aria-invalid:border-destructive",
  "data-filled:aria-invalid:hover:border-destructive",
  "data-filled:aria-invalid:focus-visible:border-destructive",
] as const;

export const formControlInputClasses = cn(
  "h-8 w-full min-w-0 rounded-lg px-2.5 py-1 text-base md:text-sm",
  "placeholder:text-muted-foreground",
  "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  ...formControlInteraction,
  ...formControlFilled
);

export const formControlTextareaClasses = cn(
  "field-sizing-content flex min-h-16 w-full rounded-lg px-2.5 py-2 text-base md:text-sm",
  "placeholder:text-muted-foreground",
  ...formControlInteraction,
  ...formControlFilled
);

/** Default sentinel values for optional form selects (e.g. "Select orientation", "No folder"). */
export const DEFAULT_SELECT_EMPTY_VALUES = ["none", ""] as const;

/** Sentinel for filter selects where "all" means no filter applied. */
export const FILTER_SELECT_EMPTY_VALUES = ["all", ""] as const;

function stringHasTrimmedContent(value: string): boolean {
  return value.trim() !== "";
}

export function isSelectEmptyValue(
  value: string | null | undefined,
  emptyValues: readonly string[] = DEFAULT_SELECT_EMPTY_VALUES
): boolean {
  if (value == null || !stringHasTrimmedContent(value)) return true;
  return emptyValues.includes(value.trim());
}

export const formControlSelectTriggerClasses = cn(
  "flex w-fit items-center justify-between gap-1.5 rounded-lg py-2 pr-2 pl-2.5 text-sm whitespace-nowrap select-none",
  "h-8 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate *:data-[slot=select-value]:leading-snug *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5",
  "data-placeholder:text-muted-foreground data-placeholder:bg-field-empty",
  "data-empty:bg-field-empty",
  "data-has-value:bg-field-filled data-has-value:border-input/90",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ...formControlInteraction
);

/** Popover triggers (date/time pickers) — pass `data-filled` when a value is set. */
export const formControlPickerTriggerClasses = cn(
  "inline-flex h-8 w-full cursor-pointer items-center justify-between gap-1 rounded-lg px-2.5 text-sm font-normal shadow-none outline-none select-none",
  "hover:bg-field-filled/60",
  "aria-expanded:bg-field-empty data-filled:aria-expanded:bg-field-filled",
  ...formControlInteraction,
  ...formControlFilled
);

/** Custom checkbox indicator — uses theme primary when checked. */
export const checkboxIndicatorClasses = cn(
  "pointer-events-none flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border-2 border-input bg-field-empty",
  "transition-[box-shadow,background-color,border-color] duration-150",
  "peer-[&:not(:disabled):hover]:border-ring/70 peer-[&:not(:disabled):hover]:ring-3 peer-[&:not(:disabled):hover]:ring-ring/30",
  "peer-[&:not(:disabled):focus-visible]:border-ring peer-[&:not(:disabled):focus-visible]:ring-3 peer-[&:not(:disabled):focus-visible]:ring-ring/50",
  "peer-checked:border-primary peer-checked:bg-primary",
  "peer-checked:peer-[&:not(:disabled):hover]:ring-3 peer-checked:peer-[&:not(:disabled):hover]:ring-primary/30",
  "peer-disabled:opacity-50",
  "peer-[&:not(:disabled):not(:checked):hover]:[&_svg]:opacity-40",
  "peer-[&:not(:disabled):not(:checked):hover]:[&_svg]:text-primary",
  "peer-checked:[&_svg]:text-primary-foreground peer-checked:[&_svg]:opacity-100"
);

function valueHasMeaningfulContent(
  value: string | number | readonly string[] | null | undefined
): boolean {
  if (value == null) return false;
  if (typeof value === "string") return stringHasTrimmedContent(value);
  if (typeof value === "number") return !Number.isNaN(value);
  if (Array.isArray(value)) {
    return value.some((item) => stringHasTrimmedContent(String(item)));
  }
  return String(value).trim() !== "";
}

/** True when the field has non-whitespace content (strings are trim-checked). */
export function inputHasValue(
  value?: string | number | readonly string[] | null,
  defaultValue?: string | number | readonly string[] | null
): boolean {
  if (valueHasMeaningfulContent(value)) return true;
  if (valueHasMeaningfulContent(defaultValue)) return true;
  return false;
}
