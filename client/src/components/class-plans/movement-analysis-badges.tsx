"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MovementAnalysisBadgesProps {
  spinalMovement?: string[] | null;
  jointLoading?: string[] | null;
  chainType?: string[] | null;
  className?: string;
}

function nonEmpty(values: string[] | null | undefined): string[] {
  return (values ?? []).filter((s) => s != null && String(s).trim() !== "");
}

/** Compact movement analysis badges (matches exercise detail `Badge variant="secondary"`). */
export function MovementAnalysisBadges({
  spinalMovement,
  jointLoading,
  chainType,
  className,
}: MovementAnalysisBadgesProps) {
  const spinal = nonEmpty(spinalMovement);
  const joints = nonEmpty(jointLoading);
  const chains = nonEmpty(chainType);

  if (spinal.length === 0 && joints.length === 0 && chains.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {spinal.map((value, i) => (
        <Badge key={`sp-${value}-${i}`} variant="secondary" className="text-[10px] font-medium">
          {value}
        </Badge>
      ))}
      {joints.map((value, i) => (
        <Badge key={`jl-${value}-${i}`} variant="secondary" className="text-[10px] font-medium">
          {value}
        </Badge>
      ))}
      {chains.map((value, i) => (
        <Badge key={`ct-${value}-${i}`} variant="secondary" className="text-[10px] font-medium">
          {value}
        </Badge>
      ))}
    </div>
  );
}
