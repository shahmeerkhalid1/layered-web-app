import type { ReactNode } from "react";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { cn } from "@/lib/utils";

export function LegalPageShell({
  children,
  backHref = "/register",
}: {
  children: ReactNode;
  backHref?: string;
}) {
  return (
    <AuthPageShell
      backHref={backHref}
      backLabel="Back"
      className="justify-start py-16 sm:py-20"
      contentClassName="max-w-3xl text-left"
    >
      <article className="rounded border border-border bg-card px-5 py-8 shadow-lg sm:px-8 sm:py-10 md:px-10">
        {children}
      </article>
    </AuthPageShell>
  );
}

export function LegalHeader({
  title,
  lastUpdated,
}: {
  title: string;
  lastUpdated: string;
}) {
  return (
    <header className="space-y-2 border-b border-border pb-6">
      <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
    </header>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function LegalSubSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-foreground/50">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-8 space-y-8", className)}>{children}</div>;
}

export function LegalEmphasis({ children }: { children: ReactNode }) {
  return <p className="font-medium text-foreground">{children}</p>;
}

export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </p>
  );
}
