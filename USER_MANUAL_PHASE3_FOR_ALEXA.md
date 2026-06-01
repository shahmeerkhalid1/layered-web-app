# Layered. — User Manual for Alexa (Phase 3: Calendar & Class Scheduling)

This guide explains how to use **Phase 3** of the Pilates Platform: the **calendar**, **week overview**, and **class scheduling** tools. It is written for you to read on your own, test the product, and answer questions without needing to dig into technical details.

---

## What Phase 3 adds

Phases 1 and 2 gave instructors **exercises** (individual moves) and **class plans** (reusable templates with sections and exercises). Phase 3 answers the next question: **when does the class actually happen?**

With Phase 3 you can:

- See scheduled classes on a **calendar** (week or month view)
- Browse the same week in a **teaching-focused list** (Week Overview)
- Schedule a class **from a class plan** (plan + date/time in one step)
- Schedule a **blank class** first and attach a plan later
- Open any scheduled class on the day and **adjust that session only** without changing the saved template
- Create **one-off** or **recurring** classes
- Mark classes **complete** or **cancelled**

Everything saves to the live system (same backend as Phases 1 and 2).

**Not included yet (coming in later phases):** client roster, enrollment, attendance checklists, and session notes. The class drawer includes placeholder copy where clients will eventually appear.

---

## How the three phases fit together

| Phase | What it is | Example |
|-------|------------|---------|
| **1 — Exercise library** | Individual moves with layers, photos, equipment tags | “Rolling Like a Ball” |
| **2 — Class plans** | Reusable templates: sections + exercises + class type/style | “Monday Reformer — Beginner” |
| **3 — Calendar & scheduling** | A template (or blank slot) placed on a **specific date and time** | “Monday Reformer — Beginner, Tue 10:00 AM, May 27” |

**Workflow in one line:** move → plan → schedule → teach.

---

## Where to find scheduling in the app

After logging in as an instructor, use the sidebar:

| Menu item | Purpose |
|-----------|---------|
| **Calendar** | Visual week/month grid; best for planning and spotting gaps |
| **Week Overview** | Same week as a day-by-day list; best for a quick read before teaching |
| **Class Plans** | Where **Schedule this plan** lives (Phase 2, now connected to the calendar) |

Both Calendar and Week Overview open the **same class drawer** when you click a scheduled class.

---

## Calendar

### Header controls

At the top of the Calendar page you will see:

- **Date range** — the week or month you are viewing
- **Class count** — how many classes are scheduled in that period
- **Previous / Next** — move backward or forward in time
- **Today** — jump back to the current week or month
- **Week / Month** — switch views
- **New class** — open the full create-class form (see below)

A hint under the title reminds you: **click an empty time slot to quick-schedule**.

### Week view

- Each **column** is a day; **rows** are hours.
- Scheduled classes appear as **coloured blocks**.
- **Group** and **private** classes use different colours so the week is easy to scan.
- When a class plan was attached, the block may also show **class type · class style** (for example `Reformer · Beginner`).
- **Click a class block** → opens the **class drawer** for that session.
- **Click an empty hour** → opens the **quick schedule** dialog with date and time already filled in.

### Month view

- Shows the full month at a glance.
- **Click a day** → jumps to **week view** for that week.

---

## Week Overview

Week Overview shows the same scheduled classes as the calendar, but as **cards grouped by day** instead of a time grid.

Each card shows:

- Start **time**
- **Duration**
- **Group** or **Private**
- **Class type · class style** when set

**Click a card** → same class drawer as on the calendar.

Use whichever view you prefer: Calendar for planning layout, Week Overview for a simple daily checklist.

---

## Three ways to schedule a class

### Option A — Schedule this plan (recommended when you already have a template)

**Best for:** “I have a class plan ready; put it on the calendar.”

1. Go to **Class Plans**.
2. On a plan **card** or on the **plan detail page**, click **Schedule this plan**.
3. The dialog shows the **template name** at the top. **Duration** comes from the plan.
4. Fill in:
   - **Title** (optional — if left blank, the template name is used)
   - **Group** or **Private**
   - **Date** and **start time**
5. For a **single session**, click **Schedule**. The class appears on the calendar **and the full sections and exercises are copied** from the template.
6. For a **recurring series**, tick **Recurring class**, choose **weekdays**, set an **end date**, then click **Schedule**. The plan is copied onto **every** future session in that series.

### Option B — New class (from the calendar header)

**Best for:** “I know the time slot; I will attach a plan later (or build the session by hand).”

1. On **Calendar**, click **New class**.
2. Enter **title**, **group or private**, **duration**, **start date**, and **time**.
3. Optionally tick **Recurring class** and set weekdays + end date.
4. Click to create. Classes land on the calendar as **empty shells** (no plan copied yet).
5. Open a session from the calendar and use **Assign / swap template** in the drawer, or add sections and exercises manually.

### Option C — Quick schedule from an empty slot

**Best for:** “I am looking at the calendar and want something at this exact hour.”

1. In **week view**, click an **empty time slot**.
2. The quick schedule dialog opens with **date and time pre-filled**.
3. Add **title**, **group or private**, **duration**.
4. Schedule as one-off or recurring (same weekday + end-date pattern as New class).
5. No plan is copied at creation — attach one later from the drawer if needed.

### Quick comparison

| Path | Plan copied at creation? | Typical use |
|------|--------------------------|-------------|
| **Schedule this plan** | Yes | Teaching a known template on a set schedule |
| **New class** | No | Block time first, plan later |
| **Quick schedule (empty slot)** | No | Fast booking while browsing the week |

---

## Recurring classes

When you tick **Recurring class** (in any scheduling form):

1. Select one or more **weekdays** (Mon–Sun pills).
2. Set an **end date** for the series.
3. Submit — the system creates a **class series** and generates individual **sessions** on each matching day up to the end date.

**Limits:** Duration must be a whole number of minutes, at least 1 and at most **480** (8 hours). The system caps how many future sessions can be generated in one series (520 occurrences).

### Editing a recurring series later

From the class drawer, if the session belongs to a recurring series:

- **Reschedule date/time** → you are asked **Just this class** or **All future classes**
- **Edit series…** → change series-level rules (weekdays, end date, clock time, duration) with a confirmation step when future sessions will be regenerated

See **Rescheduling** below for the difference between these actions.

---

## The class drawer (teaching day)

Click any scheduled class on the **Calendar** or **Week Overview** to open the **class drawer** — a panel from the right side of the screen. This is the command centre for **that one session**.

### What you see at the top

- Class **title**
- **Date** and **time**
- **Group** or **Private** badge
- **Duration**
- **Repeats: … · until …** line if it is part of a recurring series
- **Template badge** (if a plan is attached):
  - **Using [plan name]** — session still matches the copied template
  - **Modified** — you changed something for this session only; the saved template in Class Plans is **not** changed

### Rescheduling

Use the **date** and **time** fields in the drawer to move a session.

- **Non-recurring class** — saves immediately to the new date/time.
- **Recurring class** — a dialog asks:
  - **Just this class** — moves only this occurrence (e.g. skip a public holiday week)
  - **All future classes** — shifts the pattern from this session forward (e.g. move every future Saturday class to Monday from next week onward)

Changing **only the time** on “all future” updates the clock for following sessions on the same weekdays. Changing the **date** can shift which weekdays the series uses going forward.

### Session actions

Under **Session actions**:

| Button | What it does |
|--------|--------------|
| **Mark complete** | Marks this session as done after teaching |
| **Assign / swap template** | Opens a searchable list of class plans; pick one row, then confirm **Attach template** |
| **Add section** | Adds a new section to this session’s plan |
| **Edit series…** | Opens the series editor (recurring classes only) |
| **Reset to template** | Discards your session edits and restores the copied template (shown when customised) |
| **Cancel class** | Cancels this scheduled session |

### Editing the session plan

Inside the drawer you can manage sections and exercises for **this session only**:

- **Rename** a section (pencil icon)
- **Reorder** sections or exercises (up/down arrows)
- **Add exercises** from the library (multi-select picker) or **create new**
- Edit **reps, duration, or notes** on each exercise row
- **Remove** exercises or sections

Any edit marks the session as **Modified**. The original class plan template in **Class Plans** stays unchanged.

### Attaching or swapping a template

If there is no plan yet, or you want a different one:

1. Click **Assign / swap template**.
2. Search and **select one plan** (radio-style rows — click the row to select).
3. Click **Attach template** to confirm (avoids accidental one-click changes).
4. Sections and exercises from that template **replace** the current session plan and the customised flag clears.

---

## Copy-on-use: why sessions do not break templates

This is an important product rule:

- Scheduling **copies** a class plan onto the session. It does **not** link live to the template.
- If you edit the **template** in Class Plans later, **already scheduled sessions do not auto-update**.
- If you edit a **session** in the drawer, the **template** is never changed.
- **Reset to template** on a session throws away session-only edits and restores the last attached copy.

This lets instructors reuse structure while adapting on the day for a specific room, client mix, or energy level.

---

## Common tasks (step-by-step)

### Happy path — schedule and teach a known plan

1. **Class Plans** → pick a template → **Schedule this plan**
2. Set date, time, group/private → **Schedule** (add recurring options if needed)
3. On the teaching day, open **Calendar** or **Week Overview** → click the class
4. Review or tweak exercises in the drawer
5. After class → **Mark complete**

### Block time now, plan later

1. **Calendar** → **New class** (or click an empty slot)
2. Enter title, type, duration, date, time → create
3. Before teaching → open the session → **Assign / swap template** → pick plan → **Attach template**

### Move one occurrence without changing the whole series

1. Open the session in the drawer
2. Change date and/or time
3. Choose **Just this class**

### Change every future session in a series

1. Open any upcoming session in the series
2. Change date/time → **All future classes**, **or**
3. Use **Edit series…** for weekday/end-date/duration changes

### Undo session edits

1. Open the customised session
2. Click **Reset to template**
3. Confirm

---

## What is not in Phase 3

These are planned for later phases — do not expect them in the current build:

- **Client profiles** and roster
- **Enrollment** (who is signed up for a class)
- **Attendance** tracking
- **Session notes** after class
- **Live dashboard stats** (home page numbers are still placeholders for some metrics)
- **Drag-and-drop reorder** in the plan editor (arrow up/down reorder works today)

The class drawer may show placeholder text where clients will eventually be listed.

---

## Tips for testing

If you want to verify the system yourself:

1. **With a plan:** Class Plans → Schedule this plan → open on Calendar → tweak one exercise → confirm badge shows **Modified** → check Class Plans template is unchanged.
2. **Without a plan:** New class → open drawer → Assign template → confirm sections appear.
3. **Recurring:** Create a Mon/Wed series for two weeks → reschedule one Wed as “just this class” → confirm other sessions unchanged.
4. **Week vs calendar:** Same class should appear in both views with matching time and type.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Class plan / template** | Reusable teaching plan in Class Plans (Phase 2) |
| **Scheduled class / session / instance** | One dated occurrence on the calendar |
| **Class series** | A recurring set of sessions sharing the same rules |
| **Copy-on-use** | Template content is copied to the session, not synced live |
| **Customised / Modified** | Session plan was edited after scheduling or attach |
| **Group / Private** | Class format; shown as colour and badge throughout scheduling UI |

---

## Quick reference — button locations

| Action | Where to click |
|--------|----------------|
| Schedule from a template | Class Plans → **Schedule this plan** (card or detail header) |
| Schedule without a template | Calendar → **New class** or empty slot |
| Open a session | Calendar block or Week Overview card |
| Attach a plan to a session | Class drawer → **Assign / swap template** |
| Mark taught | Class drawer → **Mark complete** |
| Cancel a session | Class drawer → **Cancel class** |
| Edit recurring rules | Class drawer → **Edit series…** |

---

## What comes next (Phase 4+)

After calendar and scheduling, the roadmap continues with:

- **Client profiles** — who attends your studio
- **Enrollment and attendance** — who is in each class and who showed up
- **Session notes** — record what happened in class
- **Reporting / dashboard stats** — real numbers on the home page

---

*Last updated: May 2026 — reflects Phase 3 completion (calendar, week overview, quick schedule, recurring classes, class drawer with copy-on-use, edit series, reschedule scopes).*

If you have questions while testing, note them here and your developer can answer against this build.
