"use client";

import { Suspense, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  AuthField,
  AuthFooterLink,
  AuthFormAlert,
  AuthFormCard,
  AuthLoadingCard,
  AuthPageShell,
  AuthSubmitButton,
} from "@/components/auth/auth-page-shell";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/lib/validation/auth-schemas";

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
  const { login, isAuthenticated, isLoading } = useAuth();
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
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

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
      setError("root", {
        message: err instanceof Error ? err.message : "Login failed",
      });
    }
  });

  return (
    <AuthPageShell>
      {/* <p className="text-sm text-muted-foreground text-center w-72 mx-auto"></p> */}
      <AuthFormCard
      description="Welcome Back — enter your credentials to open your workspace."
        footer={
          <AuthFooterLink prompt="Don't have an account?" linkLabel="Create one" href="/register" />
        }
      >
        <form onSubmit={onSubmit} className="space-y-5">
          {passwordResetSuccess ? (
            <div
              role="status"
              className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground"
            >
              Your password was updated. Sign in with your new password.
            </div>
          ) : null}
          {errors.root ? <AuthFormAlert>{errors.root.message}</AuthFormAlert> : null}

          <AuthField id="email" label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              className={`h-11 rounded-xl`}
              {...register("email")}
            />
          </AuthField>

          <AuthField
            id="password"
            label="Password"
            labelEnd={
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Forgot Password
              </Link>
            }
            error={errors.password?.message}
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              className={`h-11 rounded-xl`}
              {...register("password")}
            />
          </AuthField>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
            <Checkbox id="rememberMe" {...register("rememberMe")} />
            Remember me
          </label>

          <AuthSubmitButton disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In"}
            {!isSubmitting ? <ArrowRight className="size-4" aria-hidden /> : null}
          </AuthSubmitButton>
        </form>
      </AuthFormCard>
    </AuthPageShell>
  );
}
