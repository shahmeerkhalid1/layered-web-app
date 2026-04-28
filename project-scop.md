# Pilates Platform --- MVP Project Scope

## Problem

Pilates instructors currently juggle multiple disconnected tools ---
spreadsheets, notes apps, and paper planners --- to schedule classes,
design exercise progressions, track clients, and manage their teaching
library. This fragmented workflow makes it hard to stay organized, reuse
class content, track client progress, and scale their practice over
time.

## Solution

Build a centralized SaaS platform purpose-built for Pilates instructors
that unifies class scheduling, structured class planning with layered
exercise progressions, a rich exercise library, and client session
tracking --- giving instructors everything they need to plan, teach, and
grow in one place.

## MVP Scope

- Users --- authenticated accounts (instructor-centric for MVP)
- Classes --- scheduled instances (calendar events), both group and private (1-on-1)
- Recurring & one-off classes (recurring = scheduling shortcut that generates individual instances)
- Class Plan Templates (reusable, decoupled from schedule; copy-on-use by default, optional sync)
- Exercise Library (with folders, tags, descriptions, cueing, regressions/progressions, up to 3 images per exercise)
- Exercise Progressions --- linear chain structure (Level 1 → Level 2 → Level 3)
- Starter exercise library (instructor-provided seed data) + personal additions
- Client roster/enrollment --- clients pre-assigned to recurring classes
- Attendance tracking for group classes
- Clients & session notes --- profiles, notes, injuries/focus/goals, exercises used, timeline per client
- Session notes must be tied to a scheduled class (no ad-hoc/standalone notes)
- Basic teaching stats & notifications
- Soft-delete for all major entities (exercises, clients, plans, classes)

## Features

### Home Dashboard

- **Calendar View** --- Weekly/monthly view of all scheduled classes with at-a-glance status
- **Upcoming Classes** --- Today's schedule prominently displayed
- **Notifications:**
  - Today's upcoming classes reminder
  - Clients missing session notes (nudge to log)
  - Scheduled classes without a plan assigned

### Calendar & Class Planning

- **Class Scheduling** --- Create one-off or recurring classes (group or private)
- **Recurring Classes** --- Generates individual class instances; instructor can swap the plan per instance
- **Class Planner** --- Structured builder with instructor-defined flexible sections (e.g., Warm-up, Main, Cool-down, or custom), each containing ordered exercises with structured data (time, reps, notes, order)
- **Class Plan Templates** --- Reusable class structures; copied into a class by default, with option to keep a live sync link
- **Layered Exercise Progressions** --- Linear chain system (Level 1 → 2 → 3) for building adaptive exercise flows
- **Client Roster** --- Pre-assign clients to recurring classes; check attendance per class instance

### Exercise Library

- **Create & Save Exercises** --- Build a personal library with rich metadata
- **Starter Library** --- Pre-seeded with common Pilates exercises (instructor-curated data)
- **Equipment-Based Folders** --- Categorize exercises by apparatus or equipment type
- **Exercise Detail Storage** --- Per-exercise fields: description, regressions/progressions (linear chain), cueing ideas, up to 3 image uploads
- **Load into Class Plans** --- Pull library exercises into any class plan or template
- **Search & Filter** --- Find exercises by name, tag, folder, or equipment
- **Soft-Delete** --- Archived exercises remain in historical class plans and session records

### Client Management

- **Client Profiles** --- Create and manage individual client records
- **Enrollment/Roster** --- Assign clients to recurring classes (group or private)
- **Attendance Tracking** --- Record which clients attended each group class instance
- **Session Notes** --- Log notes after each session, always tied to a specific class instance
- **Health & Goals Tracking** --- Store injuries, focus areas, and goals per client
- **Exercise Attachments** --- Link exercises used in a session to the client's record
- **Timeline View** --- Chronological history of all sessions and notes per client

### Reporting

- **Classes Taught** --- Count of classes per week/month
- **Unique Clients Seen** --- Number of distinct clients per period
- **Most-Used Exercises** --- Top exercises across all class plans
- **Sessions Per Client** --- Frequency tracking per client

## Architecture Decisions

| Decision | Choice | Notes |
|---|---|---|
| Session types | Group + Private (1-on-1) | Both supported in MVP |
| Recurring classes | Scheduling shortcut → individual instances | Each instance can have its own plan |
| Template linking | Copy-on-use by default, optional live sync | Instructor chooses per class |
| Exercise progressions | Linear chain | Level 1 → 2 → 3 (not branching tree) |
| Exercise library | Starter seed + personal | Instructor provides seed data |
| Session notes | Tied to scheduled class | No standalone/ad-hoc notes |
| Client enrollment | Roster concept | Clients pre-assigned to recurring classes |
| Attendance | Full tracking | Who showed up per group class instance |
| Deletion strategy | Soft-delete | All major entities; archived data preserved |
| Auth | Email + password | Architecture flexible for social login later |
| Image storage | Cloudinary (recommended) | Up to 3 images per exercise |
| Privacy/compliance | Not for MVP | Keep schema clean for future compliance |
| Data export | Not for MVP | Build clean, add later |
| Calendar sync | Standalone for MVP | No Google/Apple calendar sync |
| Mobile | Equally important as desktop | Responsive design required |

## Out of Scope (Future Phases)

- Video storage for exercises
- Team / multi-instructor functionality
- Client-facing portal
- Billing and subscription management
- External calendar sync (Google, Apple)
- Social login (Google, Apple)
- Data export
- HIPAA/GDPR compliance tooling

## User Roles

- **Instructor** --- Default MVP role. Full access to their own classes, templates, library, and clients.
- **Admin** --- Platform-level management. See capabilities below.
- **Team Member** *(Future)* --- Secondary instructors under a studio account with scoped access.

### Admin Capabilities (MVP)

**User Management**

- Invite instructors via email (invite link triggers registration flow)
- Signup toggle --- Enable or disable the public signup form (off by default; invite-only when disabled)
- View all registered instructor accounts
- Activate / deactivate accounts (soft-disable, not delete)
- Trigger password reset emails
- View account details (email, join date, last active)

**Content Oversight**

- Add, edit, or remove exercises from the shared starter/seed exercise library
- Instructors retain exclusive control over their personal exercise additions

**Platform Stats**

- Total instructors registered
- Active vs. inactive account counts
- Platform-wide usage overview (classes created, sessions logged)

### Out of Admin Scope (MVP)

- Cannot access instructor-specific data (clients, session notes, class plans) --- instructors own their data
- No billing or subscription management
- No instructor impersonation
