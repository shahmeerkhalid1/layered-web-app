"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BulletTextarea } from "@/components/exercises/bullet-textarea";
import {
  buildClientFormDefaults,
  clientFormSchema,
  type ClientFormValues,
} from "@/lib/validation/client-form-schema";
import type { ClientDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ClientFormProps {
  client?: ClientDetail;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  submitLabel?: string;
  pending?: boolean;
}

export function ClientForm({
  client,
  onSubmit,
  submitLabel = "Save client",
  pending = false,
}: ClientFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: buildClientFormDefaults(client),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (client?.id) {
      reset(buildClientFormDefaults(client));
    }
  }, [client?.id, client, reset]);

  function handleInvalid() {
    toast.error("Fill the required fields before submitting.");
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit, handleInvalid)}
      className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            className={cn(errors.firstName && "border-destructive")}
            {...register("firstName")}
            aria-invalid={Boolean(errors.firstName)}
          />
          {errors.firstName ? (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            className={cn(errors.lastName && "border-destructive")}
            {...register("lastName")}
            aria-invalid={Boolean(errors.lastName)}
          />
          {errors.lastName ? (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            aria-invalid={Boolean(errors.phone)}
          />
        </div>
      </div>

      <Controller
        control={control}
        name="injuries"
        render={({ field }) => (
          <BulletTextarea
            label={<Label htmlFor="injuries">Injuries / considerations</Label>}
            id="injuries"
            value={field.value ?? ""}
            onValueChange={field.onChange}
            placeholder="Note any injuries or physical considerations…"
            bulletsEnabled={false}
          />
        )}
      />

      <Controller
        control={control}
        name="focusAreas"
        render={({ field }) => (
          <BulletTextarea
            label={<Label htmlFor="focusAreas">Focus areas</Label>}
            id="focusAreas"
            value={field.value ?? ""}
            onValueChange={field.onChange}
            placeholder="What should sessions emphasize?"
            bulletsEnabled={false}
          />
        )}
      />

      <Controller
        control={control}
        name="goals"
        render={({ field }) => (
          <BulletTextarea
            label={<Label htmlFor="goals">Goals</Label>}
            id="goals"
            value={field.value ?? ""}
            onValueChange={field.onChange}
            placeholder="Client goals for their practice…"
            bulletsEnabled={false}
          />
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full px-6" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
