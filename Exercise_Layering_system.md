# Pilates Platform — Implemented Features & Changes

## 1. Exercise Layer System

A dynamic, ordered content-block system for building exercise instructions step by step.

### Database

- **`ExerciseLayer`** model (`server/prisma/schema.prisma`) — stores `exerciseId`, `order`, and `content` per layer; cascades on exercise delete.

### Backend

- **Create/Update** endpoints (`POST /api/exercises`, `PATCH /api/exercises/:id`) accept an optional `layers: string[]` array.
- Service atomically replaces layers on every save: `deleteMany` existing → `createMany` with new order indices.
- Layers are included in `getExerciseById` response (ordered by `order` ASC).

### Frontend — Form

- Dynamic layer rows in `exercise-form.tsx`: add, remove, and edit content per layer.
- Layer label logic lives in `client/src/lib/exercise-layer-labels.ts`:
  - **< 4 layers** → `Layer 1`, `Layer 2`, `Layer 3` (no Finisher).
  - **≥ 4 layers** → last row is always **Finisher**; preceding rows are `Layer 1` … `Layer N−1`.
  - Adding a layer when ≥ 4 inserts **before** the Finisher row.
- Finisher row has a distinct bordered card style and a placeholder "Record Voice Note" button (shows toast — stub for future audio).

### Frontend — Detail Page

- Exercise detail page (`exercises/[id]/page.tsx`) renders layers with the same labeling logic; Finisher styled distinctly.

---

## 2. Dynamic Dropdown Options (Configurable Selects)

Allows instructors to use platform-provided defaults **and** add their own custom options per dropdown category.

### Database

- **`DropdownCategory`** — unique `key` + display `name`; seeded at platform setup.
- **`DropdownOption`** — belongs to a category; `instructorId` null = global (seeded), non-null = custom per instructor.

### Seeded Categories (8)

| Key | Name | Example Defaults |
|-----|------|------------------|
| `orientation` | Orientation | Prone, Supine, Sitting, Standing, Side-lying, Kneeling, All Fours |
| `direction_faced` | Direction Faced | Front-Facing, Side-Facing, Rear-Facing |
| `movement_type` | Movement Type | Bilateral, Unilateral, Alternating |
| `equipment` | Equipment Used | Reformer, Cadillac, Chair, Barrel, Mat, Tower, Spine Corrector |
| `machine_setup` | Machine Setup | Headrest Up/Down, Footbar High/Low, Long/Short Box |
| `spinal_movement` | Spinal Movement | Flexion, Extension, Rotation, Lateral Flexion, Articulation |
| `chain_type` | Chain Type | Open Chain, Closed Chain, Both, Lower Chain Closed, Upper Open |
| `joint_loading` | Joint Loading | Knee Loading, Wrist Loading |

### Backend — Dropdown Module (`server/src/modules/dropdowns/`)

- **`GET /api/dropdowns/:categoryKey`** — returns options visible to the current instructor (global + their custom ones), ordered by `order` then `label`.
- **`POST /api/dropdowns/:categoryKey`** — creates a new instructor-scoped option; auto-generates a slug `value`; handles collisions.
- **`DELETE /api/dropdowns/:optionId`** — deletes only instructor-owned custom options (global options are protected).

### Frontend

- **`dropdownApi`** (`client/src/services/dropdown-api.ts`) — typed `getOptions(key)`, `createOption(key, label)`.
- **`useDropdownOptions(key)`** hook (`client/src/hooks/exercises/use-dropdown-options.ts`) — fetches + caches options for a category.
- Exercise form selects consume these hooks for orientation, direction faced, movement type, springs, equipment, machine setup, spinal movement, chain type, and joint loading fields.

---

## 3. Extended Exercise Fields

New optional metadata fields on `Exercise` for comprehensive Pilates documentation:

| Field | Purpose |
|-------|---------|
| `orientation` | Body position (Supine, Prone, etc.) |
| `directionFaced` | Direction client faces during exercise |
| `movementType` | Bilateral / Unilateral / Alternating |
| `springs` | Spring configuration (free text via dropdown) |
| `equipment` | Equipment used (Reformer, Mat, etc.) |
| `machineSetup` | Machine configuration details |
| `transitionCues` | Verbal cues for transitioning |
| `cueing` | Teaching cues and instructions |
| `spinalMovement` | Primary spinal movement category |
| `chainType` | Open / Closed chain classification |
| `jointLoading` | Joints bearing load |

All fields are nullable strings, populated from dropdown-driven selects in the form. Stored directly on the `Exercise` model and returned in API responses.

---

## 4. Exercise Form UI Enhancements

- Removed bordered "Class setup" card wrapper — orientation, direction faced, and machine setup fields now flow naturally.
- **Springs + Equipment row** aligned to equal height (`h-12`, `sm:items-stretch`).
- **Select trigger values** no longer clip at the bottom — replaced `line-clamp-1` with `truncate` + `leading-snug`.
- **Movement Analysis** section: spinal movement, chain type, and joint loading grouped logically.
- Form sections: Basic Info → Orientation & Setup → Springs & Equipment → Transition & Cueing → Layers → Movement Analysis → Images → Progression.

---

## 5. Seed Updates

`server/prisma/seed.ts` now:
1. Seeds platform settings (`signupEnabled`).
2. Creates or promotes admin user.
3. Seeds all 8 dropdown categories with their default global options (idempotent — skips existing).

---

## Files Added

| File | Purpose |
|------|---------|
| `server/src/modules/dropdowns/dropdown.routes.ts` | Express router for dropdown API |
| `server/src/modules/dropdowns/dropdown.service.ts` | Business logic for dropdown CRUD |
| `server/src/modules/dropdowns/dropdown.validation.ts` | Zod schemas for dropdown requests |
| `client/src/services/dropdown-api.ts` | Typed API client for dropdowns |
| `client/src/hooks/exercises/use-dropdown-options.ts` | React hook for fetching dropdown options |
| `client/src/lib/exercise-layer-labels.ts` | Layer title + finisher detection helpers |

## Files Modified

| File | Changes |
|------|---------|
| `server/prisma/schema.prisma` | Added `ExerciseLayer`, `DropdownCategory`, `DropdownOption` models; extended `Exercise` with new fields |
| `server/prisma/seed.ts` | Added `seedDropdownDefaults()` for 8 categories |
| `server/src/app.ts` | Mounted `/api/dropdowns` router |
| `server/src/modules/exercises/exercise.service.ts` | Layer create/update/include logic |
| `server/src/modules/exercises/exercise.validation.ts` | Added `layers` array + new string fields to Zod schemas |
| `client/src/lib/types.ts` | Extended `Exercise` type with layers + new fields |
| `client/src/services/exercise-api.ts` | `SaveExerciseBody` includes `layers` + new fields |
| `client/src/components/exercises/exercise-form.tsx` | Full form rebuild: layers, dropdowns, layout fixes |
| `client/src/app/(dashboard)/exercises/[id]/page.tsx` | Detail page: layers display, new field sections |
| `client/src/components/ui/select.tsx` | Fixed `SelectTrigger` height override + value clipping |
