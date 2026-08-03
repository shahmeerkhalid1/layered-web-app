"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ClientLibraryHeaderProps {
  totalClients?: number;
  visibleClientCount: number;
  loading: boolean;
  hasActiveFilters: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onNewClient?: () => void;
  createDisabled?: boolean;
  createDisabledTitle?: string;
}

export function ClientLibraryHeader({
  totalClients,
  visibleClientCount,
  loading,
  hasActiveFilters,
  search,
  onSearchChange,
  onNewClient,
  createDisabled = false,
  createDisabledTitle = "Upgrade to add more clients",
}: ClientLibraryHeaderProps) {
  const totalKnown = totalClients !== undefined;
  const total = totalClients ?? 0;

  const subtitle = totalKnown
    ? hasActiveFilters
      ? `Showing ${visibleClientCount} of ${total} client${total === 1 ? "" : "s"}`
      : `${total} client${total === 1 ? "" : "s"}`
    : loading
      ? "Loading roster…"
      : "0 clients";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <header className="space-y-2">
          <p className="layered-eyebrow">Clients</p>
          <h1 className="layered-display-headline">Clients</h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {subtitle}
          </p>
        </header>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {onNewClient ? (
            <button
              type="button"
              onClick={createDisabled ? undefined : onNewClient}
              disabled={createDisabled}
              title={createDisabled ? createDisabledTitle : undefined}
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex h-10 items-center justify-center rounded bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary/90",
                createDisabled && "pointer-events-none opacity-50",
              )}
            >
              <Plus className="mr-2 size-4" />
              New client
            </button>
          ) : (
            <Link
              href="/clients/new"
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex h-10 items-center justify-center rounded bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary/90",
              )}
            >
              <Plus className="mr-2 size-4" />
              New client
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[260px] flex-1">
          <ExerciseSearch
            id="client-search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search by name, email, or phone…"
          />
        </div>
      </div>
    </div>
  );
}
