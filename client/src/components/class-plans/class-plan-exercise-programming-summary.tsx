"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Exercise fields surfaced on class plans (per client spec: programming tags at a glance). */
export interface ClassPlanExerciseProgrammingFields {
  orientation?: string | null;
  directionFaced?: string | null;
  movementType?: string | null;
  springs?: string | null;
  machineSetup?: string | null;
  equipment?: string[] | null;
  spinalMovement?: string[] | null;
  jointLoading?: string[] | null;
  chainType?: string[] | null;
}

function trim(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  return t === "" ? null : t;
}

function nonEmpty(values: string[] | null | undefined): string[] {
  return (values ?? []).filter((s) => s != null && String(s).trim() !== "");
}

export interface ClassPlanExerciseProgrammingSummaryProps {
  exercise: ClassPlanExerciseProgrammingFields;
  className?: string;
}

/** One cell in the same 2-column grid as class-plan-card / scalar exercise fields. */
function DlField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 min-w-0">{children}</dd>
    </div>
  );
}

function AnalysisBadgeGroup({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, i) => (
        <Badge key={`${value}-${i}`} variant="secondary" className="text-[10px] font-medium">
          {value}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Setup + movement analysis in one {@link ClassPlanCard}-style 2-column `dl` grid
 * (e.g. movement type | springs on one row from `sm` up).
 */
export function ClassPlanExerciseProgrammingSummary({
  exercise,
  className,
}: ClassPlanExerciseProgrammingSummaryProps) {
  const orientation = trim(exercise.orientation);
  const directionFaced = trim(exercise.directionFaced);
  const movementType = trim(exercise.movementType);
  const springs = trim(exercise.springs);
  const machineSetup = trim(exercise.machineSetup);
  const equipment = nonEmpty(exercise.equipment);
  const spinalMovement = nonEmpty(exercise.spinalMovement);
  const chainType = nonEmpty(exercise.chainType);
  const jointLoading = nonEmpty(exercise.jointLoading);

  const hasAny =
    orientation ||
    directionFaced ||
    movementType ||
    springs ||
    machineSetup ||
    equipment.length > 0 ||
    spinalMovement.length > 0 ||
    chainType.length > 0 ||
    jointLoading.length > 0;

  if (!hasAny) return null;

  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-2",
        className
      )}
    >
      {orientation && (
        <DlField label="Orientation">
          <span className="font-medium leading-snug text-foreground">{orientation}</span>
        </DlField>
      )}
      {directionFaced && (
        <DlField label="Direction faced">
          <span className="font-medium leading-snug text-foreground">{directionFaced}</span>
        </DlField>
      )}
      {movementType && (
        <DlField label="Movement type">
          <span className="font-medium leading-snug text-foreground">{movementType}</span>
        </DlField>
      )}
      {springs && (
        <DlField label="Springs">
          <span className="wrap-break-word font-medium leading-snug text-foreground">{springs}</span>
        </DlField>
      )}
      {machineSetup && (
        <DlField label="Machine setup">
          <span className="font-medium leading-snug text-foreground">{machineSetup}</span>
        </DlField>
      )}
      {equipment.length > 0 && (
        <DlField label="Equipment">
          <div className="flex flex-wrap gap-1">
            {equipment.map((v, i) => (
              <Badge
                key={`eq-${v}-${i}`}
                variant="outline"
                className="text-[10px] font-normal text-foreground"
              >
                {v}
              </Badge>
            ))}
          </div>
        </DlField>
      )}
      {spinalMovement.length > 0 && (
        <DlField label="Spinal movement">
          <AnalysisBadgeGroup values={spinalMovement} />
        </DlField>
      )}
      {chainType.length > 0 && (
        <DlField label="Chain type">
          <AnalysisBadgeGroup values={chainType} />
        </DlField>
      )}
      {jointLoading.length > 0 && (
        <DlField label="Joint loading">
          <AnalysisBadgeGroup values={jointLoading} />
        </DlField>
      )}
    </dl>
  );
}
