"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ClientProfileView } from "@/components/clients/client-profile-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clientApi } from "@/services/client-api";
import type { ClientDetail } from "@/lib/types";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const attendanceCount = client._count?.attendances ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Link href="/clients" aria-label="Back to clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em]">
              {client.firstName} {client.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {client.enrollments.length} enrolled class
              {client.enrollments.length === 1 ? "" : "es"} · {attendanceCount} attendance
              record{attendanceCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline" className="rounded-full">
              <Pencil className="mr-2 size-4" />
              Edit client
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={pending}
          >
            <Trash2 className="mr-2 size-4" />
            Archive
          </Button>
        </div>
      </div>

      <ClientProfileView client={client} />

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
    </div>
  );
}
