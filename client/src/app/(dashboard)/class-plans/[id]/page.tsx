import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClassPlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassPlanDetailPage({ params }: ClassPlanDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-8 shadow-lg">
      <div>
        <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Class planner
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-card-foreground">
          Plan editor
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The visual planner for template <span className="font-mono text-foreground">{id}</span> is
          not built yet. Use the listing page to duplicate or delete templates, or return to class
          plans.
        </p>
      </div>
      <Link
        href="/class-plans"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "inline-flex rounded-full"
        )}
      >
        Back to class plans
      </Link>
    </div>
  );
}
