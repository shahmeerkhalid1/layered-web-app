"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { clientApi } from "@/services/client-api";
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

interface ClientListProps {
  clients: Client[];
  loading: boolean;
  showFilteredEmpty?: boolean;
  onClearFilters?: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => Promise<void>;
}

function clientDisplayName(client: Client) {
  return `${client.firstName} ${client.lastName}`.trim();
}

export function ClientList({
  clients,
  loading,
  showFilteredEmpty,
  onClearFilters,
  page,
  totalPages,
  onPageChange,
  onRefresh,
}: ClientListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [archiveTarget, setArchiveTarget] = useState<Client | Client[] | null>(
    null
  );
  const [archiving, setArchiving] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const clientIdsOnPage = useMemo(
    () => clients.map((client) => client.id),
    [clients]
  );

  const allOnPageSelected =
    clientIdsOnPage.length > 0 &&
    clientIdsOnPage.every((id) => selectedIds.has(id));
  const someOnPageSelected =
    clientIdsOnPage.some((id) => selectedIds.has(id)) && !allOnPageSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPageSelected;
    }
  }, [someOnPageSelected]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (clientIdsOnPage.includes(id)) {
          next.add(id);
        }
      }
      return next;
    });
  }, [clientIdsOnPage]);

  const toggleAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const id of clientIdsOnPage) {
          next.delete(id);
        }
      } else {
        for (const id of clientIdsOnPage) {
          next.add(id);
        }
      }
      return next;
    });
  }, [allOnPageSelected, clientIdsOnPage]);

  const toggleRow = useCallback((clientId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(clientId);
      } else {
        next.delete(clientId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  async function handleArchiveConfirm() {
    if (!archiveTarget) return;

    const targets = Array.isArray(archiveTarget)
      ? archiveTarget
      : [archiveTarget];

    setArchiving(true);
    try {
      const result = await clientApi.deleteClients(targets.map((client) => client.id));
      toast.success(result.message);
      setArchiveTarget(null);
      clearSelection();
      if (onRefresh) {
        await onRefresh();
      }
    } catch {
      toast.error("Failed to archive client");
    } finally {
      setArchiving(false);
    }
  }

  const selectedClients = clients.filter((client) => selectedIds.has(client.id));
  const archiveDescription = Array.isArray(archiveTarget)
    ? `${archiveTarget.length} client${archiveTarget.length === 1 ? "" : "s"} will be removed from your roster. Enrollments and attendance history remain linked in the database.`
    : archiveTarget
      ? `${clientDisplayName(archiveTarget)} will be removed from your roster. Enrollments and attendance history remain linked.`
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
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={() => setArchiveTarget(selectedClients)}
              >
                <Trash2 className="mr-2 size-4" />
                Archive selected
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3 rounded-full border border-border bg-background/75 px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              Loading clients
            </div>
          </div>
        ) : showFilteredEmpty && onClearFilters ? (
          <ClientFilteredEmptyState onClearFilters={onClearFilters} />
        ) : clients.length === 0 ? (
          <ClientEmptyState />
        ) : (
          <>
            <Table>
              <TableHeader className="bg-accent">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-12 px-4 py-3">
                    <Checkbox
                      ref={selectAllRef}
                      checked={allOnPageSelected}
                      onChange={(event) => {
                        event.stopPropagation();
                        toggleAllOnPage();
                      }}
                      aria-label="Select all clients on this page"
                    />
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Name
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Email
                  </TableHead>
                  <TableHead className="hidden px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase sm:table-cell">
                    Phone
                  </TableHead>
                  <TableHead className="hidden px-4 py-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase md:table-cell">
                    Enrolled
                  </TableHead>
                  <TableHead className="w-12 px-4 py-3 text-right text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const enrollmentCount = client._count?.enrollments ?? 0;
                  const isSelected = selectedIds.has(client.id);

                  return (
                    <TableRow
                      key={client.id}
                      data-state={isSelected ? "selected" : undefined}
                      tabIndex={0}
                      className="cursor-pointer border-border hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                      onClick={() => router.push(`/clients/${client.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/clients/${client.id}`);
                        }
                      }}
                    >
                      <TableCell
                        className="px-4 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={(event) => {
                            event.stopPropagation();
                            toggleRow(client.id, event.target.checked);
                          }}
                          aria-label={`Select ${clientDisplayName(client)}`}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold text-card-foreground">
                        {clientDisplayName(client)}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate px-4 py-3 text-muted-foreground sm:max-w-none">
                        {client.email}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                        {client.phone ?? "—"}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3 md:table-cell">
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/40 text-[11px]"
                        >
                          {enrollmentCount} class
                          {enrollmentCount === 1 ? "" : "es"}
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
                              "shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground data-popup-open:bg-accent"
                            )}
                            aria-label={`Open menu for ${clientDisplayName(client)}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-2xl border-border bg-popover p-1 shadow-xl"
                          >
                            <DropdownMenuItem
                              className="rounded-xl"
                              onClick={() => router.push(`/clients/${client.id}`)}
                            >
                              <Eye className="size-4" />
                              View profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl"
                              onClick={() => router.push(`/clients/${client.id}/edit`)}
                            >
                              <Pencil className="size-4" />
                              Edit client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="rounded-xl"
                              onClick={() => setArchiveTarget(client)}
                            >
                              <Trash2 className="size-4" />
                              Archive
                            </DropdownMenuItem>
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
                ariaLabel="Client list pagination"
              />
            </div>
          </>
        )}
      </div>

      <Dialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <DialogContent className="rounded-3xl border-border bg-popover p-6 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-popover-foreground">
              Archive client{Array.isArray(archiveTarget) && archiveTarget.length !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription className="leading-6 text-muted-foreground">
              {archiveDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveTarget(null)}
              className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={archiving}
              onClick={() => void handleArchiveConfirm()}
              className="rounded-full"
            >
              {archiving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Archive"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClientFilteredEmptyState({
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
        No clients match
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Try another search term or clear filters to see your full roster.
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

function ClientEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Users className="size-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-card-foreground">
        No clients yet
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Add your first client to start tracking enrollments and attendance.
      </p>
      <Link href="/clients/new" className="mt-4">
        <Button
          size="sm"
          className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 size-4" />
          New client
        </Button>
      </Link>
    </div>
  );
}
