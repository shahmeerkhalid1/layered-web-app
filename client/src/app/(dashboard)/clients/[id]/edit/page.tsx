"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Trash2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { ClientForm } from "@/components/clients/client-form";
import { EnrollInClassDialog } from "@/components/clients/enroll-in-class-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { clientApi } from "@/services/client-api";
import type { ClientDetail } from "@/lib/types";
import type { ClientFormValues } from "@/lib/validation/client-form-schema";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";

export default function ClientEditPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState<{
    enrollmentId: string;
    classId: string;
    classTitle: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientApi.getClientById(clientId);
      setClient(data);
    } catch {
      toast.error("Failed to load client");
      router.replace("/clients");
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSave(values: ClientFormValues) {
    if (!client) return;
    setPending(true);
    try {
      const updated = await clientApi.updateClient(client.id, values);
      setClient(updated);
      toast.success("Client updated");
    } catch {
      toast.error("Failed to update client");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!client) return;
    setPending(true);
    try {
      await clientApi.deleteClient(client.id);
      toast.success("Client archived");
      router.replace("/clients");
    } catch {
      toast.error("Failed to archive client");
    } finally {
      setPending(false);
      setDeleteOpen(false);
    }
  }

  async function handleUnenroll(enrollmentId: string, classId: string) {
    setPending(true);
    try {
      const result = await clientApi.unenrollClient(classId, enrollmentId);
      toast.success(result.message);
      await load();
      setUnenrollTarget(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to unenroll client");
    } finally {
      setPending(false);
    }
  }

  if (loading || !client) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-label="Loading client"
        />
      </div>
    );
  }

  const enrolledClassIds = new Set(client.enrollments.map((e) => e.classId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Link href={`/clients/${client.id}`} aria-label="Back to client profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em]">
              Edit {client.firstName} {client.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Update contact details, notes, and class enrollments.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-full text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
          disabled={pending}
        >
          <Trash2 className="mr-2 size-4" />
          Archive client
        </Button>
      </div>

      <ClientForm
        client={client}
        onSubmit={handleSave}
        submitLabel="Save changes"
        pending={pending}
      />

      <section className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
              Enrolled classes
            </h3>
            <p className="text-sm text-muted-foreground">
              Classes this client is rostered on for attendance tracking.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={() => setEnrollOpen(true)}
            disabled={pending}
          >
            <UserPlus className="mr-2 size-4" />
            Enroll in class
          </Button>
        </div>

        {client.enrollments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Not enrolled in any classes yet.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {client.enrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{enrollment.class.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {enrollment.class.type}
                    </Badge>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" aria-hidden />
                      {enrollment.class.durationMinutes} min
                    </span>
                    <span>
                      Enrolled{" "}
                      {new Date(enrollment.enrolledAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-1 sm:items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full"
                    disabled={pending || !enrollment.canUnenroll}
                    onClick={() =>
                      setUnenrollTarget({
                        enrollmentId: enrollment.id,
                        classId: enrollment.classId,
                        classTitle: enrollment.class.title,
                      })
                    }
                  >
                    <UserMinus className="mr-2 size-4" />
                    Unenroll
                  </Button>
                  {!enrollment.canUnenroll ? (
                    <p className="text-xs text-muted-foreground sm:text-right">
                      No upcoming sessions
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EnrollInClassDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        clientId={client.id}
        enrolledClassIds={enrolledClassIds}
        onEnrolled={() => void load()}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive this client?</DialogTitle>
            <DialogDescription>
              {client.firstName} {client.lastName} will be removed from your active roster.
              Historical attendance records are preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={pending}
              onClick={() => void handleDelete()}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDestructiveDialog
        open={unenrollTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnenrollTarget(null);
        }}
        title="Unenroll from class?"
        description={
          unenrollTarget
            ? `${client.firstName} ${client.lastName} will be removed from upcoming sessions of “${unenrollTarget.classTitle}”. Past attendance and session notes are kept.`
            : "This client will be removed from upcoming sessions."
        }
        confirmLabel="Unenroll"
        confirmPendingLabel="Removing…"
        pending={pending}
        confirmDisabled={!unenrollTarget}
        onConfirm={async () => {
          if (!unenrollTarget) return;
          await handleUnenroll(unenrollTarget.enrollmentId, unenrollTarget.classId);
        }}
      />
    </div>
  );
}
