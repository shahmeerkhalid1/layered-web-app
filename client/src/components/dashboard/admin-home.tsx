"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminApi,
  type AdminStats,
  type InvitationRow,
} from "@/services/admin-api";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Mail,
  Settings,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import type { ComponentType } from "react";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="layered-card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
    </article>
  );
}

function QuickActionRow({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
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

export function AdminHome() {
  const { instructor } = useAuth();
  const firstName = instructor?.name?.split(" ")[0];
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, inv] = await Promise.all([
        adminApi.getStats(),
        adminApi.getInvitations(),
      ]);
      setStats(s);
      setInvitations(inv.invitations);
    } catch (e) {
      console.error(e);
      setError(e instanceof ApiError ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const pendingCount = invitations.filter((i) => i.status === "PENDING").length;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="layered-eyebrow">Admin</p>
        <h1 className="layered-display-headline">
          {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
        </h1>
        <p className="text-sm text-muted-foreground">
          Platform overview and quick access to management tools.
        </p>
      </header>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded border-border px-3 shadow-none"
            onClick={() => void load()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total instructors"
          value={stats?.totalInstructors ?? "—"}
          hint="Registered accounts"
          icon={Users}
        />
        <StatCard
          label="Active"
          value={stats?.activeInstructors ?? "—"}
          hint="Not banned"
          icon={UserCheck}
        />
        <StatCard
          label="Inactive"
          value={stats?.bannedInstructors ?? "—"}
          hint="Banned — cannot sign in"
          icon={UserX}
        />
        <StatCard
          label="Pending invites"
          value={pendingCount}
          hint="Awaiting registration"
          icon={Mail}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        {/* <div className="flex flex-col gap-3 rounded bg-[var(--layered-navy)] p-5 text-white">
          <div>
            <h2 className="layered-section-title text-white">Quick actions</h2>
            <p className="mt-0.5 text-sm text-white/70">
              Shortcuts to admin tools
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <QuickActionRow
              href="/admin/users"
              title="User management"
              description="Invite, roles, and account status"
              icon={Users}
            />
            <QuickActionRow
              href="/admin/users"
              title="Invite user"
              description="Send a registration invitation"
              icon={UserPlus}
            />
            <QuickActionRow
              href="/admin/settings"
              title="Platform settings"
              description="Signup and platform configuration"
              icon={Settings}
            />
          </div>
        </div> */}

        <Link
          href="/admin/users"
          className="layered-card-interactive flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div>
            <h2 className="layered-section-title">User management</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Invite instructors, change roles, and activate or deactivate accounts
              from the user management page.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            Open user management
            <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
      </div>
    </div>
  );
}
