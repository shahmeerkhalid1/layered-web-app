"use client";

import { UserPlus, UsersRound } from "lucide-react";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface AdminUserLibraryHeaderProps {
  totalUsers?: number;
  visibleUserCount: number;
  loading: boolean;
  hasActiveFilters: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onInvite: () => void;
}

export function AdminUserLibraryHeader({
  totalUsers,
  visibleUserCount,
  loading,
  hasActiveFilters,
  search,
  onSearchChange,
  onInvite,
}: AdminUserLibraryHeaderProps) {
  const totalKnown = totalUsers !== undefined;
  const total = totalUsers ?? 0;

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-2xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UsersRound className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-3xl">
                User management
              </h2>
              <p
                className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground"
                aria-live="polite"
              >
                {!totalKnown && loading && <span>Loading directory…</span>}
                {totalKnown && (
                  <span className="font-medium text-foreground">
                    {hasActiveFilters
                      ? `Showing ${visibleUserCount} of ${total} user${total === 1 ? "" : "s"}`
                      : `${total} user${total === 1 ? "" : "s"}`}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onInvite}
            className="rounded-full px-4"
          >
            <UserPlus className="mr-2 size-4" />
            Invite user
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3 border-t border-border pt-5">
        <div className="min-w-0 flex-1 basis-52 space-y-2 sm:basis-72">
          <Label htmlFor="user-search" className="text-muted-foreground">
            Search
          </Label>
          <ExerciseSearch
            id="user-search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search by email…"
          />
        </div>
      </div>
    </div>
  );
}
