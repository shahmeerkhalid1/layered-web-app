# Pilates Platform — Demo for Alexa (Phase 3 & 4: Calendar, Scheduling, and Client Management)

## Overview — say first (about 60–90 seconds)

"**Quick recap:** you already saw the **exercise library** — where instructors build individual moves with layers, photos, and movement tags — and **class plans** — reusable templates that stack those moves into sections like warm-up, main work, and cool-down."

"**Phase 3** is the **calendar and scheduling** layer. This is where a template stops sitting on a shelf and becomes a **real class on a real day and time**. Instructors can see their week or month, schedule one-off or repeating classes, attach a plan, tweak that session without breaking the original template, and manage the class on the day."

"**Phase 4** is the **client management** layer. This is where the instructor sees **who is in each class** — a client roster with profiles, enrollment in recurring classes, and per-session attendance marking. Now the calendar is not just about *what* to teach, but also *who is there*."

"Everything saves to the **live system** — the same backend you saw before. What is **not in this build yet** is **session notes** (personal notes on a client after a class) and the **live dashboard stats** — those come next."

"**Today** I will walk the **calendar**, **week overview**, the **scheduling forms**, the **class drawer** — and then show how **clients, enrollment, and attendance** now plug directly into that same drawer."

## Opening Line

"Alexa, you already saw login and admin, the instructor side for **exercises** and **class plans**. Today we are covering the **scheduling** and **client** layers — when and how plans land on the calendar, plus who is signed up and who shows up."

## How it all connects (say once, before the screen tour)

"Think of the full instructor loop working end to end."

"**Phase 1 — Exercise library:** build the building blocks. One exercise at a time — layers, photos, equipment tags, all saved for reuse."

"**Phase 2 — Class plans:** stack those blocks into a **template** — sections, order, class type and style — something they might teach many times."

"**Phase 3 — Calendar and scheduling:** pick a **date and time**, put that template onto the calendar as a **scheduled class**, and adjust that specific session without rewriting the master."

"**Phase 4 — Client management:** create client profiles, enroll them into classes, and mark attendance per session. The instructor now knows *what*, *when*, and *who*."

"So: **move → plan → schedule → enrol → teach → mark attendance**. That is the working loop today."

---

## Part 1 — Calendar

### 1. Open Calendar from the menu.

"This is the instructor's **main schedule view** — a visual map of what is coming up."

Point at the page title and the date range under it.

"The header shows **how many classes** sit in this week or month, and they can flip between **week** and **month**, move **back and forward**, or jump to **today**."

Point at week/month toggle, arrows, Today button.

"**New class** is for building a **class on the calendar without a plan attached yet** — one session or a **repeating series**. They can also **click an empty time slot** in week view to quick-schedule with date and time already filled in."

### 2. Week view — what you are looking at.

"In **week view**, each day is a column and time runs down the side. Scheduled classes show as **coloured blocks** you can click."

Point at a GROUP block versus a PRIVATE block if both exist.

"**Group** and **private** classes use different colours so the week reads at a glance. When a plan was attached, you also see **class type and style** on the block — for example *Reformer · Beginner* — pulled from the template."

Click a scheduled class block.

"Clicking a class opens the **class drawer** on the right — the instructor's command centre for **that specific session**. We will open that properly in a minute."

### 3. Month view — the big picture.

"In **month view**, they see the whole month at once. Clicking a day jumps them into **week view** for that week — handy when planning further ahead."

Switch to month, click a day, land back in week view.

### 4. Past-date guard.

"One important rule: **you cannot schedule a class in the past**. Empty slots on previous days are not clickable. The date picker in the scheduling forms blocks past dates too. But they can still **open, view, complete, and mark attendance** on past sessions — only creating or moving a class backward is stopped."

Point at a past day column (grayed or non-interactive slots).

"This keeps the calendar honest without locking instructors out of finishing admin on classes that already happened."

### 5. Quick schedule from an empty slot.

"If they click an **empty hour** on the week grid, the **quick schedule** dialog opens with **date and time already filled in**."

Click an empty slot.

"They add a **title**, pick **group or private**, set **duration**, and hit **Schedule** for a **one-off** class."

"If they tick **Recurring class**, they also pick **which weekdays** repeat and an **end date** — same as the full New Class form."

Point at recurring checkbox, weekday pills, end date.

"This is the fast path when they look at the calendar and think 'I need something here at ten o'clock'. No plan is copied — they can attach one later from the drawer."

---

## Part 2 — Week Overview

### 6. Open Week Overview from the menu.

"This is a **teaching-focused** view of the same week — less grid, more like a **day-by-day list** of what is on."

Point at the day strip and the cards under each day.

"Each card shows **time**, **duration**, **group or private**, and **type · style** when a plan is set. They tap a card to open the **same class drawer** as on the calendar."

"Some instructors will live on **Calendar**; others will prefer **Week Overview** for a quick read before they walk into the studio. Same data, two layouts."

---

## Part 3 — Scheduling Flows

### 7. Schedule a plan from Class Plans (plan + calendar in one step).

"Remember **class plans** from the last demo? **Schedule this plan** sits on the plan card and on the plan detail page."

Open Class Plans, point at the Schedule button on a card or in the detail header.

"The dialog title says **Schedule this plan**. The **template name** shows at the top. They pick **date**, **start time**, and **group or private**. Duration comes from the plan."

"For a **single session**, one click creates the calendar entry **and copies the full sections and exercises** from the template."

"If they tick **Recurring class**, they choose **weekdays** and **end date** — the plan copies onto **each** future session in that series."

"This is: **plan first, schedule second** — teaching content already inside every occurrence."

### 8. New class from the calendar (time first, plan later).

"**New class** on the calendar is the other path. They enter **title**, **group or private**, **duration**, **start date**, and **time**. Tick **Recurring** if they want repeating weekdays plus an end date."

Open New Class from the calendar header.

"No plan is copied here. The sessions land as **empty shells** until the instructor opens one and uses **Assign template** in the drawer."

"So two paths: **Schedule this plan** = template and timetable together. **New class** or **quick schedule from a slot** = timetable first, plan attached when ready."

---

## Part 4 — Class Drawer (what happens on the day)

### 9. Open a scheduled class from the calendar or week overview.

"When an instructor opens a class, this **drawer** is their command centre for **that one session**."

Point at the title, date, time, group/private badge, and recurrence line.

### 10. Template status — using vs modified.

"If a plan was attached, they see a badge like **Using [plan name]** or **Modified — based on [plan name]**."

Point at the badge.

"**Using** means it still matches the template copy. **Modified** means they changed something for **this session only** — the saved template in Class Plans is **not** changed. Reuse the structure, adapt on the day."

### 11. Attach or swap a plan.

"If there is no plan yet, or they want a different one, **Assign or swap template** opens a searchable list. They **pick one row**, confirm — sections and exercises from that template **copy onto this session**. The original template stays untouched."

Show the attach dialog briefly.

### 12. Edit the session plan — sections and exercises.

"Inside the drawer they can **rename sections**, **add a section**, **reorder** with up and down arrows, **add exercises from the library** or **create a new one**, adjust reps or notes on a row, or **remove** something."

Point at one section and one exercise row.

"If they change the plan here, the session flips to **Modified**. There is also **Reset to template** to throw away tweaks and go back to the copied version."

### 13. Reschedule — one class vs the whole series.

"They can change **date and time** for this session. If it is part of a **recurring series**, the app asks: **just this class**, or **all future classes**."

Show the scope dialog if there is a recurring example.

"**Just this class** moves one occurrence — good for a public holiday. **All future classes** shifts the pattern forward."

"For editing the **series rules** themselves — weekdays, end date, clock time across the series — there is the **Edit series** dialog. If they change the recurrence pattern, the app asks to confirm before regenerating future sessions."

### 14. Session actions — complete or cancel.

"Under **Session actions** they can **mark complete** when the class is done, or **cancel** if it is not running. Keeps the calendar honest about what actually happened."

Point at the action buttons.

---

## Part 5 — Client Management (Phase 4)

### 15. Open Clients from the menu.

"Now the **Clients** link is live in the sidebar."

Click Clients.

"This is the client library — the same layout you saw for exercises and class plans. **Title, live count, search, and a table.**"

Point at the header showing total client count and the search bar.

### 16. Client table.

"Each row shows **name**, **email**, **phone**, **how many classes they are enrolled in**, and quick actions."

Point at a row.

"Clicking a row opens the **client profile**. The row menu gives them **View profile**, **Edit**, or **Archive**."

"They can also **multi-select** with checkboxes and **archive in bulk** with one button. One API call, no matter how many are selected."

### 17. Create a new client.

Click **New client** in the header.

"The form asks for **first name**, **last name**, **email** (required), **phone**, plus open text for **injuries**, **focus areas**, and **goals** — the kind of notes a Pilates instructor writes during an intake session."

"All validation happens on submit. If something is wrong, the exact field highlights with the reason below it."

Fill in a test client or point at the fields.

"On save, they land on the new **client profile**."

### 18. Client profile page.

"The profile is **read-only** by default. Contact info at the top, then **enrolled classes** listed below — which class, type, duration, and when they enrolled."

Point at the sections.

"**Edit client** button goes to the editable version where they can also manage enrollments."

### 19. Edit client and manage enrollments.

Click **Edit client**.

"Same form as create, but with the existing data filled in. Below the form they see **Enrol in class** — they can search for a class and add this client to its roster."

Point at the enrollment section.

"Important detail: **enrollment** is for the **whole class series** — enrol once and they appear on every future session. **Attendance** is per session — checked off on the actual day."

---

## Part 6 — Enrollment and Attendance (Phase 4 inside the Class Drawer)

### 20. Back to the class drawer — now with clients.

Open a class instance from the calendar (one that has enrolled clients).

"Scroll down in the drawer. There is now an **Attendance** section. This is the Phase 4 connection: the clients who are enrolled in this class **automatically appear here** for every session."

Point at the attendance checklist.

### 21. Mark attendance.

"Each enrolled client has a **checkbox**. The instructor ticks who showed up, leaves unchecked who did not, and hits **Save**."

Toggle a checkbox.

"This saves to the database against **this specific session** — not the series. So if a client misses Tuesday but comes Thursday, both are recorded separately."

### 22. Manage enrollment from the drawer.

"There is a **Manage enrollment** button that opens the roster manager."

Click it to open the enrollment dialog.

"Top section: **currently enrolled** — they can select one or many and **remove** them from this class. Bottom section: **add clients** — search, tick, and batch-add to the roster."

"Once someone is added here, they appear on attendance for every future session in that class."

### 23. Dashboard integration.

Go back to the dashboard (home page).

"The **Clients** stat card is now live — it shows the real total from the database. Clicking it goes to the client list."

Point at the clients card.

---

## Part 7 — The Full Loop (put it all together)

### 24. Happy path summary (say, do not necessarily demo every click).

"The complete working loop today is:"

"**Build exercises** → **Build a class plan template** → **Schedule that plan** (one-off or recurring) → **Open the session on the calendar** → **Enrol clients** into the class → **Mark attendance** on the day → **Mark complete**."

"Or the quick path: **Create a class from the calendar** → **Attach a template later** → **Enrol clients** → **Mark attendance** → **Done**."

---

## Closing

"So **Phase 3 and 4 together** complete the scheduling-to-attendance loop you scoped: exercises in the library, templates in class plans, dated classes on the calendar and week overview, client profiles with intake notes, enrollment in recurring classes, and per-session attendance marking."

"The instructor can now manage **what they teach**, **when they teach it**, and **who is in the room** — all from one platform."

"**What is next:** **session notes** — so after a class, the instructor can write personal notes on each client (what worked, what to progress next time). Then **dashboard stats** and **reporting** to see the bigger picture over time."

"If you want to test yourself: pick a **class plan** → **Schedule this plan** → open on **Calendar** → enrol a test client via the drawer → mark attendance → mark complete. That is the full real workflow."

Total time: ~12–18 minutes (or shorter if you skip recurring scheduling and the session plan editor detail).

If Alexa asks follow-up questions, paste them here and I will give you the answer immediately.
