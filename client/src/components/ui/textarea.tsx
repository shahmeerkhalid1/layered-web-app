import * as React from "react"

import {
  formControlTextareaClasses,
  inputHasValue,
} from "@/lib/form-control-styles"
import { cn } from "@/lib/utils"

function syncTextareaFilled(
  el: HTMLTextAreaElement,
  value?: string | number | readonly string[] | null
) {
  const has =
    value !== undefined ? inputHasValue(value) : inputHasValue(el.value)
  if (has) el.setAttribute("data-filled", "")
  else el.removeAttribute("data-filled")
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, value, defaultValue, onChange, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null)

  const setRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
      if (node) syncTextareaFilled(node, value)
    },
    [forwardedRef, value]
  )

  React.useEffect(() => {
    if (innerRef.current) syncTextareaFilled(innerRef.current, value)
  }, [value, defaultValue])

  return (
    <textarea
      ref={setRef}
      data-slot="textarea"
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => {
        syncTextareaFilled(e.currentTarget, value)
        onChange?.(e)
      }}
      className={cn(formControlTextareaClasses, className)}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
