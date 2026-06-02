"use client";

import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountPageShellProps {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
  className?: string;
}

export function AccountPageShell({
  title,
  description,
  backHref,
  backLabel,
  children,
  className,
}: AccountPageShellProps) {
  const router = useRouter();

  return (
    <div className={cn("flex w-full min-h-full flex-col space-y-6", className)}>
      <div className="flex min-w-0 items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(backHref)}
          aria-label={backLabel}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="w-full space-y-6">{children}</div>
    </div>
  );
}

interface AccountSectionProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AccountSection({
  id,
  icon: Icon,
  title,
  description,
  children,
  className,
  contentClassName,
}: AccountSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-4.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className={cn("mt-6", contentClassName)}>{children}</div>
    </section>
  );
}
