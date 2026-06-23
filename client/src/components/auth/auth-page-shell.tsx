"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Copyright } from "lucide-react";

import { cn } from "@/lib/utils";

const BRAND_HEADLINE = "Scribbles become sequences. Thoughts become flows.";

const BRAND_DESCRIPTION =
  "Layered is your digital studio notebook, helping you plan with intention, teach with clarity and bring intention to every class you teach. Built by an instructor, for instructors, Layered turns your ideas into intentional class plans that move seamlessly.";

export interface AuthPageShellProps {
  children: ReactNode;
  className?: string;
}

export function AuthPageShell({ children, className }: AuthPageShellProps) {
  const year = new Date().getFullYear();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden min-h-screen flex-col justify-end overflow-hidden lg:flex">
        <Image
          src="/background-image.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/15"
          aria-hidden
        />
        <div className="relative z-10 px-10 py-12 xl:px-14 xl:py-14">
          <h2 className="max-w-lg font-heading text-2xl font-semibold leading-snug tracking-[-0.02em] text-white xl:text-[1.75rem]">
            {BRAND_HEADLINE}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75">{BRAND_DESCRIPTION}</p>
          <p className="mt-10 flex items-center gap-2 text-xs text-white/50">
            <Copyright className="size-3.5 shrink-0 text-white/60" aria-hidden />
            Layered {year}
          </p>
        </div>
      </aside>

      <main
        className={cn(
          "flex min-h-screen flex-col items-center justify-center bg-card px-6 py-10 sm:px-10 lg:px-16 lg:py-12",
          className
        )}
      >
        <div className="mb-8 flex w-full max-w-[400px] justify-center lg:mb-10">
          <Image
            src="/layered-dark-logo.png"
            alt="Layered."
            width={400}
            height={100}
            className="h-auto w-[350px] dark:hidden"
            priority
          />
          <Image
            src="/layered-light-logo.png"
            alt="Layered."
            width={400}
            height={100}
            className="hidden h-auto w-[350px] dark:block"
            priority
          />
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}

export interface AuthFormCardProps {
  title?: string;
  description: string;
  children: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
}

export function AuthFormCard({ title, description, children, badge, footer }: AuthFormCardProps) {
  return (
    <div className="w-full">
      {badge ? <div className="mb-5 flex justify-center">{badge}</div> : null}
      <div className="space-y-2 text-center">
        {title ? (
          <h1 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
        ) : null}
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
  children: ReactNode;
}

export function AuthField({ id, label, hint, labelEnd, error, children }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
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

export function AuthLoadingCard() {
  return (
    <AuthFormCard description="Checking access…">
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
        className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
      >
        {linkLabel}
      </Link>
    </p>
  );
}

export function AuthSubmitButton({
  children,
  disabled,
  type = "submit",
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground",
        "transition-[opacity,transform,box-shadow] duration-150",
        "hover:opacity-95 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50"
      )}
    >
      {children}
    </button>
  );
}
