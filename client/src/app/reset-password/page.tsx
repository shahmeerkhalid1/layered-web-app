"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  AuthField,
  AuthFooterLink,
  AuthFormAlert,
  AuthFormCard,
  AuthLoadingCard,
  AuthPageShell,
  AuthSubmitButton,
  authInputClassName,
} from "@/components/auth/auth-page-shell";
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
        <AuthPageShell backHref="/login">
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
      <AuthPageShell backHref="/login">
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
    <AuthPageShell backHref="/login">
      <AuthFormCard
        title="Reset password"
        description="Choose a new password for your Layered account."
        footer={<AuthFooterLink prompt="Remember your password?" linkLabel="Sign in" href="/login" />}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {errors.root ? <AuthFormAlert>{errors.root.message}</AuthFormAlert> : null}

          <AuthField
            id="password"
            label="New password"
            hideLabel
            error={errors.password?.message}
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="New password"
              aria-invalid={errors.password ? true : undefined}
              className={cn(authInputClassName, errors.password && "border-destructive")}
              {...register("password")}
            />
          </AuthField>

          <AuthField
            id="confirmPassword"
            label="Confirm password"
            hideLabel
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Confirm password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              className={cn(authInputClassName, errors.confirmPassword && "border-destructive")}
              {...register("confirmPassword")}
            />
          </AuthField>

          <div className="pt-2">
            <AuthSubmitButton disabled={isSubmitting}>
              {isSubmitting ? "Setting password…" : "Set password"}
            </AuthSubmitButton>
          </div>
        </form>
      </AuthFormCard>
    </AuthPageShell>
  );
}
