"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Top-level list/home routes that show the brand background image. */
const PAGE_BACKGROUND_PATHS = new Set([
  "/",
  "/week-overview",
  "/class-plans",
  "/exercises",
  "/clients",
  "/calendar",
  "/admin/users",
]);

export function usePageBackground(): boolean {
  const pathname = usePathname();
  return PAGE_BACKGROUND_PATHS.has(pathname);
}

export function PageBackgroundContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const showBackground = usePageBackground();

  return (
    <div
      className={cn(
        "relative min-h-full",
        showBackground &&
          "bg-[url('/background-image.png')] bg-cover bg-fixed bg-center bg-no-repeat",
        className
      )}
    >
      {showBackground ? (
        <div
          className="pointer-events-none absolute inset-0 bg-background/20 dark:bg-background/20"
          aria-hidden
        />
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
