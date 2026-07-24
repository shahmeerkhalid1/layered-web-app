"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BillingPageView } from "@/components/billing/billing-page-view";

function BillingLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading billing…</span>
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="space-y-6 rounded-[2rem] px-2 pb-6 sm:px-4">
      <Suspense fallback={<BillingLoading />}>
        <BillingPageView />
      </Suspense>
    </div>
  );
}
