"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

const AUTH_LINK_CLASS =
  "font-medium text-[var(--layered-navy)] dark:text-white underline-offset-4 transition-colors hover:underline";

export interface AuthPageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  backHref?: string;
  backLabel?: string;
}

export function AuthPageShell({
  children,
  className,
  contentClassName,
  backHref,
  backLabel = "Back",
}: AuthPageShellProps) {
  return (
    <div
      className={cn(
        "relative flex h-dvh flex-col items-center justify-center px-6 py-10 sm:px-10",
        "bg-gradient-to-b from-[#efebfe4] from-0% via-[#c4c5c8] via-50% to-[#aaacb2] to-80% dark:bg-none dark:bg-background",
        className
      )}
    >
      {backHref ? (
        <div className="absolute top-6 left-6 z-10 sm:top-8 sm:left-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-3 py-1.5 text-sm text-muted-foreground dark:text-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            {backLabel}
          </Link>
        </div>
      ) : null}

      <main className={cn("w-full max-w-100 text-center", contentClassName)}>{children}</main>
    </div>
  );
}

export interface AuthFormCardProps {
  title: string;
  description: string;
  children: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
}

export function AuthFormCard({ title, description, children, badge, footer }: AuthFormCardProps) {
  return (
    <div className="w-full dark:bg-background min-h-screen flex flex-col justify-center ">
      {badge ? <div className="mb-5">{badge}</div> : null}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
      {footer ? <div className="mt-8">{footer}</div> : null}
    </div>
  );
}

export function AuthFormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {children}
    </div>
  );
}

export interface AuthFieldProps {
  id: string;
  label: string;
  hint?: string;
  labelEnd?: ReactNode;
  error?: string;
  hideLabel?: boolean;
  children: ReactNode;
}

export function AuthField({
  id,
  label,
  hint,
  labelEnd,
  error,
  hideLabel = false,
  children,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-baseline justify-between gap-2",
          hideLabel && "sr-only"
        )}
      >
        <label htmlFor={id} className="text-sm text-muted-foreground">
          {label}
        </label>
        {labelEnd ?? (hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null)}
      </div>
      {children}
      {error ? (
        <p className="pl-0.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const authInputClassName =
  "h-12 rounded border-input bg-background/70 px-4 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35";

export function AuthLoadingCard() {
  return (
    <AuthFormCard title="Loading" description="Checking access…">
      <div className="flex justify-center py-10">
        <div
          className="size-9 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-label="Loading"
        />
      </div>
    </AuthFormCard>
  );
}

export function AuthFooterLink({
  prompt,
  linkLabel,
  href,
}: {
  prompt: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {prompt}{" "}
      <Link href={href} className={AUTH_LINK_CLASS}>
        {linkLabel}
      </Link>
    </p>
  );
}

export function AuthLegalLinks() {
  return (
    <p className="mt-3 text-center text-xs text-muted-foreground">
      <Link href="/privacy" className={AUTH_LINK_CLASS}>
        Privacy Policy
      </Link>
      <span className="mx-2 text-muted-foreground/60" aria-hidden>
        |
      </span>
      <Link href="/terms" className={AUTH_LINK_CLASS}>
        Terms &amp; Conditions
      </Link>
    </p>
  );
}

export function AuthTextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("text-sm", AUTH_LINK_CLASS, className)}>
      {children}
    </Link>
  );
}

export function AuthSubmitButton({
  children,
  disabled,
  type = "submit",
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background",
        "transition-[opacity,transform] duration-150",
        "hover:opacity-90 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50"
      )}
    >
      {children}
    </button>
  );
}
