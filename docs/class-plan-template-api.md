# Class Plan Template API (Task 2.2 — Templates Only)

Summary of what was implemented for reusable class plan templates: backend validation, service layer, HTTP routes, and app registration.

## Prerequisites (already in place before this work)

- Prisma models: `ClassPlanTemplate`, `ClassPlanFolder`, `PlanSection`, `PlanSectionExercise`, `Exercise.savedToLibrary`
- Seed dropdowns: `class_type`, `class_style` in `server/prisma/seed.ts`
- Folder CRUD: `POST/GET/PATCH/DELETE` under `/api/class-plan-folders` (`class-plan-folder.*`)
- Exercise helper: `PATCH /api/exercises/:id/save-to-library` (per MVP plan)

## New files

| File | Role |
|------|------|
| `server/src/modules/class-plans/class-plan.validation.ts` | Zod schemas: `createClassPlanSchema`, `updateClassPlanSchema`, `listClassPlansSchema` + exported types |
| `server/src/modules/class-plans/class-plan.service.ts` | Prisma logic: create, list (paginated + filters), get by id, update (optional full section replace), soft-delete, duplicate |
| `server/src/modules/class-plans/class-plan.routes.ts` | Express router: six endpoints, `authenticate` on all; `validate` / `validateQuery` where needed |

## Modified files

| File | Change |
|------|--------|
| `server/src/app.ts` | Mount `classPlanRoutes` at `/api/class-plans` |

## HTTP endpoints

All routes require an authenticated session (cookie). Base path: **`/api/class-plans`**.

1. **`POST /api/class-plans`** — Create a template. Body: `name` (required), optional `classType`, `classStyle`, `durationMinutes`, `folderId`, `tags`, nested `sections` with optional `exercises` (each links an `exerciseId`). Validates folder ownership when `folderId` is set; validates all referenced exercises belong to the instructor.

2. **`GET /api/class-plans`** — Paginated list. Query: `search`, `folderId` (use `none` for unfiled), `classType`, `classStyle`, comma-separated `tags` (matches any), `page`, `limit`. Response shape: `{ data, total, page, limit }`. Each row includes `folder` and `_count.sections`.

3. **`GET /api/class-plans/:id`** — Full template with `folder`, ordered `sections`, ordered `PlanSectionExercise` rows, and nested `exercise` with `id`, `name`, `spinalMovement`, `chainType`, `jointLoading` for planner badges.

4. **`PATCH /api/class-plans/:id`** — Partial update of metadata. If `sections` is present in the body, existing sections for that template are deleted and replaced in one transaction (same idea as exercise layer replace). No-op if the body changes nothing.

5. **`DELETE /api/class-plans/:id`** — Soft-delete (`deletedAt`). Returns JSON `{ message: "Template deleted" }`.

6. **`POST /api/class-plans/:id/duplicate`** — New template with name `"<original> (Copy)"`, same metadata/tags/folder, new sections and `PlanSectionExercise` rows pointing at the same exercises.

## Behaviour notes

- Lists and reads only templates where `deletedAt` is null and `instructorId` matches the session user.
- Section replace on PATCH: sending `sections` replaces the entire tree; omit `sections` to only patch title, type, style, duration, folder, or tags.
- Duplicate does not clone `Exercise` rows; it clones template structure and reuses exercise IDs.

## Out of scope (per plan)

- Nested routes such as `POST/PATCH/DELETE` for individual sections or section exercises under `/api/class-plans/:id/sections/...` (reserved for a later slice if needed).

## Verify locally

```bash
npm run build --prefix server
```

Run the API with a logged-in instructor and call the endpoints with `credentials: "include"` (same pattern as the rest of the app).
