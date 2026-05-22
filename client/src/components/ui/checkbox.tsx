"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { checkboxIndicatorClasses } from "@/lib/form-control-styles";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <span
      data-slot="checkbox"
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer align-middle has-[:disabled]:cursor-default",
        className
      )}
    >
      <input
        type="checkbox"
        ref={ref}
        data-slot="checkbox-input"
        className="peer absolute inset-0 z-10 size-4.5 opacity-0 enabled:cursor-pointer disabled:cursor-default disabled:pointer-events-none"
        {...props}
      />
      <span className={checkboxIndicatorClasses} aria-hidden>
        <Check
          className="size-2.5 opacity-0 transition-opacity duration-150"
          strokeWidth={2.5}
          aria-hidden
        />
      </span>
    </span>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
