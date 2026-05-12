# Class Plan Folder API (Phase 2.2 — Folders Only)

Summary of what was implemented for organizing class plan templates into folders: backend validation, service layer, HTTP routes, and app registration. Mirrors the exercise folder pattern (`/api/exercise-folders`).

## Prerequisites (already in place before this work)

- Prisma model: `ClassPlanFolder` (`id`, `name`, `instructorId`, `createdAt`, `deletedAt`) with relation to `ClassPlanTemplate[]` and `Instructor.classPlanFolders`
- `ClassPlanTemplate.folderId` optional FK to `ClassPlanFolder` (templates can live outside any folder)

## New files

| File | Role |
|------|------|
| `server/src/modules/class-plans/class-plan-folder.validation.ts` | Zod schema: `createClassPlanFolderSchema` (`name` required) + exported `CreateClassPlanFolderInput` |
| `server/src/modules/class-plans/class-plan-folder.service.ts` | Prisma logic: `listFolders`, `createFolder`, `updateFolder`, `deleteFolder` — all scoped by `instructorId` and active rows (`deletedAt` null) |
| `server/src/modules/class-plans/class-plan-folder.routes.ts` | Express router: four endpoints, `authenticate` on all; `validate` on POST and PATCH |

## Modified files

| File | Change |
|------|--------|
| `server/src/app.ts` | Mount `classPlanFolderRoutes` at `/api/class-plan-folders` (alongside other API mounts) |

## HTTP endpoints

All routes require an authenticated session (cookie). Base path: **`/api/class-plan-folders`**.

1. **`GET /api/class-plan-folders`** — List folders for the signed-in instructor. Response: `{ folders, totalTemplates }`. Each folder is ordered by `name` ascending and includes `_count.templates` (non-deleted templates only). `totalTemplates` is the count of all non-deleted templates for that instructor (for sidebar totals).

2. **`POST /api/class-plan-folders`** — Create a folder. Body: `{ "name": string }` (required, non-empty). Returns **201** with the created `ClassPlanFolder` row.

3. **`PATCH /api/class-plan-folders/:id`** — Rename a folder. Body: same as POST (`name`). Returns **200** with the updated row. **404** if the folder does not exist, is soft-deleted, or belongs to another instructor.

4. **`DELETE /api/class-plan-folders/:id`** — Soft-delete the folder (`deletedAt` set). First clears `folderId` on every `ClassPlanTemplate` that pointed at this folder (templates become unfiled, not deleted). Returns **204** with no body. **404** if not found / not owned / already archived.

## Behaviour notes

- All queries filter by `instructorId` from the session (`req.user.instructorId`).
- List and update operations only consider folders where `deletedAt` is null.
- Deleting a folder does not soft-delete templates; it only nulls their `folderId`.

## Out of scope

- Class plan template CRUD and nested section APIs — documented separately in [class-plan-template-api.md](./class-plan-template-api.md).
- Frontend folder sidebar UI (Class Plans page) — not part of this backend slice.

## Verify locally

```bash
npm run build --prefix server
```

Exercise the endpoints with a logged-in instructor and `credentials: "include"` (same pattern as the rest of the app).
