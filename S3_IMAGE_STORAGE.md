# S3 Image Storage — Implementation Summary

## Overview

Images are stored in a **private AWS S3 bucket**. The server uploads via multer + `sharp` resize, stores S3 object keys in the database, and returns **presigned read URLs** on API responses. Exercise forms stage images in the browser until save (no temp folder).

---

## Dependencies

| Package | Location | Purpose |
|---------|----------|---------|
| `@aws-sdk/client-s3` | server | S3 upload/delete |
| `@aws-sdk/s3-request-presigner` | server | Presigned GET URLs |
| `sharp` | server | Image resize (800×800 exercise, 400×400 avatar) |

---

## Environment

**Server (`server/.env`):**

```env
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_SIGNED_URL_TTL_SECONDS=3600
```

**Client (`client/.env`, optional for `next/image`):**

```env
NEXT_PUBLIC_S3_BUCKET=your-bucket-name
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## Key paths

| Asset | S3 key |
|-------|--------|
| Exercise image | `exercises/{exerciseId}/{uuid}.webp` |
| Profile avatar | `avatars/{instructorId}/profile.webp` |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/exercises/:id/images` | Upload image (multipart `image`) |
| `DELETE` | `/api/exercises/:id/images/:imageId` | Remove image + S3 object |
| `PATCH` | `/api/exercises/:id/images/reorder` | Reorder saved images |
| `POST` | `/api/profile/avatar` | Upload avatar |
| `GET` | `/api/profile/avatar` | Signed avatar URL for session storage keys |
| `DELETE` | `/api/profile/avatar` | Remove avatar |

All exercise read endpoints sign `images[].url` from `publicId` (S3 key).

---

## Client flow (exercise forms)

1. User drops images → `File` held in React state + `URL.createObjectURL` preview.
2. Save → `POST` or `PATCH /api/exercises` (JSON only).
3. Pending files → `POST /api/exercises/:id/images` per file.
4. Mixed saved/pending order → `PATCH .../images/reorder` with merged IDs.

---

## Migration from Cloudinary

```bash
cd server
npx tsx scripts/migrate-cloudinary-to-s3.ts
```

Downloads existing Cloudinary URLs from DB, uploads to S3, updates keys. Optionally set `CLOUDINARY_CLOUD_NAME` when `publicId` values are keys rather than full URLs.

---

## Future video

Use the same `storage.ts` module. Videos should use presigned **multipart upload** direct to S3 (not multer through Express). Add `ExerciseMedia` with `type` + `status` when implementing video.
