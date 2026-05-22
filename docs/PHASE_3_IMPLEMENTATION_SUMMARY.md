# Phase 3 — Calendar & Class Scheduling — Implementation Summary

This document records what was implemented for **Phase 3: Calendar and Class Scheduling** (per the internal Phase 3 plan). It is a **working log / handoff** document, not the canonical product spec (see `.cursor/plans/` for planning artifacts).

---

## Overview

End-to-end scheduling was added: **Prisma models and migration**, **Express scheduling APIs** (classes, class instances, quick schedule, copy-on-use templates), and **Next.js UI** (calendar week/month, week overview, quick schedule from class plans, instance drawer, recurring class creation, edit-scope for recurring instance reschedules).

**Deferred by design (later phases):** `Client`, `Enrollment`, `Attendance`, `SessionNote` models and roster/attendance UI (Phase 4+).

---

## 1. Database (Prisma)

**File:** `server/prisma/schema.prisma`

### Added / updated

- **`ClassInstance`** model: `classId`, `date` (`@db.Date`), `time` (`@db.Timestamptz`), `status` (`InstanceStatus`), `instructorId`, optional `templateId` (audit only), `isCustomised`, denormalized `classType` / `classStyle`, scaffold fields (`rating`, `reflectionNotes`, `reviewedAt`), `createdAt`, `deletedAt`.
- **`Class`**: relations to `Instructor`, optional `ClassPlanTemplate`, `instances[]`.
- **`Instructor`**: `classes[]`, `classInstances[]`.
- **`ClassPlanTemplate`**: `classInstances[]`, `classes[]` (series-level template reference).
- **`PlanSection`**: foreign key / relation to **`ClassInstance`** (`classInstanceId`), cascade delete.

### Migration

- Applied migration: `server/prisma/migrations/20260519114559_add_class_instance_scheduling/migration.sql`
- Regenerate client: `npx prisma generate` (from `server/`).

### Service rule (not enforced in DB)

- Each `PlanSection` must have **exactly one** of `templateId` or `classInstanceId` set — enforced in scheduling services when creating/updating sections.

---

## 2. Backend — Scheduling module

**Directory:** `server/src/modules/scheduling/`

| File | Purpose |
|------|---------|
| `scheduling.validation.ts` | Zod schemas for bodies and list query params |
| `scheduling.service.ts` | Business logic: CRUD, recurrence, copy-on-use, regeneration |
| `class.routes.ts` | `/api/classes` |
| `class-instance.routes.ts` | `/api/class-instances` (+ nested sections/exercises) |
| `quick-schedule.routes.ts` | `POST /api/quick-schedule` |

**Mounted in:** `server/src/app.ts`

```text
/api/classes
/api/class-instances
/api/quick-schedule
```

All scheduling routes use **`authenticate`** and instructor ownership checks; list/detail filters respect **`deletedAt: null`** where applicable.

### Request validation middleware

**File:** `server/src/middleware/validate.middleware.ts`

- **`validate()`** assigns **`req.body = schema.parse(req.body)`** (not only `parse` for side effects). Without this, JSON bodies stay as raw strings and **`z.coerce.date()`** output is discarded — it caused runtime errors in scheduling date helpers (e.g. `getUTCFullYear` on strings) for **`POST /api/classes`** and any other body-validated route.
- **`ZodType`** is used for schema parameters instead of deprecated **`ZodSchema`** (Zod 4 compatibility export).

### Key behaviors

- **`copyTemplateToInstanceInternal`**: Loads template sections + exercises, deletes existing instance sections, recreates rows with `classInstanceId` only, sets instance `templateId` / denormalized fields / `isCustomised: false`.
- **`POST /api/quick-schedule`**: One-off `Class` + one `ClassInstance`; optional template copy; `syncWithTemplate` forced off for MVP.
- **`POST /api/classes`**: One-off or recurring; optional `templateId` copies plan to **each** generated instance; recurrence JSON shape `{ daysOfWeek: number[] }` (ISO Mon=1 … Sun=7); cap on generated instance count (**520**).
- **`PATCH /api/classes/:id`**: Series updates; optional **`regenerateFutureInstancesFrom`** (`YYYY-MM-DD`) for recurring: deletes future **SCHEDULED** instances from that anchor and regenerates. Optional **`rescheduleToDate`** (`YYYY-MM-DD`) — used with regeneration from the instance drawer: when the target date differs from the anchor, the service computes a **calendar-day offset**, **shifts `recurrenceRule.daysOfWeek`** by that offset, and regenerates from the target date (calendar-style “this and following” move). When only **time** changes (same calendar date), weekdays are unchanged.
- **Instance plan CRUD** (nested routes): section add/update/delete, exercise add/update/remove — sets **`isCustomised: true`** on the instance (except assign-template flow, which resets copy state).

### Recurring instance reschedule (drawer → API)

| Scope | API | Effect |
|-------|-----|--------|
| **Just this class** | `PATCH /api/class-instances/:id` with `date` + `time` | Moves **one** occurrence to any calendar date/time. Past and other future sessions keep the existing series pattern. |
| **All future classes** | `PATCH /api/classes/:id` with `time`, `regenerateFutureInstancesFrom` (anchor = edited instance date), `rescheduleToDate` (user’s chosen date) | Deletes **SCHEDULED** instances on or after the anchor, updates series clock, optionally **shifts weekdays** by anchor→target day offset, regenerates future slots. Past instances before the anchor are untouched. |

**Regeneration side effects:** future instances are **hard-deleted** and recreated with **new IDs** (not soft-deleted). The drawer must not reload the old instance id after “all future” — see frontend notes below.

**Helpers in `scheduling.service.ts`:** `calendarDayDiff`, `shiftDaysOfWeek`, `buildOccurrenceSlots`, `applyUTCTimeToDay` (series `time` stores clock; occurrence dates come from recurrence + calendar days).

### Recurrence

- `Class.recurrenceRule` stores JSON `{ daysOfWeek: number[] }`.
- Instance `time` combines series clock with each occurrence calendar day (UTC-oriented helpers in service).

---

## 3. Frontend — API & types

| Area | Location |
|------|----------|
| HTTP client | `client/src/services/scheduling-api.ts` |
| Shared types | `client/src/lib/types.ts` (scheduling block: `ScheduledClass`, `CalendarClassInstance`, `ClassInstanceDetail`, list/create/update bodies; **`UpdateClassBody.regenerateFutureInstancesFrom`**, **`UpdateClassBody.rescheduleToDate`**, etc.) |
| Calendar helpers | `client/src/lib/calendar-utils.ts` |
| Local date/time → ISO | `client/src/lib/datetime-local.ts` |
| Quick schedule Zod | `client/src/lib/validation/quick-schedule-form-schema.ts` |
| Create class Zod | `client/src/lib/validation/create-class-form-schema.ts` |
| Calendar data hook | `client/src/hooks/scheduling/use-calendar-instances.ts` |

---

## 4. Frontend — UI & flows

### Flow 2 — Quick schedule

- **Component:** `client/src/components/scheduling/quick-schedule-dialog.tsx`
- **Wired from:**
  - `client/src/components/class-plans/class-plan-card.tsx` (Schedule on card)
  - `client/src/components/class-plans/class-plan-detail-view.tsx` (**Schedule this plan** in header)
- **Also from:** Calendar empty slot → `client/src/app/(dashboard)/calendar/page.tsx` (slot prefill into the same dialog)

### Calendar

- **Page:** `client/src/app/(dashboard)/calendar/page.tsx`
- **Pieces:** `calendar-header.tsx`, `calendar-week-view.tsx`, `calendar-month-view.tsx`
- **Interactions:** Week/month toggle; prev/next/today; click event → **Class instance drawer**; click empty hour band → quick schedule; **New class** → create-class dialog.

### Class instance drawer

- **Component:** `client/src/components/scheduling/class-instance-drawer.tsx`
- **Uses:** `client/src/components/scheduling/instance-exercise-row.tsx` for per-row metadata edits (reps/duration/notes) against instance APIs.
- **Features:** Mark complete / cancel; assign or swap template (list from class plans); add/remove sections; clients placeholder copy; **reschedule** date/time with **`edit-scope-dialog.tsx`** when the parent class is recurring (**this instance** vs **all future**).

**Recurring reschedule UX (current):**

- **Just this class** — one-off move to any date (e.g. skip a holiday week without changing the series weekdays).
- **All future classes** — calendar-style “this and following”: changing **date** shifts the whole series by the day offset (e.g. Sat → Mon if the user picks a Monday). Changing **time only** updates the series clock for future occurrences on the same weekdays.
- **Not the same as “edit series start date”** — changing `startDate` / `daysOfWeek` while keeping the same weekly pattern is **series-level** editing (see follow-ups: **Edit class dialog**). The drawer date picker is optimized for **occurrence** moves, not full series rule edits.

**Post-regeneration drawer behavior:** `ClassInstanceDrawer` accepts optional **`onInstanceIdChange`**. After “all future”, the parent (`calendar/page.tsx`, `week-overview/page.tsx`) updates `drawerId` to the replacement instance from `PATCH /api/classes/:id` response (`instances[]` matched by `rescheduleToDate`, else first future scheduled row). Avoids `GET /api/class-instances/:oldId` 404 after hard-delete regeneration.

**Layout / shell (shadcn `Sheet`):** `client/src/components/ui/sheet.tsx` applies high-specificity defaults (`data-[side=right]:w-3/4`, `data-[side=right]:sm:max-w-sm`). The drawer overrides with **`data-[side=right]:w-full`** and **`data-[side=right]:sm:max-w-3xl`** so width changes actually apply.

**Attach template dialog:** Wider content (`sm:max-w-3xl` with the same max-width pattern as the drawer). **Selection UX:** searchable list of templates as **radio rows** (full-row hit target, `role="radiogroup"`); user picks a template then confirms with **Attach template** (avoids accidental one-click attach). Empty search / no templates copy is handled explicitly.

**Session actions toolbar:** Short **“Session actions”** heading and muted description above the buttons (clarifies these controls apply to **this scheduled occurrence**). Button order: **Mark complete** (primary) → **Assign / swap template** → **Add section** (both outline) → **Cancel class** (destructive). Assign / Add section are **`disabled` while `pending`** during other mutations.

**Global buttons:** `client/src/components/ui/button.tsx` includes **`cursor-pointer`** on the shared `Button` primitive (disabled buttons still use `disabled:pointer-events-none`).

### Week overview

- **Page:** `client/src/app/(dashboard)/week-overview/page.tsx`
- **Nav:** `client/src/components/layout/sidebar.tsx` — **Week Overview** entry (after Calendar).

### Recurring class creation (Flow 1 entry)

- **Component:** `client/src/components/scheduling/create-class-dialog.tsx`
- **Opened from:** Calendar header **New class** (distinct from quick schedule).
- **Note:** Optional template is currently implemented as an optional **template ID** text field (quick bridge); the instance drawer uses a **searchable radio list + explicit “Attach template”** for assign/swap.

---

## 5. Copy-on-use rules (MVP)

| Rule | Implementation |
|------|------------------|
| No live template sync | `syncWithTemplate` not used for live sync; writes keep it off |
| Template edits never mutate instances | Instance sections are independent copies |
| `templateId` on instance | Audit reference; assign/copy sets it |
| `assign-template` | Replaces instance plan; `isCustomised: false` |
| Instance section/exercise edits | `isCustomised: true` |

---

## 6. Build / run

- **Server:** `npm run build --prefix server` (TypeScript compile).
- **Client:** `npm run build --prefix client` (Next.js production build).
- **DB:** Ensure `DATABASE_URL` is set and migrations applied (`npx prisma migrate dev` from `server/` in development).

---

## 7. Testing checklist (manual)

Suggested checks before demo or release:

- [ ] Quick schedule from a **class plan** copies sections; template unchanged; instance `isCustomised` false.
- [ ] Quick schedule from **calendar slot** without template creates a bare instance.
- [ ] Week grid shows events at correct local day/time; **GROUP** vs **PRIVATE** styling differs.
- [ ] **Assign template:** pick a row, then **Attach template**; plan replaces and customised flag clears.
- [ ] Editing instance exercise fields sets **customised** (via row blur saves).
- [ ] **Recurring create** yields instances on selected weekdays within date range.
- [ ] **Just this class** vs **all future** reschedule paths for recurring instances.
- [ ] **All future** with **date change**: future sessions shift weekday by day offset; drawer stays open on new instance id (not 404 on old id).
- [ ] **All future** with **time-only change**: same weekdays, updated clock for following sessions.
- [ ] Soft-deleted classes/instances **do not** appear in calendar range queries.
- [ ] Cross-instructor access is denied (401/404 as implemented).

---

## 8. Known gaps / follow-ups (optional)

- **Drag-and-drop reorder:** Arrow up/down reorder is shipped for instance drawer + template planner; true DnD (e.g. shared `@dnd-kit`) deferred post-MVP.
- **Hooks:** plan mentioned `useQuickSchedule` / `useClassInstanceDetail`; current code inlines fetch in components or uses `useCalendarInstances` only — add dedicated hooks if you want stricter reuse.
- **Timezone edge cases:** calendar uses local dates for range queries vs server `DATE` storage; document instructor timezone assumptions if you expand globally.

### Phase 3 completion pass (May 2026)

**Backend (A1–A4):**

- `GET /api/classes` — optional `type`, `startDate`, `endDate` filters
- `GET /api/class-instances` — optional `status`, `classId` filters (calendar still uses `start`/`end`)
- `DELETE /api/classes/:id` — soft-deletes future instances only (`date >= today`); past records preserved
- `POST /api/quick-schedule` — returns full `instanceDetailInclude` shape (UI unchanged)
- Instance detail includes `template: { id, name }` for badge copy

**Frontend:**

- `ExercisePickerDialog` — discriminated `mode: "template" | "instance"`
- Instance drawer — section/exercise arrow reorder, rename, add exercise, template badges, reset to template, **Edit series…**
- `edit-class-dialog.tsx` — series PATCH with regeneration confirm (no `rescheduleToDate`)
- Calendar week view + week overview — show `classType · classStyle` when set
- Create-class dialog — recurrence form only (template picker reverted; attach plan per instance or quick-schedule instead)

**New files:** `client/src/components/scheduling/edit-class-dialog.tsx`

---

## 9. File index (quick reference)

**Server**

- `server/prisma/schema.prisma`
- `server/prisma/migrations/20260519114559_add_class_instance_scheduling/migration.sql`
- `server/src/middleware/validate.middleware.ts` (body/query parse assignment; `ZodType`)
- `server/src/app.ts`
- `server/src/modules/scheduling/scheduling.service.ts`
- `server/src/modules/scheduling/scheduling.validation.ts`
- `server/src/modules/scheduling/class.routes.ts`
- `server/src/modules/scheduling/class-instance.routes.ts`
- `server/src/modules/scheduling/quick-schedule.routes.ts`

**Client**

- `client/src/services/scheduling-api.ts`
- `client/src/lib/types.ts`
- `client/src/lib/calendar-utils.ts`
- `client/src/lib/datetime-local.ts`
- `client/src/lib/validation/quick-schedule-form-schema.ts`
- `client/src/lib/validation/create-class-form-schema.ts`
- `client/src/hooks/scheduling/use-calendar-instances.ts`
- `client/src/components/scheduling/quick-schedule-dialog.tsx`
- `client/src/components/scheduling/create-class-dialog.tsx`
- `client/src/components/scheduling/edit-class-dialog.tsx`
- `client/src/components/class-plans/exercise-picker-dialog.tsx` (template + instance modes)
- `client/src/components/scheduling/edit-scope-dialog.tsx`
- `client/src/components/scheduling/calendar-header.tsx`
- `client/src/components/scheduling/calendar-week-view.tsx`
- `client/src/components/scheduling/calendar-month-view.tsx`
- `client/src/components/scheduling/class-instance-drawer.tsx`
- `client/src/components/scheduling/instance-exercise-row.tsx`
- `client/src/app/(dashboard)/calendar/page.tsx`
- `client/src/app/(dashboard)/week-overview/page.tsx`
- `client/src/components/class-plans/class-plan-card.tsx`
- `client/src/components/class-plans/class-plan-detail-view.tsx`
- `client/src/components/layout/sidebar.tsx`
- `client/src/components/ui/sheet.tsx` (default sheet widths; override pattern for wide panels)
- `client/src/components/ui/dialog.tsx` (default `sm:max-w-sm` on content; override with explicit `sm:max-w-*` when needed)
- `client/src/components/ui/button.tsx` (`cursor-pointer` on interactive buttons)

---

*Last updated: May 2026 — Phase 3 completion pass (API filters, future-only series delete, full quick-schedule response, template name on detail, instance plan editor parity, Edit class series dialog, calendar classType/classStyle labels). Create-class template picker (Part F) reverted. Drag-and-drop reorder deferred post-MVP.*
