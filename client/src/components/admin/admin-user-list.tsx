"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
  SearchX,
  Shield,
  UserPlus,
  UserRound,
  UserX,
} from "lucide-react";
import type { InvitationRow } from "@/services/admin-api";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExerciseLibraryPagination } from "@/components/exercises/exercise-library-pagination";

export type AdminListUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt?: string;
  emailVerified?: boolean;
};

interface AdminUserListProps {
  users: AdminListUser[];
  pendingInvitations?: InvitationRow[];
  loading: boolean;
  showFilteredEmpty?: boolean;
  onClearFilters?: () => void;
  onInvite?: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => Promise<void>;
  selfId?: string;
  onViewDetails: (user: AdminListUser) => void;
  onViewInvitationDetails?: (invitation: InvitationRow) => void;
  onCopyInviteLink?: (invitation: InvitationRow) => void;
  onRevokeInvitation?: (invitation: InvitationRow) => void;
  onMakeAdmin: (user: AdminListUser) => void;
  onMakeInstructor: (user: AdminListUser) => void;
  onDeactivate: (user: AdminListUser) => void;
  onActivate: (user: AdminListUser) => void;
}

export function AdminUserList({
  users,
  pendingInvitations = [],
  loading,
  showFilteredEmpty,
  onClearFilters,
  onInvite,
  page,
  totalPages,
  onPageChange,
  onRefresh,
  selfId,
  onViewDetails,
  onViewInvitationDetails,
  onCopyInviteLink,
  onRevokeInvitation,
  onMakeAdmin,
  onMakeInstructor,
  onDeactivate,
  onActivate,
}: AdminUserListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deactivateTarget, setDeactivateTarget] = useState<
    AdminListUser | AdminListUser[] | null
  >(null);
  const [deactivating, setDeactivating] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const isSelf = (user: AdminListUser) => user.id === selfId;

  const userIdsOnPage = useMemo(
    () => users.map((user) => user.id),
    [users],
  );

  const selectableIdsOnPage = useMemo(
    () => users.filter((user) => !isSelf(user)).map((user) => user.id),
    [users, selfId],
  );

  const allOnPageSelected =
    selectableIdsOnPage.length > 0 &&
    selectableIdsOnPage.every((id) => selectedIds.has(id));
  const someOnPageSelected =
    selectableIdsOnPage.some((id) => selectedIds.has(id)) && !allOnPageSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPageSelected;
    }
  }, [someOnPageSelected]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (userIdsOnPage.includes(id)) {
          next.add(id);
        }
      }
      return next;
    });
  }, [userIdsOnPage]);

  const toggleAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const id of selectableIdsOnPage) {
          next.delete(id);
        }
      } else {
        for (const id of selectableIdsOnPage) {
          next.add(id);
        }
      }
      return next;
    });
  }, [allOnPageSelected, selectableIdsOnPage]);

  const toggleRow = useCallback((userId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedUsers = users.filter((user) => selectedIds.has(user.id));
  const selectedActiveUsers = selectedUsers.filter(
    (user) => !isSelf(user) && !user.banned,
  );

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) return;

    const targets = (
      Array.isArray(deactivateTarget) ? deactivateTarget : [deactivateTarget]
    ).filter((user) => !isSelf(user) && !user.banned);

    if (targets.length === 0) {
      setDeactivateTarget(null);
      return;
    }

    setDeactivating(true);
    try {
      const results = await Promise.all(
        targets.map((user) =>
          authClient.admin.banUser({
            userId: user.id,
            banReason: "Deactivated by administrator",
          }),
        ),
      );
      const failed = results.find(
        (res) => (res as { error?: { message?: string } }).error?.message,
      );
      const err = (failed as { error?: { message?: string } }).error;
      if (err?.message) {
        throw new Error(err.message);
      }
      toast.success(
        targets.length === 1
          ? "User deactivated"
          : `${targets.length} users deactivated`,
      );
      setDeactivateTarget(null);
      clearSelection();
      if (onRefresh) {
        await onRefresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to deactivate users");
    } finally {
      setDeactivating(false);
    }
  }

  const deactivateDescription = Array.isArray(deactivateTarget)
    ? `${deactivateTarget.filter((u) => !isSelf(u) && !u.banned).length} user${
        deactivateTarget.length === 1 ? "" : "s"
      } will not be able to sign in until reactivated.`
    : deactivateTarget
      ? `${deactivateTarget.email} will not be able to sign in until reactivated.`
      : "";

  return (
    <>
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-accent/40 px-4 py-3 sm:px-5">
          <p className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-background hover:text-foreground"
              onClick={clearSelection}
            >
              Clear selection
            </Button>
            {selectedActiveUsers.length > 0 ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={() => setDeactivateTarget(selectedActiveUsers)}
              >
                <UserX className="mr-2 size-4" />
                Deactivate selected
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex items-center gap-3 rounded-full border border-border bg-background/75 px-4 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            Loading users
          </div>
        </div>
      ) : showFilteredEmpty && onClearFilters ? (
        <AdminUserFilteredEmptyState onClearFilters={onClearFilters} />
      ) : users.length === 0 && pendingInvitations.length === 0 ? (
        <AdminUserEmptyState onInvite={onInvite} />
      ) : (
        <>
          <Table>
            <TableHeader className="bg-accent">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox
                    ref={selectAllRef}
                    checked={allOnPageSelected}
                    disabled={selectableIdsOnPage.length === 0}
                    onChange={(event) => {
                      event.stopPropagation();
                      toggleAllOnPage();
                    }}
                    aria-label="Select all users on this page"
                  />
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Name
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Email
                </TableHead>
                <TableHead className="hidden px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase sm:table-cell">
                  Role
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Status
                </TableHead>
                <TableHead className="w-12 px-4 py-3 text-right text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvitations.map((invitation) => (
                <TableRow
                  key={`invite-${invitation.id}`}
                  tabIndex={0}
                  className="cursor-pointer border-border bg-muted/15 hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                  onClick={() => onViewInvitationDetails?.(invitation)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onViewInvitationDetails?.(invitation);
                    }
                  }}
                >
                  <TableCell className="px-4 py-3" />
                  <TableCell className="px-4 py-3 font-medium text-muted-foreground italic">
                    Pending
                  </TableCell>
                  <TableCell className="max-w-[12rem] truncate px-4 py-3 text-muted-foreground sm:max-w-none">
                    {invitation.email}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 sm:table-cell">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-border bg-muted/40 text-[11px] font-semibold",
                        invitation.role === "ADMIN" &&
                          "border-primary/30 bg-primary/10 text-primary",
                      )}
                    >
                      {invitation.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/25 bg-primary/10 text-[11px] text-primary"
                    >
                      <Mail className="mr-1 size-3" />
                      Invite pending
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="px-4 py-3 text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                          "shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent",
                        )}
                        aria-label={`Open menu for ${invitation.email}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-2xl border-border bg-popover p-1 shadow-xl w-48"
                      >
                        <DropdownMenuItem
                          className="rounded-xl"
                          onClick={() => onViewInvitationDetails?.(invitation)}
                        >
                          <Eye className="size-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-xl"
                          onClick={() => onCopyInviteLink?.(invitation)}
                        >
                          <Copy className="size-4" />
                          Copy invite link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          className="rounded-xl"
                          onClick={() => onRevokeInvitation?.(invitation)}
                        >
                          <UserX className="size-4" />
                          Revoke invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users.map((user) => {
                const banned = Boolean(user.banned);
                const self = isSelf(user);

                const isSelected = selectedIds.has(user.id);

                return (
                  <TableRow
                    key={user.id}
                    data-state={isSelected ? "selected" : undefined}
                    tabIndex={0}
                    className="cursor-pointer border-border hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                    onClick={() => onViewDetails(user)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onViewDetails(user);
                      }
                    }}
                  >
                    <TableCell
                      className="px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={self}
                        onChange={(event) => {
                          event.stopPropagation();
                          toggleRow(user.id, event.target.checked);
                        }}
                        aria-label={`Select ${user.name}`}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-card-foreground">
                      {user.name}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate px-4 py-3 text-muted-foreground sm:max-w-none">
                      {user.email}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 sm:table-cell">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-border bg-muted/40 text-[11px] font-semibold",
                          user.role === "ADMIN" &&
                            "border-primary/30 bg-primary/10 text-primary",
                        )}
                      >
                        {user.role ?? "INSTRUCTOR"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {banned ? (
                        <Badge
                          variant="destructive"
                          className="rounded-full text-[11px]"
                        >
                          Inactive
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/40 text-[11px]"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon-sm" }),
                            "shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent",
                          )}
                          aria-label={`Open menu for ${user.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-2xl border-border bg-popover p-1 shadow-xl"
                        >
                          <DropdownMenuItem
                            className="rounded-xl"
                            onClick={() => onViewDetails(user)}
                          >
                            <Eye className="size-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="rounded-xl"
                            disabled={self || user.role === "ADMIN"}
                            onClick={() => onMakeAdmin(user)}
                          >
                            <Shield className="size-4" />
                            Make admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl"
                            disabled={self || user.role !== "ADMIN"}
                            onClick={() => onMakeInstructor(user)}
                          >
                            <UserRound className="size-4" />
                            Make instructor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!banned ? (
                            <DropdownMenuItem
                              variant="destructive"
                              className="rounded-xl"
                              disabled={self}
                              onClick={() => onDeactivate(user)}
                            >
                              <UserX className="size-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="rounded-xl"
                              disabled={self}
                              onClick={() => onActivate(user)}
                            >
                              <UserRound className="size-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <ExerciseLibraryPagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              loading={loading}
              ariaLabel="User list pagination"
            />
          </div>
        </>
      )}
    </div>

    <Dialog
      open={deactivateTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDeactivateTarget(null);
      }}
    >
      <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
            Deactivate user
            {Array.isArray(deactivateTarget) &&
            deactivateTarget.filter((u) => !u.banned).length !== 1
              ? "s"
              : ""}
            ?
          </DialogTitle>
          <DialogDescription className="leading-6 text-muted-foreground">
            {deactivateDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeactivateTarget(null)}
            className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deactivating}
            onClick={() => void handleDeactivateConfirm()}
            className="rounded-full"
          >
            {deactivating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Deactivate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function AdminUserFilteredEmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
        No users match
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Try another search term or clear filters to see everyone in the directory.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-4 rounded-full px-4"
        onClick={onClearFilters}
      >
        Clear filters
      </Button>
    </div>
  );
}

function AdminUserEmptyState({ onInvite }: { onInvite?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <UserPlus className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
        No users yet
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Send the first invitation so someone can register and appear here.
      </p>
      {onInvite ? (
        <Button
          type="button"
          size="sm"
          className="mt-4 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          onClick={onInvite}
        >
          <UserPlus className="mr-2 size-4" />
          Invite user
        </Button>
      ) : null}
    </div>
  );
}
