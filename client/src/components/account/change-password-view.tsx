"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Shield,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AccountPageShell } from "@/components/account/account-page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  changePasswordFormDefaults,
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/lib/validation/profile-schemas";
import { cn } from "@/lib/utils";

const PASSWORD_TIPS = [
  "At least 8 characters",
  "Mix letters, numbers, and symbols",
  "Do not reuse passwords from other sites",
] as const;

export function ChangePasswordView() {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: changePasswordFormDefaults,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const revokeOtherSessions = watch("revokeOtherSessions");
  const newPassword = watch("newPassword");

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: values.revokeOtherSessions,
      });
      if (error) {
        toast.error(error.message ?? "Could not change password");
        return;
      }
      reset(changePasswordFormDefaults);
      toast.success("Password updated");
    } catch {
      toast.error("Could not change password");
    } finally {
      setSaving(false);
    }
  });

  const meetsMinLength = newPassword.length >= 8;

  return (
    <AccountPageShell
      title="Change password"
      description="Enter your current password, then choose a new one. We recommend signing out other devices afterward."
      backHref="/account"
      backLabel="Back to account settings"
    >
      <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,280px)] xl:items-start">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
          <form noValidate onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                placeholder="Enter current password"
                aria-invalid={errors.currentPassword ? true : undefined}
                className={cn(errors.currentPassword && "border-destructive")}
                {...register("currentPassword")}
              />
              {errors.currentPassword ? (
                <p className="text-sm text-destructive">
                  {errors.currentPassword.message}
                </p>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                New password
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    aria-invalid={errors.newPassword ? true : undefined}
                    className={cn(errors.newPassword && "border-destructive")}
                    {...register("newPassword")}
                  />
                  {errors.newPassword ? (
                    <p className="text-sm text-destructive">
                      {errors.newPassword.message}
                    </p>
                  ) : newPassword.length > 0 ? (
                    <p
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        meetsMinLength
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <CheckCircle2
                        className={cn(
                          "size-3.5",
                          meetsMinLength ? "opacity-100" : "opacity-40",
                        )}
                        aria-hidden
                      />
                      {meetsMinLength ? "Meets minimum length" : "8+ characters required"}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <PasswordInput
                    id="confirm-password"
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    aria-invalid={errors.confirmPassword ? true : undefined}
                    className={cn(errors.confirmPassword && "border-destructive")}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword ? (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border px-4 py-3.5 transition-colors hover:border-ring/40">
              <Checkbox
                checked={revokeOtherSessions}
                onChange={(e) =>
                  setValue("revokeOtherSessions", e.target.checked, {
                    shouldDirty: true,
                  })
                }
                className="mt-0.5"
              />
              <span className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Shield className="size-4 text-primary" aria-hidden />
                  Sign out other devices
                </span>
                <span className="block text-xs leading-5 text-muted-foreground">
                  Ends active sessions on other browsers and devices. Recommended after
                  updating your password.
                </span>
              </span>
            </label>

            <Separator />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/account"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex justify-center rounded-full",
                )}
              >
                Cancel
              </Link>
              <Button type="submit" className="rounded-full shadow-sm" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Updating…
                  </>
                ) : (
                  "Change password"
                )}
              </Button>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl border border-border bg-card p-5 shadow-lg lg:sticky lg:top-6">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Password tips
          </p>
          <ul className="mt-4 space-y-3">
            {PASSWORD_TIPS.map((tip) => (
              <li
                key={tip}
                className="flex gap-2.5 text-sm leading-6 text-muted-foreground"
              >
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-primary/80"
                  aria-hidden
                />
                {tip}
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-2xl border border-border px-3 py-2.5 text-xs leading-5 text-muted-foreground">
            After saving, you stay signed in on this device unless you chose to sign out
            others.
          </p>
        </aside>
      </div>
    </AccountPageShell>
  );
}
