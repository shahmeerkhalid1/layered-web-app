"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { adminApi } from "@/services/admin-api";
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
import { Loader2, LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";

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
      <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] bg-background">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card/75 px-4 py-2 text-sm text-muted-foreground shadow-lg">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          Loading platform settings
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl space-y-6 overflow-hidden rounded-[2rem] bg-background p-1">
      <div className="pointer-events-none absolute top-20 right-8 h-40 w-40 rounded-full bg-secondary/70 blur-3xl" />

      <div className="relative rounded-3xl border border-border bg-card/90 p-5 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Platform Controls
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-3xl">
              Platform settings
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Control registration access and keep instructor onboarding aligned with
              the studio.
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <ShieldCheck className="size-6" />
          </div>
        </div>
      </div>

      <Card className="relative border-border bg-card shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-[-0.02em] text-card-foreground">
                Public signup
              </CardTitle>
              <CardDescription className="mt-1 leading-6 text-muted-foreground">
                Choose whether new instructors can self-register or need an invite.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-card-foreground">
              {signupEnabled ? "Anyone can register" : "Invite-only registration"}
            </p>
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
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
              "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border border-transparent p-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
              signupEnabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block size-6 translate-x-0 rounded-full bg-background shadow-sm ring-0 transition-transform",
                signupEnabled && "translate-x-6"
              )}
            />
          </button>
        </CardContent>
      </Card>

      <Card className="relative border-border bg-card shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <MailCheck className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-[-0.02em] text-card-foreground">
                Invitations
              </CardTitle>
              <CardDescription className="mt-1 leading-6 text-muted-foreground">
                Admin-created invitations carry the user role and a short-lived link.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Invitations are created from{" "}
            <Link
              href="/admin/users"
              className={cn(
                buttonVariants({ variant: "link" }),
                "h-auto p-0 text-sm font-semibold text-primary hover:text-primary/80"
              )}
            >
              User management
            </Link>
            . Each invite includes a role and expires after seven days.
          </p>
          <p className="rounded-2xl border border-border bg-accent px-3 py-2 text-xs text-accent-foreground">
            When disabled, only users with a valid invitation link can register with the
            invited email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
