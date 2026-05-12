---
description: All Conversation between Muhammad Waqar Khan and Alexa McKay, Alexa M
alwaysApply: false
---
Alexa McKay, Alexa M
Layered Web-Based App
Tuesday, Mar 24
AM
Alexa McKay sent an offer

6:04 AM
I’m reaching out as I’m currently looking for a developer to help bring a web-based app idea to life, and I’d love to see if this could be a good fit.



I’m building a SaaS platform designed specifically for Pilates instructors to plan and manage their class programming. The core idea is to create a centralised system where instructors can schedule classes, build structured class plans (including layered exercise progressions), and store exercises for future use.



I’ve already created an interactive prototype using Blink, which maps out the core user flows, layout, and feature structure. This should give a clear starting point for development and help communicate the overall vision.



For the MVP, I’m aiming to keep things lean and focused on solo instructors. The key features include:



Calendar dashboard with scheduled class plans
Class planner with structured exercise builder (including layering system)
Exercise library with folders, tags, and search
Basic weekly teaching stats



Additional features like client notes, video storage, and team functionality would come in later phases.



From a technical perspective, I’m currently considering a stack such as cursor, but I’m very open to your recommendations on the best approach.



I’d love to:



Get your thoughts on the scope and feasibility
Understand how you would approach building this
Discuss potential timelines and costs



If this sounds like something you’d be interested in, I’d be happy to share the prototype and a more detailed breakdown.



Looking forward to hearing from you,

Rate: $15.00/hr

Rate increase: None

Limit: 20 hrs/week

View offer
Muhammad Waqar Khan
7:21 AM
Hi Alexa,



Thank you for reaching out — this sounds like a well-thought-out and exciting idea. I really like that you already have an interactive prototype in place; that will make the MVP scope much clearer and help move efficiently into development.



From what you’ve described, the feature set for the MVP sounds very feasible, especially with a lean focus on solo instructors. I’d be happy to review the prototype and share detailed feedback on scope, recommended tech stack, architecture, timeline, and estimated cost. I can also suggest an approach that keeps the system scalable for future phases like client notes and team functionality.



Please feel free to share the prototype and any additional documentation, and we can take it from there.



Looking forward to learning more.
Best,
Muhammad Waqar

AM
Alexa McKay
10:33 AM
Hi Muhammad,



Thank you for your thoughtful response, I really appreciate your feedback and I’m glad the concept resonates with you.



I’ll share the interactive prototype along with a brief overview of the core MVP features and user flow shortly. It would be great to get your insights on the scope, tech stack, and how best to structure it for scalability as the platform evolves.



I’m particularly interested in building this in a way that remains simple for solo instructors initially, but can expand seamlessly into client notes, team functionality, and a more robust system over time, so your input there will be really valuable.



Looking forward to hearing your thoughts once you’ve had a chance to review.



Best,
Alexa

Attached is the link to the prototype on blink.io, let me know if it works okay: https://layered-pilates-class-planner-1kle384v.sites.blink.new/

Wednesday, Mar 25
Muhammad Waqar Khan
8:00 AM
Hello Alexa,
Actually I was on holidays for one of our religious festival.



I am back to work today and will surely check th above link and get back to you soon.

AM
Alexa McKay
9:05 AM
No worries at all!

Muhammad Waqar Khan
11:19 AM
Hi Alexa,



I’ve reviewed the prototype and overall I think you’ve done a great job mapping out the core flow — it’s very clear and logically structured, which is ideal for moving into development.



A few high-level thoughts after reviewing the dashboard and planning flow:



1. Structure & Scalability
The current layout works very well for solo instructors. From a technical standpoint, I’d recommend we structure the database around:



* Users
* Classes (scheduled instances)
* Class Templates
* Exercises
* Exercise Layers / Progressions
* Tags / Folders



This will allow us to keep the MVP simple while making it easy to introduce client notes, video storage, and team roles later without restructuring the system.



2. Calendar + Class Planner
The weekly dashboard view is clean and intuitive. For scalability, I’d suggest separating:



* “Scheduled Class” (calendar event)
* “Class Plan Template” (reusable structure)



This way instructors can reuse and modify plans without duplicating logic.



3. Layered Exercise Logic
The layering concept is the most unique and important part of your product. I would design this as a modular, relational structure (parent exercise → progression levels) so it remains flexible and expandable over time.



4. Suggested Tech Stack
I’d likely recommend something like:



* Frontend: React (Next.js)
* Backend: Node.js (or Next.js API routes)
* Database: PostgreSQL
* Auth: Clerk or Supabase Auth
* Hosting: Vercel / AWS



This would give us strong scalability while keeping development lean for MVP.



Overall, the scope is very feasible for an MVP. Based on what I’ve seen so far, I’d estimate approximately 6–8 weeks for a well-built, scalable version 1 (I can give a more precise estimate once we finalize scope details).



Best,
Muhammad

Thursday, Mar 26
AM
Alexa McKay
12:06 AM
Hi Muhammad, thank-you for looking over it and your suggestions- I am on board with them. If we are looking at 6-8 weeks is that at 20 hours per week?

What are our next steps moving forward? Thanks again for your help

Muhammad Waqar Khan
12:31 PM
Hi Alexa,



Great, glad to hear you’re aligned with the approach.



For the 6–8 week estimate, that’s based on a part-time pace (~20–25 hours/week). If we increase the weekly hours, we could definitely shorten the timeline.



Next steps I’d recommend:



Finalize MVP scope – lock down the exact features for version 1 (to avoid scope creep).
Break into milestones – I’ll divide the project into clear phases (e.g., setup, core backend, planner, dashboard, testing).
Define timeline & cost – based on confirmed scope and weekly hours.
Start development – begin with project setup + database architecture.



If you’re good with that, I can put together a clear milestone plan with timeline and cost breakdown for you next.



Also happy to jump on a quick call to align before we begin.

Monday, Mar 30
AM
Alexa McKay
12:30 AM
Hi Muhammad, Sorry for the delay getting back to you. Happy to increase the weekly hours to (30-40) to shorten the timeline. Would be great to see the milestone plan!

Muhammad Waqar Khan
8:27 AM
Hello again,
I will prepare a milestone document today and will share it with you later Alexa.

Muhammad Waqar Khan
11:28 AM
Hi Alexa,



Increasing to 30–40 hours/week will definitely help us move faster.
Based on that, here’s a proposed milestone plan with an adjusted timeline (~4–5 weeks total):



Milestone 1: Project Setup & Architecture (3–4 days)
Hours: 30
1- Finalize MVP scope
2- Set up project (frontend + backend)
3- Database schema design (users, classes, templates, exercises, layers)
4- Auth setup



Milestone 2: Core Backend & APIs (5–6 days)
Hours: 40
1- Build core APIs (classes, templates, exercises)
2- Implement relationships (class -> plan -> exercises -> layers)
3- Basic validation & structure for scalability



Milestone 3: Class Planner + Exercise Builder (6–7 days)
Hours: 45
1- Build class planning interface
2- Implement layered exercise system (progressions)
3- Save/edit reusable class templates



Milestone 4: Calendar Dashboard (4–5 days)
Hours: 25
1- Weekly calendar view (as per prototype)
2- Create/edit scheduled classes
3- Link class plans to calendar



Milestone 5: Exercise Library (3–4 days)
Hours: 30
1- Folder/tag system
2- Search & filtering
3- Reuse exercises planner



Milestone 6: Basic Stats + Polish (3–4 days)
Hours: 30
1- Weekly teaching stats
2- UI refinements
3- Performance optimization



Milestone 7: Testing & Deployment (2–3 days)
Hours: 20
1- QA testing
2- Bug fixing
3- Deployment (Vercel/AWS)



Please let me know your thoughts or if you’d like to adjust anything before we proceed.
Thanks.

Tuesday, Mar 31
AM
Alexa McKay
7:00 AM
Hi Muhammad, Thank you for putting in the time to write up the timeline I really appreciate. So overall we are looking at around 220 hours? Cost wise I would like to keep the project at this or under 250 hours max. Also I am also not 100% set on the UI design right now and thinking maybe something more simple- but can give you a better idea of this when you need it. In terms of getting started what else would you need from me.

Muhammad Waqar Khan
7:35 AM
Hi Alexa,



Thanks for your message — yes, we can keep the project within the 220–250 hour range by staying focused on the MVP. Starting with a simpler UI is also a great approach, and we can refine it later as the product evolves.



To get started, I just need:



* Confirmation on the MVP scope
* Access to the prototype (any updates if applicable)
* Access to your existing Git/code repository so I can review and build on it



Once I have these, we can set up the contract and begin right away.

Wednesday, Apr 01
AM
Alexa McKay
2:12 AM
Okay so MVP scope: * Users
* Classes (scheduled instances)
* Class Templates
* Exercises
* Exercise Layers / Progressions
* Tags / Folders



2. Calendar + Class Planner
The weekly dashboard view is clean and intuitive. For scalability, I’d suggest separating:



* “Scheduled Class” (calendar event)
* “Class Plan Template” (reusable structure)



3. Layered Exercise Logic
The layering concept is the most unique and important part of your product. I would design this as a modular, relational structure (parent exercise → progression levels) so it remains flexible and expandable over time



4. Exercise Library
Create and save exercises
Categorise by equipment folder
Store:
Description
Regressions/progressions
Cueing ideas
Image upload
Ability to load exercises into class plans
Search and filter functionality



5. Client Notes
Create client profile
Log session notes
Store injuries, focus areas, and goals
Attach exercises used
Timeline view per client

I have shared the prototype link from blink.io - do you want me to give you actual access? As I am assuming this will then give you access to the existing Git/code repository

Blink - Musings from Wink
We are Wink - A small but incredible lab and design studio in India. With credence in design as a change agent, we work to create inspired services, products and experiences for not only our clients...
Blink - Musings from Wink
Muhammad Waqar Khan
10:58 AM
Hi Alexa,



This looks great, the scope is very clear. I agree with everything outlined, and it fits well within our planned MVP and timeline.



Yes, it would be perfect if you could give me access to the prototype on Blink. If that also includes access to the existing Git/code repository, that would be ideal — it’ll help me review the current setup and continue from there smoothly.



Once I have access, I’ll do a quick technical review and we can proceed with setting up the contract and starting development.

Tuesday, Apr 07
Muhammad Waqar Khan
3:07 PM
Hi Alexa,



Just wanted to follow up and see if you’ve had a chance to review everything and decide how you’d like to proceed.



I’m ready to get started.
Would love to hear your thoughts.

Wednesday, Apr 08
AM
Alexa McKay
2:33 AM
Hi Muhammad, Apologies for the delay in replying I missed that last message. I am just figuring out how I am able to give you access, i may need to upgrade to pro again., as i am not sure if you can access it even if you log in through my account.

Muhammad Waqar Khan
11:20 AM
Hi Alexa,



No worries at all, thanks for the update!



If access via Blink is a bit tricky right now, no problem — alternatively, you can just share:



- Any exported files/assets from the prototype (if available)
- Or simply grant me access to the Git/code repository directly



That would be enough for me to get started from a development perspective. We can always sync the prototype details alongside.



Let me know what works best for you

Friday, Apr 10
AM
Alexa McKay
6:50 AM
Hi Muhammad,

AM
Alexa McKay
8:19 AM
Sorry I am just figuring out how to do it- am i able to share it through GitHub?

Muhammad Waqar Khan
9:01 AM
Hello Alexa, I think we need to connect. Please share your schedul, so I can pick a time.

Thursday, Apr 23
AM
Alexa McKay
12:26 AM
Hi Muhammad,



My apologies for the delay in getting back to you — I’ve been tied up with a big project. I’d love to schedule a time for a call; what works best for you in terms of your local time?



Thanks,
Alexa

I have also downloaded the GIT can also share with you via GITHUB

Muhammad Waqar Khan
12:29 AM
Hello Alexa, hope you are doing well. Thank you for updating me. Let me share my calendar with you so you can pick a slot.

AM
Alexa McKay
12:29 AM
Okay thankyou, also let me know your GitHub username and i will share with you

Muhammad Waqar Khan wants to schedule a 30-minute meeting

12:30 AM
Waiting for Alexa to pick a date and time. Preview what your booking page looks like.

Preview booking page
We can see the GitHub in meeting. No worries

AM
Alexa McKay scheduled a meeting

12:46 AM
Date: Apr 30, 2026

Time: 09:00 AM - 09:30 AM (PKT)

Cancel | Reschedule | Add to calendar
If you have an earlier time in the week also let me know 🙂

Muhammad Waqar Khan
12:49 AM
Oh 30-april is too far. It's ok for me
But I think we can meet early. Let me send new schedule for you to pick early date please.

Muhammad Waqar Khan wants to schedule a 30-minute meeting

12:50 AM
Waiting for Alexa to pick a date and time. Preview what your booking page looks like.

Preview booking page
AM
Alexa McKay scheduled a meeting

1:11 AM
Date: Apr 23, 2026

Time: 10:00 AM - 10:30 AM (PKT)

Cancel | Reschedule | Add to calendar
we can do today that works great

Muhammad Waqar Khan
1:13 AM
Sure. Thank you

AM
Alexa McKay
1:15 AM
thanks

Upwork video meeting starts in 30 minutes

APP
9:30 AM
Date: Apr 23, 2026

Time: 10:00 AM - 10:30 AM (PKT)

Join meeting
Upwork video meeting starts in 1 minute

APP
9:59 AM
Date: Apr 23, 2026

Time: 10:00 AM - 10:30 AM (PKT)

Join meeting
Muhammad Waqar Khan created an Upwork video meeting

9:59 AM

The meeting ended (duration 08:07)

You’ll get a message when the meeting summary and recording are ready to view.

How it works

Your AI meeting recap is ready

APP
10:08 AM

Alexa McKay, Muhammad Waqar Khan
Apr 23, 2026
Summary
The meeting between Muhammad Waqar Khan and Alexa McKay focused on discussing the progress and next steps for a project they are collaborating on. Muhammad confirmed that Alexa had reviewed the milestones document, and they discussed access to GitHub for collaboration. Muhammad outlined his process for milestone completion and payment, and they agreed on a plan for Muhammad to review the codebase and start working on the first milestone. Alexa confirmed the technologies suggested by Muhammad were suitable for the project.
Action items
4
Muhammad Waqar Khan
Review the GitHub repository and Blink.io prototype after receiving access from Alexa.
Share a detailed plan with Alexa outlining the stages for Milestone 1.
Check the codebase and reach out to Alexa if there are any questions.
Alexa McKay Add Muhammad as a collaborator on GitHub using the email he provided in the meeting chat.
Generated by Uma, Upwork’s Mindful AI
Muhammad Waqar Khan
10:24 AM
Hi again, can you please send me the contract (hourly)here on Upwork. I will accept it and then I'll create milestones here also.

AM
Alexa McKay sent an offer

10:57 AM
The Freelancer will design, develop, and deliver a full-stack web application based on the agreed Minimum Viable Product (MVP).



This includes:



Frontend development (user interface and user experience)
Backend development (server, APIs, and application logic)
Database design and implementation
User authentication and account management
Core features including:
Class planning system
Exercise builder with layered progressions
Calendar scheduling dashboard
Exercise library with search and filtering
Basic analytics and performance tracking
Integration between frontend and backend systems
Deployment of the application to a live environment (e.g., Vercel or AWS)



All work will be delivered in accordance with the milestone structure outlined in this agreement.



Any features, functionality, or changes not explicitly included in this scope will be considered out of scope and may require a separate agreement or additional payment.

Est. Budget: $2,500.00

Milestone 1: Milestone 1: Project Setup & Architecture (3–4 days) Hours: 30 1- Finalize MVP scope 2- Set up project (frontend + backend) 3- Database schema design (users, classes, templates, exercises, layers) 4- Auth setup

Project funds: $340.00

View offer
Freelance_Development_Agreement_Updated.pdf 
Freelance_Development_Agreement_Updated.pdf
3 kB
Hi Muhammad, just wrote it up and sent it through 🙂

Muhammad Waqar Khan
Apr 23, 2026 | 10:24 AM
Hi again, can you please send me the contract (hourly)here on Upwork. I will accept it and then I'll create milestones here also.

Show more
Muhammad Waqar Khan accepted an offer

11:06 AM
View contract
Thank you for the contract Alexa. I will update you daily about progress.

AM
Alexa McKay
11:28 AM
Great thankyou Muhammad

Friday, Apr 24
Muhammad Waqar Khan
12:02 AM
Progress 24-Apr-2026



- Research competitive dashboards (functionality and  UI insights)
- Finalized tech stack (Fontend/Backend - NextJS, Database Supabase, Authentication System)



For tomorrow:
- Start working on Milestone-1.

AM
Alexa McKay
1:00 AM
Thats awesome thanks again Muhammad

Muhammad Waqar Khan
10:43 PM
Hi Alexa, Progress Today:
The project architecture is officially finalised, and I’ve resolved the logical gaps in the business flow.
Both the frontend and backend environments are now fully set up, so I will be moving into core features development for milestone-1.

Saturday, Apr 25
AM
Alexa McKay
4:54 AM
Hi Muhammad, thanks heaps for the update. Thats great!

Monday, Apr 27
Muhammad Waqar Khan
10:25 PM
Hi Alexa, Progress Today:
Backend / infrastructure
Database & ORM — PostgreSQL connected via Prisma; initial schema with instructor accounts and Better Auth–managed tables (sessions, accounts, verification).
Authentication — Better Auth with email/password, cookie-based sessions
Web app / UX foundation
Dashboard layout with sidebar, top bar, and main content area
Auth flows — Login and register pages hooked to Better Auth; shared auth state so the UI knows when someone is signed in.
Secure API calls — Front-end API helper that sends requests with cookies so logged-in users stay authenticated on API calls.

3 files 
image.png
image.png
image.png
Tuesday, Apr 28
AM
Alexa McKay
4:03 AM
Hi Muhammad,



Thank you so much for the update, I really appreciate the progress, it’s great to see everything coming together so smoothly. The backend setup and auth flow sound solid, and the dashboard foundation is exactly what we need at this stage.



I also wanted to mention one change on my end: I’d like to remove the Team Management page and replace it with a Collaborate page instead. I’ve added this in already, so that should be the direction moving forward.



Let me know if you need anything from me to support this shift.

Muhammad Waqar Khan
4:28 PM
Hii Alexa



Thank you for the heads up. I'll keep this in mind. Since this is outside the MVP scope, I'll likely finalize it after the MVP is done. Everything is good from my side. I'll keep you updated on the progress, and I'll reach out if I need anything.

Wednesday, Apr 29
Muhammad Waqar Khan
12:04 AM
Hi Alexa
Progress Update: 28 Apr
Milestone 1 is nearly complete. I’ve finalized the MVP scope, set up the full-stack environment, and implemented the Admin Dashboard with full Auth and user management. I have attached a demo video, In attached video I am logged in as ADMIN, As an Admin you can manage users, exercise library (later when library will be created), and platform actions. i.e I will invite Instructor to register via link.
https://www.loom.com/share/61f11b55e3844ef8b1f7860a16084800



Two actions for you:
- Please set the current repo to Private.
- Create a new repository for the backend so I can merge the code there.



I’ll have Milestone 1 fully wrapped up by tomorrow. Let me know if you have time for a quick call—I’d love to give you a live demo of the admin features!

The video walkthrough focuses on the UI, but I’ve also attached an image of the database schema for your review to show how the backend logic is structured.

image.png 
image.png
Muhammad Waqar Khan
1:57 PM
Hii Alexa.I have committed and pushed the initial code to GitHub. You can find the repository here



https://github.com/amcka115/Alexa551

AM
Alexa McKay
2:41 PM
Hi Muhammad that great, thank you very much for your progress update. I have just set the repo to private and have created a new repository for the backend. let me know a time that suits to call

Will view the walk through video now

https://github.com/amcka115/alexa-app-backend.git

Muhammad Waqar Khan
3:07 PM
Yeah, Let me share calender for tomorrow, you can pick a slot which suits you.

Muhammad Waqar Khan wants to schedule a 30-minute meeting

3:08 PM
Waiting for Alexa to pick a date and time. Preview what your booking page looks like.

Preview booking page
Also, please add me as a collaborator for backend repository.

AM
Alexa McKay
3:22 PM
Sorry just added you as a collaborator. Will pick a time now

Alexa McKay scheduled a meeting

3:22 PM
Date: Apr 30, 2026

Time: 11:00 AM - 11:30 AM (PKT)

Cancel | Reschedule | Add to calendar
Muhammad Waqar Khan
3:24 PM
Thank you Alexa, see you tomorrow then!

Thursday, Apr 30
AM
Alexa McKay
12:47 AM
Hey Muhammad,



Apologies, I’ve just had a chance to look over the video.



I’m just a little unsure about the function of the user management. Since each account is individual, I just want to clarify how this would work, is this mainly for me on the backend?



I do think some basic admin functionality will be important (like managing users and access), but I’d like to keep this minimal for the MVP and potentially expand on it in a later phase. I also want to keep things quite simple from a privacy perspective.



For now, I think a simple way for me to view/manage users and allow sign-ups should be enough.



Let me know

Muhammad Waqar Khan
1:02 AM
Hi Alexa,



Totally understand your point! We are exactly on the same page.



The user management I showed is strictly for you as the Admin to have basic oversight of the platform. For the MVP, it is kept very functional—just a simple way for you to invite instructors and manage their access (like activating or deactivating accounts).

AM
Alexa McKay
1:20 AM
Okay great. So the video shows what my admin acc would look like?

Upwork video meeting starts in 30 minutes

APP
8:30 AM
Date: Apr 30, 2026

Time: 09:00 AM - 09:30 AM (PKT)

Join meeting
AM
Alexa McKay created an Upwork video meeting

8:55 AM

Join meeting

For the best experience, join on a computer web browser.

How it works

Upwork video meeting starts in 1 minute

APP
8:59 AM
Date: Apr 30, 2026

Time: 09:00 AM - 09:30 AM (PKT)

Join meeting
AM
Alexa McKay
8:59 AM
sorry just running 3 mins late

Muhammad Waqar Khan
9:00 AM
Alexa, I thought the meeting is after 2-hours(11am) my time.

I just wokeup and it early morning here. Can we meet after 2-hours please?

AM
Alexa McKay
9:02 AM
no worries I thought it was too, then i got that notification. Yes lets meet in 2hours

Muhammad Waqar Khan
9:03 AM
Sure. Thank you

AM
Alexa McKay rescheduled a meeting

9:35 AM
Apr 30, 2026, 01:30 PM - 02:00 PM (PKT)

Apr 30, 2026, 11:00 AM - 11:30 AM (PKT)

Cancel | Reschedule | Add to calendar
Apologies I have just needed to reschedule by 2hours does that work for you?

Muhammad Waqar Khan
9:52 AM
Alright. I'll be there

Upwork video meeting starts in 30 minutes

APP
1:00 PM
Date: Apr 30, 2026

Time: 01:30 PM - 02:00 PM (PKT)

Join meeting
Muhammad Waqar Khan created an Upwork video meeting

1:28 PM

Join meeting

For the best experience, join on a computer web browser.

How it works

Upwork video meeting starts in 1 minute

APP
1:29 PM
Date: Apr 30, 2026

Time: 01:30 PM - 02:00 PM (PKT)

Join meeting
Muhammad Waqar Khan
1:30 PM
Hello Joelle, I am sharing Google Meet link with you, upwork is not allowing me to start the meeting here.

AM
Alexa McKay
1:31 PM
okay

Muhammad Waqar Khan
1:33 PM
You removed this message

AM
Alexa McKay
1:35 PM
just waiting to be let in on google meets

Muhammad Waqar Khan
1:35 PM
Sorry, please join this one : https://meet.google.com/jry-xdud-amw

Muhammad Waqar Khan requested payment for the milestone

2:06 PM
Following our demo, I’ve completed and shared the core system structure along with the authentication system for both admin and instructor roles.



Next, I’ll continue building out the remaining instructor features as discussed.

Milestone 1: "Milestone 1: Project Setup & Architecture (3–4 days) Hours: 30 1- Finalize MVP scope 2- Set up project (frontend + backend) 3- Database schema design (users, classes, templates, exercises, layers) 4- Auth setup"

Amount: $340.00

View details
AM
Alexa McKay approved the milestone

2:16 PM
Milestone 1: "Milestone 1: Project Setup & Architecture (3–4 days) Hours: 30 1- Finalize MVP scope 2- Set up project (frontend + backend) 3- Database schema design (users, classes, templates, exercises, layers) 4- Auth setup"

Amount paid: $340.00

Amount: $340.00

View details
AM
Alexa McKay
2:29 PM
Thanks again for the call.



Just confirming my understanding, users can sign up directly through the login/sign-up page, not just via an invitation link? Happy with that overall milestone i will release the funds

Muhammad Waqar Khan
2:47 PM
Yes the user will directly signup and also with invitation link. But the permission stays with admin, so admin can disable direct signup also anytime(will implement after mvp).

Thank you for releasing the milestone.
I will share progress for next features,so you get updated everyday.

Friday, May 01
AM
Alexa McKay
7:25 AM
great thanks again

Sunday, May 03
AM
Alexa McKay activated the milestone

1:31 PM
Milestone 2: "Milestone 2: Core Backend & APIs (5–6 days) Hours: 40 1- Build core APIs (classes, templates, exercises) 2- Implement relationships (class -> plan -> exercises -> layers) 3- Basic validation & structure for scalability"

Amount: $455.00

View details
Monday, May 04
Muhammad Waqar Khan
12:53 PM
Hi Alexa,



I’m back today and starting work on Milestone 2. As before, I’ll share daily progress updates along with video recordings so you can track everything clearly.



If you’d like, we can also schedule a meeting anytime this week—Wednesday or Thursday would be ideal, as it gives me a couple of days to make solid progress before our discussion.

AM
Alexa McKay
1:17 PM
Hi Muhammad, Thanks great thankyou keep me updated. Yes either of those days work well.

Muhammad Waqar Khan
10:02 PM
Progress Update: 4 May
Demo link: https://www.loom.com/share/20a67cc104444105ad461b2c2aa81c2f



In the demo, the first screen shows the Admin Panel where I’m logged in as an admin. I start on the Dashboard, which displays key user metrics such as total instructors, active users, banned users, and pending invites. Then I navigate to User Management to view detailed user data and use the options menu (three dots) to access individual user information. After that, I open the Settings tab to review platform-level configurations.



Next, I switch to the Instructor view in a different browser. I begin with the Dashboard, which currently contains placeholder data. Then I go to the Exercise section, where all exercises are listed. I click on “New Exercise” to open the creation form, fill in pre-prepared details (name, description, cueing idea, and tags), and submit it to create a new exercise. Once created, the exercise detail page is displayed. I return to the Exercise list, open the newly created exercise (Footwork L2), and access the Edit form, then cancel it.



Point Covered:
- Built a Core Exercise Library with Prisma schemas and CRUD(Create, Read, Update and Delete) APIs
- Created structured Create/Edit forms, and refactored the UI into reusable components with dedicated hooks for better maintainability.

Tuesday, May 05
AM
Alexa McKay
12:52 AM
wow that so good, amazing progress Thankyou for the update I really appreciate it! It’s looking great, look forward to testing soon.
Thanks again

Wednesday, May 06
Muhammad Waqar Khan
12:04 AM
Progress Update: 5 May
In the demo, I’m logged in as an Instructor and working within the Exercises tab. I added a “+” icon next to Folders, which allows creating new folders. I created a folder named “Reformer,” and it appears below the All Exercises section.



Next, I created a new exercise by filling in the required fields such as name, description, and cueing ideas (using pre-prepared content), selected the “Reformer” folder, added relevant tags, and saved it. After returning to the Exercises tab, the exercise appears in the listing. By clicking on the “Reformer” folder, the list filters to show only exercises within that folder, while the All Exercises tab continues to display all exercises, including uncategorized ones.



Point Cover:
- Full Folder Management functionality, supported by Folder APIs (Create, Read, Update, Delete)
 - UI for creating, renaming, and deleting folders



Demo Link:
https://www.loom.com/share/7a42785338624db2abb54a4aa2cd0410

AM
Alexa McKay
12:45 AM
Hi Muhammad, thank you for the update. Wow such big improvements, it’s coming along very well I am happy with it.



Did you want to meet sometime tomorrow?

Or later in the week is fine also if you wanted to get more done.

Muhammad Waqar Khan
8:46 AM
Good morning Alexa.



Yeah we can meet by Thursday. I will try to make some more progress today.

AM
Alexa McKay
9:56 AM
Okay sounds good, thankyou

Muhammad Waqar Khan
11:31 PM
Progress Update: May 6th



In this Demo, I’m logged in as an Instructor and working in the Exercises section. I had already prepared the exercise content using AI, so I started by clicking on “New Exercise” and filling in the name, description, and cueing details.



After that, I selected a folder and saw an optional “progression” field. Since I was creating a Level 1 exercise (the starting/basic version), I left this empty. I then added tags, uploaded images (up to 3 images per exercise), and created the exercise.



Next, I created another exercise (Level 2). This time, after filling in the details, I selected the previous exercise (Level 1) as its progression. This links the exercises together, where Level 1 is the easier version and Level 2 is the next step. I also uploaded images and adjusted their order using drag-and-drop before saving.
Now, the system clearly shows a progression chain:
 Short Spine Level 1 → Short Spine Level 2



Points Covered:
- Exercise creation flow
- Progression system to link exercises from easier to more advanced levels
- Upload up to 3 images per exercise with drag-and-drop reordering
- Folder behavior: deleting a folder does not remove exercises; they simply move to “uncategorized”
- When an exercise is deleted, its images are also properly removed
- Visual progression chain viewer to clearly see exercise levels



Demo Link:
https://www.loom.com/share/cbf56ec9c37a4f0b82b14d245e3886da

Thursday, May 07
AM
Alexa McKay
12:51 AM
Morning Muhammad, thank you for the update — I really appreciate it.
The exercise section is looking great overall. There is one important addition I’d like to include, which is a “layer system” — this also ties directly into the app name, “LAYERED.”
In Pilates, when you create an exercise (for example, a leg set), you progressively build it by adding layers within that set. As you may have seen in the prototype on Blink, there’s an option to add layers to each exercise.
For example:
A single leg press would start as Layer 1, which is just the basic movement with cues.
In Layer 2, you build on that by adding something like pulses at halfway.
By Layer 3 or 4, you introduce a “finisher” — for instance, dropping down to halfway pulses to complete the set.
So essentially, each layer builds intensity and complexity within the same exercise, creating a more dynamic and progressive experience.
Therefore is there anychnace we could add this layering system in like the prodotyoe, I will add a screen recording to show what I mean.



Thanks again

Muhammad Waqar Khan
1:04 AM
Alright Alexa. And please if you can share a recording - that would be good for me.

AM
Alexa McKay
5:23 AM
Apologies the file never uploaded will try again now

ScreenRecording_05-07-2026 07-53-07_1.mov 
ScreenRecording_05-07-2026 07-53-07_1.mov
97 MB
Muhammad Waqar Khan
7:22 AM
Thank you. I will definetly look at the recordings and try to build same thing.

Muhammad Waqar Khan
12:00 PM
Hello again, I think we can meet by next week (Tuesday) would be better. I will try to show a healthy update till then.

AM
Alexa McKay
12:16 PM
yeah no worries, thankyou

Muhammad Waqar Khan
10:28 PM
Progress Update: May 6th
In the Demo, I’m logged in as an Instructor and working in the Exercises section. I had already prepared the exercise content using, so I started by creating a new exercise and filling in the basic details such as the exercise name.



I then completed the structured exercise setup by selecting Orientation, Direction Faced, Movement Type, and Equipment Used from dropdowns, while leaving optional fields like Springs and Machine Setup empty where not required.



Next, I worked through the new Layering System. Layer 1 is available by default in the form, and I added content for Layer 2 as well. When clicking “Add Layer,” the form automatically places the Finisher section at the end. If another instructional layer is needed before the Finisher, the system intelligently inserts the next layer (such as Layer 3) while always keeping the Finisher positioned last.



After that, I added Transition Cues, Notes, selected Movement Analysis and Chain Type, assigned the exercise to a folder, and uploaded an image. Clicking on an uploaded image opens a full preview for a better viewing experience.
Once the exercise is created, the system now provides a dedicated Preview Mode, allowing instructors to review the final formatted exercise exactly as it will appear inside the platform.



Points Covered:
- Dynamic dropdown-based exercise configuration
- Layering System with automatic layer ordering
- Support for adding multiple instructional layers dynamically
- Finisher section always locked at the end for consistency
- Image upload with full-size preview support



Demo Link: https://www.loom.com/share/98036859c12649e6a5c9039ca63803ba

Friday, May 08
Muhammad Waqar Khan
12:02 PM
I've put together a few quick questions to clarify the workflow for Class Plans and the Calendar to ensure the final build matches your vision perfectly.



https://docs.google.com/document/d/1eaWc9Aam4ZiXJS8RXq4JNPZgJsya6fdbRxbSCbVOimA/edit?usp=sharing

AM
Alexa McKay
2:01 PM
Hi Muhammad, thanks for sending that doc through below is my thinking: A Class Plan should primarily act as a reusable template, but with the ability to customise it for a specific session.



So the ideal flow would be:



1.) Create a Class Plan as a base template
Then assign it to a specific date/time
With the option to edit or adjust it for that specific class without changing the original template



This is important because instructors often reuse structures, but adapt them depending on the class, clients, or how the body is presenting that day.

2. Where Class Plans live vs Calendar



Yes your suggested flow is exactly how I imagine it working:



Go to Class Plans → create a plan (e.g. “Beginner Reformer”)
Go to Week Overview / Calendar → schedule a class
Attach the plan to that class



The calendar acts as a visual overview for the instructor, allowing them to clearly see what classes they are teaching across the week. It’s also where the organisation happens, attaching a Class Plan to a specific time and day helps structure and map out their schedule in a really intuitive way.



I’d also like the option to:



Quick-create and schedule in one go (for ease and speed)



So ideally:
- Both flows exist



Structured planning (Class Plans → Calendar)
Quick planning (create + assign instantly)

AM
Alexa McKay
2:47 PM
3. Exercise Input Methods



Yes, definitely both.



Pick from Library: for efficiency and consistency
Create New: for flexibility and creativity



This is really important because:



Not every exercise will already exist
Instructors often adapt or create variations in the moment



Over time, newly created exercises (added within individual Class Plans) should be able to be saved as individual exercises not just as part of a full plan allowing users to gradually build their own exercise library.



The Exercise Library should function as a separate, organised space where users can:



Store and access individual exercises
Create a simple folder/category system (e.g. “Lower Body”, “Arms”, etc.)



In practice, creating a Class Plan would involve selecting and sequencing 5–7 individual exercises to build a full, teachable session. The Exercise Library acts as a quick-access bank of these individual movements (e.g. “Leg Set 1”) that can be easily added into a Class Plan. Essentially: Create New Class Plan
- This feature allows instructors to create a full Pilates class plan from scratch.
Within a Class Plan, users can:



Build out the full structure of a class (e.g. warm-up → main sets → cool down)
Add and sequence multiple exercises to create a complete, teachable session



When creating a plan, users should be able to:



Import saved exercises from the Exercise Library
Create new exercises on the spot if needed



This ensures the process is both:



Efficient (using pre-saved exercises)
Flexible (allowing for creativity and adaptation)

4. Defining the "Rating" Field- (this is isn't a must happy to leave out for now, more jst a way to further organise previously created class plans)



Option b) Performance Review fits best.



The rating should act as a post-class reflection tool, allowing instructors to:



Review how the class flowed
Reflect on what worked/didn’t
Improve future planning



If possible, it would be great if:



This is filled in after the class
Potentially paired with a short notes/reflection field

Muhammad Waqar Khan
2:55 PM
Thanks so much for clarifying those points! Super helpful to have that clear. I’m going to get these requirements locked in now. I’ll keep you updated

AM
Alexa McKay
3:02 PM
thats great, thanks again. Let me know if you need any further information too.

Muhammad Waqar Khan
10:47 PM
Progress Update: May 8th
I refined the Exercise Listing UI to create a cleaner and more consistent experience by improving the alignment of exercise titles, descriptions, tags, and action buttons (Edit/Delete). The layout and spacing were updated to improve readability and overall usability.



I also did initial research and planning for the upcoming Class Planner and Exercise Builder modules, focusing on structured class sections, reusable templates, and a flexible workflow for instructors to build and organize efficiently.

Screenshot_49.png 
Screenshot_49.png
Sunday, May 10
AM
Alexa McKay
2:45 AM
Hi Muhammad,



Thanks for sending this through it’s all looking really aligned. I just wanted to add a bit more clarity around how the Movement Analysis section will work based on the latest layout.



Alongside the exercise setup (starting position, orientation, direction faced, movement type, springs, equipment, and machine setup), each exercise will also include a Movement Analysis layer to give more depth and structure when programming.



This includes:



Spinal Movement



Flexion
Extension
Rotation
Lateral Flexion
Articulation



Chain Type



Open Chain
Closed Chain
Both
Lower Chain Closed
Upper Open



Joint Loading



Knee Loading
Wrist Loading



This allows instructors to be more intentional with programming for example balancing spinal patterns, managing joint stress, and ensuring variety across open vs closed chain work. It also supports smarter class planning over time, especially when layering exercises or building progressions.



The goal is for this to feel quick to select (not overwhelming), but really powerful in terms of how it informs class design and client outcomes.



Let me know if that aligns with how you were thinking, or if you’d want to simplify/expand any of those categories.

2 files 
Screenshot 2026-05-10 at 9.44.07 AM.png
Screenshot 2026-05-10 at 9.44.01 AM.png
Monday, May 11
Muhammad Waqar Khan
11:44 AM
Thank you for the added clarity — this makes a lot of sense and the reasoning behind it is really well thought out. Being able to balance spinal patterns, manage joint stress, and track open vs closed chain work across a class is exactly the kind of depth that will make the platform genuinely useful for programming.



To confirm how we'll build it:



Spinal Movement and Joint Loading will work as multi-select checkboxes — so an instructor can tick more than one at a time. For example, Swan Dive could be tagged as both Extension and Articulation, and a Plank variation could have both Knee Loading and Wrist Loading selected at the same time. This matches the way these movements actually work in the body.



Chain Type will stay as a single select — an exercise is one or the other (or Both), so a dropdown/radio button is the right fit there.



This is already in the schema and the dropdown seed data is set up. I just need to make a small update to allow multiple selections on those two fields, which is straightforward.



All aligns perfectly with how we were thinking about it — really glad you flagged this as it's an important detail to get right. Please let me know if there’s anything else you’d like to adjust.

AM
Alexa McKay
1:08 PM
Hi Muhammad,



This is perfect, thanks for laying it out so clearly.



Yes ideally the spinal movement and joint loading being multi-select, that feels exactly right and reflects how exercises are actually performed.



On chain type, I understand the logic of keeping it as a single select, but I’d lean towards also having this as multi-select. In practice, there are quite a few movements that genuinely sit across both depending on setup, transitions, or intent within the exercise (not just a strict “both” category). Allowing multiple selections here would keep it consistent with the rest of the movement analysis and give a bit more flexibility when programming.

I will attach a screen recording below from the prodtype to show what I mean.

AM
Alexa McKay
1:40 PM
Here is the screen recording- showing the main tags i would like to add when builing a class I will add below

AM
Alexa McKay
1:48 PM
Screen Recording 2026-05-11 at 8.35.44 PM.mov 
Screen Recording 2026-05-11 at 8.35.44 PM.mov
30 MB
These are the tags that need to be included when writing out he class plan: Orientation
- Supine
- Prone
- Side-Lying
- Low Kneeling
- High Kneeling
- 4 point kneeling
- Standing
- Seated



Direction Faced
- Front-Facing
- Reverse-Facing
- Side-Facing



Spring
* Input field (instead of selected drop down)
Note: Reformer machines vary
If exercise is on mat → option to then type “N/A”



Machine Setup
- Footbar Up
- Footbar Down
- Footbar Up
- Footbar Middle
Option for N/A if it doesn’t apply for mat instructors



Equipment
- Ring
- Band
- Ball
- Box
- Dumbbells
- Dell
- Multi-select enabled (users can select multiple pieces of equipment)
- Include option to type in and for “None” / no selection (for bodyweight or minimal setup exercises).



Movement Analysis
Spinal Movement (multi-select)
- Flexion
- Extension
- Rotation
- Lateral Flexion
- Articulation                      
- Neutral
- None (for exercises like lying leg warm-ups on carriage)



Chain Type (multi-select)
Open Chain – The moving limb is free (e.g. arm or leg moving without being fixed)
Closed Chain – The limb is fixed against a surface (e.g. foot on carriage or hands on bar)
Both – Combines open and closed chain within the same exercise
Lower Chain Closed – Lower body is fixed (e.g. feet grounded), upper body moves freely
Upper Open – Upper body is moving freely while lower body remains stable



Joint Load
Knee Loading (checkbox)
Wrist Loading (checkbox)
Hip Flexor Loading (checkbox)

AM
Alexa McKay
2:03 PM
furthermore: Layering System Update (Class Plan Structure)



Currently, any layers added beyond the 3rd layer are automatically assigned as a finisher. This creates unnecessary limitations and reduces flexibility when building structured progressions within a class.



Proposed update:



Allow unlimited layers within a class plan without automatically tagging any layer as a finisher
Introduce a manual toggle: “Mark as Finisher” so instructors can intentionally define the finisher layer
or alternatively:
Restrict finisher status so that only the final layer can be marked as a finisher, rather than automatically assigning all layers beyond layer 3



This will ensure class structure remains intentional and fully customisable.



Progression System



To support better programming and scalability within exercises, add dedicated fields for:



Progressions
Regressions



These could be implemented as:



Expandable text fields within each exercise, or
Embedded directly within the exercise structure as part of the layering system



This would allow instructors to clearly build intensity options and modifications without disrupting the core class flow.