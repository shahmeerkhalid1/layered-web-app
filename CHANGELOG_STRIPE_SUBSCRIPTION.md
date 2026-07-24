# Stripe Subscription Integration — Session Changelog

Documentation of the payment system work, client discussions, Stripe configuration, and all code changes from the July 2026 implementation session.

---

## 1. Business context (Alexa / Layered)

### MVP scope agreed (individual subscriptions only)

Alexa confirmed keeping the MVP focused on **payment system + individual subscription**, not Studio/Team Management in this phase.

| Plan | Price (NZD) | Limits |
|------|-------------|--------|
| **Starter (Free)** | $0 | Up to **3 class plans** |
| **Instructor+ (Monthly)** | **$14 NZD / month** | Unlimited class plans |
| **Instructor+ (Annual)** | **$10 NZD / month** equivalent (**$120 NZD / year**) | Unlimited class plans; UI shows ~17% savings / “Save $60 NZD per year” |

**UX strategy:** Instructors sign up on the free plan, use the product, and are prompted to upgrade when they hit the 3 class plan limit.

**Studio/Team Management** was explicitly deferred to a later phase. It would require Team/Organisation models, membership, Personal vs Team visibility on content, and team-level billing — a separate scope from the payment quote.

### Later studio discussion (not implemented)

Alexa later proposed a **simple studio MVP** (team workspace, up to 20 seats, exercise sharing, studio subscription at $149/mo or $1,500/yr). That remains **Phase 2** and is **not** in this implementation.

### Client Stripe account access

Alexa should:

1. Create a **New Zealand** Stripe account (NZD settlement)
2. Invite the developer as **Administrator** or **Developer** under **Settings → Team**
3. Not share login password — team invite only

---

## 2. Architecture decisions

### Payment flow: Option C (chosen)

| Option | Description | Decision |
|--------|-------------|----------|
| A | Stripe Checkout redirect only | Insufficient — no manage/cancel UI |
| B | Embedded payment form in-app | Too complex for MVP |
| **C** | **Stripe Checkout (subscribe) + Customer Portal (manage/cancel/switch)** | **Implemented** |

**Subscribe:** User clicks **Upgrade Now** on `/billing` → redirect to Stripe Checkout → return to `/billing?success=true`.

**Manage:** Subscribed users click **Manage subscription** → Stripe Customer Portal (update card, switch monthly/annual, cancel).

**Webhooks:** Stripe sends events to `/api/webhooks/stripe`; server updates `Subscription` in PostgreSQL.

### Currency

All paid pricing is **NZD**. Stripe Price objects use `currency: nzd`. Checkout displays NZ$ amounts from Price IDs (not hardcoded in payment logic).

### Entitlements

- **Free:** `status: "free"` — max 3 active class plans (`deletedAt: null`)
- **Paid:** `status: "active"` or `"trialing"` — unlimited class plans
- **Platform admins:** Unlimited (bypass quota); no billing UI actions

Server-side quota is **authoritative**; client disables create/duplicate UI when at limit.

---

## 3. Database

### Migration

`server/prisma/migrations/20260715080738_add_subscription/migration.sql`

### Model: `Subscription`

```prisma
model Subscription {
  id                   String    @id @default(cuid())
  instructorId         String    @unique
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?
  status               String    @default("free") // free | active | past_due | canceled | trialing
  billingInterval      String?   // month | year
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  instructor Instructor @relation(...)
}
```

- One subscription row per instructor (created on signup)
- `stripeCustomerId` is nullable until first checkout
- `stripeCustomerId` is **nullable + unique** (not empty string) to avoid unique constraint issues

### Seed changes

- `signupEnabled` default set to **`true`** (freemium open registration)
- `seedSubscriptions()` backfills `status: "free"` for instructors missing a row

---

## 4. Server implementation

### New dependency

- `stripe` (^22.3.1) in `server/package.json`

### New files

| File | Purpose |
|------|---------|
| `server/src/lib/stripe.ts` | Stripe client, NZD constants, price ID helpers, `FREE_CLASS_PLAN_LIMIT = 3` |
| `server/src/modules/subscriptions/subscription.service.ts` | Checkout, portal, status, webhooks, quota assertion |
| `server/src/modules/subscriptions/subscription.routes.ts` | Authenticated API routes |
| `server/src/modules/subscriptions/subscription.validation.ts` | Zod: `createCheckoutSchema` (`interval: month \| year`) |
| `server/src/modules/subscriptions/subscription.webhook.ts` | Raw webhook handler with signature verification |

### Modified files

| File | Changes |
|------|---------|
| `server/prisma/schema.prisma` | Added `Subscription` model + `Instructor.subscription` relation |
| `server/prisma/seed.ts` | Open signup, backfill subscriptions |
| `server/src/app.ts` | Webhook **before** `express.json()`; mount `/api/subscriptions` |
| `server/src/lib/auth.ts` | `databaseHooks.user.create.after` creates free `Subscription` |
| `server/src/modules/class-plans/class-plan.service.ts` | `assertClassPlanQuota()` in `createClassPlan` + `duplicateClassPlan` |

### API routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/subscriptions/status` | Yes | Tier, limits, plan count, pricing display, `canUpgrade` / `canManage` |
| POST | `/api/subscriptions/checkout` | Yes | Body: `{ interval: "month" \| "year" }` → `{ url }` |
| POST | `/api/subscriptions/portal` | Yes | → `{ url }` for Customer Portal |
| POST | `/api/webhooks/stripe` | No (Stripe signature) | Webhook events |

**Mount order in `app.ts`:**

```typescript
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.use(express.json()); // all other routes
```

### Webhook events handled

- `checkout.session.completed` — link subscription after first payment
- `customer.subscription.created` / `customer.subscription.updated` — sync status, interval, period dates
- `customer.subscription.deleted` — reset to free tier
- `invoice.paid` — confirm active
- `invoice.payment_failed` — set `past_due`

### Key service functions

- `ensureSubscriptionRecord(instructorId)`
- `getSubscriptionStatus(instructorId)`
- `createCheckoutSession(instructorId, { interval })`
- `createPortalSession(instructorId)`
- `assertClassPlanQuota(instructorId)` — throws `ForbiddenError` (403) at 3 plans on free tier
- `handleWebhookEvent(event)`
- `assertRecurringSubscriptionPrice(priceId, interval)` — validates Price is recurring with correct interval before checkout

### Environment variables (server)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...    # $14.00 NZD / month, recurring
STRIPE_PRICE_ANNUAL=price_...     # $120.00 NZD / year, recurring (NOT one_time)
CLIENT_URL=http://localhost:3000
```

---

## 5. Client implementation

### New files

| File | Purpose |
|------|---------|
| `client/src/services/subscription-api.ts` | `getStatus`, `createCheckout(interval)`, `createPortal` |
| `client/src/hooks/use-subscription-status.ts` | Loads status; exposes `quotaReached`, `isPaid` |
| `client/src/app/(dashboard)/billing/page.tsx` | Billing route with Suspense |
| `client/src/components/billing/billing-page-view.tsx` | Current plan, monthly/annual toggle, plan cards, upgrade/manage |
| `client/src/components/class-plans/class-plan-upgrade-banner.tsx` | Banner when free tier at 3 plans |

### Modified files

| File | Changes |
|------|---------|
| `client/src/lib/types.ts` | `SubscriptionStatus`, `SubscriptionTier`, `SubscriptionPricing` |
| `client/src/components/layout/sidebar.tsx` | **Billing** nav link (`CreditCard` icon) |
| `client/src/app/(dashboard)/class-plans/page.tsx` | Upgrade banner, disable create at quota, subscription hook |
| `client/src/components/class-plans/class-plan-library-header.tsx` | `createDisabled` on New plan button |
| `client/src/components/class-plans/class-plan-list.tsx` | `createDisabled`, `duplicateDisabled` props |
| `client/src/components/class-plans/class-plan-card.tsx` | Disable duplicate at quota |
| `client/src/components/class-plans/create-template-dialog.tsx` | 403 toast with Upgrade action |
| `client/src/hooks/class-plans/use-class-plan-library.ts` | 403 on duplicate with link to `/billing` |

### Billing page behaviour

- **Free users:** See Starter + Instructor+ cards, monthly/annual toggle, **Upgrade Now**
- **Subscribed users:** Current plan card + **Manage subscription** only (plan cards hidden; `canUpgrade: false`)
- **Success/cancel:** Query params `?success=true` / `?canceled=true` show toasts and refresh status

### Plan switching (already subscribed)

- **Not** via in-app Upgrade button (checkout blocked if already active)
- **Yes** via **Manage subscription** → Stripe Customer Portal
- Requires portal config: both monthly and annual prices on Instructor+ product, “customers can switch plans” enabled
- Webhooks sync interval changes back to app

---

## 6. Stripe Dashboard setup

### Products & prices (Test mode)

**Product:** Instructor+ (`prod_UsqRYadiP4quu6` in dev)

| Price | Amount | Type | Env var |
|-------|--------|------|---------|
| Monthly | $14.00 NZD | **Recurring / month** | `STRIPE_PRICE_MONTHLY` |
| Annual | $120.00 NZD | **Recurring / year** | `STRIPE_PRICE_ANNUAL` |

**Important:** Annual price must be **`recurring`**, not `one_time`. Checkout `mode: "subscription"` rejects one-time prices.

### Customer Portal — subscription updates (configured)

| Setting | Value |
|---------|--------|
| Plan changes | **Prorate charges and credits** |
| Charge timing | **Invoice prorations immediately** at update |
| Downgrade — cheaper plan | **Update immediately** |
| Downgrade — shorter interval (annual → monthly) | **Update immediately** |

**Effect:** All plan switches apply immediately with proration. Annual → monthly does not wait until year end.

Alternative discussed for Alexa: **At end of billing period** for annual → monthly (keeps paid year). Not selected.

### Webhooks

**Production:** Dashboard → Webhooks → `https://<api>/api/webhooks/stripe`

**Local dev:** Stripe CLI (see below)

Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`

---

## 7. Local development: Stripe CLI

### Why

`localhost:5000` is not reachable from Stripe’s servers. Webhooks would never arrive without a tunnel.

### Steps

```bash
stripe login
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Copy the printed **`whsec_...`** into `STRIPE_WEBHOOK_SECRET` in `server/.env` and restart the server.

### Flow

1. User completes Checkout
2. Stripe emits `checkout.session.completed`
3. CLI forwards to local server
4. Server verifies signature, updates `Subscription` to `active`
5. User sees Instructor+ on `/billing` and unlimited class plans

Without webhooks, payment succeeds in Stripe but app stays on free tier.

---

## 8. Bug fix: annual checkout error

### Error

```
StripeInvalidRequestError: You must provide at least one recurring price in `subscription` mode when using prices.
```

### Cause

`STRIPE_PRICE_ANNUAL` pointed to a **`one_time`** price (`type: "one_time"`), while monthly was correctly `recurring`.

### Fix

1. Created new recurring yearly price: `price_1Tu6hvDU5WAwBwfUJxdMkRWH` ($120 NZD/year)
2. Updated `STRIPE_PRICE_ANNUAL` in `server/.env`
3. Added `assertRecurringSubscriptionPrice()` for clearer errors if misconfigured again

---

## 9. Testing checklist

- [ ] Register new instructor → free subscription row exists
- [ ] Create 3 class plans → 4th blocked (UI + API 403)
- [ ] `/billing` → Upgrade monthly → test card `4242 4242 4242 4242`
- [ ] Webhook received → status `active`, unlimited plans
- [ ] Upgrade annual (after recurring price fix)
- [ ] **Manage subscription** → switch monthly ↔ annual
- [ ] Cancel in portal → reverts to free at period end / on deletion webhook
- [ ] `stripe listen` running during local tests

---

## 10. Client communication templates (summary)

Messages drafted in session for Alexa:

1. **Scope agreement** — Individual MVP only; studio later without rebuild
2. **Work started** — Payment system in progress; Stripe account invite needed
3. **Stripe team invite** — How she adds developer to Stripe Dashboard
4. **Subscription update settings** — Options for proration, downgrades, shorter interval (annual → monthly) for her confirmation

---

## 11. Out of scope (this session)

- Studio / team workspace
- Team invitations (separate from admin platform invites)
- Exercise Personal vs Team visibility
- Studio pricing ($149/mo, $1,500/yr, 20 seats)
- In-app plan switch UI (portal only for subscribed users)
- Stripe Connect / marketplace billing
- Tax/GST automation (can add via Stripe Tax later)

---

## 12. Future Phase 2 notes (studio)

When implementing studio, extend (do not replace) individual billing:

- `Team`, `TeamMember`, `TeamInvitation` models
- `Exercise.visibility`: `PERSONAL` | `TEAM`
- Subscription on `teamId` OR dual entitlement (individual + team)
- Four+ Stripe prices (individual + studio tiers)
- Seat limit enforcement (20)

Individual subscription work remains valid as the foundation.

---

## 13. File change index (complete)

### Server — new

- `server/src/lib/stripe.ts`
- `server/src/modules/subscriptions/subscription.service.ts`
- `server/src/modules/subscriptions/subscription.routes.ts`
- `server/src/modules/subscriptions/subscription.validation.ts`
- `server/src/modules/subscriptions/subscription.webhook.ts`
- `server/prisma/migrations/20260715080738_add_subscription/migration.sql`

### Server — modified

- `server/package.json` (stripe dependency)
- `server/prisma/schema.prisma`
- `server/prisma/seed.ts`
- `server/src/app.ts`
- `server/src/lib/auth.ts`
- `server/src/modules/class-plans/class-plan.service.ts`

### Client — new

- `client/src/services/subscription-api.ts`
- `client/src/hooks/use-subscription-status.ts`
- `client/src/app/(dashboard)/billing/page.tsx`
- `client/src/components/billing/billing-page-view.tsx`
- `client/src/components/class-plans/class-plan-upgrade-banner.tsx`

### Client — modified

- `client/src/lib/types.ts`
- `client/src/components/layout/sidebar.tsx`
- `client/src/app/(dashboard)/class-plans/page.tsx`
- `client/src/components/class-plans/class-plan-library-header.tsx`
- `client/src/components/class-plans/class-plan-list.tsx`
- `client/src/components/class-plans/class-plan-card.tsx`
- `client/src/components/class-plans/create-template-dialog.tsx`
- `client/src/hooks/class-plans/use-class-plan-library.ts`

### Config (not committed — local)

- `server/.env` — `STRIPE_*` variables (secrets must not be committed)

---

*Generated from the Stripe subscription implementation session, July 2026.*
