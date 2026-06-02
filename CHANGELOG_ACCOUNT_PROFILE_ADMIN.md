# Account, Profile & Admin User Management — Changelog

This document records functionality, UI, API, and bug-fix work for **account settings**, **profile photos**, **admin user management**, **platform settings placement**, and related auth/navigation changes on the **Pilates Platform (Layered.)**.

**Scope:** `client/` (Next.js 16) and `server/` (Express + Prisma + Better Auth + Cloudinary)  
**Roles:** `INSTRUCTOR` and `ADMIN` (both use the same account flows unless noted)

---

## Table of contents

1. [Summary](#1-summary)
2. [Routes & navigation](#2-routes--navigation)
3. [Account settings (all users)](#3-account-settings-all-users)
4. [Change password](#4-change-password)
5. [Profile photo upload](#5-profile-photo-upload)
6. [Avatar display & initials fallback](#6-avatar-display--initials-fallback)
7. [Backend — profile API](#7-backend--profile-api)
8. [Auth & session](#8-auth--session)
9. [Admin — user management UI](#9-admin--user-management-ui)
10. [Admin — platform settings](#10-admin--platform-settings)
11. [Bug fixes](#11-bug-fixes)
12. [Files created](#12-files-created)
13. [Files modified](#13-files-modified)
14. [Files removed / deprecated](#14-files-removed--deprecated)
15. [Testing checklist](#15-testing-checklist)

---

## 1. Summary

| Area | What changed |
|------|----------------|
| **Account settings** | Dedicated pages for profile (name + photo) and security (password link). Full-width layout aligned with other dashboard pages. |
| **Profile photo** | Cloudinary upload/delete via `/api/profile/avatar`; session synced with Better Auth `updateUser({ image })`. |
| **Avatar UI** | Two-letter initials when no photo; cache-busting; remount fix after delete so fallback always shows. |
| **Change password** | Separate page at `/account/password` (not combined with profile). |
| **Admin user management** | Table UI aligned with **Clients** library: header card, `ExerciseSearch`, table styling, row click → details, actions menu with icons, pagination. |
| **Row selection** | Checkboxes, select-all, bulk **Deactivate selected** (excludes current admin’s own row). |
| **Platform settings** | Moved from sidebar **Settings** tab into **Account settings** for admins only. `/admin/settings` redirects to `/account#platform-settings`. |
| **Sign-in email** | Shown for instructors only (hidden for admins). Copy explains email is set at registration/invite and cannot be changed in-app. |
| **Login/register** | Fixed React warning: redirect when already authenticated runs in `useEffect`, not during render. |

**Explicitly not implemented (by design):**

- Email change in admin dashboard or account UI (Better Auth / product choice: email fixed after register/invite).
- Billing section on account settings (removed placeholder; reserved for future).
- Section nav pills (Profile / Email / Billing / Security) on account page (removed).

---

## 2. Routes & navigation

### New / updated routes (client)

| Path | Component | Who |
|------|-----------|-----|
| `/account` | `AccountSettingsView` | All authenticated users |
| `/account/password` | `ChangePasswordView` | All authenticated users |
| `/profile` | Redirect → `/account` | Legacy URL |
| `/admin/users` | Admin users page + list | `ADMIN` only (layout guard) |
| `/admin/settings` | Redirect → `/account#platform-settings` | `ADMIN` (legacy bookmark) |

### Sidebar

**Instructor** (unchanged main nav): Dashboard, Week Overview, Calendar, Class Plans, Exercises, Clients.

**Admin** main nav (sidebar):

- Dashboard (`/`)
- User Management (`/admin/users`)
- ~~Settings (`/admin/settings`)~~ **removed**

**Account menu** (bottom of sidebar, all roles):

- Account settings → `/account`
- Change password → `/account/password`
- Log out

Active state: Account settings highlights only on exact `/account` (not on `/account/password`).

---

## 3. Account settings (all users)

**Page:** `/account`  
**Component:** `client/src/components/account/account-settings-view.tsx`  
**Shell:** `AccountPageShell` — back button (ghost icon, `router.push`), title, description, full-width children.

### Sections

1. **Signed in as** — Preview card with avatar, display name, role badge, email.
2. **Profile** — Photo upload + display name form (React Hook Form + `profileFormSchema`).
3. **Sign-in email** — **Instructors only.** Read-only email with lock icon; message: set at registration/invite, cannot be changed in app.
4. **Platform settings** — **Admins only.** See [§10](#10-admin--platform-settings).
5. **Security** — Link row to `/account/password`.

### Name update

- Client: `authClient.updateUser({ name })` (Better Auth).
- Validation: `profileFormSchema` — trim, 1–120 chars.
- Save button enabled only when form is dirty.

### Admin vs instructor copy

- Admin description: *"Update your profile, platform settings, and sign-in options."*
- Instructor description: *"Update your profile and manage how you sign in to Layered."*

---

## 4. Change password

**Page:** `/account/password`  
**Component:** `client/src/components/account/change-password-view.tsx`

- Fields: current password, new password, confirm password, **revoke other sessions** (checkbox, default on).
- Validation: `changePasswordFormSchema` in `client/src/lib/validation/profile-schemas.ts`.
- Uses Better Auth client change-password API.
- Layout: form card + sidebar tips (password guidance).
- Back link: Account settings (`/account`).

---

## 5. Profile photo upload

**Component:** `client/src/components/account/profile-photo-upload.tsx`  
**API module:** `client/src/services/profile-api.ts`

### User flow

1. Drag-and-drop or **Upload photo** / **Replace photo** (JPEG, PNG, WebP, max 5 MB).
2. Immediate **blob URL** preview while uploading.
3. On success: `POST /api/profile/avatar` → Cloudinary → DB `avatarUrl` → `authClient.updateUser({ image: url })` → parent state + toast.
4. **Remove** → `DELETE /api/profile/avatar` → Cloudinary destroy → `updateUser({ image: "" })` → initials fallback.

### UI

- Large circular preview (`AccountAvatar` size 28).
- Loading overlay on preview during upload/remove.

---

## 6. Avatar display & initials fallback

**Component:** `client/src/components/account/account-avatar.tsx`  
**Utils:** `client/src/lib/utils.ts`

### `getDisplayInitials(name)`

Always up to **two** characters:

- Multiple words: first letter of first + first letter of last word (e.g. `John Smith` → `JS`).
- Single word ≥2 chars: first two letters (`Alex` → `AL`).
- Single char: duplicated (`J` → `JJ`).
- Empty name: `??`.

### `avatarDisplayUrl(url, version?)`

Optional `?v=` / `&v=` cache-bust query when `imageVersion` changes after replace.

### Base UI avatar remount

`Avatar` root uses `key={src ?? "initials"}` so when the image is cleared, `imageLoadingStatus` resets and **fallback initials show** (fixes blank circle after delete).

### Session normalization

`auth-context.tsx`: `image: user.image?.trim() || null` so empty strings do not count as a photo URL.

---

## 7. Backend — profile API

**Mount:** `app.use("/api/profile", profileRoutes)` in `server/src/app.ts`  
**Auth:** All routes use `authenticate` middleware.

| Method | Path | Body / file | Response |
|--------|------|-------------|----------|
| `POST` | `/api/profile/avatar` | `multipart/form-data` field `image` | `{ url: string }` |
| `DELETE` | `/api/profile/avatar` | — | `204` |

**Service:** `server/src/modules/profile/profile.service.ts`

- Upload: `uploadAvatarImage(instructorId, filePath)` → updates `Instructor.avatarUrl`.
- Delete: `deleteAvatarImage` + `avatarUrl: null` in Prisma.

**Cloudinary:** `server/src/lib/cloudinary.ts`

- Public ID: `avatars/{instructorId}/profile`
- Upload: 400×400 fill, `overwrite: true`, `invalidate: true`
- Delete: `destroy` on same public ID

**Better Auth mapping:** `user.fields.image` → `avatarUrl` on `Instructor` model (`server/src/lib/auth.ts`).

---

## 8. Auth & session

### Client context

`client/src/context/auth-context.tsx` — `Instructor` includes `image: string | null` from session `user.image`.

### Profile sync after photo change

`authClient.updateUser({ image })` after upload; `image: ""` after delete (client normalizes to `null` for display).

### Login / register guard

**Problem:** `router.replace("/")` ran during render when `isAuthenticated` → React error *"Cannot update a component (Router) while rendering a different component (LoginPage)"*.

**Fix:** `useEffect` when `!isLoading && isAuthenticated`; show `AuthLoadingCard` until redirect.

**Files:** `client/src/app/login/page.tsx`, `client/src/app/register/page.tsx`.

---

## 9. Admin — user management UI

**Page:** `/admin/users`  
**Pattern:** Same as **Clients** (`ClientLibraryHeader` + `ClientList`).

### Header — `admin-user-library-header.tsx`

- Icon tile (`UsersRound`), `font-heading` title **User management**
- Live count: `N users` or `Showing X of Y users` when search active
- **Invite user** (rounded full button)
- **ExerciseSearch** for email search (debounced on page)

### List — `admin-user-list.tsx`

| Feature | Behavior |
|---------|----------|
| Table shell | `rounded-3xl border bg-card shadow-lg` |
| Header row | `bg-accent`, uppercase tracked column labels |
| Columns | Checkbox, Name, Email, Role (hidden &lt; `sm`), Status, Actions |
| Row click / Enter / Space | Opens **View details** sheet |
| Checkbox | Per row; disabled for **current user** |
| Select all | Selects all on page except self |
| Selection bar | `{n} selected`, Clear selection, **Deactivate selected** (active users only) |
| Bulk deactivate | Confirm dialog; parallel `banUser`; refresh via `onRefresh` |
| Row menu | View details, Make admin, Make instructor, Deactivate / Activate (with icons) |
| Status badges | Active: outline muted; Inactive: destructive pill |
| Role badges | Outline; admin highlighted with primary tint |
| Empty states | Directory empty + invite CTA; filtered empty + clear filters |
| Loading | Centered pill spinner |
| Pagination | `ExerciseLibraryPagination` inside table card |

### Page — `admin/users/page.tsx`

- Data: `authClient.admin.listUsers` (paginated, email search, sort `createdAt` desc)
- Page size: `10`
- Dialogs: invite (RHF + `adminInviteFormSchema`), ban, unban, role change
- Sheet: user details (name, email, role, status, ban reason, created, email verified)
- Still uses `adminApi.invite` for invitations

---

## 10. Admin — platform settings

**Previously:** `/admin/settings` standalone page with Cards and decorative blur.

**Now:** `PlatformSettingsSection` embedded in `/account` for **admins only**.

**Component:** `client/src/components/account/platform-settings-section.tsx`  
**Section id:** `platform-settings` (`scroll-mt-6` for hash links)

### Controls

1. **Public signup** — Toggle via `adminApi.patchSettings({ signupEnabled })`. Affects `/register` when no invite token.
2. **Invitations** — Informational block + link to `/admin/users`.

### Redirect

`client/src/app/(dashboard)/admin/settings/page.tsx` → `redirect("/account#platform-settings")`.

**Account page:** `useEffect` scrolls to `#platform-settings` when hash present (admin only).

### API (unchanged)

- `GET /api/admin/settings` → `{ signupEnabled: boolean }`
- `PATCH /api/admin/settings` → update platform setting

---

## 11. Bug fixes

| Issue | Cause | Fix |
|-------|--------|-----|
| Blank avatar after photo remove | Base UI `Avatar` kept `imageLoadingStatus: loaded` after `AvatarImage` unmounted | Remount `Avatar` with `key={src ?? "initials"}` |
| Single-letter initials | `getDisplayInitials` only used first letter per word | Always two letters (see [§6](#6-avatar-display--initials-fallback)) |
| Stale session image after delete | Empty string vs null | Trim/normalize in `auth-context` + `updateUser({ image: "" })` |
| Router setState during render on login | `router.replace` in render when authenticated | `useEffect` + loading UI |
| Admin settings in sidebar + separate page | Product decision to consolidate | Removed nav item; settings in account |

---

## 12. Files created

```
client/src/app/(dashboard)/account/page.tsx
client/src/app/(dashboard)/account/password/page.tsx
client/src/app/(dashboard)/profile/page.tsx                    # redirect → /account
client/src/components/account/account-avatar.tsx
client/src/components/account/account-page-shell.tsx
client/src/components/account/account-settings-view.tsx
client/src/components/account/change-password-view.tsx
client/src/components/account/platform-settings-section.tsx
client/src/components/account/profile-photo-upload.tsx
client/src/components/admin/admin-user-library-header.tsx
client/src/components/admin/admin-user-list.tsx
client/src/lib/validation/profile-schemas.ts
client/src/services/profile-api.ts
server/src/modules/profile/profile.routes.ts
server/src/modules/profile/profile.service.ts
CHANGELOG_ACCOUNT_PROFILE_ADMIN.md                             # this file
```

---

## 13. Files modified

```
client/src/context/auth-context.tsx              # image on Instructor; trim empty image
client/src/lib/utils.ts                          # getDisplayInitials, avatarDisplayUrl
client/src/components/layout/sidebar.tsx         # account menu; remove admin Settings nav
client/src/app/login/page.tsx                    # auth redirect in useEffect
client/src/app/register/page.tsx                 # auth redirect in useEffect
client/src/app/(dashboard)/admin/settings/page.tsx   # redirect to account hash
client/src/app/(dashboard)/admin/users/page.tsx      # header + list components
server/src/lib/auth.ts                           # image → avatarUrl (if not already)
server/src/lib/cloudinary.ts                     # avatar upload/delete helpers
server/src/app.ts                                # mount /api/profile
server/prisma/schema.prisma                      # avatarUrl on Instructor (if migration applied)
```

---

## 14. Files removed / deprecated

| Item | Notes |
|------|--------|
| `client/src/components/profile/profile-settings-view.tsx` | Replaced by split account + password views (removed in session) |
| `/admin/settings` as primary UI | Replaced by account section; route kept as redirect |
| Sidebar **Settings** (admin) | Removed |
| Combined profile + password on one page | Split into `/account` and `/account/password` |
| Billing card / section nav pills on account | Removed per UX request |

---

## 15. Testing checklist

### Account (instructor)

- [ ] Open `/account` — profile, email (read-only), security link visible
- [ ] Upload photo — preview, sidebar avatar, signed-in card update
- [ ] Remove photo — two-letter initials everywhere
- [ ] Change display name — save, session name updates
- [ ] Change password — `/account/password`, revoke sessions option
- [ ] Sign-in email section visible

### Account (admin)

- [ ] Sign-in email section **hidden**
- [ ] Platform settings visible — toggle signup, toast on save
- [ ] `/admin/settings` redirects to platform section on account page

### Admin users

- [ ] List loads, search by email, pagination
- [ ] Row click opens details sheet
- [ ] Select one / select all (cannot select self)
- [ ] Bulk deactivate with confirm
- [ ] Invite user dialog + copy link
- [ ] Role change / ban / unban from row menu

### Auth

- [ ] Visit `/login` while logged in — no console Router error; redirects to `/`
- [ ] Visit `/register` while logged in — same

### Regression

- [ ] Instructor sidebar nav unchanged
- [ ] Admin dashboard and user management still guarded by admin layout

---

## Related docs

- Project conventions: `.cursor/rules/project.mdc`
- Broader session UI changelog: `CHANGELOG_SESSION.md`
