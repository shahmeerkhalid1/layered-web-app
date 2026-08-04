"use client";

import { Suspense, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
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
  AuthTextLink,
  authInputClassName,
} from "@/components/auth/auth-page-shell";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/lib/validation/auth-schemas";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell>
          <AuthLoadingCard />
        </AuthPageShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { login, isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordResetSuccess = searchParams.get("reset") === "success";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    router.replace(isEmailVerified ? "/" : "/verify-email");
  }, [isLoading, isAuthenticated, isEmailVerified, router]);

  if (isLoading || isAuthenticated) {
    return (
      <AuthPageShell>
        <AuthLoadingCard />
      </AuthPageShell>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password, values.rememberMe);
      router.replace("/");
      router.refresh();
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 403) {
        router.replace(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }
      setError("root", {
        message: err instanceof Error ? err.message : "Login failed",
      });
    }
  });

  return (
    <AuthPageShell>
      <AuthFormCard
        title="Welcome back"
        description="Enter your credentials to open your workspace."
        footer={
          <AuthFooterLink prompt="Don't have an account?" linkLabel="Create one" href="/register" />
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {passwordResetSuccess ? (
            <div
              role="status"
              className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground"
            >
              Your password was updated. Sign in with your new password.
            </div>
          ) : null}
          {errors.root ? <AuthFormAlert>{errors.root.message}</AuthFormAlert> : null}

          <AuthField id="email" label="Email" hideLabel error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              aria-invalid={errors.email ? true : undefined}
              className={cn(authInputClassName, errors.email && "border-destructive")}
              {...register("email")}
            />
          </AuthField>

          <AuthField id="password" label="Password" hideLabel error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Password"
              aria-invalid={errors.password ? true : undefined}
              className={cn(authInputClassName, errors.password && "border-destructive")}
              {...register("password")}
            />
          </AuthField>

          <div className="flex items-center justify-between pt-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox id="rememberMe" {...register("rememberMe")} />
              Remember me
            </label>
            <AuthTextLink href="/forgot-password">Forgot password</AuthTextLink>
          </div>

          <div className="pt-2">
            <AuthSubmitButton disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </AuthSubmitButton>
          </div>
        </form>
      </AuthFormCard>
    </AuthPageShell>
  );
}
