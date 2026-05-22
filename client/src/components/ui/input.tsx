import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import {
  formControlInputClasses,
  inputHasValue,
} from "@/lib/form-control-styles"
import { cn } from "@/lib/utils"

function syncInputFilled(el: HTMLInputElement, value?: string | number | readonly string[] | null) {
  const has =
    value !== undefined
      ? inputHasValue(value)
      : inputHasValue(el.value)
  if (has) el.setAttribute("data-filled", "")
  else el.removeAttribute("data-filled")
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, defaultValue, onChange, ...props }, forwardedRef) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null)

    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node
        if (typeof forwardedRef === "function") forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
        if (node) syncInputFilled(node, value)
      },
      [forwardedRef, value]
    )

    React.useEffect(() => {
      if (innerRef.current) syncInputFilled(innerRef.current, value)
    }, [value, defaultValue])

    return (
      <InputPrimitive
        type={type}
        data-slot="input"
        ref={setRef}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          syncInputFilled(e.currentTarget, value)
          onChange?.(e)
        }}
        className={cn(formControlInputClasses, className)}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
