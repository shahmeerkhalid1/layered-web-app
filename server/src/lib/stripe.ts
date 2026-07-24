import Stripe from "stripe";

export const CURRENCY = "NZD";

export const FREE_CLASS_PLAN_LIMIT = 3;
export const FREE_EXERCISE_LIMIT = 5;
export const FREE_CLIENT_LIMIT = 5;

export const PRICING_DISPLAY = {
  monthly: 14,
  annualMonthlyEquivalent: 10,
  annualTotal: 120,
  annualSavingsPercent: 17,
  annualSavingsAmount: 60,
} as const;

export const PAID_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return key;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey());
}

export function getStripePriceMonthly(): string {
  const priceId = process.env.STRIPE_PRICE_MONTHLY?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_MONTHLY is not configured");
  }
  return priceId;
}

export function getStripePriceAnnual(): string {
  const priceId = process.env.STRIPE_PRICE_ANNUAL?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ANNUAL is not configured");
  }
  // console.log("STRIPE_PRICE_ANNUAL", priceId);
  return priceId;
}

export function resolvePriceIdForInterval(interval: "month" | "year"): string {
  return interval === "year" ? getStripePriceAnnual() : getStripePriceMonthly();
}

export function isAllowedStripePriceId(priceId: string): boolean {
  if (!isStripeConfigured()) return false;
  try {
    return (
      priceId === getStripePriceMonthly() || priceId === getStripePriceAnnual()
    );
  } catch {
    return false;
  }
}

export function getClientBaseUrl(): string {
  return process.env.CLIENT_URL?.trim() || "http://localhost:3000";
}
