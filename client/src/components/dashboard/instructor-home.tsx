"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  FileText,
  LayoutDashboard,
  NotebookPen,
  Users,
} from "lucide-react";

import { DashboardMiniCalendar } from "@/components/dashboard/dashboard-mini-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calendarInstanceHref } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import type {
  DashboardNotificationItem,
  DashboardNotificationsResponse,
  DashboardStats,
} from "@/lib/types";
import { dashboardApi } from "@/services/dashboard-api";

type StatCardProps = {
  title: string;
  value: number | undefined;
  hint: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  accent: "primary" | "secondary" | "muted";
  loading?: boolean;
};

function StatCard({
  title,
  value,
  hint,
  href,
  icon: Icon,
  accent,
  loading,
}: StatCardProps) {
  const accentStyles = {
    primary: {
      icon: "dark:bg-primary dark:text-secondary-foreground dark:border-border dark:group-hover:bg-primary/100",
      card: "bg-primary/10 text-primary group-hover:bg-primary/15 dark:border-primary/25 dark:bg-primary dark:text-secondary-foreground",
    },
    secondary: {
      icon: "bg-secondary/80 text-secondary-foreground group-hover:bg-secondary/100",
      card: "border-border/80 bg-background/60 hover:border-border hover:bg-muted/30",
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
      "hover:border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    !href && "opacity-95",
  );

  const displayValue = loading ? "—" : (value ?? 0);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            accentStyles[accent].icon,
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
          {displayValue}
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

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3.5 transition-all",
        "hover:border-border hover:bg-muted/30 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
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

function NotificationCard({
  icon: Icon,
  title,
  description,
  href,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  tone: "warning" | "info" | "success" | "muted";
}) {
  const toneStyles = {
    warning:
      "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
    info: "border-primary/25 bg-primary/30 text-secondary-foreground",
    success: "border-border/80 bg-muted/15 text-foreground",
    muted:
      "border-border/80 bg-background/60 hover:bg-muted/30 text-foreground",
  } as const;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all",
        "hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        toneStyles[tone],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs opacity-80">{description}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 opacity-50" aria-hidden />
    </Link>
  );
}

function formatNotificationWhen(item: DashboardNotificationItem): string {
  const date = new Date(item.time);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function NeedsClosureNotificationsGroup({
  items,
}: {
  items: DashboardNotificationItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  const title =
    items.length === 1
      ? "1 past session still open"
      : `${items.length} past sessions still open`;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100">
      <div className="flex items-start gap-3 px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs opacity-80">
            These classes are past their scheduled date. Mark complete if they
            happened, or cancel if they did not.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 rounded-full px-2.5 text-xs text-amber-900 hover:bg-amber-500/10 dark:text-amber-100"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              Hide details
              <ChevronUp className="size-3.5" aria-hidden />
            </>
          ) : (
            <>
              Show details
              <ChevronDown className="size-3.5" aria-hidden />
            </>
          )}
        </Button>
      </div>

      {expanded ? (
        <ul className="space-y-1.5 border-t border-amber-500/20 px-3 py-3">
          {items.map((item) => (
            <li key={item.instanceId}>
              <Link
                href={calendarInstanceHref(item.instanceId)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-background/60 px-3 py-2.5 transition-all",
                  "hover:border-amber-500/35 hover:bg-muted/30 hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.classTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatNotificationWhen(item)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {item.classType === "GROUP" ? "Group" : "Private"}
                  </Badge>
                  <ArrowRight
                    className="size-3.5 text-muted-foreground/50"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function NoPlanNotificationsGroup({
  items,
}: {
  items: DashboardNotificationItem[];
}) {
  const [expanded, setExpanded] = useState(false);

  const title =
    items.length === 1
      ? "1 class needs a plan"
      : `${items.length} classes need a plan`;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100">
      <div className="flex items-start gap-3 px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs opacity-80">
            Attach a template on the calendar before these sessions.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 rounded-full px-2.5 text-xs text-amber-900 hover:bg-amber-500/10 dark:text-amber-100"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              Hide details
              <ChevronUp className="size-3.5" aria-hidden />
            </>
          ) : (
            <>
              Show details
              <ChevronDown className="size-3.5" aria-hidden />
            </>
          )}
        </Button>
      </div>

      {expanded ? (
        <ul className="space-y-1.5 border-t border-amber-500/20 px-3 py-3">
          {items.map((item) => (
            <li key={item.instanceId}>
              <Link
                href={calendarInstanceHref(item.instanceId)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-background/60 px-3 py-2.5 transition-all",
                  "hover:border-amber-500/35 hover:bg-muted/30 hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.classTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatNotificationWhen(item)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {item.classType === "GROUP" ? "Group" : "Private"}
                  </Badge>
                  <ArrowRight
                    className="size-3.5 text-muted-foreground/50"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function NotificationsSection({
  data,
  loading,
}: {
  data: DashboardNotificationsResponse | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const noPlan = data?.noPlan ?? [];
  const needsClosure = data?.needsClosure ?? [];
  const missingNotes = data?.missingNotes ?? [];
  const upcoming = data?.upcoming ?? [];
  const total =
    noPlan.length + needsClosure.length + missingNotes.length + upcoming.length;

  if (total === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-muted/15 px-4 py-4">
        <CheckCircle2
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-foreground">All caught up</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No open past sessions, plans to attach, notes to write, or upcoming
            reminders right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {needsClosure.length > 0 ? (
        <NeedsClosureNotificationsGroup items={needsClosure} />
      ) : null}
      {noPlan.length > 0 ? <NoPlanNotificationsGroup items={noPlan} /> : null}
      {missingNotes.slice(0, 3).map((item) => (
        <NotificationCard
          key={`${item.instanceId}-${item.clientName}`}
          icon={NotebookPen}
          tone="info"
          title={`Write notes for ${item.clientName ?? "client"}`}
          description={`${item.classTitle} · ${formatNotificationWhen(item)}`}
          href={calendarInstanceHref(item.instanceId)}
        />
      ))}
      {upcoming.slice(0, 2).map((item) => (
        <NotificationCard
          key={item.instanceId}
          icon={Calendar}
          tone="muted"
          title={`Upcoming: ${item.classTitle}`}
          description={formatNotificationWhen(item)}
          href={calendarInstanceHref(item.instanceId)}
        />
      ))}
    </div>
  );
}

export interface InstructorHomeProps {
  firstName?: string;
}

export function InstructorHome({ firstName }: InstructorHomeProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] =
    useState<DashboardNotificationsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    const t = window.setTimeout(() => {
      void (async () => {
        setLoadingStats(true);
        try {
          const result = await dashboardApi.getStats(ac.signal);
          if (!cancelled) setStats(result);
        } catch {
          if (!cancelled) setStats(null);
        } finally {
          if (!cancelled) setLoadingStats(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      ac.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    const t = window.setTimeout(() => {
      void (async () => {
        setLoadingNotifications(true);
        try {
          const result = await dashboardApi.getNotifications(ac.signal);
          if (!cancelled) setNotifications(result);
        } catch {
          if (!cancelled) setNotifications(null);
        } finally {
          if (!cancelled) setLoadingNotifications(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      ac.abort();
    };
  }, []);

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const greeting = getGreeting();
  const todayCount = stats?.todayClasses;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl uppercase mt-40">
        {firstName ? (
          <>
            Welcome back, <span className="text-primary">{firstName}</span>
          </>
        ) : (
          "Welcome back"
        )}
      </h1>
      <div className="rounded-3xl border border-border bg-card shadow-lg">
        <div className="border-b border-border/70 px-4 py-5 md:px-6 md:py-6">
          {/* <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-secondary-foreground">
                <LayoutDashboard className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {greeting}
                </p>
                <h1 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground md:text-2xl uppercase">
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
          </div> */}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Today's classes"
              value={todayCount}
              hint={
                todayCount === 0
                  ? "Nothing on the calendar yet"
                  : "Scheduled for today"
              }
              href="/calendar"
              icon={Calendar}
              accent="primary"
              loading={loadingStats}
            />
            <StatCard
              title="Clients"
              value={stats?.totalClients}
              hint={
                stats?.totalClients === 0
                  ? "Add clients to your roster"
                  : "Active clients in your roster"
              }
              href="/clients"
              icon={Users}
              accent="secondary"
              loading={loadingStats}
            />
            <StatCard
              title="Exercise library"
              value={stats?.totalExercises}
              hint={
                stats?.totalExercises === 0
                  ? "Build your movement catalog"
                  : "Saved exercises"
              }
              href="/exercises"
              icon={Dumbbell}
              accent="secondary"
              loading={loadingStats}
            />
            <StatCard
              title="Plan templates"
              value={stats?.totalTemplates}
              hint={
                stats?.totalTemplates === 0
                  ? "Reusable class structures"
                  : "Templates created"
              }
              href="/class-plans"
              icon={FileText}
              accent="secondary"
              loading={loadingStats}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardMiniCalendar />

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
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Notifications
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Open past sessions, plans to attach, notes to write, and what&apos;s
          coming up
        </p>
        <div className="mt-5">
          <NotificationsSection
            data={notifications}
            loading={loadingNotifications}
          />
        </div>
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
