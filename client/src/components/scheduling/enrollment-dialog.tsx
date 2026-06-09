"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { clientApi } from "@/services/client-api";
import type { Client, EnrollmentRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";

export type EnrollmentDialogMode = "private" | "group";

interface EnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  /** Private = one client per class (1:1). Group = multi-select roster. */
  mode?: EnrollmentDialogMode;
  onUpdated?: () => void;
}

function clientDisplayName(client: Pick<Client, "firstName" | "lastName">) {
  return `${client.firstName} ${client.lastName}`.trim();
}

function enrollSuccessMessage(created: number, skipped: number) {
  if (created === 1 && skipped === 0) {
    return "Client enrolled";
  }
  if (skipped > 0) {
    return `${created} client${created === 1 ? "" : "s"} enrolled (${skipped} already enrolled)`;
  }
  return `${created} client${created === 1 ? "" : "s"} enrolled`;
}

function unenrollSuccessMessage(removed: number) {
  return removed === 1 ? "Client unenrolled" : `${removed} clients unenrolled`;
}

export function EnrollmentDialog({
  open,
  onOpenChange,
  classId,
  mode = "private",
  onUpdated,
}: EnrollmentDialogProps) {
  const isPrivate = mode === "private";

  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAddIds, setSelectedAddIds] = useState<Set<string>>(new Set());
  const [selectedPrivateClientId, setSelectedPrivateClientId] = useState<string | null>(null);
  const [selectedRemoveIds, setSelectedRemoveIds] = useState<Set<string>>(new Set());
  const [unenrollTarget, setUnenrollTarget] = useState<string[] | null>(null);
  const selectAllAddRef = useRef<HTMLInputElement>(null);
  const selectAllRemoveRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [enrollmentRows, clientList] = await Promise.all([
        clientApi.getEnrollments(classId),
        clientApi.listClients({ page: 1, limit: 100 }),
      ]);
      setEnrollments(enrollmentRows);
      setClients(clientList.data);
    } catch {
      toast.error("Failed to load enrollment data");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [open, load]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSearch("");
        setSelectedAddIds(new Set());
        setSelectedPrivateClientId(null);
        setSelectedRemoveIds(new Set());
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((e) => e.clientId)),
    [enrollments]
  );

  const enrollmentRowIds = useMemo(
    () => enrollments.map((row) => row.id),
    [enrollments]
  );

  const addCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (enrolledIds.has(c.id)) return false;
      if (!q) return true;
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone?.includes(q) ?? false)
      );
    });
  }, [clients, enrolledIds, search]);

  const candidateIds = useMemo(
    () => addCandidates.map((client) => client.id),
    [addCandidates]
  );

  const allCandidatesSelected =
    candidateIds.length > 0 &&
    candidateIds.every((id) => selectedAddIds.has(id));
  const someCandidatesSelected =
    candidateIds.some((id) => selectedAddIds.has(id)) && !allCandidatesSelected;

  const allEnrolledSelected =
    enrollmentRowIds.length > 0 &&
    enrollmentRowIds.every((id) => selectedRemoveIds.has(id));
  const someEnrolledSelected =
    enrollmentRowIds.some((id) => selectedRemoveIds.has(id)) &&
    !allEnrolledSelected;

  useEffect(() => {
    if (selectAllAddRef.current) {
      selectAllAddRef.current.indeterminate = someCandidatesSelected;
    }
  }, [someCandidatesSelected]);

  useEffect(() => {
    if (selectAllRemoveRef.current) {
      selectAllRemoveRef.current.indeterminate = someEnrolledSelected;
    }
  }, [someEnrolledSelected]);

  useEffect(() => {
    setSelectedAddIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (candidateIds.includes(id)) {
          next.add(id);
        }
      }
      return next;
    });
  }, [candidateIds]);

  useEffect(() => {
    setSelectedRemoveIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (enrollmentRowIds.includes(id)) {
          next.add(id);
        }
      }
      return next;
    });
  }, [enrollmentRowIds]);

  useEffect(() => {
    if (!selectedPrivateClientId) return;
    if (!candidateIds.includes(selectedPrivateClientId)) {
      setSelectedPrivateClientId(null);
    }
  }, [candidateIds, selectedPrivateClientId]);

  const toggleAddCandidate = useCallback((clientId: string, checked: boolean) => {
    setSelectedAddIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(clientId);
      } else {
        next.delete(clientId);
      }
      return next;
    });
  }, []);

  const toggleAllCandidates = useCallback(() => {
    setSelectedAddIds((prev) => {
      const next = new Set(prev);
      if (allCandidatesSelected) {
        for (const id of candidateIds) {
          next.delete(id);
        }
      } else {
        for (const id of candidateIds) {
          next.add(id);
        }
      }
      return next;
    });
  }, [allCandidatesSelected, candidateIds]);

  const toggleRemoveRow = useCallback((enrollmentId: string, checked: boolean) => {
    setSelectedRemoveIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(enrollmentId);
      } else {
        next.delete(enrollmentId);
      }
      return next;
    });
  }, []);

  const toggleAllEnrolled = useCallback(() => {
    setSelectedRemoveIds((prev) => {
      const next = new Set(prev);
      if (allEnrolledSelected) {
        for (const id of enrollmentRowIds) {
          next.delete(id);
        }
      } else {
        for (const id of enrollmentRowIds) {
          next.add(id);
        }
      }
      return next;
    });
  }, [allEnrolledSelected, enrollmentRowIds]);

  async function handleEnroll(clientIds: string[]) {
    const uniqueIds = [...new Set(clientIds)];
    if (uniqueIds.length === 0) return;

    setPending(true);
    try {
      if (isPrivate) {
        const nextClientId = uniqueIds[0]!;
        if (enrollments.length > 0) {
          await clientApi.unenrollClients(
            classId,
            enrollments.map((row) => row.id)
          );
        }
        const result = await clientApi.enrollClients(classId, [nextClientId]);
        toast.success(
          enrollments.length > 0 ? "Client updated" : enrollSuccessMessage(result.created, result.skipped)
        );
      } else {
        const result = await clientApi.enrollClients(classId, uniqueIds);
        toast.success(enrollSuccessMessage(result.created, result.skipped));
      }
      setSelectedAddIds(new Set());
      setSelectedPrivateClientId(null);
      await load();
      onUpdated?.();
    } catch {
      toast.error(isPrivate ? "Failed to assign client" : "Failed to enroll client");
    } finally {
      setPending(false);
    }
  }

  async function handleUnenroll(enrollmentIds: string[]) {
    const uniqueIds = [...new Set(enrollmentIds)];
    if (uniqueIds.length === 0) return;

    setPending(true);
    try {
      const result = await clientApi.unenrollClients(classId, uniqueIds);
      toast.success(unenrollSuccessMessage(result.removed));
      setSelectedRemoveIds(new Set());
      await load();
      onUpdated?.();
    } catch {
      toast.error("Failed to unenroll client");
    } finally {
      setPending(false);
    }
  }

  const dialogTitle = isPrivate
    ? enrollments.length > 0
      ? "Change client"
      : "Assign client"
    : "Manage enrollment";

  const dialogDescription = isPrivate
    ? "Private sessions are one client per class. Search your roster and assign who this session is for."
    : "Add or remove clients from this class roster.";

  const unenrollTargetRows = useMemo(
    () =>
      unenrollTarget
        ? enrollments.filter((row) => unenrollTarget.includes(row.id))
        : [],
    [enrollments, unenrollTarget]
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {isPrivate ? (
          <>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                {enrollments.length > 0 && (
                  <section className="rounded-2xl border border-border bg-muted/15 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Current client</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {clientDisplayName(enrollments[0]!.client)}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 rounded-full text-destructive hover:text-destructive"
                        disabled={pending}
                        onClick={() => void handleUnenroll([enrollments[0]!.id])}
                      >
                        <UserMinus className="mr-1 size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </section>
                )}

                <section>
                  <h4 className="text-sm font-medium text-foreground">
                    {enrollments.length > 0 ? "Select a different client" : "Select a client"}
                  </h4>
                  <div className="relative mt-2">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search clients…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ul
                    className="mt-2 max-h-52 space-y-2 overflow-y-auto"
                    role="radiogroup"
                    aria-label="Clients to assign"
                  >
                    {addCandidates.length === 0 ? (
                      <li className="py-4 text-center text-sm text-muted-foreground">
                        {enrollments.length > 0 && !search.trim()
                          ? "No other clients in your roster."
                          : "No clients match your search."}
                      </li>
                    ) : (
                      addCandidates.map((client) => {
                        const selected = selectedPrivateClientId === client.id;
                        return (
                          <li key={client.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                                selected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-muted/40",
                                pending && "pointer-events-none opacity-60"
                              )}
                            >
                              <input
                                type="radio"
                                name="assign-private-client"
                                value={client.id}
                                checked={selected}
                                onChange={() => setSelectedPrivateClientId(client.id)}
                                className="sr-only"
                              />
                              <span
                                className={cn(
                                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/40 bg-background"
                                )}
                                aria-hidden
                              >
                                {selected ? (
                                  <span className="size-1.5 rounded-full bg-current" />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1 text-left">
                                <span className="text-sm font-medium text-foreground">
                                  {clientDisplayName(client)}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {client.email}
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </section>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => onOpenChange(false)}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={pending || !selectedPrivateClientId}
                    onClick={() => {
                      if (selectedPrivateClientId) {
                        void handleEnroll([selectedPrivateClientId]);
                      }
                    }}
                  >
                    {pending
                      ? "Saving…"
                      : enrollments.length > 0
                        ? "Change client"
                        : "Assign client"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        ) : (
          <>
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-foreground">Enrolled</h4>
                {selectedRemoveIds.size > 0 ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                    disabled={pending}
                    onClick={() => setUnenrollTarget([...selectedRemoveIds])}
                  >
                    <UserMinus className="mr-1 size-3.5" />
                    Remove {selectedRemoveIds.size} selected
                  </Button>
                ) : null}
              </div>
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : enrollments.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No clients enrolled yet.</p>
              ) : (
                <>
                  <div className="mt-2 flex items-center gap-2 px-1">
                    <Checkbox
                      ref={selectAllRemoveRef}
                      checked={allEnrolledSelected}
                      onChange={() => toggleAllEnrolled()}
                      aria-label="Select all enrolled clients"
                    />
                    <span className="text-xs text-muted-foreground">
                      Select all ({enrollments.length})
                    </span>
                  </div>
                  <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                    {enrollments.map((row) => {
                      const isSelected = selectedRemoveIds.has(row.id);

                      return (
                        <li
                          key={row.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/10 px-3 py-2"
                        >
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onChange={(event) => {
                                event.stopPropagation();
                                toggleRemoveRow(row.id, event.target.checked);
                              }}
                              aria-label={`Select ${clientDisplayName(row.client)}`}
                            />
                            <span className="truncate text-sm text-foreground">
                              {clientDisplayName(row.client)}
                            </span>
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0 rounded-full text-destructive hover:text-destructive"
                            disabled={pending}
                            onClick={() => setUnenrollTarget([row.id])}
                          >
                            <UserMinus className="mr-1 size-3.5" />
                            Remove
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-foreground">Add client</h4>
                {selectedAddIds.size > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    disabled={pending}
                    onClick={() => void handleEnroll([...selectedAddIds])}
                  >
                    <UserPlus className="mr-1 size-3.5" />
                    Add {selectedAddIds.size} selected
                  </Button>
                ) : null}
              </div>
              <div className="relative mt-2">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {addCandidates.length > 0 ? (
                <div className="mt-2 flex items-center gap-2 px-1">
                  <Checkbox
                    ref={selectAllAddRef}
                    checked={allCandidatesSelected}
                    onChange={() => toggleAllCandidates()}
                    aria-label="Select all visible clients"
                  />
                  <span className="text-xs text-muted-foreground">
                    Select all visible ({addCandidates.length})
                  </span>
                </div>
              ) : null}
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {addCandidates.length === 0 ? (
                  <li className="py-4 text-center text-sm text-muted-foreground">
                    No clients to add.
                  </li>
                ) : (
                  addCandidates.map((client) => {
                    const isSelected = selectedAddIds.has(client.id);

                    return (
                      <li
                        key={client.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2"
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={(event) => {
                              event.stopPropagation();
                              toggleAddCandidate(client.id, event.target.checked);
                            }}
                            aria-label={`Select ${clientDisplayName(client)}`}
                          />
                          <span className="truncate text-sm text-foreground">
                            {clientDisplayName(client)}
                          </span>
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0 rounded-full"
                          disabled={pending}
                          onClick={() => void handleEnroll([client.id])}
                        >
                          <UserPlus className="mr-1 size-3.5" />
                          Add
                        </Button>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>

    <ConfirmDestructiveDialog
      open={unenrollTarget !== null}
      onOpenChange={(open) => {
        if (!open) setUnenrollTarget(null);
      }}
      title={
        unenrollTargetRows.length === 1
          ? "Remove client from class?"
          : "Remove clients from class?"
      }
      description={
        unenrollTargetRows.length === 1
          ? `${clientDisplayName(unenrollTargetRows[0]!.client)} will be unenrolled from this class.`
          : unenrollTargetRows.length > 1
            ? `${unenrollTargetRows.length} clients will be unenrolled from this class.`
            : "Selected clients will be unenrolled from this class."
      }
      confirmLabel="Remove"
      confirmPendingLabel="Removing…"
      pending={pending}
      confirmDisabled={!unenrollTarget || unenrollTarget.length === 0}
      onConfirm={async () => {
        if (!unenrollTarget) return;
        await handleUnenroll(unenrollTarget);
        setUnenrollTarget(null);
      }}
    />
    </>
  );
}
