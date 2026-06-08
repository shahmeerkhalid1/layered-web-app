"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import Link from "next/link";

import {
  AuthField,
  AuthFooterLink,
  AuthFormAlert,
  AuthFormCard,
  AuthLoadingCard,
  AuthPageShell,
} from "@/components/auth/auth-page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { formatAuthRequestError } from "@/lib/auth-errors";
import { authClient } from "@/lib/auth-client";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/lib/validation/auth-schemas";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell>
          <AuthLoadingCard />
        </AuthPageShell>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <AuthPageShell>
        <AuthFormCard
          title="Invalid reset link"
          description="This password reset link is missing or no longer valid."
          footer={
            <AuthFooterLink
              prompt="Need a new link?"
              linkLabel="Request reset"
              href="/forgot-password"
            />
          }
        >
          <AuthFormAlert>
            {tokenError === "INVALID_TOKEN"
              ? "This reset link is invalid or has expired."
              : "Open the link from your email, or request a new reset link."}
          </AuthFormAlert>
          <Link
            href="/forgot-password"
            className={cn(buttonVariants(), "mt-5 h-10 w-full rounded-full")}
          >
            Request new link
          </Link>
        </AuthFormCard>
      </AuthPageShell>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });
      if (error) {
        setError("root", {
          message: formatAuthRequestError(error, "Could not reset password. Try again."),
        });
        return;
      }
      router.replace("/login?reset=success");
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Could not reset password. Try again.",
      });
    }
  });

  return (
    <AuthPageShell>
      <AuthFormCard
        title="Choose a new password"
        description="Enter a new password for your Layered. account."
        footer={<AuthFooterLink prompt="Remember your password?" linkLabel="Sign in" href="/login" />}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          {errors.root ? <AuthFormAlert>{errors.root.message}</AuthFormAlert> : null}

          <AuthField
            id="password"
            label="New password"
            hint="Min. 8 characters"
            error={errors.password?.message}
          >
            <PasswordInput
              id="password"
              placeholder="Create a secure password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              className={cn(errors.password && "border-destructive")}
              {...register("password")}
            />
          </AuthField>

          <AuthField
            id="confirmPassword"
            label="Confirm password"
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirmPassword"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              className={cn(errors.confirmPassword && "border-destructive")}
              {...register("confirmPassword")}
            />
          </AuthField>

          <Button
            type="submit"
            className="h-10 w-full gap-2 rounded-full"
            disabled={isSubmitting}
          >
            <KeyRound className="size-4" aria-hidden />
            {isSubmitting ? "Updating password…" : "Update password"}
          </Button>
        </form>
      </AuthFormCard>
    </AuthPageShell>
  );
}
