"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await adminApi.getSettings();
      setSignupEnabled(s.signupEnabled);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const toggleSignup = async (next: boolean) => {
    setSaving(true);
    try {
      const s = await adminApi.patchSettings({ signupEnabled: next });
      setSignupEnabled(s.signupEnabled);
      toast.success(next ? "Open signup enabled" : "Invite-only mode");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform settings</h2>
        <p className="text-muted-foreground">
          Control who can register and how invitations work.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public signup</CardTitle>
          <CardDescription>
            When disabled, only users with a valid invitation link can register with the
            invited email.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {signupEnabled ? "Anyone can register" : "Invite-only registration"}
            </p>
            <p className="text-xs text-muted-foreground">
              The register page checks this flag before showing the signup form.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={signupEnabled}
            disabled={saving}
            onClick={() => void toggleSignup(!signupEnabled)}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
              signupEnabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block size-6 translate-x-0.5 rounded-full bg-background shadow ring-0 transition-transform",
                signupEnabled && "translate-x-5"
              )}
            />
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Additional platform keys can be stored in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PlatformSetting</code>{" "}
            when you extend the admin API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Invitations are created from{" "}
            <Link
              href="/admin/users"
              className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-sm")}
            >
              User management
            </Link>
            . Each invite includes a role and expires after seven days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
