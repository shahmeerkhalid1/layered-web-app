"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Dumbbell, FileText, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  {
    icon: CalendarDays,
    title: "Schedule with clarity",
    description: "Calendar and week views keep every class within reach.",
  },
  {
    icon: Dumbbell,
    title: "Exercise library",
    description: "Build progressions, layers, and programming in one place.",
  },
  {
    icon: FileText,
    title: "Class plans",
    description: "Templates and sections you can reuse session after session.",
  },
] as const;

export interface AuthPageShellProps {
  children: ReactNode;
  className?: string;
}

export function AuthPageShell({ children, className }: AuthPageShellProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)/0.12,transparent)]"
        aria-hidden
      />
      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,520px)]">
        <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 bg-muted/20 px-10 py-12 lg:flex xl:px-14">
          <div className="space-y-10">
            <div>
              <Image
                src="/layered-logo.png"
                alt="Layered."
                width={607}
                height={115}
                style={{ width: 140, height: "auto" }}
                priority
              />
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                Plan classes, manage your exercise library, and run your Pilates practice from one
                calm, focused workspace.
              </p>
            </div>
            <ul className="space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="flex gap-3 rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4.5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0 text-primary/70" aria-hidden />
            Built for instructors who teach with intention
          </p>
        </aside>

        <main
          className={cn(
            "flex flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-10 lg:py-12",
            className
          )}
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <Image
              src="/layered-logo.png"
              alt="Layered."
              width={607}
              height={115}
              style={{ width: 120, height: "auto" }}
              priority
            />
          </div>
          {children}
        </main>
      </div>
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
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
        {badge ? <div className="mb-4">{badge}</div> : null}
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-8 border-t border-border/70 pt-6">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AuthFormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
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
  children: ReactNode;
}

export function AuthField({ id, label, hint, labelEnd, error, children }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
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
      <Link
        href={href}
        className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
      >
        {linkLabel}
      </Link>
    </p>
  );
}
