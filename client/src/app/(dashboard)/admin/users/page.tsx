"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { adminApi } from "@/lib/admin-api";
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
import { MoreHorizontal, UserPlus, Copy, Loader2 } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User management</h2>
          <p className="text-muted-foreground">
            Invite instructors, update roles, and activate or deactivate accounts.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openInvite}>
          <UserPlus className="size-4" />
          Invite user
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex max-w-md flex-1 flex-col gap-1.5">
          <Label htmlFor="user-search">Search by email</Label>
          <div className="flex gap-2">
            <Input
              id="user-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="contains…"
            />
            <Button type="button" variant="secondary" onClick={applySearch}>
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No users match this search.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const banned = Boolean(u.banned);
                  const self = isSelf(u);
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role ?? "INSTRUCTOR"}</Badge>
                      </TableCell>
                      <TableCell>
                        {banned ? (
                          <Badge variant="destructive">Inactive</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon-sm" }),
                              "shrink-0"
                            )}
                            aria-label="Open row menu"
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailsUser(u)}>
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={self || u.role === "ADMIN"}
                              onClick={() =>
                                setConfirmRole({ user: u, nextRole: "ADMIN" })
                              }
                            >
                              Make admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
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
                                disabled={self}
                                onClick={() => setConfirmBan(u)}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
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

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages} ({total} users)
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Creates an invitation link. The user registers with the same email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {inviteLinkResult && (
              <div className="rounded-md border bg-muted/50 p-3 text-xs break-all">
                <p className="mb-2 font-medium text-foreground">Invite link</p>
                <p className="text-muted-foreground">{inviteLinkResult}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
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
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={inviteSubmitting || !inviteEmail.trim()}
              onClick={() => void submitInvite()}
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
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>User details</SheetTitle>
            <SheetDescription>Information from the directory.</SheetDescription>
          </SheetHeader>
          {detailsUser && (
            <dl className="grid gap-3 px-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{detailsUser.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{detailsUser.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd>{detailsUser.role ?? "INSTRUCTOR"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{detailsUser.banned ? "Inactive (banned)" : "Active"}</dd>
              </div>
              {detailsUser.banReason ? (
                <div>
                  <dt className="text-muted-foreground">Ban reason</dt>
                  <dd>{detailsUser.banReason}</dd>
                </div>
              ) : null}
              {detailsUser.createdAt ? (
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(detailsUser.createdAt).toLocaleString()}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-foreground">Email verified</dt>
                <dd>{detailsUser.emailVerified ? "Yes" : "No"}</dd>
              </div>
            </dl>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmBan} onOpenChange={(o) => !o && setConfirmBan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate user?</DialogTitle>
            <DialogDescription>
              {confirmBan?.email} will not be able to sign in until reactivated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmBan(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionLoading}
              onClick={() => void runBan()}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmUnban} onOpenChange={(o) => !o && setConfirmUnban(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate user?</DialogTitle>
            <DialogDescription>
              {confirmUnban?.email} will be able to sign in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmUnban(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionLoading}
              onClick={() => void runUnban()}
            >
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRole} onOpenChange={(o) => !o && setConfirmRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role?</DialogTitle>
            <DialogDescription>
              Set {confirmRole?.user.email} to{" "}
              <strong>{confirmRole?.nextRole}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmRole(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionLoading}
              onClick={() => void runSetRole()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
