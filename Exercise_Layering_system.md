# Pilates Platform — Implemented Features & Changes

## 1. Exercise Layer System

A dynamic, ordered content-block system for building exercise instructions step by step.

### Database

- **`ExerciseLayer`** model (`server/prisma/schema.prisma`) — stores `exerciseId`, `order`, `content`, and `isFinisher` (boolean, default false) per layer; cascades on exercise delete.

### Backend

- **Create/Update** endpoints (`POST /api/exercises`, `PATCH /api/exercises/:id`) accept an optional `layers: { content, order?, isFinisher? }[]` array.
- Service atomically replaces layers on every save: `deleteMany` existing → `createMany` with new order indices and `isFinisher` flag.
- Layers are included in `getExerciseById` response (ordered by `order` ASC).

### Frontend — Form

- Dynamic layer rows in [`exercise-form.tsx`](client/src/components/exercises/exercise-form.tsx): add, remove, and edit content per layer.
- **React Hook Form** + **`zodResolver`** ([`client/src/lib/validation/exercise-form-schema.ts`](client/src/lib/validation/exercise-form-schema.ts)): layers are a **`useFieldArray`** on `layers` (`{ content, isFinisher }[]` per row). Each layer’s **`content`** is edited through a **`Controller`** wrapping **`BulletTextarea`**. **`buildExerciseFormDefaults`** + **`reset`** when `exercise?.id` changes on edit. Client Zod enforces (among other rules) at least one layer row, movement type not `"none"`, and chain type max two entries — aligned with server expectations where practical. Image upload/reorder state stays in **local React state** outside RHF.
- Layer label logic lives in `client/src/lib/exercise-layer-labels.ts`:
  - `getLayerStepTitle(index)` always returns `Layer N` (no auto-finisher logic).
- **Manual finisher toggle**: only the **last** layer row shows a "Mark as finisher" checkbox. When checked, that layer displays a "Finisher" badge. Adding a new layer always appends at the end and clears any existing finisher flag.
- No automatic finisher assignment — instructors control it intentionally.

#### `BulletTextarea` (plain-text bullets in `content`)

Reusable component: [`client/src/components/exercises/bullet-textarea.tsx`](client/src/components/exercises/bullet-textarea.tsx). Wired from [`exercise-form.tsx`](client/src/components/exercises/exercise-form.tsx) via **React Hook Form `Controller`** for:

- **Every** dynamic layer row (Layer 1, Layer 2, … — not only the first).
- **Description**, **Starting position**, **Cues / notes**, **Progression notes**, and **Regression notes**.

Behaviour (bullets are **literal** `•` characters and newlines inside the same `String` stored on `ExerciseLayer.content` or exercise fields — no separate list model in the database):

| Input | Effect |
|--------|--------|
| **Enter** | Inserts `\n• ` so the next line starts with a bullet. |
| **Shift+Enter** | Inserts a newline only (continuation of the current bullet line). |
| **Add •** | Inserts `• ` at the caret only when the selection is collapsed, the caret is at the **start** of the current line, and that line does not already begin with `• `; otherwise the control stays disabled. |
| IME composition | Enter is not intercepted while composing (e.g. CJK input). |

Toolbar layout:

- Optional **`label`** on the **same row** as **Add •** (e.g. shadcn `Label` for Description; for layers: step title + optional Finisher badge + "Mark as finisher" checkbox when that row is the last layer).
- Optional **`toolbarEndSlot`** after **Add •** (e.g. **Remove layer** when there is more than one layer). The control group uses `data-bullet-textarea-toolbar` so moving focus from the textarea to **Add •** or remove does not reset the add-bullet gate incorrectly.
- **`bulletsEnabled={false}`** renders a plain shadcn `Textarea` with no bullet behaviour (available for reuse elsewhere; **all** layer rows in the exercise form use bullets enabled).

The shadcn [`Textarea`](client/src/components/ui/textarea.tsx) uses `forwardRef` so the component can restore selection after programmatic inserts.

### Frontend — Detail Page

- Exercise detail page ([`client/src/app/(dashboard)/exercises/[id]/page.tsx`](client/src/app/(dashboard)/exercises/[id]/page.tsx)) renders layers with `layer.isFinisher` flag; finisher-marked layers get a "Finisher" badge and distinct bordered card styling.
- Layer **body** copy (and other long exercise strings such as description, starting position, cueing, progression/regression notes where applicable) is rendered with **`ExercisePreText`** ([`client/src/components/exercises/exercise-pre-text.tsx`](client/src/components/exercises/exercise-pre-text.tsx)): line breaks preserved; lines beginning with `•` get a **hanging indent** so wrapped text aligns under the text after the bullet, not under the bullet column.

---

## 2. Dynamic Dropdown Options (Configurable Selects)

Allows instructors to use platform-provided defaults **and** add their own custom options per dropdown category.

### Database

- **`DropdownCategory`** — unique `key` + display `name`; seeded at platform setup.
- **`DropdownOption`** — belongs to a category; `instructorId` null = global (seeded), non-null = custom per instructor.

### Seeded categories (10)

Exercise metadata keys **plus** two reserved for **class plan templates** (Phase 2 UI):

| Key | Name | Default Options |
|-----|------|-----------------|
| `orientation` | Orientation | Supine, Prone, Side-Lying, Low Kneeling, High Kneeling, 4 Point Kneeling, Standing, Seated |
| `direction_faced` | Direction Faced | Front-Facing, Reverse-Facing, Side-Facing |
| `movement_type` | Movement Type | Bilateral, Unilateral, Alternating |
| `equipment` | Equipment Used | Ring, Band, Ball, Box, Dumbbells, Dell, None |
| `machine_setup` | Machine Setup | Footbar Up, Footbar Down, Footbar Middle, N/A |
| `spinal_movement` | Spinal Movement | Flexion, Extension, Rotation, Lateral Flexion, Articulation, Neutral, None |
| `chain_type` | Chain Type | Open Chain, Closed Chain, Both, Lower Chain Closed, Upper Open |
| `joint_loading` | Joint Loading | Knee Loading, Wrist Loading, Hip Flexor Loading |
| `class_type` | Class Type | Reformer, Mat, Chair, Cadillac, Barrel |
| `class_style` | Class Style | Beginner, Intermediate, Advanced, Pre/Post Natal, HIIT, Restorative, JumpBoard, Classical Pilates |

### Backend — Dropdown Module (`server/src/modules/dropdowns/`)

- **`GET /api/dropdowns/:categoryKey`** — returns options visible to the current instructor (global + their custom ones), ordered by `order` then `label`.
- **`POST /api/dropdowns/:categoryKey`** — creates a new instructor-scoped option; auto-generates a slug `value`; handles collisions.
- **`DELETE /api/dropdowns/:optionId`** — deletes only instructor-owned custom options (global options are protected).

### Frontend

- **`dropdownApi`** (`client/src/services/dropdown-api.ts`) — typed `getOptions(key)`, `createOption(key, label)`.
- **`useDropdownOptions(key)`** hook (`client/src/hooks/use-dropdown-options.ts`) — fetches + caches options for a category.
- Exercise form selects consume these hooks for **orientation**, **direction faced**, **movement type**, **equipment**, **machine setup**, **spinal movement**, **chain type**, and **joint loading**. **`springs`** is a **free-text** field with an **N/A** quick button — not a dropdown category.

---

## 3. Extended Exercise Fields

Metadata fields on `Exercise` for comprehensive Pilates documentation:

| Field | Type | Purpose |
|-------|------|---------|
| `orientation` | `String?` | Body position (Supine, Prone, Seated, etc.) |
| `directionFaced` | `String?` | Direction client faces during exercise |
| `movementType` | `String?` | Bilateral / Unilateral / Alternating |
| `springs` | `String?` | Spring configuration (free text input, N/A for mat) |
| `equipment` | `String[]` | Equipment/props used — **multi-select** (Ring, Band, Ball, etc.) with custom entry and "None" option; while "None" is checked, all other equipment checkboxes and the custom add row are **disabled** |
| `machineSetup` | `String?` | Machine configuration (Footbar Up/Down/Middle, N/A) |
| `transitionCues` | `String?` | Verbal cues for transitioning |
| `cueing` | `String?` | Teaching cues and instructions |
| `spinalMovement` | `String[]` | Spinal movement categories — **multi-select** with "None" clearing others; while "None" is checked, every other spinal-movement checkbox is **disabled** |
| `chainType` | `String[]` | Chain classification — **multi-select**, max 2; "Both" is mutually exclusive with other options; hover tooltips on each option |
| `jointLoading` | `String[]` | Joints bearing load — **multi-select** (Knee, Wrist, Hip Flexor) |
| `progressionNotes` | `String?` | How to make the exercise harder (text field) |
| `regressionNotes` | `String?` | How to make the exercise easier (text field) |
| `progressionOfId` | `String?` | Links to an easier exercise (self-referential FK for progression chains) |

### Multi-select behaviour

- **Equipment**: checkboxes from dropdown options + custom "Add" input. Selecting "None" clears all others and **disables** all non-None checkboxes plus the custom add field/button (same muted/disabled styling pattern as Chain Type); unchecking "None" re-enables them. Selecting any other option clears "None" from the array.
- **Spinal Movement**: checkboxes from dropdown options. Same "None" clear + **disable all other options** while "None" is selected; unchecking "None" re-enables the list.
- **Chain Type**: checkboxes from dropdown options with smart constraints:
  - Selecting "Both" disables all other options (max 1 selection).
  - Selecting any non-Both option disables "Both"; max 2 selections total.
  - Each option shows a tooltip description on hover (from `client/src/lib/chain-type-tooltips.ts`).
- **Joint Loading**: simple multi-select checkboxes (no special constraints).

---

## 4. Exercise Form UI

- **Form stack**: **React Hook Form** + **`zodResolver`** and [`exercise-form-schema.ts`](client/src/lib/validation/exercise-form-schema.ts); shadcn **`Select`** fields use **`Controller`**; simple text inputs use **`register`**; multi-select arrays use **`setValue`** / **`getValues`** with **`useWatch`** for derived UI (checkboxes, disabled states).
- **Springs**: full-width `Label` → helper text → text input with **N/A quick button** (same `h-12` / `rounded-2xl` styling as other inputs).
- **Equipment**: full-width `Label` → helper text → checkboxes + custom "Add" input row (same input sizing/styling). With "None" selected, non-None checkboxes and custom add controls are disabled until "None" is cleared.
- **Machine Setup**: single-select dropdown with N/A option.
- **Movement Analysis** section: Spinal Movement (multi-select, "None" disables other options while selected), Chain Type (multi-select with constraints + tooltips), Joint Loading (multi-select) — grouped under a heading with a separator.
- **Layers**: each row uses **`Controller`** + **`BulletTextarea`** on `layers.{index}.content` (Enter / Shift+Enter / **Add •** as above). Step title + finisher UI sit in the component’s `label` slot on one row with **Add •**; **Remove layer** sits in `toolbarEndSlot` when there is more than one layer. Numbered layers; manual "Mark as finisher" only on the **last** row (`setValue` on the whole `layers` array for finisher flags).
- **Description**, **Starting position**: **`Controller`** + **`BulletTextarea`** with shadcn `Label` in the `label` slot (same row as **Add •**).
- **Progression / Regression**: **`Controller`** + **`BulletTextarea`** ("Progression notes", "Regression notes") with labels on the same row as **Add •**. The inline **"Easier version (progression)"** `Select` (pick easier exercise) is **commented out** in the form source; `progressionOfId` still defaults in the schema and is sent on save (typically `null` / unchanged). Use **`PATCH /api/exercises/:id/progression`** or **`exerciseApi.setProgression`** to change progression until the block is restored.
- **Cueing**: **`Controller`** + **`BulletTextarea`** with label on the same row as **Add •**.
- **Auth pages**: **`/login`** and **`/register`** use the same RHF + Zod pattern with [`auth-schemas.ts`](client/src/lib/validation/auth-schemas.ts).
- Form sections (approximate order): Basic Info → Orientation & Direction → Movement Type → Springs & Equipment → Machine Setup → Layers → Transition Cues & Cueing → Movement Analysis → Folder → Progression/Regression Notes → Tags → Images.

---

## 5. Exercise Detail Page

- **Setup** card: Orientation, Direction faced, Movement type, Springs, Machine setup as key-value pairs. **Equipment** displayed as badges (array field). **Description** and **Starting position** (and similar long strings) use **`ExercisePreText`** for line breaks and bullet-line hanging indents where applicable.
- **Layers** card: numbered layers with `isFinisher` badge on finisher-marked layers and distinct card styling; layer text (and other long copy where used) via **`ExercisePreText`** so `•`-style lines from the form display with a hanging indent when wrapped.
- **Movement Analysis** card: Spinal Movement as badges, **Chain Type** as badges (was single text), Joint Loading as badges.
- **Progressions & Regressions** card: shows `progressionNotes` and `regressionNotes` when present, via **`ExercisePreText`**.
- **Progression Chain Viewer**: shows exercise-to-exercise chain (Level 1 → 2 → 3) when chain has 2+ steps.

---

## 6. Seed updates

`server/prisma/seed.ts` now:
1. Seeds platform settings (`signupEnabled`).
2. Creates or promotes admin user.
3. Seeds **10** dropdown categories with default global options (idempotent — skips existing option rows that already match).
   - Exercise-oriented keys: orientation (8), direction_faced (3), movement_type (3), equipment (7), machine_setup (4), spinal_movement (7), chain_type (5), joint_loading (3).
   - **Class plan** keys (for upcoming template UI): **class_type** (Reformer, Mat, Chair, Cadillac, Barrel), **class_style** (Beginner, Intermediate, Advanced, Pre/Post Natal, HIIT, Restorative, JumpBoard, Classical Pilates).

---

## Files Added

| File | Purpose |
|------|---------|
| `server/src/modules/dropdowns/dropdown.routes.ts` | Express router for dropdown API |
| `server/src/modules/dropdowns/dropdown.service.ts` | Business logic for dropdown CRUD |
| `server/src/modules/dropdowns/dropdown.validation.ts` | Zod schemas for dropdown requests |
| `client/src/services/dropdown-api.ts` | Typed API client for dropdowns |
| `client/src/hooks/use-dropdown-options.ts` | React hook for fetching dropdown options |
| `client/src/lib/exercise-layer-labels.ts` | Layer title helper (`getLayerStepTitle`) |
| `client/src/lib/validation/exercise-form-schema.ts` | Client Zod schema + `buildExerciseFormDefaults` for exercise create/edit |
| `client/src/lib/validation/auth-schemas.ts` | Client Zod schemas for login and register |
| `client/src/lib/chain-type-tooltips.ts` | Chain type hover tooltip descriptions |
| `client/src/components/exercises/bullet-textarea.tsx` | Reusable long-text control: Enter / Shift+Enter bullets, **Add •**, optional `label` + `toolbarEndSlot` on one toolbar row |
| `client/src/components/exercises/exercise-pre-text.tsx` | Read-only display: line breaks + hanging indent for lines starting with `•` |
| `server/prisma/migrations/20260511140000_alexa_exercise_fields/migration.sql` | Migration: equipment/chainType to arrays, add progressionNotes/regressionNotes, add isFinisher |

## Files Modified

| File | Changes |
|------|---------|
| `server/prisma/schema.prisma` | `equipment` and `chainType` → `String[]`; added `progressionNotes`, `regressionNotes` to Exercise; added `isFinisher` to ExerciseLayer |
| `server/prisma/seed.ts` | Seeds 10 dropdown categories (exercise keys + `class_type` / `class_style`) with default global options |
| `server/src/app.ts` | Mounted `/api/dropdowns` router |
| `server/src/modules/exercises/exercise.service.ts` | Layer create/update includes `isFinisher`; all new fields flow through via `...rest` |
| `server/src/modules/exercises/exercise.validation.ts` | `equipment`/`chainType` → arrays; added `progressionNotes`/`regressionNotes`; added `isFinisher` to layer schema |
| `client/src/lib/types.ts` | `equipment`/`chainType` → `string[]`; added `progressionNotes`/`regressionNotes`; `ExerciseLayer.isFinisher` |
| `client/src/services/exercise-api.ts` | `SaveExerciseBody` updated for arrays, new text fields, `ExerciseLayerInput.isFinisher` |
| `client/src/components/exercises/exercise-form.tsx` | **React Hook Form** + **`zodResolver`** (`exercise-form-schema.ts`): **`useFieldArray`** for layers, **`Controller`** for selects and **`BulletTextarea`** fields, **`register`** / **`useWatch`** / **`setValue`** for the rest; equipment multi-select + custom entry ("None" clears others and disables non-None checkboxes + custom add while selected); chain type multi-select with constraints + tooltips; springs N/A button; manual finisher toggle; spinal movement "None" clears others and disables non-None checkboxes while selected; progression parent **Select** UI commented out (payload still includes `progressionOfId`) |
| `client/src/app/login/page.tsx` | RHF + `auth-schemas` for sign-in |
| `client/src/app/register/page.tsx` | RHF + `auth-schemas`; `setValue` for invite email |
| `client/package.json` | Adds `react-hook-form`, `@hookform/resolvers`, `zod` (client) |
| `client/src/app/(dashboard)/exercises/[id]/page.tsx` | Equipment/chain type as badges; layer `isFinisher` display; progression/regression card; **`ExercisePreText`** for long-form copy (e.g. description, layers, cueing) |
| `client/src/components/ui/textarea.tsx` | `forwardRef` for ref/caret compatibility (used by `BulletTextarea`) |
| `.cursor/rules/project.mdc` | Tech stack, forms (`lib/validation/`), layer/bullet/dropdown conventions; progression picker note |
