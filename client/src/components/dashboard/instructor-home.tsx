"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
} from "lucide-react";

import { DashboardMiniCalendar } from "@/components/dashboard/dashboard-mini-calendar";
import { Button } from "@/components/ui/button";
import { calendarInstanceHref } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import type {
  DashboardNotificationItem,
  DashboardNotificationsResponse,
  DashboardStats,
} from "@/lib/types";
import { dashboardApi } from "@/services/dashboard-api";

const TYPICAL_DAY_CAPACITY = 5;
const DOT_GRID_TOTAL = 20;
/** Target roster size for the clients donut progress ring. */
const CLIENT_ROSTER_GOAL = 100;
/** Target library size for the exercises donut progress ring. */
const EXERCISE_LIBRARY_GOAL = 100;
const DONUT_CIRCUMFERENCE = 264;

function DotGrid({ count, loading }: { count: number; loading?: boolean }) {
  const filled = Math.min(count, DOT_GRID_TOTAL);
  return (
    <div
      className="grid shrink-0"
      style={{
        gridTemplateColumns: "repeat(5, 10px)",
        gap: "7px",
      }}
      aria-hidden={loading}
    >
      {Array.from({ length: DOT_GRID_TOTAL }, (_, i) => {
        const index = DOT_GRID_TOTAL - 1 - i;
        if (loading) {
          return (
            <span
              key={i}
              className="size-2.5 rounded-full border border-border bg-transparent"
            />
          );
        }
        if (count === 0) {
          return (
            <span
              key={i}
              className="size-2.5 rounded-full border border-input bg-[var(--layered-cream)]"
            />
          );
        }
        const isNavy = index < filled;
        return (
          <span
            key={i}
            className={cn(
              "size-2.5 rounded-full",
              isNavy ? "bg-[var(--layered-navy)]" : "bg-[var(--layered-black)]",
            )}
          />
        );
      })}
    </div>
  );
}

function StatDonut({
  count,
  loading,
  goal,
}: {
  count: number;
  loading?: boolean;
  goal: number;
}) {
  const display = loading ? "—" : (count ?? 0);
  const pct = loading ? 0 : Math.min(count / goal, 1);

  return (
    <div className="relative mx-auto size-[4.5rem]">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        {!loading && count > 0 ? (
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${pct * DONUT_CIRCUMFERENCE} ${DONUT_CIRCUMFERENCE}`}
            className="text-[var(--layered-navy)]"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {display}
        </span>
      </div>
    </div>
  );
}

type QuickActionProps = {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

function QuickActionRow({
  href,
  title,
  description,
  icon: Icon,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded px-3 py-2.5 transition-colors duration-150 ease-out",
        "bg-white/8 hover:bg-white/14",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded bg-white/12">
        <Icon className="size-4 text-white" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/70">{description}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-white/50" aria-hidden />
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

function ExpandableNotificationGroup({
  items,
  title,
  description,
}: {
  items: DashboardNotificationItem[];
  title: string;
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded bg-white/8 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-[var(--layered-warning)]"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--layered-warning)]">
            {title}
          </p>
          <p className="mt-0.5 text-xs text-white/70">{description}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 rounded px-2.5 text-xs text-white hover:bg-white/10 hover:text-white"
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
        <ul className="mt-3 space-y-1.5 border-t border-white/12 pt-3">
          {items.map((item) => (
            <li key={item.instanceId}>
              <Link
                href={calendarInstanceHref(item.instanceId)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded bg-white/6 px-3 py-2.5 transition-colors duration-150",
                  "hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {item.classTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-white/60">
                    {formatNotificationWhen(item)}
                  </p>
                </div>
                <ArrowRight className="size-3.5 shrink-0 text-white" aria-hidden />
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
      <div className="flex items-center justify-center rounded-[14px] bg-white/8 px-6 py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  const noPlan = data?.noPlan ?? [];
  const needsClosure = data?.needsClosure ?? [];
  const upcoming = data?.upcoming ?? [];
  const total = noPlan.length + needsClosure.length + upcoming.length;

  if (total === 0) {
    return (
      <div className="flex items-start gap-3 rounded-[14px] bg-white/8 px-4 py-3.5">
        <Check className="mt-0.5 size-4 shrink-0 text-white" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-white">All caught up</p>
          <p className="mt-0.5 text-xs text-white/70">
            No open sessions or pending plans right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {needsClosure.length > 0 ? (
        <ExpandableNotificationGroup
          items={needsClosure}
          title={
            needsClosure.length === 1
              ? "1 past session still open"
              : `${needsClosure.length} past sessions still open`
          }
          description="Mark complete if they happened, or cancel if they did not."
        />
      ) : null}
      {noPlan.length > 0 ? (
        <ExpandableNotificationGroup
          items={noPlan}
          title={
            noPlan.length === 1
              ? "1 class needs a plan"
              : `${noPlan.length} classes need a plan`
          }
          description="Attach a template on the calendar before these sessions."
        />
      ) : null}
      {upcoming.slice(0, 3).map((item) => (
        <Link
          key={item.instanceId}
          href={calendarInstanceHref(item.instanceId)}
          className={cn(
            "flex items-center gap-3 rounded bg-white/8 px-4 py-3.5 transition-colors duration-150",
            "hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          )}
        >
          <Calendar className="size-4 shrink-0 text-white" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">
              Upcoming: {item.classTitle}
            </p>
            <p className="mt-0.5 text-xs text-white/70">
              {formatNotificationWhen(item)}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-white" aria-hidden />
        </Link>
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

  const todayCount = stats?.todayClasses ?? 0;
  const templateCount = stats?.totalTemplates ?? 0;
  const progressPct = loadingStats
    ? 4
    : Math.max(4, (todayCount / TYPICAL_DAY_CAPACITY) * 100);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="layered-eyebrow">Dashboard</p>
        <h1 className="layered-display-headline">
          {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
        </h1>
      </header>

      {/* Row A — stat cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/calendar"
          className="layered-card-interactive flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3 py-[14.5px]">
            <span className="text-2xl font-light text-muted-foreground">—</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground capitalize">Today&apos;s classes</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
              {loadingStats ? "—" : todayCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {todayCount === 0
                ? "nothing on the calendar"
                : "scheduled for today"}
            </p>
          </div>
          <div className="mt-auto h-[3px] w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded bg-[var(--layered-navy)] transition-all duration-300"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
        </Link>

        <Link
          href="/class-plans"
          className="layered-card-interactive flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center justify-between">
          <span className="text-2xl font-light text-muted-foreground">—</span>
            <DotGrid count={templateCount} loading={loadingStats} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground capitalize">
              Class Plans
            </p>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
              {loadingStats ? "—" : templateCount}
            </p>
          </div>
        </Link>
      </div>

      {/* Row B — quick actions + stats + teaching days */}
      <div className="grid gap-4 lg:grid-cols-[minmax(240px,300px)_1fr_1fr]">
        <div className="flex flex-col gap-3 rounded bg-[var(--layered-navy)] p-5 text-white lg:row-span-2 lg:self-stretch">
          <div>
            <h2 className="layered-section-title text-white capitalize">Quick actions</h2>
            <p className="mt-0.5 text-sm text-white/70">
              Shortcuts to the tools you use most
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <QuickActionRow
              href="/exercises/new"
              title="New exercise"
              description="Add a movement to your library"
              icon={Plus}
            />
            <QuickActionRow
              href="/class-plans"
              title="Class plans"
              description="Browse and edit plan templates"
              icon={FileText}
            />
            <QuickActionRow
              href="/week-overview"
              title="Week at a glance"
              description="See the full week in one view"
              icon={CalendarRange}
            />
            <QuickActionRow
              href="/calendar"
              title="Calendar"
              description="Schedule and manage class instances"
              icon={Calendar}
            />
          </div>
        </div>

        <div className="layered-card !px-4 !py-3 relative flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground capitalize">clients</p>
            <Link
              href="/clients"
              className="flex size-6 items-center justify-center rounded bg-[var(--layered-black)] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="View clients"
            >
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>
          <div className="flex justify-center py-0.5">
            <StatDonut
              count={stats?.totalClients ?? 0}
              loading={loadingStats}
              goal={CLIENT_ROSTER_GOAL}
            />
          </div>
        </div>

        <div className="layered-card !px-4 !py-3 relative flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground capitalize">exercises saved</p>
            <Link
              href="/exercises"
              className="flex size-6 items-center justify-center rounded bg-[var(--layered-black)] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="View exercises"
            >
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>
          <div className="flex justify-center py-0.5">
            <StatDonut
              count={stats?.totalExercises ?? 0}
              loading={loadingStats}
              goal={EXERCISE_LIBRARY_GOAL}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <DashboardMiniCalendar variant="dark" />
        </div>
      </div>

      {/* Row C — notifications */}
      <div className="rounded bg-[var(--layered-navy)] p-6 text-white">
        <div className="mb-5">
          <h2 className="layered-section-title text-white">Notifications</h2>
          <p className="mt-1 text-sm text-white/70">
            Open sessions, plans to attach, and what&apos;s coming up
          </p>
        </div>
        <NotificationsSection
          data={notifications}
          loading={loadingNotifications}
        />
      </div>
    </div>
  );
}
