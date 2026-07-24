import type Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors";
import {
  CURRENCY,
  FREE_CLASS_PLAN_LIMIT,
  FREE_CLIENT_LIMIT,
  FREE_EXERCISE_LIMIT,
  PAID_SUBSCRIPTION_STATUSES,
  PRICING_DISPLAY,
  getClientBaseUrl,
  getStripeClient,
  isStripeConfigured,
  resolvePriceIdForInterval,
} from "../../lib/stripe";
import type { CreateCheckoutInput } from "./subscription.validation";

export type SubscriptionTier = "free" | "active" | "past_due" | "canceled";

export interface SubscriptionStatusResponse {
  tier: SubscriptionTier;
  billingInterval: "month" | "year" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  classPlanCount: number;
  classPlanLimit: number | null;
  exerciseCount: number;
  exerciseLimit: number | null;
  clientCount: number;
  clientLimit: number | null;
  currency: typeof CURRENCY;
  pricing: typeof PRICING_DISPLAY;
  canUpgrade: boolean;
  canManage: boolean;
}

function mapDbStatusToTier(status: string): SubscriptionTier {
  if (PAID_SUBSCRIPTION_STATUSES.has(status)) return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  return "free";
}

export function hasPaidAccess(status: string): boolean {
  return PAID_SUBSCRIPTION_STATUSES.has(status);
}

async function countActiveClassPlans(instructorId: string): Promise<number> {
  return prisma.classPlanTemplate.count({
    where: { instructorId, deletedAt: null },
  });
}

async function countLibraryExercises(instructorId: string): Promise<number> {
  return prisma.exercise.count({
    where: { instructorId, deletedAt: null, savedToLibrary: true },
  });
}

async function countActiveClients(instructorId: string): Promise<number> {
  return prisma.client.count({
    where: { instructorId, deletedAt: null },
  });
}

async function assertFreeTierQuota(
  instructorId: string,
  count: number,
  limit: number,
  resourceLabel: string
): Promise<void> {
  if (await isPlatformAdmin(instructorId)) return;

  const subscription = await ensureSubscriptionRecord(instructorId);
  if (hasPaidAccess(subscription.status)) return;

  if (count >= limit) {
    throw new ForbiddenError(
      `Free plan allows up to ${limit} ${resourceLabel}. Upgrade to create more.`
    );
  }
}

async function isPlatformAdmin(instructorId: string): Promise<boolean> {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { role: true },
  });
  return instructor?.role === "ADMIN";
}

export async function ensureSubscriptionRecord(instructorId: string) {
  const existing = await prisma.subscription.findUnique({
    where: { instructorId },
  });
  if (existing) return existing;

  return prisma.subscription.create({
    data: {
      instructorId,
      status: "free",
    },
  });
}

async function ensureStripeCustomer(
  instructorId: string,
  subscriptionId: string,
  stripeCustomerId: string | null
): Promise<string> {
  if (stripeCustomerId) return stripeCustomerId;

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { email: true, name: true },
  });
  if (!instructor) throw new NotFoundError("Instructor");

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: instructor.email,
    name: instructor.name,
    metadata: { instructorId },
  });

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

function syncSubscriptionFromStripe(
  stripeSub: Stripe.Subscription
): {
  status: string;
  stripePriceId: string | null;
  billingInterval: "month" | "year" | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
} {
  const item = stripeSub.items.data[0];
  const recurring = item?.price?.recurring;
  const interval = recurring?.interval;
  const period = stripeSub as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  return {
    status: stripeSub.status,
    stripePriceId: item?.price?.id ?? null,
    billingInterval: interval === "year" || interval === "month" ? interval : null,
    currentPeriodStart: period.current_period_start
      ? new Date(period.current_period_start * 1000)
      : null,
    currentPeriodEnd: period.current_period_end
      ? new Date(period.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
  };
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  if (!inv.subscription) return null;
  return typeof inv.subscription === "string"
    ? inv.subscription
    : inv.subscription.id;
}

export async function getSubscriptionStatus(
  instructorId: string
): Promise<SubscriptionStatusResponse> {
  await ensureSubscriptionRecord(instructorId);

  const [subscription, classPlanCount, exerciseCount, clientCount, admin] =
    await Promise.all([
      prisma.subscription.findUnique({ where: { instructorId } }),
      countActiveClassPlans(instructorId),
      countLibraryExercises(instructorId),
      countActiveClients(instructorId),
      isPlatformAdmin(instructorId),
    ]);

  if (!subscription) {
    throw new NotFoundError("Subscription");
  }

  if (admin) {
    return {
      tier: "active",
      billingInterval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      classPlanCount,
      classPlanLimit: null,
      exerciseCount,
      exerciseLimit: null,
      clientCount,
      clientLimit: null,
      currency: CURRENCY,
      pricing: PRICING_DISPLAY,
      canUpgrade: false,
      canManage: false,
    };
  }

  const tier = mapDbStatusToTier(subscription.status);
  const paid = hasPaidAccess(subscription.status);

  return {
    tier,
    billingInterval:
      subscription.billingInterval === "year" ||
      subscription.billingInterval === "month"
        ? subscription.billingInterval
        : null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    classPlanCount,
    classPlanLimit: paid ? null : FREE_CLASS_PLAN_LIMIT,
    exerciseCount,
    exerciseLimit: paid ? null : FREE_EXERCISE_LIMIT,
    clientCount,
    clientLimit: paid ? null : FREE_CLIENT_LIMIT,
    currency: CURRENCY,
    pricing: PRICING_DISPLAY,
    canUpgrade: !paid,
    canManage: paid && Boolean(subscription.stripeCustomerId),
  };
}

export async function assertClassPlanQuota(instructorId: string): Promise<void> {
  const count = await countActiveClassPlans(instructorId);
  await assertFreeTierQuota(
    instructorId,
    count,
    FREE_CLASS_PLAN_LIMIT,
    "class plans"
  );
}

export async function assertExerciseQuota(instructorId: string): Promise<void> {
  const count = await countLibraryExercises(instructorId);
  await assertFreeTierQuota(
    instructorId,
    count,
    FREE_EXERCISE_LIMIT,
    "exercises"
  );
}

export async function assertClientQuota(instructorId: string): Promise<void> {
  const count = await countActiveClients(instructorId);
  await assertFreeTierQuota(
    instructorId,
    count,
    FREE_CLIENT_LIMIT,
    "clients"
  );
}

async function assertRecurringSubscriptionPrice(
  priceId: string,
  interval: "month" | "year"
): Promise<void> {
  const stripe = getStripeClient();
  const price = await stripe.prices.retrieve(priceId);
  const label = interval === "year" ? "Annual" : "Monthly";

  if (price.type !== "recurring" || !price.recurring) {
    throw new AppError(
      `${label} price (${priceId}) must be a recurring subscription price in Stripe. It is currently "${price.type}". In Stripe Dashboard, add a recurring price (billing period: ${interval === "year" ? "yearly" : "monthly"}) on the Instructor+ product and update STRIPE_PRICE_${interval === "year" ? "ANNUAL" : "MONTHLY"} in server/.env.`,
      500
    );
  }

  if (price.recurring.interval !== interval) {
    throw new AppError(
      `${label} price (${priceId}) must bill every ${interval}. In Stripe it is set to "${price.recurring.interval}". Update STRIPE_PRICE_${interval === "year" ? "ANNUAL" : "MONTHLY"} with the correct price ID.`,
      500
    );
  }
}

export async function createCheckoutSession(
  instructorId: string,
  input: CreateCheckoutInput
) {
  if (!isStripeConfigured()) {
    throw new AppError("Stripe is not configured", 503);
  }

  const subscription = await ensureSubscriptionRecord(instructorId);
  if (hasPaidAccess(subscription.status)) {
    throw new ValidationError("You already have an active subscription");
  }

  const priceId = resolvePriceIdForInterval(input.interval);
  await assertRecurringSubscriptionPrice(priceId, input.interval);
  const stripeCustomerId = await ensureStripeCustomer(
    instructorId,
    subscription.id,
    subscription.stripeCustomerId
  );

  const clientUrl = getClientBaseUrl();
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${clientUrl}/billing?success=true`,
    cancel_url: `${clientUrl}/billing?canceled=true`,
    metadata: { instructorId },
    subscription_data: {
      metadata: { instructorId },
    },
  });

  if (!session.url) {
    throw new AppError("Failed to create checkout session", 500);
  }

  return { url: session.url };
}

export async function createPortalSession(instructorId: string) {
  if (!isStripeConfigured()) {
    throw new AppError("Stripe is not configured", 503);
  }

  const subscription = await prisma.subscription.findUnique({
    where: { instructorId },
  });
  if (!subscription?.stripeCustomerId) {
    throw new ValidationError("No billing account found. Subscribe first.");
  }
  if (!hasPaidAccess(subscription.status)) {
    throw new ValidationError("No active subscription to manage");
  }

  const stripe = getStripeClient();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${getClientBaseUrl()}/billing`,
  });

  return { url: portalSession.url };
}

async function updateSubscriptionFromStripeId(
  stripeSubscriptionId: string,
  instructorId?: string
) {
  const stripe = getStripeClient();
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const sync = syncSubscriptionFromStripe(stripeSub);

  const resolvedInstructorId =
    instructorId ??
    stripeSub.metadata.instructorId ??
    (await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
      select: { instructorId: true },
    }))?.instructorId;

  if (!resolvedInstructorId) return;

  await prisma.subscription.upsert({
    where: { instructorId: resolvedInstructorId },
    create: {
      instructorId: resolvedInstructorId,
      stripeCustomerId:
        typeof stripeSub.customer === "string"
          ? stripeSub.customer
          : stripeSub.customer.id,
      stripeSubscriptionId: stripeSub.id,
      ...sync,
    },
    update: {
      stripeCustomerId:
        typeof stripeSub.customer === "string"
          ? stripeSub.customer
          : stripeSub.customer.id,
      stripeSubscriptionId: stripeSub.id,
      ...sync,
    },
  });
}

async function markSubscriptionFree(instructorId: string) {
  await prisma.subscription.update({
    where: { instructorId },
    data: {
      status: "free",
      stripeSubscriptionId: null,
      stripePriceId: null,
      billingInterval: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });
}

export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const instructorId = session.metadata?.instructorId;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (subscriptionId && instructorId) {
        await updateSubscriptionFromStripeId(subscriptionId, instructorId);
      } else if (subscriptionId) {
        await updateSubscriptionFromStripeId(subscriptionId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const stripeSub = event.data.object as Stripe.Subscription;
      await updateSubscriptionFromStripeId(
        stripeSub.id,
        stripeSub.metadata.instructorId
      );
      break;
    }
    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const instructorId = stripeSub.metadata.instructorId;
      if (instructorId) {
        await markSubscriptionFree(instructorId);
      } else {
        const row = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        });
        if (row) await markSubscriptionFree(row.instructorId);
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (subscriptionId) {
        await updateSubscriptionFromStripeId(subscriptionId);
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (!subscriptionId) break;

      const row = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      });
      if (row) {
        await prisma.subscription.update({
          where: { id: row.id },
          data: { status: "past_due" },
        });
      }
      break;
    }
    default:
      break;
  }
}
