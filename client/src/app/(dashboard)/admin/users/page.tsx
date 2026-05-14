"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { adminApi } from "@/services/admin-api";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  SearchX,
  X,
} from "lucide-react";
import { ExerciseLibraryPagination } from "@/components/exercises/exercise-library-pagination";
import {
  adminInviteFormSchema,
  type AdminInviteFormValues,
} from "@/lib/validation/auth-schemas";

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

  const [confirmBan, setConfirmBan] = useState<AdminListUser | null>(null);
  const [confirmUnban, setConfirmUnban] = useState<AdminListUser | null>(null);
  const [confirmRole, setConfirmRole] = useState<{
    user: AdminListUser;
    nextRole: Role;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const prevDebouncedRef = useRef(debouncedSearch);
  const lastFetchKeyRef = useRef("");

  const loadUsers = useCallback(
    async (pageForQuery: number) => {
      setLoading(true);
      try {
        const offset = (pageForQuery - 1) * PAGE_SIZE;
        const q = debouncedSearch.trim();
        const res = await authClient.admin.listUsers({
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
      void loadUsers(pageForQuery);
    });
  }, [page, debouncedSearch, loadUsers]);

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
      await loadUsers(page);
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
      await loadUsers(page);
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
      await loadUsers(page);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Role update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isSelf = (u: AdminListUser) => u.id === selfId;
  const searchTrim = debouncedSearch.trim();
  const hasActiveFilters = searchTrim.length > 0;
  const showFilteredEmpty =
    !loading && users.length === 0 && hasActiveFilters;
  const showDirectoryEmpty =
    !loading && users.length === 0 && !hasActiveFilters;

  return (
    <div className="space-y-6 rounded-[2rem] bg-background px-2 pb-6 pt-2 sm:px-4">
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-card-foreground sm:text-3xl">
              User management
            </h2>
            <p
              className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground"
              aria-live="polite"
            >
              {loading && <span>Loading directory…</span>}
              {!loading && (
                <>
                  <span className="font-medium text-foreground">
                    {hasActiveFilters
                      ? `Showing ${users.length} on this page · ${total} match${total === 1 ? "" : "es"}`
                      : `${total} user${total === 1 ? "" : "s"}`}
                  </span>
                </>
              )}
            </p>
            
          </div>
          <Button
            type="button"
            size="sm"
            onClick={openInvite}
            className="h-10 shrink-0 rounded-full bg-primary px-5 text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <UserPlus className="mr-2 size-4" />
            Invite user
          </Button>
        </div>

        <div className="flex flex-wrap items-start gap-3 border-t border-border pt-5">
          <div className="min-w-0 flex-1 basis-52 space-y-2 sm:basis-72">
            <Label htmlFor="user-search" className="text-muted-foreground">
              Search
            </Label>
            <div className="relative rounded-2xl border border-border bg-card shadow-none">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="user-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by email…"
                autoComplete="off"
                className="h-12 rounded-2xl border-0 bg-transparent pr-11 pl-11 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-ring/35"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3 rounded-full border border-border bg-background/75 px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              Loading instructors
            </div>
          </div>
        ) : showFilteredEmpty ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
              No users match
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Try another email fragment or clear your search to see everyone in the directory again.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4 rounded-full px-4"
              onClick={() => setSearchInput("")}
            >
              Clear search
            </Button>
          </div>
        ) : showDirectoryEmpty ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <UserPlus className="size-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
              No instructors yet
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Send the first invitation so someone can register and appear here.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              onClick={openInvite}
            >
              <UserPlus className="mr-2 size-4" />
              Invite user
            </Button>
          </div>
        ) : (
          <>
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
                {users.map((u) => {
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
                              "border-primary bg-primary text-primary-foreground",
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
                              "shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent",
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
                                setConfirmRole({
                                  user: u,
                                  nextRole: "INSTRUCTOR",
                                })
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
                })}
              </TableBody>
            </Table>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <ExerciseLibraryPagination
                page={page}
                totalPages={totalPages}
                loading={loading}
                onPageChange={setPage}
                ariaLabel="User list pagination"
              />
            </div>
          </>
        )}
      </div>

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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
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
