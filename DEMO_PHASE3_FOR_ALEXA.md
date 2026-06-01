# Pilates Platform — Demo for Alexa (Calendar & Class Scheduling — Phase 3)

## Overview — say first (about 45–60 seconds)

"**Quick recap:** you already saw the **exercise library** — where instructors save individual moves — and **class plans** — where those moves sit inside reusable templates with sections like warm-up and main work."

"**Phase three** is the **calendar and scheduling** layer. This is where a template stops being a saved plan on a shelf and becomes a **real class on a real day and time**. Instructors can see their week, schedule one-off or repeating classes, attach a plan to a session, tweak that session without breaking the original template, and open a class when they are about to teach."

"Everything still saves to the **live system** — the same backend you saw before. What is **not in this build yet** is **client roster and attendance** — that is the next phase."

"**Today** I will show you how **Phase 1, 2, and 3 fit together**, then walk the **calendar**, **week overview**, the **scheduling forms** (with or without a class plan), and what happens when an instructor **opens a class on the day**."

## Opening Line

"Alexa, you already saw login and admin on your side, and the instructor side for **exercises** and **class plans**. Today is the third piece: **when and how those plans land on the calendar** — so an instructor can actually run their week from the app."

## How the three phases connect (say once, before the screen tour)

"Think of it as three steps in one workflow."

"**Phase 1 — Exercise library:** build the building blocks. One exercise at a time — layers, photos, equipment tags, all saved for reuse."

"**Phase 2 — Class plans:** stack those blocks into a **template** — sections, order, class type and style — something they might teach many times."

"**Phase 3 — Calendar and scheduling:** pick a **date and time**, put that template onto the calendar as a **scheduled class**, and if the room or the clients need something different that day, **adjust this session only** without rewriting the master template."

"So: **move → plan → schedule → teach**. That is the full instructor loop we have working now."

---

## Part 1 — Calendar

### 1. Open Calendar from the menu.

"This is the instructor's **main schedule view** — a visual map of what is coming up."

Point at the page title and the date range under it.

"The header shows **how many classes** sit in this week or month, and they can flip between **week** and **month**, move **back and forward**, or jump to **today**."

Point at week/month toggle, arrows, Today.

"**New class** is for building a **class on the calendar without a plan attached yet** — one session or a **repeating series**. The hint on the page says they can also **click an empty time slot** to open the same style of **quick schedule** form, with date and time already filled in."

### 2. Week view — what you are looking at.

"In **week view**, each day is a column and time runs down the side. Scheduled classes show as **blocks** you can click."

Point at a GROUP block versus a PRIVATE block if both exist.

"**Group** and **private** classes use different colours so the week reads at a glance. When a plan was attached, you also see **class type and style** on the block — for example Reformer · Beginner — copied from the template when the class was scheduled."

Click a scheduled class block.

"Clicking a class opens the **class drawer** on the right — that is where instructors review or adjust **this specific session**. We will open that properly in a minute."

### 3. Month view — the big picture.

"In **month view**, they see the whole month at once. Clicking a day jumps them into **week view** for that week — good when they are planning further ahead."

Switch to month, click a day, land back in week view.

### 4. Quick schedule from an empty slot (calendar entry).

"If they click an **empty hour** on the week grid, the **quick schedule** dialog opens with **date and time already filled in**."

Click an empty slot.

"They add a **title**, pick **group or private**, set **duration**, and hit **Schedule** for a **one-off** class on the calendar."

"If they tick **Recurring class**, they also pick **which weekdays** repeat and an **end date** — same pattern as **New class**, but starting from the slot they clicked."

Point at the recurring checkbox, weekday pills, and end date if you expand it.

"This path is for **scheduling time first** — no class plan copied in yet. They can **attach a template later** from the class drawer if they want the exercises filled in."

Submit or cancel after showing the form — live data optional.

"This is the fast path when they are looking at the calendar and think 'I need something here at ten o'clock' — once, or every week on those days until the end date."

---

## Part 2 — Week Overview

### 5. Open Week Overview from the menu.

"This is a **teaching-focused** view of the same week — less grid, more like a **day-by-day list** of what is on."

Point at the day strip and the cards under each day.

"Each card shows **time**, **duration**, **group or private**, and **type · style** when it is set. They tap a card to open the **same class drawer** as on the calendar."

"Some instructors will live on **Calendar**; others will prefer **Week Overview** for a quick read before they walk into the studio. Same data, two layouts."

---

## Part 3 — Scheduling (connect back to class plans)

### 6. Schedule this plan from Class Plans (plan + calendar in one step).

"Remember **class plans** from the last demo? **Schedule this plan** sits on the plan card and on the plan detail page."

Open Class Plans, point at Schedule on a card or in the header on a detail page.

"The dialog title becomes **Schedule this plan**. The **template name** shows at the top, and **duration** comes from the plan. They pick **date**, **start time**, and **group or private**."

"If they leave **title** blank, it uses the **template name**."

"For a **single session**, one **Schedule** click creates the calendar entry **and copies the full sections and exercises** from the template."

"If they tick **Recurring class**, they also choose **weekdays** and an **end date** — and the plan is copied onto **each** future session in that series."

Point at recurring options if you show them.

"This is the shortcut you asked for: **plan first, schedule second** — with the teaching content already inside every occurrence."

### 7. New class from the calendar (blank class, no plan yet).

"**New class** on the calendar is the other path: build **time on the calendar first**, **without** attaching a class plan at creation."

Open New class from the calendar header.

"They enter **title**, **group or private**, **duration**, **start date**, and **time**. Tick **Recurring class** if they want repeating weekdays plus an **end date** — for example every Monday and Wednesday for the next eight weeks."

"No plan is copied here. The sessions land on the calendar as **empty shells** until the instructor opens one and uses **Assign template** in the drawer, or builds the session by hand."

Close or save depending on whether you want live data in the demo.

"So: **Schedule this plan** = template and timetable together. **New class** or **quick schedule from a slot** = timetable first, attach the plan when they are ready."

---

## Part 4 — Class drawer (what happens on the day)

### 8. Open a scheduled class from the calendar or week overview.

"When an instructor opens a class, this **drawer** is their command centre for **that one session**."

Point at the title, date, time, group/private badge, and recurrence line if it is a repeating class.

### 9. Template status — using vs modified.

"If a plan was attached, they see a badge like **Using [plan name]** or **Modified — based on [plan name]**."

Point at the badge.

"**Using** means it still matches the template copy. **Modified** means they changed something for **this session only** — the saved template in Class Plans is **not** changed. That was important to you: reuse the structure, adapt on the day."

### 10. Attach or swap a plan.

"If there is no plan yet, or they want a different one, **Assign or swap template** opens a searchable list. They **pick one row**, then confirm **Attach template** — so it is deliberate, not accidental."

Show the attach dialog briefly.

"The sections and exercises from that template **copy onto this session**. The original template stays untouched."

### 11. Edit the session plan — sections and exercises.

"Inside the drawer they can **rename sections**, **add a section**, **reorder** with up and down arrows, **add exercises from the library** or **create new**, adjust reps or notes on a row, or **remove** something."

Point at one section and one exercise row. Keep it high level.

"If they change the plan here, the session flips to **Modified**. There is also **Reset to template** if they want to throw away their tweaks and go back to the copied version."

"This is the same exercise library from Phase 1 feeding the same section idea from Phase 2 — but now it lives on **this dated class**."

### 12. Reschedule — one class vs the whole series.

"They can change **date and time** for this session. If it is part of a **recurring series**, the app asks: **just this class**, or **all future classes**."

Show the scope dialog if you have a recurring example.

"**Just this class** moves one occurrence — handy for a public holiday. **All future classes** shifts the pattern from that point forward — for example moving a Saturday series to Mondays from next week."

"For editing the **series rules** themselves — weekdays, end date, clock time across the series — there is **Edit series** for that deeper change."

### 13. Session actions — complete or cancel.

"Under **Session actions** they can **mark complete** when the class is done, or **cancel** if it is not running. That keeps the calendar honest about what actually happened."

Point at the action buttons. Mention that **client attendance** is still to come — no roster checklist yet.

---

## Closing

"So **Phase 3 completes the instructor loop** you scoped: **exercises** in the library, **templates** in class plans, and now **dated classes** on the **calendar** and **week overview** — scheduled from a plan (**Schedule this plan**, one-off or recurring), or as **blank sessions** (**New class** or **quick schedule from a slot**) with the plan attached later in the drawer, opened on the day with **copy-on-use** so edits to one session never break the master template."

"**What is next:** **client profiles, enrollment, and attendance** — so instructors can see who is in a class and mark who showed up. **Session notes** and **dashboard stats** follow after that."

"If you want to test yourself later, the happy path with a plan is: pick a **class plan** → **Schedule this plan** (one-off or recurring) → open it on **Calendar** or **Week Overview** → tweak in the drawer if needed → **mark complete**. Without a plan first: **New class** or **click an empty slot** → attach a template in the drawer when ready."

Total time: ~10–15 minutes (or shorter if you skip recurring and attach-template detail).

If Alexa asks follow-up questions, paste them here and I will give you the answer immediately.