"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { chainTypeTooltipForValue } from "@/lib/chain-type-tooltips";
import { cn } from "@/lib/utils";

export interface ChainTypeOptionLabelProps {
  value: string;
  label: string;
  className?: string;
}

export function ChainTypeOptionLabel({ value, label, className }: ChainTypeOptionLabelProps) {
  const description = chainTypeTooltipForValue(value);

  if (!description) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "inline-flex cursor-help items-center gap-1 border-b border-dotted border-muted-foreground/45 transition-colors hover:border-primary/50 hover:text-foreground",
              className
            )}
          >
            {label}
          </span>
        }
      />
      <TooltipContent
        side="right"
        sideOffset={6}
        className="max-w-xs px-3 py-2.5 text-left leading-snug flex flex-col items-start"
      >
        <p className="font-semibold text-background">{label}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-background/85">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
