"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { adminApi } from "@/services/admin-api";
import { ApiError } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function PlatformSettingsSection() {
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await adminApi.getSettings();
      setSignupEnabled(s.signupEnabled);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load platform settings");
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
      toast.error(
        e instanceof ApiError ? e.message : "Could not update platform settings",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      id="platform-settings"
      className="w-full scroll-mt-6 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-4.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
            Platform settings
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Control registration access and instructor onboarding for the whole
            platform.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center py-8">
          <div className="flex items-center gap-3 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            Loading platform settings
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-border bg-muted/15 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LockKeyhole className="size-4" aria-hidden />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Public signup
                  </p>
                  <p className="max-w-md text-xs leading-5 text-muted-foreground">
                    {signupEnabled
                      ? "Anyone can register from the sign-up page."
                      : "Only users with a valid invitation link can register."}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {signupEnabled
                      ? "Anyone can register"
                      : "Invite-only registration"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={signupEnabled}
                aria-label="Toggle public signup"
                disabled={saving}
                onClick={() => void toggleSignup(!signupEnabled)}
                className={cn(
                  "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border border-transparent p-1 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                  signupEnabled ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block size-6 translate-x-0 rounded-full bg-background shadow-sm transition-transform",
                    signupEnabled && "translate-x-6",
                  )}
                />
              </button>
            </div>
          </div>

          <Separator />

          <div className="rounded-2xl border border-border bg-muted/15 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MailCheck className="size-4" aria-hidden />
              </div>
              <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Invitations</p>
                  <p className="mt-1">
                    Admin-created invitations include the user role and expire
                    after seven days.
                  </p>
                </div>
                <p>
                  Create invites from{" "}
                  <Link
                    href="/admin/users"
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "inline-flex h-auto gap-1 p-0 text-sm font-semibold text-primary",
                    )}
                  >
                    <UserPlus className="size-3.5" />
                    User management
                  </Link>
                  .
                </p>
                <p className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                  When public signup is off, only the invited email can complete
                  registration using the invite link.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
