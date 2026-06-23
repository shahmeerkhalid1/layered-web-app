"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

import {
  AuthField,
  AuthFooterLink,
  AuthFormAlert,
  AuthFormCard,
  AuthPageShell,
  AuthSubmitButton,
} from "@/components/auth/auth-page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { authApi } from "@/services/auth-api";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation/auth-schemas";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authApi.requestPasswordReset({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("email", { message: err.message });
        return;
      }
      setError("root", {
        message: err instanceof Error ? err.message : "Could not send reset email. Try again.",
      });
    }
  });

  if (submitted) {
    return (
      <AuthPageShell>
        <AuthFormCard
          title="Check your email"
          description="We sent a link to reset your password."
          footer={<AuthFooterLink prompt="Remember your password?" linkLabel="Sign in" href="/login" />}
        >
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-muted/15 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Mail className="size-6" aria-hidden />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              The link expires in one hour. If you do not see the email, check your spam folder.
            </p>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-6 h-11 w-full rounded-full"
              )}
            >
              Back to sign in
            </Link>
          </div>
        </AuthFormCard>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <AuthFormCard
        description="Enter the email on your Layered. account and we will send you a reset link."
        footer={<AuthFooterLink prompt="Remember your password?" linkLabel="Sign in" href="/login" />}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          {errors.root ? <AuthFormAlert>{errors.root.message}</AuthFormAlert> : null}

          <AuthField id="email" label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              className={cn("h-11 rounded-xl", errors.email && "border-destructive")}
              {...register("email")}
            />
          </AuthField>

          <AuthSubmitButton disabled={isSubmitting}>
            {isSubmitting ? "Sending link…" : "Send reset link"}
            {!isSubmitting ? <ArrowRight className="size-4" aria-hidden /> : null}
          </AuthSubmitButton>

          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-11 w-full gap-2 rounded-full"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to sign in
          </Link>
        </form>
      </AuthFormCard>
    </AuthPageShell>
  );
}
