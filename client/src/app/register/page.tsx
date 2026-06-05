"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, UserPlus } from "lucide-react";

import {
  AuthField,
  AuthFooterLink,
  AuthFormAlert,
  AuthFormCard,
  AuthLoadingCard,
  AuthPageShell,
} from "@/components/auth/auth-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { api } from "@/lib/api";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/lib/validation/auth-schemas";
import { cn } from "@/lib/utils";

interface InviteInfo {
  email: string;
  role: string;
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell>
          <AuthLoadingCard />
        </AuthPageShell>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const { register: signUp, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [pageError, setPageError] = useState("");
  const [signupAllowed, setSignupAllowed] = useState<boolean | null>(null);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [checking, setChecking] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        if (token) {
          const data = await api.get<InviteInfo>(`/invite/verify?token=${token}`);
          setInvite(data);
          setValue("email", data.email, { shouldValidate: true });
          setSignupAllowed(true);
        } else {
          const data = await api.get<{ signupEnabled: boolean }>("/signup-status");
          setSignupAllowed(data.signupEnabled);
        }
      } catch {
        if (token) {
          setPageError("Invalid or expired invitation link.");
        }
        setSignupAllowed(false);
      } finally {
        setChecking(false);
      }
    }
    void checkAccess();
  }, [token, setValue]);

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

  if (checking) {
    return (
      <AuthPageShell>
        <AuthLoadingCard />
      </AuthPageShell>
    );
  }

  if (!signupAllowed && !invite) {
    return (
      <AuthPageShell>
        <AuthFormCard
          title="Registration closed"
          description={
            pageError ||
            "Public sign-up is disabled. Ask your administrator for an invitation link."
          }
          footer={<AuthFooterLink prompt="Already have an account?" linkLabel="Sign in" href="/login" />}
        >
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Mail className="size-6" aria-hidden />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              When you receive an invite, open the link in your email to create your account.
            </p>
          </div>
        </AuthFormCard>
      </AuthPageShell>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setPageError("");
    try {
      await signUp(values.email, values.password, values.name);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Registration failed");
    }
  });

  const inviteBadge = invite ? (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
        Invitation
      </Badge>
      {invite.role ? (
        <span className="text-xs text-muted-foreground">Role: {invite.role}</span>
      ) : null}
    </div>
  ) : null;

  return (
    <AuthPageShell>
      <AuthFormCard
        title="Create your account"
        description={
          invite
            ? "You're joining Layered. via invitation — finish setting up your profile."
            : "Get started with Layered. and organize your teaching in one place."
        }
        badge={inviteBadge}
        footer={
          <AuthFooterLink prompt="Already have an account?" linkLabel="Sign in" href="/login" />
        }
      >
        <form onSubmit={onSubmit} className="space-y-5">
          {pageError ? <AuthFormAlert>{pageError}</AuthFormAlert> : null}

          <AuthField id="name" label="Full name" error={errors.name?.message}>
            <Input
              id="name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              className={cn(errors.name && "border-destructive")}
              {...register("name")}
            />
          </AuthField>

          <AuthField
            id="email"
            label="Email"
            hint={invite ? "From your invitation" : undefined}
            error={errors.email?.message}
          >
            <div className="relative">
              {invite ? (
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                readOnly={!!invite}
                aria-invalid={errors.email ? true : undefined}
                className={cn(
                  invite && "bg-muted/40 pl-9",
                  errors.email && "border-destructive"
                )}
                {...register("email")}
              />
            </div>
          </AuthField>

          <AuthField
            id="password"
            label="Password"
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

          <Button
            type="submit"
            className="h-10 w-full gap-2 rounded-full"
            disabled={isSubmitting}
          >
            <UserPlus className="size-4" aria-hidden />
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthFormCard>
    </AuthPageShell>
  );
}
