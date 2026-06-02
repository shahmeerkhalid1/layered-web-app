# Phase 4: Client Management — Technical Documentation

Implementation of instructor client roster management: CRUD, enrollment, attendance, and related UI. Includes follow-up enhancements (batch APIs, table library, view/edit split, form validation, dialog layout).

---

## Overview

| Area | Summary |
|------|---------|
| **Scope** | Client CRUD, class enrollment, per-instance attendance, library UI, dashboard integration |
| **Auth** | All routes require `authenticate` middleware; data scoped to `req.user.instructorId` |
| **Soft delete** | Clients use `deletedAt`; archive = soft delete; attendance history preserved |
| **Batch ops** | Single API calls for bulk enroll, unenroll, and archive (up to 100 IDs) |

---

## Database (Prisma)

### Models

**`Client`** — `server/prisma/schema.prisma`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | cuid |
| `firstName`, `lastName` | `String` | Required |
| `email` | `String` | **Required** (migration `20260601110013_client_email_required`) |
| `phone`, `injuries`, `focusAreas`, `goals` | `String?` | Optional text |
| `instructorId` | `String` | FK → `Instructor` |
| `deletedAt` | `DateTime?` | Soft delete |

**Constraints:** `@@unique([email, instructorId])`, `@@index([instructorId])`

**`Enrollment`** — links client to class series (`Class`)

| Field | Type | Notes |
|-------|------|-------|
| `clientId`, `classId` | `String` | FKs, cascade on delete |
| `enrolledAt` | `DateTime` | Default now |

**Constraints:** `@@unique([clientId, classId])`

**`Attendance`** — per `ClassInstance` presence

| Field | Type | Notes |
|-------|------|-------|
| `clientId`, `classInstanceId` | `String` | FKs, cascade on delete |
| `present` | `Boolean` | Default `false` |

**Constraints:** `@@unique([clientId, classInstanceId])`

### Migrations

| Migration | Purpose |
|-----------|---------|
| `20260601104431_add_client_management` | Creates `Client`, `Enrollment`, `Attendance` tables |
| `20260601110013_client_email_required` | `Client.email` NOT NULL |

---

## Backend API

### Mount points (`server/src/app.ts`)

- `app.use("/api/clients", clientRoutes)`
- Enrollment & attendance live under existing scheduling routers:
  - `/api/classes` → `class.routes.ts`
  - `/api/class-instances` → `class-instance.routes.ts`

### Client module — `server/src/modules/clients/`

#### Routes (`client.routes.ts`)

| Method | Path | Validation | Response |
|--------|------|------------|----------|
| `POST` | `/api/clients` | `createClientSchema` | `201` Client |
| `GET` | `/api/clients` | `listClientsQuerySchema` (query) | `{ data, total, page, limit }` |
| `DELETE` | `/api/clients` | `deleteClientsSchema` (body) | `{ removed, message }` **batch archive** |
| `GET` | `/api/clients/:id` | — | `ClientDetail` with enrollments |
| `PATCH` | `/api/clients/:id` | `updateClientSchema` | Updated client detail |
| `DELETE` | `/api/clients/:id` | — | `204` single archive |

**Route order:** `DELETE /` (batch) is registered **before** `GET /:id` to avoid param conflicts.

#### Validation (`client.validation.ts`)

- **Create/update:** `firstName`, `lastName`, `email` required; email validated with Zod `.email()`
- **List query:** `page` (default 1), `limit` (1–100, default 20), optional `search`
- **Batch delete:** `clientIds: string[]` (1–100)

#### Service (`client.service.ts`)

| Function | Behavior |
|----------|----------|
| `createClient` | Email uniqueness per instructor; trims strings; optional fields → `null` if empty |
| `listClients` | Paginated; search on firstName, lastName, email, phone (case-insensitive); includes `_count` enrollments/attendances |
| `getClientById` | Detail + enrollments (filters out soft-deleted classes) + attendance count |
| `updateClient` | Email conflict check when changed |
| `deleteClients` | Validates ownership; `updateMany` soft-delete; returns count + message |
| `deleteClient` | Delegates to `deleteClients([id])` |

**Active filter:** `{ deletedAt: null }` on all reads/writes.

### Scheduling — enrollment (`scheduling.service.ts`, `class.routes.ts`)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/api/classes/:id/enrollments` | — | `EnrollmentRow[]` |
| `POST` | `/api/classes/:id/enrollments` | `{ clientIds: string[] }` | `{ enrollments, created, skipped }` |
| `DELETE` | `/api/classes/:id/enrollments` | `{ enrollmentIds: string[] }` | `{ removed, message }` |
| `DELETE` | `/api/classes/:id/enrollments/:enrollmentId` | — | Same as batch (single ID) |

**`enrollClients` logic:**

1. Assert class owned by instructor
2. Dedupe `clientIds`
3. Verify all clients exist and belong to instructor
4. Skip already-enrolled; `ConflictError` if none left to create
5. `createMany` + return new rows with `created` / `skipped` counts

**`unenrollClients` logic:**

1. Assert class owned
2. Verify all enrollment IDs belong to class
3. `deleteMany` + return `removed` count

### Scheduling — attendance (`class-instance.routes.ts`)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/api/class-instances/:id/attendance` | — | `AttendanceRow[]` (enrolled clients + present flag) |
| `PATCH` | `/api/class-instances/:id/attendance` | `{ attendance: [{ clientId, present }] }` | Updated rows |

**`getAttendance`:** Lists enrolled clients for the instance’s class; merges saved `Attendance` rows (`present: null` if never marked).

**`markAttendance`:** Upserts attendance for enrolled clients only.

---

## Frontend

### Routes (App Router)

| Route | File | Purpose |
|-------|------|---------|
| `/clients` | `app/(dashboard)/clients/page.tsx` | Paginated library (table) |
| `/clients/new` | `app/(dashboard)/clients/new/page.tsx` | Create client form |
| `/clients/[id]` | `app/(dashboard)/clients/[id]/page.tsx` | **View-only** profile |
| `/clients/[id]/edit` | `app/(dashboard)/clients/[id]/edit/page.tsx` | Edit form + enrollments |

### Types (`client/src/lib/types.ts`)

- `Client`, `ClientDetail`, `ClientListResponse`
- `EnrollmentRow`, `EnrollClientsResponse`, `UnenrollClientsResponse`
- `DeleteClientsResponse`, `AttendanceRow`

### API client (`client/src/services/client-api.ts`)

| Method | Endpoint | Notes |
|--------|----------|-------|
| `listClients` | `GET /clients` | Default `CLIENT_PAGE_SIZE = 20` |
| `getClientById` | `GET /clients/:id` | |
| `createClient` | `POST /clients` | |
| `updateClient` | `PATCH /clients/:id` | |
| `deleteClient` | `DELETE /clients/:id` | Single archive |
| `deleteClients` | `DELETE /clients` + body | Batch archive |
| `getEnrollments` | `GET /classes/:id/enrollments` | |
| `enrollClients` / `enrollClient` | `POST /classes/:id/enrollments` | Batch / single wrapper |
| `unenrollClients` / `unenrollClient` | `DELETE` enrollment routes | |
| `getAttendance` / `markAttendance` | `/class-instances/:id/attendance` | |

### Generic API change (`client/src/lib/api.ts`)

`api.delete<T>(endpoint, body?, options?)` — optional JSON body for batch `DELETE` (enrollment + client archive).

### Validation (`client/src/lib/validation/client-form-schema.ts`)

Mirrors server create schema; `buildClientFormDefaults()` for create/edit forms.

### Hooks

| Hook | File | Role |
|------|------|------|
| `useClientSearch` | `hooks/clients/use-client-search.ts` | Local search + debounce |
| `useClientList` | `hooks/clients/use-client-list.ts` | Paginated fetch, abort on filter change, `refreshClients()` promise |

---

## Components

### Client library

**`client-library-header.tsx`**

- Title, live counts, “New client” CTA
- Debounced search input (admin-users pattern)

**`client-list.tsx`** (replaced card layout)

- shadcn **Table** with columns: checkbox, name, email, phone, enrolled classes, actions
- **Row click** → `/clients/[id]` (view profile)
- **Multi-select** checkboxes + bulk “Archive selected”
- Row menu: View profile, Edit client (`/edit`), Archive
- **Batch archive:** single `clientApi.deleteClients()` call (not N parallel deletes)
- Pagination via `ExerciseLibraryPagination`
- Archive confirmation dialog (single or bulk)

**Deleted:** `client-card.tsx` (no longer used)

### Client forms & profile

**`client-form.tsx`**

- React Hook Form + `zodResolver(clientFormSchema)`
- Required fields marked with `*`
- **Validation fix:** `noValidate` on form; removed HTML `required` on email (was blocking Zod); `handleInvalid` toast; `border-destructive` on errors; `mode: "onSubmit"`, `reValidateMode: "onChange"`

**`client-profile-view.tsx`** (read-only)

- Contact & profile section (name, email, phone, notes via `ExercisePreText`)
- Enrolled classes list (type, duration, enrolled date)
- Used on `/clients/[id]` only

### Enrollment dialogs

**`enrollment-dialog.tsx`** (class-centric — from calendar/drawer)

- Manage roster for a **class series**
- Enrolled section: checkboxes, select all, batch remove, per-row remove
- Add section: search, checkboxes, select all visible, batch add, per-row add
- Uses `enrollClients` / `unenrollClients` batch APIs

**`enroll-in-class-dialog.tsx`** (client-centric — from edit page)

- Pick a class to enroll **one client**
- **Layout fix:** flex column dialog — sticky header + search, scrollable class list (`exercise-picker-dialog` pattern)

### Attendance

**`attendance-checklist.tsx`**

- Used in `class-instance-drawer.tsx`
- Loads enrolled clients + attendance state
- Checkbox per client; save via `markAttendance`
- “Manage enrollment” opens `EnrollmentDialog`
- Checkbox uses native `onChange` (not `onCheckedChange`)

### Dashboard & nav

**`instructor-home.tsx`**

- Live client count from `clientApi.listClients`
- Clients stat card links to `/clients`

**`sidebar.tsx`**

- “Clients” nav link enabled (`/clients`)

---

## User flows

### Create client

1. `/clients/new` → `ClientForm` → `POST /api/clients`
2. Redirect to `/clients/[id]` (view profile)

### View vs edit

| Action | Destination |
|--------|-------------|
| Table row click / “View profile” | `/clients/[id]` — read-only |
| “Edit client” / profile “Edit client” button | `/clients/[id]/edit` — form + enrollment management |

### Enroll client in class

- **From edit page:** `EnrollInClassDialog` → `enrollClient(classId, clientId)`
- **From class drawer:** `EnrollmentDialog` → batch/single `enrollClients`

### Mark attendance

1. Open class instance in drawer
2. `AttendanceChecklist` for `SCHEDULED` / `COMPLETED` instances
3. Save → `PATCH .../attendance`

### Archive client

- Single: detail page or row menu → `DELETE /api/clients/:id`
- Bulk: table selection → `DELETE /api/clients` with `{ clientIds }`

---

## Iterative changes (post-initial implementation)

| Change | Details |
|--------|---------|
| **Email required** | Schema, server validation, frontend schema/types, form `*` labels; migration for NOT NULL |
| **Table library** | Replaced cards; filters, checkboxes, pagination, row navigation |
| **Batch enrollment** | `POST .../enrollments` with `clientIds[]`; UI multi-select in `enrollment-dialog` |
| **Batch unenrollment** | `DELETE .../enrollments` with body `{ enrollmentIds }` |
| **Batch archive** | `DELETE /api/clients` with `{ clientIds }`; `client-list` uses one call |
| **View / edit split** | Profile view page + `/edit` route; removed duplicate menu items |
| **Form validation** | `noValidate`, Zod-driven errors, toast on invalid submit |
| **Dialog header** | `enroll-in-class-dialog` sticky header + scroll body |

---

## Files reference

### Created

```
server/src/modules/clients/
  client.routes.ts
  client.service.ts
  client.validation.ts

server/prisma/migrations/
  20260601104431_add_client_management/
  20260601110013_client_email_required/

client/src/app/(dashboard)/clients/
  page.tsx
  new/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx

client/src/components/clients/
  client-form.tsx
  client-library-header.tsx
  client-list.tsx
  client-profile-view.tsx
  enroll-in-class-dialog.tsx

client/src/hooks/clients/
  use-client-list.ts
  use-client-search.ts

client/src/services/client-api.ts
client/src/lib/validation/client-form-schema.ts
```

### Modified (cross-cutting)

```
server/prisma/schema.prisma          — Client, Enrollment, Attendance models
server/src/app.ts                    — mount /api/clients
server/src/modules/scheduling/
  scheduling.service.ts              — enrollClients, unenrollClients, get/mark attendance
  scheduling.validation.ts           — batch schemas
  class.routes.ts                    — enrollment batch routes
  class-instance.routes.ts           — attendance routes

client/src/lib/types.ts              — client/roster types
client/src/lib/api.ts                — delete() with optional body
client/src/components/scheduling/
  attendance-checklist.tsx
  enrollment-dialog.tsx
  class-instance-drawer.tsx
client/src/components/dashboard/instructor-home.tsx
client/src/components/layout/sidebar.tsx
```

### Deleted

```
client/src/components/clients/client-card.tsx
```

---

## Error handling

| Case | HTTP | Error class |
|------|------|-------------|
| Client not found | 404 | `NotFoundError` |
| Duplicate email | 409 | `ConflictError` |
| Already enrolled / nothing to enroll | 409 | `ConflictError` |
| Invalid body / empty ID arrays | 400 | `ValidationError` / Zod middleware |
| Unauthorized | 401 | Auth middleware |

---

## Conventions aligned with platform

- Zod 4 on server (`validate` middleware) and client (`zodResolver`)
- Paginated list: `{ data, total, page, limit }` (same shape as class plans)
- Library UX: header card, directory vs filtered empty states, shared pagination component
- Soft delete pattern consistent with exercises
- Instructor scoping on all queries via `instructorId`

---

## Manual test checklist

- [ ] Create client with empty required fields → inline Zod errors + toast
- [ ] Create client with duplicate email → server conflict error
- [ ] Library search, pagination, row click → view profile
- [ ] Edit client, save, enroll/unenroll from edit page
- [ ] Batch select clients → archive (single API call)
- [ ] Class drawer → manage enrollment (batch add/remove)
- [ ] Class drawer → attendance save for scheduled/completed instance
- [ ] Dashboard client count matches library total
- [ ] Enroll-in-class dialog: header/search fixed while scrolling list

---

## Related plan

Initial scope defined in `.cursor/plans/mvp_implementation_plan_4c3cd703.plan.md` — Phase 4: Client Management.
