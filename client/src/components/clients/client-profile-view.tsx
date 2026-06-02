"use client";

import type { ReactNode } from "react";
import { Calendar, Mail, Phone } from "lucide-react";
import { ExercisePreText } from "@/components/exercises/exercise-pre-text";
import { Badge } from "@/components/ui/badge";
import type { ClientDetail } from "@/lib/types";

function ProfileDetail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="inline-flex min-w-0 items-center gap-2 text-sm text-foreground">
        {icon}
        <span className="min-w-0 truncate">{value}</span>
      </p>
    </div>
  );
}

function ProfileTextBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;

  return (
    <div className="space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <ExercisePreText className="text-sm text-muted-foreground">{value}</ExercisePreText>
    </div>
  );
}

interface ClientProfileViewProps {
  client: ClientDetail;
}

export function ClientProfileView({ client }: ClientProfileViewProps) {
  const attendanceCount = client._count?.attendances ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
              Contact & profile
            </h3>
            <p className="text-sm text-muted-foreground">
              {attendanceCount} attendance record{attendanceCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ProfileDetail label="First name" value={client.firstName} />
          <ProfileDetail label="Last name" value={client.lastName} />
          <ProfileDetail
            label="Email"
            value={client.email}
            icon={<Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
          />
          <ProfileDetail
            label="Phone"
            value={client.phone?.trim() || "—"}
            icon={<Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
          />
        </div>

        <div className="mt-5 space-y-4">
          <ProfileTextBlock label="Injuries / considerations" value={client.injuries} />
          <ProfileTextBlock label="Focus areas" value={client.focusAreas} />
          <ProfileTextBlock label="Goals" value={client.goals} />
          {!client.injuries?.trim() &&
          !client.focusAreas?.trim() &&
          !client.goals?.trim() ? (
            <p className="text-sm text-muted-foreground">
              No notes added yet. Use Edit to add injuries, focus areas, or goals.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Calendar className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
              Enrolled classes
            </h3>
            <p className="text-sm text-muted-foreground">
              {client.enrollments.length} class
              {client.enrollments.length === 1 ? "" : "es"} on the roster for attendance
              tracking.
            </p>
          </div>
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
                className="rounded-2xl border border-border bg-muted/10 p-4"
              >
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
