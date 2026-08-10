"use client";

import { Suspense } from "react";
import { BillingPageView } from "@/components/billing/billing-page-view";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <Suspense>
        <BillingPageView />
      </Suspense>
    </div>
  );
}
