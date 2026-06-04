"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Dumbbell,
  FileText,
  LayoutDashboard,
  Sparkles,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { clientApi } from "@/services/client-api";

/** Placeholder metrics until dashboard APIs are wired. */
const DASHBOARD_STATS = {
  todayClasses: 0,
  exercises: 0,
  planTemplates: 0,
} as const;

type StatCardProps = {
  title: string;
  value: number;
  hint: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  accent: "primary" | "secondary" | "muted";
};

function StatCard({ title, value, hint, href, icon: Icon, accent }: StatCardProps) {
  const accentStyles = {
    primary: {
      icon: "dark:bg-primary dark:text-secondary-foreground dark:border-border dark:group-hover:bg-primary/100",
      card: "bg-primary/10 text-primary group-hover:bg-primary/15 dark:border-primary/25 dark:bg-primary dark:text-secondary-foreground",
    },
    secondary: {
      icon: "bg-secondary/80 text-secondary-foreground group-hover:bg-secondary/100",
      card: "border-border/80 bg-background/60 hover:border-border  hover:bg-muted/30",
    },
    muted: {
      icon: "bg-muted text-muted-foreground group-hover:bg-muted/80",
      card: "border-border/80 bg-card/80",
    },
  } as const;

  const className = cn(
    "group flex flex-col rounded-2xl border p-4 transition-all",
    accentStyles[accent].card,
    href &&
      "hover:border-border  hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    !href && "opacity-95"
  );

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            accentStyles[accent].icon
          )}
        >
          <Icon className="size-4.5" aria-hidden />
        </div>
        {href ? (
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

type QuickActionProps = {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

function QuickAction({ href, title, description, icon: Icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3.5 transition-all",
        "hover:border-border hover:bg-muted/30 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-secondary-foreground transition-colors group-hover:bg-secondary/100">
        <Icon className="size-4.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}

export interface InstructorHomeProps {
  firstName?: string;
}

export function InstructorHome({ firstName }: InstructorHomeProps) {
  const [totalClients, setTotalClients] = useState<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        try {
          const result = await clientApi.listClients({ page: 1, limit: 1 });
          if (!cancelled) setTotalClients(result.total);
        } catch {
          if (!cancelled) setTotalClients(0);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card shadow-lg">
        <div className="border-b border-border/70 px-4 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/80 text-secondary-foreground">
                <LayoutDashboard className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {greeting}
                </p>
                <h1 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground md:text-2xl">
                  {firstName ? (
                    <>
                      Welcome back, <span className="text-primary">{firstName}</span>
                    </>
                  ) : (
                    "Welcome back"
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">{dateLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Today's classes"
              value={DASHBOARD_STATS.todayClasses}
              hint={
                DASHBOARD_STATS.todayClasses === 0
                  ? "Nothing on the calendar yet"
                  : "Scheduled for today"
              }
              href="/calendar"
              icon={Calendar}
              accent="primary"
            />
            <StatCard
              title="Clients"
              value={totalClients ?? 0}
              hint={
                totalClients === undefined
                  ? "Loading roster…"
                  : totalClients === 0
                    ? "Add clients to your roster"
                    : "Active clients in your roster"
              }
              href="/clients"
              icon={Users}
              accent="secondary"
            />
            <StatCard
              title="Exercise library"
              value={DASHBOARD_STATS.exercises}
              hint={
                DASHBOARD_STATS.exercises === 0
                  ? "Build your movement catalog"
                  : "Saved exercises"
              }
              href="/exercises"
              icon={Dumbbell}
              accent="secondary"
            />
            <StatCard
              title="Plan templates"
              value={DASHBOARD_STATS.planTemplates}
              hint={
                DASHBOARD_STATS.planTemplates === 0
                  ? "Reusable class structures"
                  : "Templates created"
              }
              href="/class-plans"
              icon={FileText}
              accent="secondary"
            />
          </div>
        </div>

      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* <section className="lg:col-span-3">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                  Today&apos;s schedule
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Classes and private sessions for {dateLabel.split(",").slice(-1)[0]?.trim() ?? "today"}
                </p>
              </div>
              <Link
                href="/calendar"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 gap-1")}
              >
                Open calendar
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Calendar className="size-7" aria-hidden />
              </div>
              <p className="mt-4 font-medium text-foreground">No classes scheduled today</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                When you add classes on the calendar, they&apos;ll show up here so you can jump
                straight into planning.
              </p>
              <Link
                href="/calendar"
                className={cn(buttonVariants({ variant: "default" }), "mt-6 rounded-full")}
              >
                Go to calendar
              </Link>
            </div>
          </div>
        </section> */}

        <section className="lg:col-span-2">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Quick actions
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Shortcuts to the tools you use most
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <QuickAction
                href="/exercises/new"
                title="New exercise"
                description="Add a movement to your library"
                icon={Dumbbell}
              />
              <QuickAction
                href="/class-plans"
                title="Class plans"
                description="Browse and edit plan templates"
                icon={FileText}
              />
              <QuickAction
                href="/week-overview"
                title="Week at a glance"
                description="See the full week in one view"
                icon={CalendarDays}
              />
              <QuickAction
                href="/calendar"
                title="Calendar"
                description="Schedule and manage class instances"
                icon={Calendar}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
