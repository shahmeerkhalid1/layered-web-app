"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { adminApi } from "@/services/admin-api";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  UserPlus,
  Copy,
  Loader2,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

const PAGE_SIZE = 10;

type Role = "ADMIN" | "INSTRUCTOR";

type AdminListUser = {
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("INSTRUCTOR");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteLinkResult, setInviteLinkResult] = useState<string | null>(null);

  const [detailsUser, setDetailsUser] = useState<AdminListUser | null>(null);

  const [confirmBan, setConfirmBan] = useState<AdminListUser | null>(null);
  const [confirmUnban, setConfirmUnban] = useState<AdminListUser | null>(null);
  const [confirmRole, setConfirmRole] = useState<{
    user: AdminListUser;
    nextRole: Role;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const res = await authClient.admin.listUsers({
        query: {
          limit: PAGE_SIZE,
          offset,
          ...(searchApplied.trim()
            ? {
                searchValue: searchApplied.trim(),
                searchField: "email" as const,
                searchOperator: "contains" as const,
              }
            : {}),
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
      const err = (res as { error?: { message?: string } }).error;
      if (err?.message) {
        throw new Error(err.message);
      }
      const { users: list, total: t } = parseListUsersResult(res);
      setUsers(list);
      setTotal(t);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, searchApplied]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadUsers();
    });
  }, [loadUsers]);

  const applySearch = () => {
    setPage(1);
    setSearchApplied(searchInput);
  };

  const openInvite = () => {
    setInviteEmail("");
    setInviteRole("INSTRUCTOR");
    setInviteLinkResult(null);
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    setInviteSubmitting(true);
    setInviteLinkResult(null);
    try {
      const data = await adminApi.invite({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteLinkResult(data.inviteLink);
      toast.success("Invitation created");
      if (data.emailSent === false && data.emailError) {
        toast.message("Email was not sent", {
          description: data.emailError,
        });
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Invite failed");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
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
      await loadUsers();
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
      await loadUsers();
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
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Role update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isSelf = (u: AdminListUser) => u.id === selfId;
  const activeVisibleCount = users.filter((u) => !u.banned).length;

  return (
    <div className="relative space-y-6 overflow-hidden rounded-[2rem] bg-background p-1">
      <div className="pointer-events-none absolute top-24 right-10 h-52 w-52 rounded-full bg-secondary/70 blur-3xl" />

      <div className="relative rounded-3xl border border-border bg-card/90 p-5 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Instructor Directory
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-3xl">
              User management
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Invite instructors, update roles, and keep access aligned with your
              studio operations.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={openInvite}
            className="rounded-full bg-primary px-5 text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <UserPlus className="size-4" />
            Invite user
          </Button>
        </div>
      </div>

      <div className="relative grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-lg">
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="user-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
                placeholder="contains..."
                className="h-11 rounded-2xl border-input bg-background/70 pr-4 pl-11 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={applySearch}
              className="rounded-full border-border bg-transparent px-5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Search
            </Button>
          </div>
        </div>

        <div className="flex min-w-36 items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-lg">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground">
              {total}
            </p>
            <p className="text-xs text-muted-foreground">Total users</p>
          </div>
        </div>

        <div className="flex min-w-36 items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-lg">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground">
              {activeVisibleCount}
            </p>
            <p className="text-xs text-muted-foreground">Active here</p>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3 rounded-full border border-border bg-background/75 px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              Loading instructors
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-accent">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Name
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Email
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
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
              {users.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="py-14 text-center text-sm text-muted-foreground"
                  >
                    No users match this search.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const banned = Boolean(u.banned);
                  const self = isSelf(u);
                  return (
                    <TableRow
                      key={u.id}
                      className="border-border hover:bg-accent/70"
                    >
                      <TableCell className="px-4 py-3 font-semibold text-card-foreground">
                        {u.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-border bg-accent text-[11px] font-semibold text-accent-foreground",
                            u.role === "ADMIN" &&
                              "border-primary bg-primary text-primary-foreground"
                          )}
                        >
                          {u.role ?? "INSTRUCTOR"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {banned ? (
                          <Badge variant="destructive" className="rounded-full">
                            Inactive
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full border-border bg-secondary text-secondary-foreground"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon-sm" }),
                              "shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent"
                            )}
                            aria-label="Open row menu"
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-2xl border-border bg-popover p-1 shadow-xl"
                          >
                            <DropdownMenuItem
                              className="rounded-xl"
                              onClick={() => setDetailsUser(u)}
                            >
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="rounded-xl"
                              disabled={self || u.role === "ADMIN"}
                              onClick={() =>
                                setConfirmRole({ user: u, nextRole: "ADMIN" })
                              }
                            >
                              Make admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl"
                              disabled={self || u.role !== "ADMIN"}
                              onClick={() =>
                                setConfirmRole({ user: u, nextRole: "INSTRUCTOR" })
                              }
                            >
                              Make instructor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!banned ? (
                              <DropdownMenuItem
                                variant="destructive"
                                className="rounded-xl"
                                disabled={self}
                                onClick={() => setConfirmBan(u)}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="rounded-xl"
                                disabled={self}
                                onClick={() => setConfirmUnban(u)}
                              >
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="relative flex flex-col gap-3 rounded-3xl border border-border bg-card p-3 text-sm text-muted-foreground shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <span className="px-2">
          Page {page} of {totalPages} ({total} users)
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
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
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label
                htmlFor="invite-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoComplete="off"
                className="h-11 rounded-2xl border-input bg-background/70 shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="invite-role"
                className="text-sm font-medium text-foreground"
              >
                Role
              </Label>
              <select
                id="invite-role"
                className="h-11 rounded-2xl border border-input bg-background/70 px-3 text-sm text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {inviteLinkResult && (
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
            )}
          </div>
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
              type="button"
              disabled={inviteSubmitting || !inviteEmail.trim()}
              onClick={() => void submitInvite()}
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

      <Sheet open={!!detailsUser} onOpenChange={(o) => !o && setDetailsUser(null)}>
        <SheetContent
          side="right"
          className="border-border bg-background sm:max-w-md"
        >
          <SheetHeader>
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
            <dl className="grid gap-3 px-4 text-sm">
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
