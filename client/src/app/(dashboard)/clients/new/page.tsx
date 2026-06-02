"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { clientApi } from "@/services/client-api";
import type { ClientFormValues } from "@/lib/validation/client-form-schema";

export default function NewClientPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(values: ClientFormValues) {
    setPending(true);
    try {
      const client = await clientApi.createClient(values);
      toast.success("Client created");
      router.push(`/clients/${client.id}`);
    } catch {
      toast.error("Failed to create client");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/clients")}
          aria-label="Back to clients"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em]">
            New client
          </h2>
          <p className="text-sm text-muted-foreground">
            Add a client to your roster for enrollment and attendance tracking.
          </p>
        </div>
      </div>

      <ClientForm onSubmit={handleSubmit} submitLabel="Create client" pending={pending} />
    </div>
  );
}
