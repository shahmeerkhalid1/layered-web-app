"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionUpgradeBannerProps {
  resourceLabel: string;
  count: number;
  limit: number;
  description?: string;
}

export function SubscriptionUpgradeBanner({
  resourceLabel,
  count,
  limit,
  description = "Upgrade to Instructor+ for unlimited class plans, exercises, client notes, and more — from $10 NZD/month billed annually.",
}: SubscriptionUpgradeBannerProps) {
  return (
    <div className="flex flex-col gap-4 rounded border border-[var(--layered-navy)]/30 bg-[var(--layered-light-blue)]/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          You&apos;ve reached your free plan limit ({count}/{limit} {resourceLabel})
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        href="/billing"
        className={cn(
          buttonVariants({ variant: "default" }),
          "inline-flex h-10 shrink-0 items-center rounded bg-primary px-5 shadow-none hover:bg-primary/90",
        )}
      >
        <Sparkles className="mr-2 size-4" aria-hidden />
        Upgrade to Instructor+
      </Link>
    </div>
  );
}
