"use client";

import { SubscriptionUpgradeBanner } from "@/components/billing/subscription-upgrade-banner";

interface ClassPlanUpgradeBannerProps {
  classPlanCount: number;
  classPlanLimit: number;
}

export function ClassPlanUpgradeBanner({
  classPlanCount,
  classPlanLimit,
}: ClassPlanUpgradeBannerProps) {
  return (
    <SubscriptionUpgradeBanner
      resourceLabel="class plans"
      count={classPlanCount}
      limit={classPlanLimit}
    />
  );
}
