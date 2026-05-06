# Hybrid Image Upload -- Implementation Summary

## Overview

A temp-first image upload flow for the exercise form. Images are uploaded to Cloudinary's `temp/` folder immediately on drop, then promoted to permanent `exercises/` storage when the exercise is saved. A cron job cleans up abandoned temp images.

---

## New Dependencies

| Package | Location | Purpose |
|---------|----------|---------|
| `node-cron` | server | Hourly temp image cleanup scheduler |
| `@types/node-cron` | server (dev) | TypeScript types for node-cron |
| `react-dropzone` | client | Drag-and-drop file upload zone |

---

## Backend Changes

### New Files

| File | Description |
|------|-------------|
| `server/src/modules/uploads/upload.routes.ts` | `POST /api/uploads/temp` and `DELETE /api/uploads/temp/:publicId` |
| `server/src/jobs/cleanup-temp-uploads.ts` | Hourly cron job to purge stale temp images |
| `server/src/types/express.d.ts` | Declaration merging to add `imagePublicIds` to Express Request |

### Modified Files

#### `server/src/lib/cloudinary.ts`

Added four new helpers alongside the existing `uploadImage` and `deleteImage`:

- **`uploadTempImage(filePath)`** -- uploads to `temp/` folder with `unique_filename: true` for collision resistance
- **`deleteTempImage(publicId)`** -- destroys a Cloudinary asset, guarded to only accept `temp/` prefixed IDs
- **`promoteImage(tempPublicId, exerciseId)`** -- renames from `temp/` to `exercises/<exerciseId>/<uuid>-<basename>` using `cloudinary.uploader.rename` with `overwrite: false`
- **`cleanupTempImages(maxAgeHours)`** -- paginates through all `temp/` resources (500 per page via `next_cursor`), filters by `created_at`, and deletes stale images in batches of 100

#### `server/src/modules/uploads/upload.routes.ts`

Two endpoints mounted at `/api/uploads` with mount-level authentication:

- **`POST /temp`** -- accepts up to 3 image files via multer, enforces 5 MB limit and MIME type filtering (JPEG, PNG, WebP), uploads each to Cloudinary `temp/` folder, cleans up local multer files, returns `{ images: [{ publicId, url }] }`
- **`DELETE /temp/:publicId`** -- accepts URL-encoded public ID, rejects non-`temp/` IDs, destroys from Cloudinary

#### `server/src/modules/exercises/exercise.service.ts`

- **`attachTempImagesToExercise(exerciseId, instructorId, publicIds)`** -- promotes temp images with a compensation flow:
  - Validates ownership and enforces max 3 images total
  - Rejects non-`temp/` public IDs
  - Renames all assets before writing any DB rows
  - If any rename fails, rolls back already-moved assets
  - Creates `ExerciseImage` rows in a Prisma transaction
  - If the DB write fails, deletes the promoted Cloudinary assets
- **`deleteExercise`** -- now cleans up Cloudinary assets and removes `ExerciseImage` rows before soft-deleting the exercise
- **`reorderImages(exerciseId, instructorId, imageIds)`** -- validates all IDs belong to the exercise, then updates `order` for each image in a Prisma transaction

#### `server/src/modules/exercises/exercise.routes.ts`

- Added `extractImagePublicIds` middleware before `validate()` on create/update routes -- copies `req.body.publicIds` into `req.imagePublicIds` and strips it from the body so existing Zod schemas remain unchanged
- Create and update handlers now call `attachTempImagesToExercise` when `imagePublicIds` are present, then re-fetch the exercise with images before responding
- **`PATCH /:id/images/reorder`** -- new endpoint accepting `{ imageIds: string[] }`, validated by `reorderImagesSchema`

#### `server/src/modules/exercises/exercise.validation.ts`

- Added `reorderImagesSchema` -- validates `{ imageIds: z.array(z.string()).min(1) }`

#### `server/src/app.ts`

- Mounted upload routes: `app.use("/api/uploads", authenticate, uploadsRoutes)`

#### `server/src/index.ts`

- Starts the temp upload cleanup cron on server boot via `startTempUploadCleanup()`

### Cron Job Details

- **Schedule:** every hour (`0 * * * *`)
- **Retention:** 6 hours -- only images older than 6 hours are deleted
- **Overlap guard:** module-level `isCleanupRunning` flag skips runs if a previous cleanup is still active
- **Pagination:** fetches 500 resources per page, follows `next_cursor` until exhausted
- **Batch deletes:** up to 100 public IDs per Cloudinary Admin API call
- **Logging:** prints scanned/deleted/failed counts after each run

---

## Frontend Changes

### Modified Files

#### `client/src/services/exercise-api.ts`

- Added `TempUploadedImage` type (`{ publicId, url }`)
- Added `publicIds?: string[]` to `SaveExerciseBody`
- Added `uploadTempImages(formData)` -- `POST /uploads/temp`
- Added `deleteTempImage(publicId)` -- `DELETE /uploads/temp/:encodedPublicId`
- Added `reorderImages(id, imageIds)` -- `PATCH /exercises/:id/images/reorder`

#### `client/src/components/exercises/exercise-form.tsx`

**Unified image list** -- saved and temp images are managed in a single `images` state array using a discriminated union type:

```typescript
type ImageItem =
  | { type: "saved"; data: ExerciseImage }
  | { type: "temp"; data: TempUploadedImage };
```

**Dropzone** (file upload area):
- Accepts JPEG, PNG, and WebP files
- Max 5 MB per file
- Dynamic `maxFiles` based on remaining slots (3 total minus existing + temp)
- Immediately uploads to `POST /api/uploads/temp` on drop
- Shows loading spinner during upload
- Displays clear error toasts for size, type, and limit rejections

**Image previews:**
- Grid of image thumbnails with hover overlay
- Delete button (X) on all images -- both saved and temp
  - Saved images: calls `DELETE /api/exercises/:id/images/:imageId` (removes from Cloudinary + DB)
  - Temp images: calls `DELETE /api/uploads/temp/:publicId` (removes from Cloudinary only)
- "New" badge on temp images to distinguish from saved ones

**Drag-to-sort:**
- Grip handle icon on each image thumbnail
- HTML5 drag-and-drop to reorder (no extra library for 3 items)
- Visual ring highlight on the drop target
- In edit mode, saved image order is persisted immediately via `PATCH /api/exercises/:id/images/reorder`

**Form submission:**
- Collects `publicIds` from temp images and includes in request body
- Submit button disabled while uploading or saving

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/uploads/temp` | Yes | Upload up to 3 temp images (multipart) |
| `DELETE` | `/api/uploads/temp/:publicId` | Yes | Delete a temp image from Cloudinary |
| `POST` | `/api/exercises` | Yes | Create exercise (now accepts optional `publicIds[]`) |
| `PATCH` | `/api/exercises/:id` | Yes | Update exercise (now accepts optional `publicIds[]`) |
| `DELETE` | `/api/exercises/:id` | Yes | Soft-delete exercise + clean up all images |
| `PATCH` | `/api/exercises/:id/images/reorder` | Yes | Reorder saved images by ID array |

---

## Data Flow

```
User drops files
       |
       v
POST /api/uploads/temp  -->  Cloudinary temp/ folder
       |
       v
Preview in form (local state only, no DB)
       |
       v
User submits form
       |
       v
POST or PATCH /api/exercises  -->  Backend extracts publicIds
       |
       v
cloudinary.uploader.rename (temp/ --> exercises/)  -->  All-or-nothing
       |
       v
Prisma transaction creates ExerciseImage rows
       |
       v
Hourly cron cleans up any orphaned temp/ images > 6 hours old
```

---

## Safeguards

- **Temp-only guards** -- backend rejects non-`temp/` public IDs in delete and promote paths
- **Collision-resistant naming** -- Cloudinary `unique_filename` for temp uploads; UUID-based target IDs for promotion
- **Compensation flow** -- if any Cloudinary rename fails during promotion, already-moved assets are rolled back; if Prisma write fails after renames, promoted assets are deleted
- **Soft-delete cleanup** -- deleting an exercise now removes all Cloudinary assets and `ExerciseImage` rows before setting `deletedAt`
- **File size limit** -- 5 MB enforced on both server (multer) and client (react-dropzone)
- **Image count limit** -- max 3 images per exercise enforced on both server and client
- **Overlap protection** -- cron cleanup uses `isCleanupRunning` flag to prevent concurrent runs
