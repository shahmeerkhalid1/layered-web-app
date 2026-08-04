"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { formatAuthRequestError } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell backHref="/login">
          <AuthLoadingCard />
        </AuthPageShell>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    instructor,
    isAuthenticated,
    isEmailVerified,
    isLoading,
    resendVerificationEmail,
    logout,
  } = useAuth();

  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const tokenError = searchParams.get("error");
  const [manualEmail, setManualEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pageError, setPageError] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isEmailVerified) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isEmailVerified, router]);

  if (isLoading || (isAuthenticated && isEmailVerified)) {
    return (
      <AuthPageShell backHref="/login">
        <AuthLoadingCard />
      </AuthPageShell>
    );
  }

  const displayEmail = instructor?.email || emailFromQuery || manualEmail;
  const canResend = Boolean(displayEmail.trim());

  const handleResend = async () => {
    if (!canResend) return;
    setPageError("");
    setIsResending(true);
    try {
      await resendVerificationEmail(displayEmail.trim());
      setSent(true);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      setPageError(
        formatAuthRequestError(
          { message: err instanceof Error ? err.message : undefined, status },
          "Could not send verification email. Try again."
        )
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthPageShell backHref="/login">
      <AuthFormCard
        title="Verify your email"
        description={
          sent
            ? "We sent a new verification link to your inbox."
            : "Open the link we sent to finish setting up your account."
        }
        footer={<AuthFooterLink prompt="Already verified?" linkLabel="Sign in" href="/login" />}
      >
        <div className="space-y-4">
          {tokenError === "invalid_token" ? (
            <AuthFormAlert>
              This verification link is invalid or has expired. Request a new one below.
            </AuthFormAlert>
          ) : null}
          {pageError ? <AuthFormAlert>{pageError}</AuthFormAlert> : null}

          <div className="flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-muted/15 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded bg-primary/10 text-primary">
              <Mail className="size-6" aria-hidden />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {displayEmail ? (
                <>
                  We sent a verification link to{" "}
                  <span className="font-medium text-foreground">{displayEmail}</span>.
                </>
              ) : (
                "Enter your email below to receive a verification link."
              )}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The link expires in one hour. Check your spam folder if you do not see it.
            </p>
          </div>

          {!instructor ? (
            <AuthField id="email" label="Email" error={undefined}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={manualEmail}
                onChange={(event) => setManualEmail(event.target.value)}
                className={authInputClassName}
              />
            </AuthField>
          ) : null}

          <AuthSubmitButton
            type="button"
            disabled={!canResend || isResending}
            onClick={() => void handleResend()}
          >
            {isResending ? "Sending link…" : sent ? "Resend again" : "Resend verification email"}
          </AuthSubmitButton>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void logout().then(() => router.replace("/login"))}
              className={cn(
                "w-full text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              )}
            >
              Sign out and use a different account
            </button>
          ) : null}
        </div>
      </AuthFormCard>
    </AuthPageShell>
  );
}
