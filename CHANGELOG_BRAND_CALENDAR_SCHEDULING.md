# Session Changelog — Brand Refresh, Calendar UX, Class Plans & Scheduling Guards

This document summarizes work done across five development sessions on the **Pilates Platform** (Layered.). It covers branding and auth redesign, dashboard backgrounds, calendar improvements, class-plan field scoping, exercise picker UX, and past date/time scheduling validation.

**Date context:** June 2026  
**Git commit:** `1c51aff` — `feat(ui,scheduling): brand refresh, calendar status UX, and past-time guards`  
**Scope:** Primarily `client/`; server changes in `scheduling.validation.ts` and `scheduling.service.ts`

---

## Table of contents

1. [Summary](#1-summary)
2. [Conversation timeline](#2-conversation-timeline)
3. [Branding & theme](#3-branding--theme)
4. [Auth pages redesign](#4-auth-pages-redesign)
5. [Dashboard page backgrounds](#5-dashboard-page-backgrounds)
6. [Calendar — full 24-hour grid](#6-calendar--full-24-hour-grid)
7. [Calendar — timezone day grouping fix](#7-calendar--timezone-day-grouping-fix)
8. [Calendar — status dots & styling](#8-calendar--status-dots--styling)
9. [Past date/time scheduling guards](#9-past-datetime-scheduling-guards)
10. [Class plans — Machine Setup by class type](#10-class-plans--machine-setup-by-class-type)
11. [Exercise picker dialog UX](#11-exercise-picker-dialog-ux)
12. [UI polish](#12-ui-polish)
13. [Files created](#13-files-created)
14. [Files modified](#14-files-modified)
15. [Server API changes](#15-server-api-changes)
16. [Testing checklist](#16-testing-checklist)
17. [Follow-ups & notes](#17-follow-ups--notes)

---

## 1. Summary

This batch of work delivered:

- A **brand refresh** — new logos, background image, updated primary color tokens, and refreshed app icons/manifest
- A **split-screen auth redesign** (login, register, forgot-password, reset-password) with theme-aware logos
- **Fixed cover backgrounds** on main dashboard routes so cards float over the brand image
- A **full 24-hour calendar week grid** with correct edge hour labels and timezone-safe instance grouping
- **Status-aware calendar UI** — scheduled/completed/cancelled dots in month and mini calendar; distinct styling in week grid and week overview
- **Past time validation** — cannot create, quick-schedule, or reschedule a class to a past date/time (client + server)
- **Class-type field scoping** — Machine Setup hidden in embedded exercise forms unless the parent plan is Reformer
- **Exercise picker improvements** — Create tab first by default; deferred form mount to fix open animation jank

---

## 2. Conversation timeline

| Session | Focus | Key requests |
|---------|-------|--------------|
| [Auth & backgrounds](803738da-4631-43d0-b2b7-17c6c0d6689e) | Branding, auth UI | Redesign login/register/reset to match mockup; theme-aware logos; page backgrounds on main routes |
| [Machine Setup scoping](189f4b1b-1c57-4772-8969-9fc40cbf52e9) | Class plans | Alexa feedback: hide Machine Setup for non-Reformer plans in embedded exercise form |
| [Exercise picker](6cbe15ae-4eb2-4cdc-9101-8c6e313a4ddd) | Class plans | Default to Create tab; fix dialog open animation stutter |
| [Calendar UX](fddd21b4-4eb8-4dd5-a536-8b961e74a2d1) | Scheduling | Fix hidden 6 AM / 10 PM labels; full day hours; 3 AM class visibility; status dots; completed/cancelled styling; private vs completed color distinction |
| [Past-time guards](caba834f-fe68-47c7-b3b1-4efa1048f41d) | Scheduling | Block past hours on create; extend to class drawer reschedule; remove duplicate 12 AM label |

---

## 3. Branding & theme

### New public assets

| Asset | Purpose |
|-------|---------|
| `client/public/background-image.png` | Full-bleed brand background for auth left panel and dashboard routes |
| `client/public/layered-dark-logo.png` | Logo for **light** theme (dark text on light background) |
| `client/public/layered-light-logo.png` | Logo for **dark** theme (light text on dark background) |

### Updated icons & manifest

- `client/public/web-app-manifest-192x192.png`
- `client/public/web-app-manifest-512x512.png`
- `client/src/app/apple-icon.png`
- `client/src/app/favicon.ico`
- `client/src/app/icon0.svg`
- `client/src/app/icon1.png`
- `client/src/app/manifest.json`

### Theme tokens (`client/src/app/globals.css`)

- Primary, ring, and sidebar tokens aligned to `oklch(0.3971 0.1597 265.04)`
- Dark mode ring updated for consistency
- WebKit autofill background override added

### Sidebar (`client/src/components/layout/sidebar.tsx`)

- Replaced single `layered-logo.png` with theme-aware dark/light logo swap (same pattern as auth)

---

## 4. Auth pages redesign

**Conversation:** Auth & backgrounds session  
**Files:** `auth-page-shell.tsx`, `login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`

### Layout (`AuthPageShell`)

- **50/50 split** on `lg+`:
  - **Left:** `/background-image.png` full bleed with gradient overlay (`from-black/85 via-black/45 to-black/15`) and brand copy
  - **Right:** centered logo + flat form column (`bg-card`), no card border/shadow on the form wrapper
- Brand headline: *"Scribbles become sequences. Thoughts become flows."*
- Brand description paragraph + copyright footer
- Mobile: logo above form; image panel hidden below `lg`

### New shared components

- **`AuthSubmitButton`** — full-width rounded pill, primary fill, arrow icon support
- **`AuthFormCard`** — title now optional; centered copy; simplified footer (no top border)

### Per-page updates

| Page | Changes |
|------|---------|
| `/login` | "Welcome Back" copy; Forgot Password link on password row; `AuthSubmitButton` with arrow; rounded-xl inputs |
| `/register` | Same shell; Create Account button; invitation/closed-registration states preserved |
| `/forgot-password` | Consistent shell and flat form styling |
| `/reset-password` | Consistent shell and flat form styling |

### Remember Me — added then removed

- Initially added `rememberMe` to `loginFormSchema`, `auth-context`, and login UI
- **Removed** after discovering the current Better Auth server setup did not accept it without additional configuration
- Login again sends only `email` + `password`; no non-functional checkbox shown

### Input styling follow-up

- Login inputs updated to align with exercise library search field styling (rounded-xl, secondary/background tones, ring on hover/focus)

---

## 5. Dashboard page backgrounds

**Conversation:** Auth & backgrounds session  
**New file:** `client/src/components/layout/page-background.tsx`

### Routes with background image

| Route | Page |
|-------|------|
| `/` | Dashboard home |
| `/week-overview` | Week overview |
| `/class-plans` | Class plan library |
| `/exercises` | Exercise library |
| `/clients` | Client management |
| `/calendar` | Calendar (added so scheduling views match library pages) |

### How it works

- `PageBackgroundContent` wraps main content in `AppLayout`
- Fixed cover image: `bg-[url('/background-image.png')] bg-cover bg-fixed bg-center`
- Theme-aware overlay: `bg-background/20` (light), `bg-background/40` (dark)
- Children rendered in `relative z-10` layer so cards stay readable
- Solid `bg-background` removed from exercise, class plan, and client library page wrappers so the image shows through
- Detail routes (e.g. `/exercises/[id]`, `/clients/new`) unchanged

---

## 6. Calendar — full 24-hour grid

**Conversation:** Calendar UX session  
**Files:** `calendar-utils.ts`, `calendar-week-view.tsx`

### Problem

- Week grid only showed hours **6 AM – 10 PM**
- Edge hour labels (6 AM, 10 PM) clipped or hidden due to collapsed time gutter and `overflow` clipping
- Early-morning and late-night classes could not be scheduled or seen

### Solution

**`calendar-utils.ts`**

| Constant / helper | Value / behavior |
|-------------------|------------------|
| `CALENDAR_DAY_START_HOUR` | `0` (was `6`) |
| `CALENDAR_DAY_END_HOUR` | `23` (was `22`) |
| `CALENDAR_HOUR_HEIGHT_PX` | `72` |
| `calendarDayColumnHeightPx()` | `24 × 72 = 1728px` |
| `formatCalendarHourLabel(h)` | Correct `12 AM`, `12 PM`, etc. |

**`calendar-week-view.tsx`**

- Day columns and time gutter use fixed **`height`** (not `minHeight`) for reliable percentage positioning
- Hour labels use edge-safe transforms: first hour top-aligned, middle centered (`translateY(-50%)`), last hour bottom-aligned (`translateY(-100%)`)
- Outer shell `overflow-visible` so labels are not clipped by rounded border
- Duplicate bottom **12 AM** label removed (top `12 AM` already marks day start; last row is **11 PM**)

### Past slot disabling (later session)

- On **today**, hour slots before the current time use `isPastCalendarHourSlot()` — same disabled treatment as past days
- Current hour stays clickable until minutes pass `:00`

---

## 7. Calendar — timezone day grouping fix

**Conversation:** Calendar UX session  
**Problem:** A **3 AM** class was invisible — grouped on the wrong day column and squeezed to ~0px height.

### Root cause

- Server stores the correct instant in `inst.time`, but `inst.date` is a **UTC calendar date**
- In timezones ahead of UTC, early-morning local times can fall on the **previous UTC date**
- Calendar views grouped by `inst.date.slice(0, 10)` instead of the local day from `inst.time`

### Fix

**Client — `instanceLocalDayKey(inst)`** in `calendar-utils.ts`:

```ts
export function instanceLocalDayKey(inst: { time: string }): string {
  return formatYmdLocal(new Date(inst.time));
}
```

Updated in:

- `calendar-week-view.tsx`
- `calendar-month-view.tsx`
- `week-overview-panel.tsx`
- `dashboard-mini-calendar.tsx`

**Server — `scheduling.service.ts`**

- `listClassInstancesForCalendar` widens the `date` filter by **±1 UTC calendar day** so early-morning local instances are not dropped from the fetch

---

## 8. Calendar — status dots & styling

**Conversation:** Calendar UX session  
**New files:** `calendar-day-status-dots.tsx`, `calendar-instance-status-styles.ts`

### Shared status dots (`CalendarDayStatusDots`)

| Dot color | Status |
|-----------|--------|
| Primary | Scheduled |
| Muted gray | Completed |
| Destructive red | Cancelled |

Used in:

- **Month view** — replaced numeric count badge with dots; added `CalendarStatusLegend` footer
- **Dashboard mini calendar** — refactored to use same shared components

### Week grid event styling (`weekGridEventStatusClasses`)

| Status | Appearance |
|--------|------------|
| **Scheduled — Group** | Primary blue left border + tint |
| **Scheduled — Private** | Accent/border tint (distinct from completed gray) |
| **Completed** | Muted background, border, text; slightly faded title |
| **Cancelled** | Destructive tint; strikethrough title |
| Tooltip | Shows Completed / Cancelled badge when applicable |

### Week overview card styling

| Status | Card | Time pill | Title |
|--------|------|-----------|-------|
| Scheduled | Secondary card (unchanged) | Secondary pill | Normal foreground |
| Completed | Muted card | Muted pill | Muted text + **Completed** badge |
| Cancelled | Destructive-tinted card | Destructive pill | Strikethrough + **Cancelled** badge |

### Week overview layout tweaks

- Outer shell adjusted so brand background shows through between day sections
- Day sections use `bg-card rounded-3xl` cards on the background

### Private vs completed color fix

- Scheduled private events previously used `secondary`, which matched **completed** (`muted`) too closely in the theme
- Private scheduled events updated to use a more distinct accent treatment so they don't read as completed

---

## 9. Past date/time scheduling guards

**Conversation:** Past-time guards session  
**New file:** `client/src/lib/validation/scheduling-past-guard.ts`

### Client helpers (`calendar-utils.ts`)

| Helper | Purpose |
|--------|---------|
| `currentHm()` | Current local time as `HH:mm` |
| `isPastScheduleDateTime(dateYmd, timeHm)` | True if local date+time is before now |
| `isPastCalendarHourSlot(d, hour)` | True if hour slot on day `d` is in the past |
| `localIsoWeekdayFromYmd(ymd)` | ISO weekday (Mon=1 … Sun=7) for recurring checks |

### `scheduling-past-guard.ts`

| Export | Purpose |
|--------|---------|
| `PAST_SCHEDULE_TIME_MESSAGE` | `"Start time cannot be in the past"` |
| `requiresPastTimeCheck(...)` | For recurring: only check when start date is today AND today is a selected weekday |
| `validateScheduleDateTime(...)` | Returns error message or null |

### TimePicker (`time-picker.tsx`, `time-picker-panel.tsx`)

- New **`minTime`** prop (24-hour `HH:mm`)
- Disables past hours, minutes, and AM/PM periods in the panel
- Clamps selection to `minTime` if user picks an earlier value
- Uses `compareHm()` from `datetime-local.ts`

### Create Class dialog

- Zod `superRefine` on `create-class-form-schema.ts` for one-off classes
- Submit handler calls `validateScheduleDateTime` (handles recurring weekday logic)
- `minTime={currentHm()}` when `startDate === todayYmd()`

### Quick Schedule dialog

- Same Zod + submit validation on `quick-schedule-form-schema.ts`
- Clears past slot prefill when opening with a stale time on today
- `minTime` when schedule date is today

### Class instance drawer

- Reschedule **Save schedule** rejects past time on today (toast + inline error under time picker)
- `minTime` on time picker when reschedule date is today
- Errors clear when date or time changes
- Past **dates** still blocked via existing `minDate={todayYmd()}` check

### Calendar week view

- Today’s past hour rows disabled via `isPastCalendarHourSlot` (finer than whole-day `isBeforeToday`)

---

## 10. Class plans — Machine Setup by class type

**Conversation:** Machine Setup scoping session (Alexa McKay feedback)  
**New file:** `client/src/lib/class-plan-exercise-field-visibility.ts`

### Problem

When creating exercises inside a **Mat** (or other non-Reformer) class plan, the **Machine Setup** field still appeared even though it only applies to Reformer apparatus.

### Solution

```ts
export function showMachineSetupForClassPlanType(classType: string | null | undefined): boolean {
  const trimmed = classType?.trim();
  if (!trimmed) return true;
  return trimmed.toLowerCase() === "reformer";
}
```

### Behavior

| Context | Machine Setup |
|---------|---------------|
| Standalone exercise library | Always shown |
| Embedded in plan, no `classType` | Shown |
| Embedded in **Reformer** plan | Shown |
| Embedded in **Mat, Chair, Cadillac, Barrel**, etc. | Hidden |
| Save (create, hidden) | `machineSetup: null` |
| Save (edit, hidden) | Preserves existing `exercise.machineSetup` |

### Prop plumbing

`classPlanClassType={plan.classType}` flows through:

- `ClassPlanDetailView` → `SectionExerciseRow` → `EditClassPlanExerciseDialog`
- `ClassPlanDetailView` → `ExercisePickerDialog` → embedded `ExerciseForm`

**Note:** Template-level tags (`TAG_PRESETS`: Easy Teach, Moderate, Challenging) remain global — not filtered by class type. Only the embedded **exercise form** field was scoped.

---

## 11. Exercise picker dialog UX

**Conversation:** Exercise picker session  
**File:** `exercise-picker-dialog.tsx`

### Default tab order

- **Create new** tab is first in the tab list and the default on open
- Dialog description updated: *"Create a new exercise or pick from your library for this plan."*
- On close, resets to Create tab (not library)

### Open animation fix

**Problem:** Dialog felt stuck on open because heavy `ExerciseForm` mounted during the ~100ms open animation.

**Solution:**

- `PANEL_MOUNT_DELAY_MS = 100` — defer form mount until after animation
- `panelReady` state + `ExercisePickerPanelPlaceholder` spinner during delay
- `formInstanceKey` resets on open (replaces `formKey` bump on every open)
- Library tab content lazy-rendered (`tab === "library"` guard) so inactive tab doesn't mount on open

---

## 12. UI polish

| Area | Change |
|------|--------|
| `button.tsx` | New **`filled`** variant for pagination nav buttons |
| `exercise-library-pagination.tsx` | Uses `filled` variant; adjusted border/text colors for background visibility |
| `form-control-styles.ts` | Focus/hover rings `ring-2` (was `ring-3`); exported `formControlFilled` |
| Library headers | Icon consistency (e.g. Dumbbell on exercise library) |
| `instructor-home.tsx` | Minor layout tweaks for background |
| `exercise-search.tsx` | Styling alignment |
| `calendar-header.tsx`, `calendar-panel.tsx` | Layout adjustments for background |

---

## 13. Files created

| File | Purpose |
|------|---------|
| `client/public/background-image.png` | Brand background image |
| `client/public/layered-dark-logo.png` | Light-theme logo |
| `client/public/layered-light-logo.png` | Dark-theme logo |
| `client/src/components/layout/page-background.tsx` | Route-aware background wrapper |
| `client/src/components/scheduling/calendar-day-status-dots.tsx` | Status dots + legend |
| `client/src/lib/calendar-instance-status-styles.ts` | Shared status styling for week grid & overview |
| `client/src/lib/class-plan-exercise-field-visibility.ts` | Reformer-only Machine Setup helper |
| `client/src/lib/validation/scheduling-past-guard.ts` | Client past-time validation helpers |

---

## 14. Files modified

### Client — app & assets

- `client/src/app/(dashboard)/calendar/page.tsx`
- `client/src/app/(dashboard)/class-plans/page.tsx`
- `client/src/app/(dashboard)/clients/page.tsx`
- `client/src/app/(dashboard)/exercises/page.tsx`
- `client/src/app/(dashboard)/week-overview/page.tsx`
- `client/src/app/forgot-password/page.tsx`
- `client/src/app/globals.css`
- `client/src/app/login/page.tsx`
- `client/src/app/register/page.tsx`
- `client/src/app/reset-password/page.tsx`
- `client/src/app/manifest.json`
- App icons (apple-icon, favicon, icon0.svg, icon1.png, manifest PNGs)

### Client — components

- `components/auth/auth-page-shell.tsx`
- `components/class-plans/class-plan-detail-view.tsx`
- `components/class-plans/class-plan-library-header.tsx`
- `components/class-plans/edit-class-plan-exercise-dialog.tsx`
- `components/class-plans/exercise-picker-dialog.tsx`
- `components/class-plans/section-exercise-row.tsx`
- `components/clients/client-library-header.tsx`
- `components/dashboard/dashboard-mini-calendar.tsx`
- `components/dashboard/instructor-home.tsx`
- `components/exercises/exercise-form.tsx`
- `components/exercises/exercise-library-header.tsx`
- `components/exercises/exercise-library-pagination.tsx`
- `components/exercises/exercise-search.tsx`
- `components/layout/app-layout.tsx`
- `components/layout/sidebar.tsx`
- `components/scheduling/calendar-header.tsx`
- `components/scheduling/calendar-month-view.tsx`
- `components/scheduling/calendar-panel.tsx`
- `components/scheduling/calendar-week-view.tsx`
- `components/scheduling/class-instance-drawer.tsx`
- `components/scheduling/create-class-dialog.tsx`
- `components/scheduling/quick-schedule-dialog.tsx`
- `components/scheduling/week-overview-panel.tsx`
- `components/ui/button.tsx`
- `components/ui/time-picker.tsx`
- `components/ui/time-picker-panel.tsx`

### Client — lib & validation

- `lib/calendar-utils.ts`
- `lib/datetime-local.ts`
- `lib/form-control-styles.ts`
- `lib/validation/create-class-form-schema.ts`
- `lib/validation/quick-schedule-form-schema.ts`

### Server

- `server/src/modules/scheduling/scheduling.service.ts`
- `server/src/modules/scheduling/scheduling.validation.ts`

---

## 15. Server API changes

### `scheduling.validation.ts`

| Schema / endpoint | Past guard |
|-------------------|------------|
| `createClassSchema` | `assertStartTimeNotPast` — one-off: rejects if `time` is past; recurring: checks first occurrence on start date when that weekday is selected |
| `quickScheduleSchema` | Rejects if parsed start instant is in the past |
| `updateClassInstanceSchema` | Rejects if `time` is in the past |
| `updateClassSchema` | Rejects past `rescheduleToDate`; rejects past `time` when rescheduling series |

### `scheduling.service.ts`

- `listClassInstancesForCalendar` — widens `date` filter by ±1 UTC day each side of the requested range

---

## 16. Testing checklist

### Branding & auth

- [ ] Login, register, forgot-password, reset-password render split layout on desktop
- [ ] Logos swap correctly in light vs dark mode (auth + sidebar)
- [ ] Background image visible on dashboard, week overview, class plans, exercises, clients, calendar
- [ ] Cards remain readable over background in both themes

### Calendar

- [ ] Week grid shows 12 AM through 11 PM; scroll to top/bottom for early/late hours
- [ ] Schedule a class at 3 AM (or other early hour) — appears on correct day column
- [ ] Month view and mini calendar show correct status dots (scheduled / completed / cancelled)
- [ ] Week grid: group (blue), private (accent), completed (muted), cancelled (red/strikethrough) are visually distinct
- [ ] Week overview cards match status styling
- [ ] Clicking past hour slots on today is disabled

### Scheduling guards

- [ ] Create Class — cannot pick past time when date is today
- [ ] Quick Schedule — same; past slot prefill cleared on open
- [ ] Class drawer reschedule — past time blocked with inline error
- [ ] API returns 400 for past-time create/reschedule attempts

### Class plans

- [ ] Mat plan → Add exercise → Machine Setup hidden
- [ ] Reformer plan → Add exercise → Machine Setup shown
- [ ] Standalone exercise create/edit → Machine Setup always shown
- [ ] Exercise picker opens on Create tab without animation jank

---

## 17. Follow-ups & notes

- **Remember Me:** Can be re-added when Better Auth server is configured to accept `rememberMe` on `signIn.email`
- **Auto-scroll:** Week grid is ~1728px tall; optional enhancement to scroll to current hour (or ~6 AM) on load
- **Background on detail pages:** `/exercises/[id]`, `/class-plans/[id]`, etc. do not show the brand background by design
- **Other class-type fields:** Only Machine Setup was scoped; equipment, springs, and other apparatus fields are unchanged
- **Edit class dialog:** Past-time guards apply to create, quick-schedule, and drawer reschedule — verify edit-class-dialog if rescheduling is added there later

---

*Generated from agent sessions: 803738da, 189f4b1b, 6cbe15ae, fddd21b4, caba834f — June 2026.*
