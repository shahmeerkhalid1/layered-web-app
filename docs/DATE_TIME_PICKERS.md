# Date & Time Pickers — Implementation Summary

This document records the reusable **date** and **time** picker work added to the Pilates Platform client (scheduling dialogs and instance drawer). It is a **handoff / working log**, not the canonical product spec.

---

## Overview

Native `<input type="date">` and `<input type="time">` fields were replaced with shared **`DatePicker`** and **`TimePicker`** components built on **shadcn/ui** (`Popover`, `Button`, `Select`) and **`react-day-picker`** for the calendar.

**Value formats (unchanged for APIs):**

| Field | Stored format | Example |
|-------|---------------|---------|
| Date  | `YYYY-MM-DD`  | `2026-05-21` |
| Time  | `HH:mm` (24h) | `09:30` |

Display uses locale-friendly date labels and **12-hour time with AM/PM** on the trigger button.

---

## Dependencies

| Package | Status |
|---------|--------|
| `react-day-picker` | **Installed** — powers `Calendar` / `DatePicker` |
| `react-time-picker` | **Removed** — analog-only clock; not suitable for digital UI |

---

## New & updated files

### Reusable UI (`client/src/components/ui/`)

| File | Purpose |
|------|---------|
| `calendar.tsx` | Themed `react-day-picker` wrapper (Tailwind `classNames`, dropdown caption, chevrons) |
| `date-picker.tsx` | Popover trigger + calendar; clear (X) button; locale date label |
| `time-picker.tsx` | Popover trigger + `TimePickerPanel`; clear (X) button; 12h display label |
| `time-picker-panel.tsx` | Hour, minute, and AM/PM **Select** dropdowns (all visible together in popover) |
| `time-picker-input.tsx` | OpenStatus-style segment input (low-level; not used by current popover UI) |
| `time-period-select.tsx` | OpenStatus AM/PM select (low-level; panel uses inline selects instead) |

### Utilities (`client/src/lib/`)

| File | Purpose |
|------|---------|
| `date-ymd.ts` | `ymdToDate`, `dateToYmd`, `formatYmdLabel` (locale `MM/DD/YYYY` or `DD/MM/YYYY` on trigger) |
| `datetime-local.ts` | `hmToDate`, `dateToHm`, `formatHmLabel12`, existing UTC conversion helpers |
| `time-picker-utils.ts` | OpenStatus time math/validation (`setDateByType`, `convert12HourTo24Hour`, etc.) |

### Styling

| File | Changes |
|------|---------|
| `client/src/app/globals.css` | `react-day-picker` CSS variables (`.rdp-root`, `.rdp-themed`) mapped to theme tokens; removed obsolete `react-time-picker` / inline time-field styles |

### Validation

| File | Changes |
|------|---------|
| `client/src/lib/validation/quick-schedule-form-schema.ts` | User-facing messages for empty/invalid date and time via `superRefine`; clearer duration messages |

`create-class-form-schema.ts` still uses `min(1)` / regex for `startDate` and `clockTime` — consider aligning messages if those forms show generic Zod errors.

---

## Component behavior

### DatePicker

- Trigger: outline button with calendar icon; placeholder **"Pick a date"** when empty.
- Popover: single-select `Calendar` with month/year dropdowns.
- **Clear:** X on trigger clears value (`""`), closes popover, remounts calendar (`key`) so no day stays selected.
- **Invalid state:** pass `aria-invalid` for destructive border (used with react-hook-form errors).

### TimePicker

- Trigger: outline button with clock icon; shows **12-hour label** (e.g. `09:30 AM`) via `formatHmLabel12`.
- Popover: `TimePickerPanel` with three dropdowns (hour 1–12, minute 00–59, AM/PM).
- Emits **24-hour `HH:mm`** for forms and `localDateAndTimeToUtcIso`.
- **Clear:** same pattern as date picker.
- Empty panel shows `--` placeholders until user selects values.

### Calendar theming

- Tailwind `classNames` on day cells, nav, caption, dropdowns.
- Custom `Chevron` uses **ChevronDown** for dropdown indicators (not ChevronRight).
- Theme colors follow shadcn semantic tokens (light/dark).

---

## Where pickers are used

| Screen | File | Notes |
|--------|------|-------|
| Create class | `client/src/components/scheduling/create-class-dialog.tsx` | `Controller` + `DatePicker` / `TimePicker` for `startDate`, `endDate`, `clockTime` |
| Quick schedule | `client/src/components/scheduling/quick-schedule-dialog.tsx` | `Controller` for `date`, `time` |
| Instance reschedule | `client/src/components/scheduling/class-instance-drawer.tsx` | Controlled `reschedule.date` / `reschedule.time` (pre-filled from instance) |

All integrate with **react-hook-form** where applicable (`Controller` + `field.value` / `field.onChange`).

---

## Default values & prefill

| Dialog | Default on open | Prefill |
|--------|-----------------|---------|
| **Create class** | Empty date/time (`EMPTY_CREATE_CLASS_VALUES`) | None |
| **Quick schedule** | Empty date/time (`EMPTY_QUICK_SCHEDULE_VALUES`) | `slotPrefill` from calendar slot click (`date` + optional `time`); template name/duration from class plan |
| **Instance drawer (reschedule)** | Loaded from `detail.date` / `detail.time` | Always reflects current instance |

Quick schedule opened from a **week view slot** still receives `slotPrefill` from `calendar/page.tsx` (`onSelectSlot`). Opens from class plan cards or header have **no** date/time prefill.

---

## Validation (quick schedule)

Empty or invalid fields show explicit copy (not Zod’s generic `>=1 characters`):

| Field | Empty | Invalid format |
|-------|-------|----------------|
| Date | Select a date | Select a valid date |
| Time | Select a start time | Select a valid start time |
| Duration | Duration is required / must be a whole number / etc. | (number rules) |

Implemented with `superRefine` so empty values produce a **single** issue per field.

---

## Evolution (what we tried)

1. **`react-time-picker`** — rejected (analog clock only); library removed.
2. **OpenStatus inline segments** (`time-picker-input`, bordered hour/minute fields) — replaced by popover + three selects for a native-like “pick hour and minute together” UX and cleaner scrolling.
3. **Scrollable hour/minute columns** — replaced by `Select` dropdowns for appearance consistency with shadcn.

---

## Usage example (react-hook-form)

```tsx
<Controller
  name="date"
  control={control}
  render={({ field }) => (
    <DatePicker
      id="qs-date"
      value={field.value}
      onChange={field.onChange}
      disabled={isSubmitting}
      aria-invalid={!!errors.date}
    />
  )}
/>
{errors.date && (
  <p className="text-xs text-destructive">{errors.date.message}</p>
)}
```

Time field is identical with `TimePicker` and `name="time"` (or `clockTime` in create-class schema).

---

## References

- [react-day-picker](https://react-day-picker.js.org/) — styling & appearance
- [OpenStatus time picker](https://time.openstatus.dev/) — utilities and initial segment-input patterns
