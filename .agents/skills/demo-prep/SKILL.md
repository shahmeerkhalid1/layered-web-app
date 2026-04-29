---
name: demo-prep
description: Prepare up-to-date client demo scripts and high-level walkthrough documents for the Pilates Platform. Use when the user asks for a demo, demo script, client walkthrough, presentation notes, Alexa demo, completed task summary, or content like DEMO_FOR_ALEXA.md.
---

# Demo Prep

Use this skill when preparing a client-facing demo document for the Pilates Platform.

## Goal

Create a concise, natural-language demo guide that reflects the latest completed work in the repo. The audience is a non-technical client, so explain product value and workflows, not implementation details.

## Required Workflow

1. Review current progress before writing:
   - Read `.cursor/plans/mvp_implementation_plan_4c3cd703.plan.md` if present.
   - Check relevant app pages, routes, modules, or schema files for implemented features.
   - Use `DEMO_FOR_ALEXA.md` as the style reference when it exists.
2. Identify only demo-ready completed work.
   - Do not present planned modules as completed.
   - It is fine to mention future modules in a short "next step" or closing line.
3. Write or update a demo document in natural language.
   - Keep it concise enough for a 5-10 minute demo unless the user asks for more depth.
   - Use simple client-facing language.
   - Avoid deep technical explanations, internal architecture detail, and code-level commentary.
4. Include deployment notes only when relevant.
   - For this project, the frontend and backend may live in separate GitHub repos.
   - Suggested deployment: frontend on Vercel; backend on Render, Railway, or Fly.io; PostgreSQL on Neon, Supabase, Railway, or Render Postgres.

## Output Style

Follow this format by default:

```markdown
# [Demo Title]

## Opening Line

"[Short line to start the demo.]"

## Steps

### 1. [Action to perform.]

"[What to say in natural language.]"

Point at [specific visible area].

"[Short explanation of client value.]"

### 2. [Next action.]

"[What to say.]"

## Closing

"[Summarize what is working today.]"

"[Mention what comes next.]"

"[Optional short deployment note.]"

Total time: ~5-10 minutes.

If [client/person] asks follow-up questions, paste them here and I will give you the answer immediately.
```

## Tone Rules

- Be direct and natural, like a person speaking in a demo.
- Prefer short quoted talk-track lines.
- Use the client's name if provided.
- Keep "what to click" and "what to say" clearly separated.
- Explain why the feature matters to the business.
- Say "currently", "next", or "later" when separating finished work from future work.

## Pilates Platform Context

Current product direction:

- A SaaS MVP for Pilates instructors.
- Central workspace for scheduling, class plans, exercise library, clients, attendance, and session notes.
- Admin role for user management, invitations, signup control, and platform stats.

Common completed foundation items to verify before claiming:

- Login and registration.
- Cookie-based authenticated sessions.
- Admin and instructor roles.
- Admin-only route access.
- User management.
- Invite-only onboarding.
- Public signup toggle.
- Account activation and deactivation.
- Dashboard shell.

Future modules should usually be framed as next steps:

- Exercise library.
- Class plan templates.
- Calendar and scheduling.
- Client profiles.
- Attendance tracking.
- Session notes.
- Simple reporting.
