"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  adminApi,
  buildInviteLink,
  type InvitationRow,
} from "@/services/admin-api";
import { cn, copyTextToClipboard } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AdminUserList,
  type AdminListUser,
} from "@/components/admin/admin-user-list";
import { AdminUserLibraryHeader } from "@/components/admin/admin-user-library-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  adminInviteFormSchema,
  type AdminInviteFormValues,
} from "@/lib/validation/auth-schemas";

const PAGE_SIZE = 10;

type Role = "ADMIN" | "INSTRUCTOR";

function parseListUsersResult(res: unknown): {
  users: AdminListUser[];
  total: number;
} {
  const r = res as Record<string, unknown>;
  const payload =
    r.data !== undefined && typeof r.data === "object" && r.data !== null
      ? (r.data as Record<string, unknown>)
      : r;
  const users = Array.isArray(payload.users)
    ? (payload.users as AdminListUser[])
    : [];
  const total =
    typeof payload.total === "number" ? payload.total : users.length;
  return { users, total };
}

export default function AdminUsersPage() {
  const { instructor } = useAuth();
  const selfId = instructor?.id;

  const [users, setUsers] = useState<AdminListUser[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteLinkResult, setInviteLinkResult] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminInviteFormValues>({
    resolver: zodResolver(adminInviteFormSchema),
    defaultValues: { email: "", role: "INSTRUCTOR" },
  });

  const [detailsUser, setDetailsUser] = useState<AdminListUser | null>(null);
  const [detailsInvitation, setDetailsInvitation] =
    useState<InvitationRow | null>(null);
  const [confirmRevokeInvitation, setConfirmRevokeInvitation] =
    useState<InvitationRow | null>(null);

  const [confirmBan, setConfirmBan] = useState<AdminListUser | null>(null);
  const [confirmUnban, setConfirmUnban] = useState<AdminListUser | null>(null);
  const [confirmRole, setConfirmRole] = useState<{
    user: AdminListUser;
    nextRole: Role;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const prevDebouncedRef = useRef(debouncedSearch);
  const lastFetchKeyRef = useRef("");
  const invitationSheetScrollRef = useRef<HTMLDivElement>(null);
  const userSheetScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!detailsInvitation) return;

    const resetScroll = () => {
      const el = invitationSheetScrollRef.current;
      if (!el) return;
      el.scrollTop = 0;
      el.focus({ preventScroll: true });
    };

    resetScroll();
    const raf = requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 0);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [detailsInvitation?.id]);

  useEffect(() => {
    if (!detailsUser) return;

    const resetScroll = () => {
      const el = userSheetScrollRef.current;
      if (!el) return;
      el.scrollTop = 0;
      el.focus({ preventScroll: true });
    };

    resetScroll();
    const raf = requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 0);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [detailsUser?.id]);

  const loadDirectory = useCallback(
    async (pageForQuery: number) => {
      setLoading(true);
      try {
        const offset = (pageForQuery - 1) * PAGE_SIZE;
        const q = debouncedSearch.trim();
        const [usersRes, invRes] = await Promise.all([
          authClient.admin.listUsers({
            query: {
              limit: PAGE_SIZE,
              offset,
              ...(q
                ? {
                    searchValue: q,
                    searchField: "email" as const,
                    searchOperator: "contains" as const,
                  }
                : {}),
              sortBy: "createdAt",
              sortDirection: "desc",
            },
          }),
          adminApi.getInvitations(),
        ]);
        const err = (usersRes as { error?: { message?: string } }).error;
        if (err?.message) {
          throw new Error(err.message);
        }
        const { users: list, total: t } = parseListUsersResult(usersRes);
        setUsers(list);
        setTotal(t);
        setInvitations(invRes.invitations);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load users");
        setUsers([]);
        setInvitations([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    const searchBump = prevDebouncedRef.current !== debouncedSearch;
    prevDebouncedRef.current = debouncedSearch;

    const pageForQuery = searchBump ? 1 : page;
    const fetchKey = `${debouncedSearch}:${pageForQuery}`;
    if (lastFetchKeyRef.current === fetchKey) {
      return;
    }
    lastFetchKeyRef.current = fetchKey;

    queueMicrotask(() => {
      if (searchBump && page !== 1) {
        setPage(1);
      }
      void loadDirectory(pageForQuery);
    });
  }, [page, debouncedSearch, loadDirectory]);

  const openInvite = () => {
    reset({ email: "", role: "INSTRUCTOR" });
    setInviteLinkResult(null);
    setInviteOpen(true);
  };

  const onInviteSubmit = async (values: AdminInviteFormValues) => {
    setInviteSubmitting(true);
    setInviteLinkResult(null);
    try {
      const data = await adminApi.invite({
        email: values.email.trim(),
        role: values.role,
      });
      setInviteLinkResult(data.inviteLink);
      toast.success("Invitation created");
      if (data.emailSent === false && data.emailError) {
        toast.message("Email was not sent", {
          description: data.emailError,
        });
      }
      await loadDirectory(page);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Invite failed");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const copyLink = async (link: string) => {
    try {
      await copyTextToClipboard(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const runBan = async () => {
    if (!confirmBan) return;
    setActionLoading(true);
    try {
      const res = await authClient.admin.banUser({
        userId: confirmBan.id,
        banReason: "Deactivated by administrator",
      });
      const err = (res as { error?: { message?: string } }).error;
      if (err?.message) throw new Error(err.message);
      toast.success("User deactivated");
      setConfirmBan(null);
      await loadDirectory(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ban failed");
    } finally {
      setActionLoading(false);
    }
  };

  const runUnban = async () => {
    if (!confirmUnban) return;
    setActionLoading(true);
    try {
      const res = await authClient.admin.unbanUser({ userId: confirmUnban.id });
      const err = (res as { error?: { message?: string } }).error;
      if (err?.message) throw new Error(err.message);
      toast.success("User activated");
      setConfirmUnban(null);
      await loadDirectory(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unban failed");
    } finally {
      setActionLoading(false);
    }
  };

  const runSetRole = async () => {
    if (!confirmRole) return;
    setActionLoading(true);
    try {
      const setRole = authClient.admin.setRole as (args: {
        userId: string;
        role: string;
      }) => Promise<unknown>;
      const res = await setRole({
        userId: confirmRole.user.id,
        role: confirmRole.nextRole,
      });
      const err = (res as { error?: { message?: string } }).error;
      if (err?.message) throw new Error(err.message);
      toast.success("Role updated");
      setConfirmRole(null);
      await loadDirectory(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Role update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const searchTrim = debouncedSearch.trim();
  const pendingInvitations = useMemo(() => {
    const now = Date.now();
    return invitations.filter((invitation) => {
      if (invitation.status !== "PENDING") return false;
      if (new Date(invitation.expiresAt).getTime() <= now) return false;
      if (!searchTrim) return true;
      return invitation.email
        .toLowerCase()
        .includes(searchTrim.toLowerCase());
    });
  }, [invitations, searchTrim]);

  const directoryTotal = total + pendingInvitations.length;
  const visibleCount = users.length + pendingInvitations.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = searchTrim.length > 0;
  const showFilteredEmpty =
    !loading &&
    users.length === 0 &&
    pendingInvitations.length === 0 &&
    hasActiveFilters &&
    directoryTotal === 0;

  const copyInvitationLink = async (invitation: InvitationRow) => {
    try {
      await copyTextToClipboard(buildInviteLink(invitation.token));
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const runRevokeInvitation = async () => {
    if (!confirmRevokeInvitation) return;
    setActionLoading(true);
    try {
      await adminApi.revokeInvitation(confirmRevokeInvitation.id);
      toast.success("Invitation revoked");
      setConfirmRevokeInvitation(null);
      if (detailsInvitation?.id === confirmRevokeInvitation.id) {
        setDetailsInvitation(null);
      }
      await loadDirectory(page);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to revoke invitation");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-2 pb-6 sm:px-4">
      <AdminUserLibraryHeader
        totalUsers={loading ? undefined : directoryTotal}
        visibleUserCount={visibleCount}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        search={searchInput}
        onSearchChange={setSearchInput}
        onInvite={openInvite}
      />

      <AdminUserList
        users={users}
        pendingInvitations={pendingInvitations}
        loading={loading}
        showFilteredEmpty={showFilteredEmpty}
        onClearFilters={() => setSearchInput("")}
        onInvite={openInvite}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRefresh={() => loadDirectory(page)}
        selfId={selfId}
        onViewDetails={setDetailsUser}
        onViewInvitationDetails={setDetailsInvitation}
        onCopyInviteLink={(invitation) => void copyInvitationLink(invitation)}
        onRevokeInvitation={setConfirmRevokeInvitation}
        onMakeAdmin={(user) => setConfirmRole({ user, nextRole: "ADMIN" })}
        onMakeInstructor={(user) =>
          setConfirmRole({ user, nextRole: "INSTRUCTOR" })
        }
        onDeactivate={setConfirmBan}
        onActivate={setConfirmUnban}
      />

      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) {
            reset({ email: "", role: "INSTRUCTOR" });
            setInviteLinkResult(null);
          }
        }}
      >
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
          <DialogHeader>
            <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              New Instructor
            </p>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
              Invite user
            </DialogTitle>
            <DialogDescription className="leading-6 text-muted-foreground">
              Creates an invitation link. The user registers with the same email.
            </DialogDescription>
          </DialogHeader>
          <form
            id="admin-invite-form"
            className="grid gap-4 py-3"
            onSubmit={handleSubmit(onInviteSubmit)}
          >
            <div className="space-y-2">
              <Label
                htmlFor="invite-email"
                className="pl-1.5 text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                autoComplete="off"
                aria-invalid={errors.email ? true : undefined}
                className={cn(
                  "h-11 rounded-2xl border-input bg-background/70 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35",
                  errors.email && "border-destructive",
                )}
                {...register("email")}
              />
              {errors.email ? (
                <p className="pl-1.5 text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="invite-role"
                className="pl-1.5 text-sm font-medium text-foreground"
              >
                Role
              </Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="invite-role"
                      aria-invalid={errors.role ? true : undefined}
                      className={cn(
                        "box-border h-12 min-h-12 w-full min-w-0 shrink-0 justify-between rounded-2xl border-input bg-background/80 px-4 py-0 leading-snug shadow-none focus-visible:ring-ring/35 data-placeholder:text-muted-foreground",
                        errors.role && "border-destructive",
                      )}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      sideOffset={6}
                      className="max-h-72 min-w-(--anchor-width) rounded-2xl border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
                    >
                      <SelectItem
                        value="INSTRUCTOR"
                        className="rounded-xl py-2.5 pl-3"
                      >
                        Instructor
                      </SelectItem>
                      <SelectItem value="ADMIN" className="rounded-xl py-2.5 pl-3">
                        Admin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role ? (
                <p className="pl-1.5 text-sm text-destructive">{errors.role.message}</p>
              ) : null}
            </div>
            {inviteLinkResult ? (
              <div className="rounded-2xl border border-border bg-accent p-3 text-xs break-all">
                <p className="mb-2 font-semibold text-accent-foreground">
                  Invite link
                </p>
                <p className="text-muted-foreground">{inviteLinkResult}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-full border-border bg-transparent text-muted-foreground hover:bg-background hover:text-foreground"
                  onClick={() => void copyLink(inviteLinkResult)}
                >
                  <Copy className="size-3.5" />
                  Copy link
                </Button>
              </div>
            ) : null}
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteOpen(false)}
              className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Close
            </Button>
            <Button
              type="submit"
              form="admin-invite-form"
              disabled={inviteSubmitting}
              className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              {inviteSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={!!detailsInvitation}
        onOpenChange={(o) => !o && setDetailsInvitation(null)}
      >
        <SheetContent
          side="right"
          className="border-border bg-background sm:max-w-md gap-0 overflow-hidden py-4"
        >
          <SheetHeader className="shrink-0">
            <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Pending Invitation
            </p>
            <SheetTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Invite details
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Awaiting registration via invite link.
            </SheetDescription>
          </SheetHeader>
          {detailsInvitation && (
            <div
              ref={invitationSheetScrollRef}
              tabIndex={-1}
              className="min-h-0 flex-1 overflow-y-auto outline-none"
            >
            <dl className="grid gap-3 px-4 pb-4 text-sm">
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Email
                </dt>
                <dd className="mt-1 font-semibold text-card-foreground">
                  {detailsInvitation.email}
                </dd>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Role
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {detailsInvitation.role}
                </dd>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Status
                </dt>
                <dd className="mt-1 text-muted-foreground">Pending</dd>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Expires
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {new Date(detailsInvitation.expiresAt).toLocaleString()}
                </dd>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Invited
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {new Date(detailsInvitation.createdAt).toLocaleString()}
                </dd>
              </div>
              {detailsInvitation.invitedBy ? (
                <div className="rounded-2xl border border-border bg-card/60 p-3">
                  <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Invited by
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {detailsInvitation.invitedBy.name} (
                    {detailsInvitation.invitedBy.email})
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => void copyInvitationLink(detailsInvitation)}
                >
                  <Copy className="mr-2 size-3.5" />
                  Copy invite link
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setConfirmRevokeInvitation(detailsInvitation)}
                >
                  Revoke
                </Button>
              </div>
            </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailsUser} onOpenChange={(o) => !o && setDetailsUser(null)}>
        <SheetContent
          side="right"
          className="border-border bg-background sm:max-w-md gap-0 overflow-hidden py-4"
        >
          <SheetHeader className="shrink-0">
            <p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Directory Record
            </p>
            <SheetTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              User details
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Information from the instructor directory.
            </SheetDescription>
          </SheetHeader>
          {detailsUser && (
            <div
              ref={userSheetScrollRef}
              tabIndex={-1}
              className="min-h-0 flex-1 overflow-y-auto outline-none"
            >
            <dl className="grid gap-3 px-4 pb-4 text-sm">
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Name
                </dt>
                <dd className="mt-1 font-semibold text-card-foreground">
                  {detailsUser.name}
                </dd>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Email
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {detailsUser.email}
                </dd>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Role
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {detailsUser.role ?? "INSTRUCTOR"}
                </dd>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Status
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {detailsUser.banned ? "Inactive (banned)" : "Active"}
                </dd>
              </div>
              {detailsUser.banReason ? (
                <div className="rounded-2xl border border-border bg-card/60 p-3">
                  <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Ban reason
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {detailsUser.banReason}
                  </dd>
                </div>
              ) : null}
              {detailsUser.createdAt ? (
                <div className="rounded-2xl border border-border bg-card/60 p-3">
                  <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Created
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {new Date(detailsUser.createdAt).toLocaleString()}
                  </dd>
                </div>
              ) : null}
              <div className="rounded-2xl border border-border bg-card/60 p-3">
                <dt className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Email verified
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {detailsUser.emailVerified ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmBan} onOpenChange={(o) => !o && setConfirmBan(null)}>
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
              Deactivate user?
            </DialogTitle>
            <DialogDescription className="leading-6 text-muted-foreground">
              {confirmBan?.email} will not be able to sign in until reactivated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmBan(null)}
              className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionLoading}
              onClick={() => void runBan()}
              className="rounded-full"
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmUnban} onOpenChange={(o) => !o && setConfirmUnban(null)}>
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
              Activate user?
            </DialogTitle>
            <DialogDescription className="leading-6 text-muted-foreground">
              {confirmUnban?.email} will be able to sign in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmUnban(null)}
              className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionLoading}
              onClick={() => void runUnban()}
              className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmRevokeInvitation}
        onOpenChange={(o) => !o && setConfirmRevokeInvitation(null)}
      >
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
              Revoke invitation?
            </DialogTitle>
            <DialogDescription className="leading-6 text-muted-foreground">
              {confirmRevokeInvitation?.email} will no longer be able to register
              with the current invite link. You can send a new invitation later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRevokeInvitation(null)}
              className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionLoading}
              onClick={() => void runRevokeInvitation()}
              className="rounded-full"
            >
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRole} onOpenChange={(o) => !o && setConfirmRole(null)}>
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
              Change role?
            </DialogTitle>
            <DialogDescription className="leading-6 text-muted-foreground">
              Set {confirmRole?.user.email} to{" "}
              <strong>{confirmRole?.nextRole}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRole(null)}
              className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionLoading}
              onClick={() => void runSetRole()}
              className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
