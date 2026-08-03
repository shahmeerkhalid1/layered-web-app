"use client";

import { UserPlus } from "lucide-react";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { Button } from "@/components/ui/button";

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

  const subtitle = totalKnown
    ? hasActiveFilters
      ? `Showing ${visibleUserCount} of ${total} user${total === 1 ? "" : "s"}`
      : `${total} user${total === 1 ? "" : "s"}`
    : loading
      ? "Loading directory…"
      : "0 users";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <header className="space-y-2">
          <p className="layered-eyebrow">Admin</p>
          <h1 className="layered-display-headline">User management</h1>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {subtitle}
          </p>
        </header>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            className="h-10 rounded bg-primary px-5 shadow-none hover:bg-primary/90"
            onClick={onInvite}
          >
            <UserPlus className="mr-2 size-4" />
            Invite user
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[260px] flex-1">
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
