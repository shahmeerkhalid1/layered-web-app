"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { subscriptionApi, type BillingInterval } from "@/services/subscription-api";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STARTER_FEATURES = [
  "Up to 3 class plans",
  "Up to 5 exercises in your library",
  "Client notes for up to 5 clients",
  "Calendar & scheduling",
];

/** Survives Strict Mode remount so checkout return toasts fire only once. */
let checkoutReturnHandled: "success" | "canceled" | null = null;

const INSTRUCTOR_PLUS_FEATURES = [
  "Unlimited class plans",
  "Unlimited exercise library",
  "Unlimited client notes & client management",
  "Image storage",
  "Layer templates + cue library",
  "Weekly reflections",
  "Cloud sync",
];

const BILLING_FAQ = [
  {
    question: "Can I upgrade anytime?",
    answer:
      "Yes. You can upgrade from the Free plan to Instructor+ at any time from this page. Pick monthly or annual billing, complete checkout in Stripe, and unlimited access begins once payment is confirmed.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. On Instructor+, use Manage subscription to open the Stripe billing portal. You can cancel whenever you like. You will keep access until the end of your current billing period, then your account returns to the Free plan.",
  },
  {
    question: "What happens when my subscription ends?",
    answer:
      "Your account moves back to the Free plan without deleting anything. You keep access to everything you already created. You can still edit and use existing class plans, exercises, and client notes — you just cannot add new ones above the free limits until you upgrade again or remove items to get back under the limit.",
  },
  {
    question: "Can I switch between monthly and annual billing?",
    answer:
      "Yes. If you are on Instructor+, open Manage subscription in the Stripe billing portal to change your billing interval or plan. Stripe handles proration according to your portal settings.",
  },
  {
    question: "Will I lose my content if I downgrade?",
    answer:
      "No. Layered never deletes your class plans, exercises, or client records when you cancel or downgrade. Free plan limits only apply to creating new items, not to the content you already built.",
  },
] as const;

function formatNzCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function BillingPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, loading, error, refresh } = useSubscriptionStatus();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("year");
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);

  useEffect(() => {
    const isSuccess = searchParams.get("success") === "true";
    const isCanceled = searchParams.get("canceled") === "true";

    if (!isSuccess && !isCanceled) {
      checkoutReturnHandled = null;
      return;
    }

    const returnType = isSuccess ? "success" : "canceled";
    if (checkoutReturnHandled === returnType) return;
    checkoutReturnHandled = returnType;

    if (isSuccess) {
      toast.success("Subscription updated. Welcome to Instructor+!");
      void refresh();
    } else {
      toast.message("Checkout canceled");
    }

    router.replace("/billing", { scroll: false });
  }, [searchParams, refresh, router]);

  const handleUpgrade = useCallback(async () => {
    setCheckoutPending(true);
    try {
      const { url } = await subscriptionApi.createCheckout(billingInterval);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not start checkout");
      setCheckoutPending(false);
    }
  }, [billingInterval]);

  const handleManage = useCallback(async () => {
    setPortalPending(true);
    try {
      const { url } = await subscriptionApi.createPortal();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open billing portal");
      setPortalPending(false);
    }
  }, []);

  const isPaid = status?.tier === "active";
  const isStarter = !isPaid;
  const pricing = status?.pricing;
  const monthlyPrice = pricing?.monthly ?? 14;
  const annualMonthly = pricing?.annualMonthlyEquivalent ?? 10;
  const annualSavings = pricing?.annualSavingsAmount ?? 60;

  const instructorPriceLabel =
    billingInterval === "year"
      ? `${formatNzCurrency(annualMonthly)} /month`
      : `${formatNzCurrency(monthlyPrice)} /month`;

  const instructorPriceHint =
    billingInterval === "year"
      ? `Billed annually · Save ${formatNzCurrency(annualSavings)} per year`
      : "Billed monthly";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="layered-eyebrow">Billing</p>
        <h1 className="layered-display-headline">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Choose the plan that fits your teaching — all paid pricing in NZD.
        </p>
      </header>

      {loading ? null : error || !status ? (
        <div className="rounded border border-dashed border-border bg-muted/15 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {error ?? "Unable to load billing information."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 h-10 rounded border-border px-4 shadow-none"
            onClick={() => void refresh()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>

      <section className="layered-card">
        <h2 className="layered-section-title">Current plan</h2>
        <div className="mt-4 rounded border border-border bg-muted/30 p-4 sm:p-5">
          <p className="font-medium text-foreground">
            {isPaid
              ? `You are on Instructor+ (${status.billingInterval === "year" ? "annual" : "monthly"} billing).`
              : "You are currently on the Free plan."}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {isPaid ? (
              <>
                <li className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-[var(--layered-navy)]" aria-hidden />
                  Unlimited class plans, exercises & client notes
                </li>
                {status.currentPeriodEnd ? (
                  <li className="text-xs">
                    {status.cancelAtPeriodEnd
                      ? `Access until ${new Date(status.currentPeriodEnd).toLocaleDateString("en-NZ")}`
                      : `Renews ${new Date(status.currentPeriodEnd).toLocaleDateString("en-NZ")}`}
                  </li>
                ) : null}
              </>
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-[var(--layered-navy)]" aria-hidden />
                  Up to 3 class plans
                  {status.classPlanLimit != null
                    ? ` (${status.classPlanCount}/${status.classPlanLimit} used)`
                    : null}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-[var(--layered-navy)]" aria-hidden />
                  Up to 5 exercises
                  {status.exerciseLimit != null
                    ? ` (${status.exerciseCount}/${status.exerciseLimit} used)`
                    : null}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-[var(--layered-navy)]" aria-hidden />
                  Client notes for up to 5 clients
                  {status.clientLimit != null
                    ? ` (${status.clientCount}/${status.clientLimit} used)`
                    : null}
                </li>
              </>
            )}
          </ul>
          {status.canManage ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4 h-10 rounded border border-[var(--layered-black)] bg-transparent px-4 shadow-none"
              disabled={portalPending}
              onClick={() => void handleManage()}
            >
              {portalPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Opening portal…
                </>
              ) : (
                "Manage subscription"
              )}
            </Button>
          ) : null}
        </div>
      </section>

      {status.canUpgrade ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">
              Choose Your Plan
            </h2>
            <div className="inline-flex items-center rounded border border-border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setBillingInterval("month")}
                className={cn(
                  "rounded px-4 py-2 text-sm font-medium transition-colors",
                  billingInterval === "month"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("year")}
                className={cn(
                  "inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors",
                  billingInterval === "year"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual Billing
                <Badge variant="secondary" className="rounded px-2 py-0 text-[10px]">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <PlanCard
              name="Starter"
              subtitle="New or casual instructors"
              priceLabel="$0"
              priceHint="Forever free"
              features={STARTER_FEATURES}
              action={
                isStarter ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full rounded border-border shadow-none"
                    disabled
                  >
                    Current plan
                  </Button>
                ) : null
              }
            />

            <PlanCard
              name="Instructor+"
              subtitle="Independent Pilates instructors"
              priceLabel={instructorPriceLabel}
              priceHint={instructorPriceHint}
              features={INSTRUCTOR_PLUS_FEATURES}
              highlighted
              action={
                <Button
                  type="button"
                  className="h-10 w-full rounded bg-primary shadow-none hover:bg-primary/90"
                  disabled={checkoutPending}
                  onClick={() => void handleUpgrade()}
                >
                  {checkoutPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Redirecting…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" aria-hidden />
                      Upgrade now
                    </>
                  )}
                </Button>
              }
            />
          </div>
        </>
      ) : null}

        <BillingFaq />
        </>
      )}
    </div>
  );
}

function BillingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="layered-card">
      <h2 className="layered-section-title">Frequently asked questions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Common questions about upgrading, billing, and your Layered plan.
      </p>
      <ul className="mt-5 divide-y divide-border rounded border border-border">
        {BILLING_FAQ.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <li key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:px-5"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-foreground">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-5">
                  {item.answer}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PlanCard({
  name,
  subtitle,
  priceLabel,
  priceHint,
  features,
  action,
  highlighted = false,
}: {
  name: string;
  subtitle: string;
  priceLabel: string;
  priceHint: string;
  features: string[];
  action: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex flex-col p-6",
        highlighted
          ? "layered-card-interactive border-[var(--layered-navy)] ring-1 ring-[var(--layered-navy)]/20"
          : "layered-card",
      )}
    >
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.02em]">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mt-5">
        <p className="text-3xl font-light tracking-[-0.03em]">{priceLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">{priceHint}</p>
      </div>
      <ul className="mt-6 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-[var(--layered-navy)]" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">{action}</div>
    </article>
  );
}

