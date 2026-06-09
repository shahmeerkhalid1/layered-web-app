# Unique Names & Recurring Enrollment — Changelog

This document records the work done in a single development session on the **Pilates Platform (Layered.)** covering:

- Unique display names for folders, exercises, class plan templates, and class plan sections
- Client unenroll rules (past sessions, recurring soft-unenroll)
- Supporting server validation, client inline feedback, and database schema changes

**Scope:** `client/` + `server/`  
**Date context:** June 2026

---

## Table of contents

1. [Summary](#1-summary)
2. [Unique name validation](#2-unique-name-validation)
3. [Client unenroll & recurring enrollment](#3-client-unenroll--recurring-enrollment)
4. [Database changes](#4-database-changes)
5. [New server files](#5-new-server-files)
6. [New client files](#6-new-client-files)
7. [Server files modified](#7-server-files-modified)
8. [Client files modified](#8-client-files-modified)
9. [API behavior reference](#9-api-behavior-reference)
10. [UI behavior & current limitations](#10-ui-behavior--current-limitations)
11. [Testing guide](#11-testing-guide)
12. [Migration & deployment](#12-migration--deployment)

---

## 1. Summary

| Area | What changed |
|------|----------------|
| **Exercise folders** | Duplicate folder names blocked per instructor (case-insensitive, trimmed). |
| **Class plan folders** | Same as exercise folders. |
| **Exercise names** | Duplicate exercise names blocked per instructor on create/update. |
| **Class plan templates** | Duplicate template titles blocked per instructor; duplicate copy names auto-suffixed. |
| **Class plan sections** | Duplicate section names blocked within the same template or class instance. |
| **Client unenroll (guard)** | Unenroll disabled when class has no upcoming scheduled instances. |
| **Recurring unenroll** | Soft unenroll via `Enrollment.unenrolledAt` — removes client from **future** sessions only; past/completed history preserved. |
| **Non-recurring unenroll** | Hard delete of `Enrollment` row (unchanged semantics). |

**Cross-cutting patterns:**

- Server: `ConflictError` (409) for duplicate names; `ValidationError` (400) for invalid unenroll.
- Client: shared `isDuplicateDisplayName()` helper; inline field errors + disabled submit; `ApiError` toast fallback.
- Case-insensitive matching with trim on all name fields.

---

## 2. Unique name validation

### 2.1 Exercise & class plan folders

**Server**

- `assertUniqueExerciseFolderName()` in `exercise.service.ts`
- `assertUniqueClassPlanFolderName()` in `class-plan-folder.service.ts`
- Zod: `createFolderSchema` / `createClassPlanFolderSchema` use `.trim().min(1)`

**Client**

- `FolderDialog` accepts `existingFolders`; live duplicate check while typing
- Hooks pass `ApiError.message` on save failure
- Pages pass `library.folders` into `FolderDialog`

**Error message:** `"A folder with this name already exists"`

---

### 2.2 Exercise names

**Server**

- `assertUniqueExerciseName()` in `exercise.service.ts` — scoped to instructor, non-deleted exercises
- Called on `createExercise` and `updateExercise` (when `name` is provided)
- Zod: `createExerciseSchema.name` → `.trim().min(1)`

**Client**

- `exercise-form.tsx` and `exercise-form-multistep.tsx` load full exercise list via `exerciseApi.getExercises()` on mount
- Inline duplicate error on name field; submit disabled when duplicate
- `ApiError` surfaced in toast on save failure

**Error message:** `"An exercise with this name already exists"`

---

### 2.3 Class plan template names

**Server**

- `assertUniqueClassPlanName()` in `class-plan.service.ts`
- Called on `createClassPlan` and `updateClassPlan` (when `name` changes)
- `duplicateClassPlan()` uses `resolveUniqueClassPlanCopyName()` → `"Name (Copy)"`, then `"Name (Copy 2)"`, etc.
- Zod: `createClassPlanSchema.name` → `.trim().min(1).max(200)`

**Client**

- `create-template-dialog.tsx` and `edit-class-plan-dialog.tsx` fetch up to 100 plans on dialog open
- Inline duplicate check on title field; submit disabled when duplicate

**Error message:** `"A class plan with this name already exists"`

---

### 2.4 Class plan section names

**Server**

- Shared lib: `server/src/lib/plan-section-name.ts`
  - `assertUniquePlanSectionName(name, scope, excludeSectionId?)` — scope is `{ templateId }` or `{ classInstanceId }`
  - `assertUniqueSectionNamesInPayload(sections[])` — validates bulk create/update payloads
- Used in:
  - `class-plan.service.ts` — `addSection`, `updateSection`, `createClassPlan`, `updateClassPlan`
  - `scheduling.service.ts` — `addInstanceSection`, `updateInstanceSection`
- Zod: `addSectionSchema`, `updateSectionSchema`, `planSectionSchema` — `.trim()` on `name`

**Client**

- `class-plan-detail-view.tsx` — add/rename section dialogs
- `class-instance-drawer.tsx` — add/rename section dialogs for customised instances

**Error message:** `"A section with this name already exists in this class plan"`

---

## 3. Client unenroll & recurring enrollment

### 3.1 Problem

Originally, unenroll **deleted** the `Enrollment` row entirely. For recurring classes this removed the client from the series roster even for past sessions (attendance/notes rows remained, but roster semantics were lost).

### 3.2 Solution: soft unenroll for recurring classes

**New column:** `Enrollment.unenrolledAt DateTime?`

When unenrolling from a **recurring** class (`Class.isRecurring === true`):

- Set `unenrolledAt` to start of today (UTC calendar date) via `unenrollEffectiveAt()`
- **Do not** delete the enrollment row

When unenrolling from a **non-recurring** class:

- **Delete** the enrollment row (previous behavior)

### 3.3 Roster scope helper

**File:** `server/src/lib/enrollment-scope.ts`

```typescript
activeEnrollmentFilter = { unenrolledAt: null }

enrollmentAppliesToInstance(enrollment, instance):
  - If unenrolledAt is null → applies to all instances
  - If instance status is COMPLETED or CANCELLED → always applies (historical roster)
  - Otherwise → applies only if instance.date < unenrolledAt (calendar day, UTC)
```

Used by:

- `getAttendance()` — filters roster per instance
- `markAttendance()` — validates client is on roster for that instance
- `session-note.service.ts` — `assertClientPresentOnInstance()` enrollment check
- `getEnrollments()` — returns only active enrollments (`unenrolledAt: null`)
- `getClientById()` — enrolled classes list filters active only

### 3.4 Re-enrollment

`enrollClients()` now handles three cases per client:

| State | Action |
|-------|--------|
| No enrollment row | `createMany` |
| Row with `unenrolledAt` set | `updateMany` → clear `unenrolledAt` |
| Row with `unenrolledAt` null | Skip (conflict) |

### 3.5 Unenroll guard (no upcoming sessions)

**File:** `server/src/lib/upcoming-instances.ts`

- `getClassIdsWithUpcomingScheduledInstances(classIds[])` — class has ≥1 `SCHEDULED` instance with `date >= today`
- `assertClassHasUpcomingScheduledInstances(classId)` — throws if none (used before unenroll)

**Client:** `canUnenroll` on each enrollment in `getClientById`; Unenroll button disabled with helper text *"No upcoming sessions"*

### 3.6 Private vs group

Soft unenroll is **not** tied to `Class.type` (`PRIVATE` / `GROUP`). It applies to **any recurring class**.

Current UI note: **Manage enrollment** and **attendance** in the class instance drawer are rendered only when `detail.class.type === "PRIVATE"`. Group recurring enroll/unenroll is done via **Client management** (`/clients/[id]/edit`).

---

## 4. Database changes

### Schema (`server/prisma/schema.prisma`)

```prisma
model Enrollment {
  id           String    @id @default(cuid())
  clientId     String
  classId      String
  enrolledAt   DateTime  @default(now())
  unenrolledAt DateTime?  // NEW — soft unenroll for recurring classes

  // ... relations unchanged
}
```

### Migration

**`server/prisma/migrations/20260609120000_enrollment_unenrolled_at/migration.sql`**

```sql
ALTER TABLE "Enrollment" ADD COLUMN "unenrolledAt" TIMESTAMP(3);
```

---

## 5. New server files

| File | Purpose |
|------|---------|
| `server/src/lib/plan-section-name.ts` | Unique section name checks (template + instance scope); bulk payload validation |
| `server/src/lib/upcoming-instances.ts` | Upcoming scheduled instance queries; unenroll precondition |
| `server/src/lib/enrollment-scope.ts` | `activeEnrollmentFilter`, `enrollmentAppliesToInstance()`, `unenrollEffectiveAt()` |
| `server/prisma/migrations/20260609120000_enrollment_unenrolled_at/migration.sql` | Adds `unenrolledAt` column |

---

## 6. New client files

| File | Purpose |
|------|---------|
| `client/src/lib/validation/unique-display-name.ts` | `isDuplicateDisplayName()` + shared error message constants |

**Constants exported:**

- `DUPLICATE_EXERCISE_NAME_MESSAGE`
- `DUPLICATE_CLASS_PLAN_NAME_MESSAGE`
- `DUPLICATE_CLASS_PLAN_SECTION_NAME_MESSAGE`

*(Folder duplicate message is inline in `folder-dialog.tsx` — same text as server.)*

---

## 7. Server files modified

| File | Changes |
|------|---------|
| `server/prisma/schema.prisma` | `Enrollment.unenrolledAt` |
| `server/src/modules/exercises/exercise.validation.ts` | Folder + exercise name `.trim()` |
| `server/src/modules/exercises/exercise.service.ts` | `ConflictError`; `assertUniqueExerciseFolderName`, `assertUniqueExerciseName` |
| `server/src/modules/class-plans/class-plan-folder.validation.ts` | Folder name `.trim()` |
| `server/src/modules/class-plans/class-plan-folder.service.ts` | Unique folder name on create/update |
| `server/src/modules/class-plans/class-plan.validation.ts` | Plan + section name `.trim()`; plan title refine message |
| `server/src/modules/class-plans/class-plan.service.ts` | Unique plan/section names; `resolveUniqueClassPlanCopyName` for duplicate |
| `server/src/modules/scheduling/scheduling.service.ts` | Soft/hard unenroll; enroll reactivation; attendance roster filtering; unique instance sections |
| `server/src/modules/clients/client.service.ts` | Active enrollment filter; `canUnenroll`; filtered `_count.enrollments` |
| `server/src/modules/session-notes/session-note.service.ts` | Instance-aware enrollment check via `enrollmentAppliesToInstance` |

---

## 8. Client files modified

| File | Changes |
|------|---------|
| `client/src/lib/types.ts` | `ClientDetail.enrollments[].canUnenroll` |
| `client/src/components/exercises/folder-dialog.tsx` | `existingFolders` prop; inline duplicate UI |
| `client/src/hooks/exercises/use-exercise-folders.ts` | `ApiError` toast |
| `client/src/hooks/class-plans/use-class-plan-folders.ts` | `ApiError` toast |
| `client/src/app/(dashboard)/exercises/page.tsx` | Pass `existingFolders` to `FolderDialog` |
| `client/src/app/(dashboard)/class-plans/page.tsx` | Pass `existingFolders` to `FolderDialog` |
| `client/src/components/exercises/exercise-form.tsx` | Duplicate name check; `ApiError` toast |
| `client/src/components/exercises/exercise-form-multistep.tsx` | Same |
| `client/src/components/class-plans/create-template-dialog.tsx` | Plan title duplicate check; `ApiError` toast |
| `client/src/components/class-plans/edit-class-plan-dialog.tsx` | Same |
| `client/src/components/class-plans/class-plan-detail-view.tsx` | Section add/rename duplicate check; `ApiError` toast |
| `client/src/components/scheduling/class-instance-drawer.tsx` | Instance section add/rename duplicate check; `ApiError` toast |
| `client/src/app/(dashboard)/clients/[id]/edit/page.tsx` | `canUnenroll` disabled state; confirm copy; `ApiError` / API success message toast |

---

## 9. API behavior reference

### Duplicate names → `409 Conflict`

| Endpoint | Message |
|----------|---------|
| `POST/PATCH /api/exercise-folders` | A folder with this name already exists |
| `POST/PATCH /api/class-plan-folders` | A folder with this name already exists |
| `POST/PATCH /api/exercises` | An exercise with this name already exists |
| `POST/PATCH /api/class-plans` | A class plan with this name already exists |
| Section routes (template + instance) | A section with this name already exists in this class plan |

### Unenroll

| Endpoint | Recurring class | Non-recurring class |
|----------|-----------------|---------------------|
| `DELETE /api/classes/:id/enrollments` | Sets `unenrolledAt`; message: *unenrolled from upcoming sessions* | Deletes row; message: *Client unenrolled* |
| `DELETE .../enrollments/:enrollmentId` | Same (delegates) | Same |

**Precondition:** class must have ≥1 upcoming `SCHEDULED` instance → else `400 ValidationError`

### Client detail

`GET /api/clients/:id` — each enrollment includes:

```typescript
{
  id, classId, enrolledAt,
  canUnenroll: boolean,  // false when no upcoming scheduled instances
  class: { id, title, type, durationMinutes }
}
```

Only **active** enrollments returned (`unenrolledAt: null`).

---

## 10. UI behavior & current limitations

### What works in UI today

| Feature | Exercise / class plan folders | Exercises & plans | Sections | Client unenroll |
|---------|------------------------------|-------------------|----------|-----------------|
| Inline duplicate error | Yes | Yes | Yes | N/A |
| Server-enforced | Yes | Yes | Yes | Yes |
| Disabled submit/save | Yes | Yes | Yes | Unenroll disabled when `!canUnenroll` |

### Group vs private (scheduling drawer)

In `class-instance-drawer.tsx`, **attendance**, **session notes**, and **manage enrollment** (via `AttendanceChecklist`) render only when:

```tsx
detail.class.type === "PRIVATE"
```

Therefore for **recurring group** classes:

- **Enroll / unenroll:** Client edit page (`/clients/[id]/edit`) only
- **Verify roster on past/future instances:** No group UI yet — use Prisma Studio or `GET /api/class-instances/:id/attendance`
- **Mark attendance / session notes:** Private-only in drawer today

Backend roster logic (`enrollmentAppliesToInstance`) applies to **both** types; only the UI is asymmetric.

---

## 11. Testing guide

### Unique names (any library)

1. Create item with name `"Reformer"`
2. Attempt create/rename with `"reformer"` → inline error + 409 on submit
3. Rename to same name (edit self) → allowed

### Recurring group — soft unenroll (client management path)

**Setup**

1. Create **Group** + **Recurring** class with ≥1 future `SCHEDULED` instance
2. Optionally backdate one `ClassInstance.date` in Prisma Studio for past/future split

**Steps**

1. **Clients → Edit → Enroll in class** → select recurring group class
2. **Unenroll** → confirm dialog mentions upcoming sessions + history kept
3. Toast: *Client unenrolled from upcoming sessions*
4. Class removed from **Enrolled classes** list

**Prisma Studio checks**

| Table / field | Expected after unenroll |
|---------------|-------------------------|
| `Enrollment` row | Still exists |
| `Enrollment.unenrolledAt` | Set (not null) |
| `Attendance` (if any) | Unchanged |
| `SessionNote` (if any) | Unchanged |

**Re-enroll**

- Enroll same client again → `unenrolledAt` cleared; class reappears in enrolled list

**Optional API verification (no group roster UI)**

```http
GET /api/class-instances/{futureInstanceId}/attendance   → client absent
GET /api/class-instances/{pastInstanceId}/attendance    → client present (if enrolled before unenroll)
```

### Recurring private

Same soft-unenroll behavior; can additionally verify via **Manage enrollment** and **attendance** in the class drawer.

### Non-recurring (group or private)

- Unenroll **deletes** enrollment row (no `unenrolledAt`)
- Unenroll button disabled when no upcoming instances

---

## 12. Migration & deployment

```bash
# Apply migration
npx prisma migrate deploy --prefix server

# Regenerate client (if schema pulled on fresh clone)
npx prisma generate --prefix server

# Build
npm run build --prefix server
npm run build --prefix client
```

**Existing data:** All current enrollments have `unenrolledAt = null` (fully active). No backfill required.

---

## Design notes for future work

1. **Group attendance / roster UI** — Expose `AttendanceChecklist` (or a read-only roster) for `GROUP` instances so instructors can mark attendance and verify soft-unenroll without Prisma/API.
2. **Enrolled classes history on client profile** — Optional “Past enrollments” section showing soft-unenrolled series for transparency.
3. **Database unique indexes** — App-layer checks only today; optional `@@unique` on normalized name per instructor if race conditions become a concern (folders, exercises, templates).
4. **Class plan client duplicate check pagination** — Create/edit dialogs load `limit: 100` plans; instructors with >100 templates may need server-side name check only.

---

*End of changelog.*
