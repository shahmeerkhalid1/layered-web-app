"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";

import {
  AuthField,
  AuthFooterLink,
  AuthFormAlert,
  AuthFormCard,
  AuthLoadingCard,
  AuthPageShell,
} from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/lib/validation/auth-schemas";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
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
      await login(values.email, values.password);
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
      <AuthFormCard
        title="Sign in"
        description="Welcome back — enter your credentials to open your workspace."
        footer={
          <AuthFooterLink prompt="Don't have an account?" linkLabel="Create one" href="/register" />
        }
      >
        <form onSubmit={onSubmit} className="space-y-5">
          {errors.root ? <AuthFormAlert>{errors.root.message}</AuthFormAlert> : null}

          <AuthField id="email" label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              className={cn(errors.email && "border-destructive")}
              {...register("email")}
            />
          </AuthField>

          <AuthField id="password" label="Password" error={errors.password?.message}>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              className={cn(errors.password && "border-destructive")}
              {...register("password")}
            />
          </AuthField>

          <Button
            type="submit"
            className="h-10 w-full gap-2 rounded-full"
            disabled={isSubmitting}
          >
            <LogIn className="size-4" aria-hidden />
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </AuthFormCard>
    </AuthPageShell>
  );
}
