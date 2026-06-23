"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ClientLibraryHeaderProps {
  totalClients?: number;
  visibleClientCount: number;
  loading: boolean;
  hasActiveFilters: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

export function ClientLibraryHeader({
  totalClients,
  visibleClientCount,
  loading,
  hasActiveFilters,
  search,
  onSearchChange,
}: ClientLibraryHeaderProps) {
  const totalKnown = totalClients !== undefined;
  const total = totalClients ?? 0;

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-2xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-secondary-foreground">
              <Users className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-lg uppercase">
                Clients
              </h2>
              <p
                className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground"
                aria-live="polite"
              >
                {!totalKnown && loading && <span>Loading roster…</span>}
                {totalKnown && (
                  <span className="font-medium text-foreground">
                    {hasActiveFilters
                      ? `Showing ${visibleClientCount} of ${total} client${total === 1 ? "" : "s"}`
                      : `${total} client${total === 1 ? "" : "s"}`}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/clients/new"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}
          >
            <Plus className="mr-2 size-4" />
            New client
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3 border-t border-border pt-5">
        <div className="min-w-0 flex-1 basis-52 space-y-2 sm:basis-72">
          <Label htmlFor="client-search" className="text-muted-foreground">
            Search
          </Label>
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
