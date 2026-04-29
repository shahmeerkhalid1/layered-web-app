"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminStats, type InvitationRow } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserCheck, UserX, Mail, ArrowRight } from "lucide-react";

export default function AdminDashboardPage() {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin</h2>
          <p className="text-muted-foreground">
            Platform overview and quick access to management tools.
          </p>
        </div>
        {error && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total instructors</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInstructors ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeInstructors ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Not banned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Banned</CardTitle>
            <UserX className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bannedInstructors ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Cannot sign in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending invites</CardTitle>
            <Mail className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting registration</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">User management</CardTitle>
          <Link
            href="/admin/users"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex gap-1.5"
            )}
          >
            Open
            <ArrowRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Invite instructors, change roles, and activate or deactivate accounts from the
          user management page.
        </CardContent>
      </Card>
    </div>
  );
}
