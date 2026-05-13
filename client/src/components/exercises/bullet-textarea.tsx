"use client";

import type { ComponentProps, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const BULLET_ENTER_INSERT = "\n• ";
const BULLET_MANUAL_INSERT = "• ";

function lineStartIndex(value: string, caret: number): number {
  const nl = value.lastIndexOf("\n", caret - 1);
  return nl === -1 ? 0 : nl + 1;
}

/** Collapsed caret at line start; line does not already begin with `• `. */
function canAddManualBullet(
  value: string,
  selStart: number,
  selEnd: number
): boolean {
  if (selStart !== selEnd) return false;
  const ls = lineStartIndex(value, selStart);
  if (selStart !== ls) return false;
  return !value.slice(ls).startsWith(BULLET_MANUAL_INSERT);
}

export type BulletTextareaProps = Omit<
  ComponentProps<typeof Textarea>,
  "value" | "onChange" | "defaultValue"
> & {
  value: string;
  onValueChange: (value: string) => void;
  /** When false, behaves like a plain textarea (no Enter/• behavior, no toolbar). */
  bulletsEnabled?: boolean;
  /** When true and bulletsEnabled, shows Add • above the field. */
  showAddBulletButton?: boolean;
  /** Optional label (e.g. shadcn Label) shown on the same row as Add • when the toolbar is visible. */
  label?: ReactNode;
  /** Rendered after Add • on the toolbar row (e.g. layer remove control). */
  toolbarEndSlot?: ReactNode;
  /** Optional wrapper around toolbar + textarea (e.g. spacing). */
  wrapperClassName?: string;
};

export function BulletTextarea({
  value,
  onValueChange,
  bulletsEnabled = true,
  showAddBulletButton = true,
  label,
  toolbarEndSlot,
  wrapperClassName,
  className,
  ...textareaProps
}: BulletTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [addBulletAllowed, setAddBulletAllowed] = useState(true);

  const syncAddBulletGate = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    setAddBulletAllowed(
      canAddManualBullet(el.value, el.selectionStart, el.selectionEnd)
    );
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    const rt = e.relatedTarget as HTMLElement | null;
    if (rt?.closest?.("[data-bullet-textarea-toolbar]")) return;
    setAddBulletAllowed(false);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (el && document.activeElement === el) {
      setAddBulletAllowed(
        canAddManualBullet(
          el.value,
          el.selectionStart,
          el.selectionEnd
        )
      );
    } else {
      setAddBulletAllowed(value.length === 0);
    }
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!bulletsEnabled) return;
      if (e.key !== "Enter" || e.shiftKey) return;
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const v = el.value;
      const newValue = v.slice(0, start) + BULLET_ENTER_INSERT + v.slice(end);
      flushSync(() => {
        onValueChange(newValue);
      });
      const pos = start + BULLET_ENTER_INSERT.length;
      el.setSelectionRange(pos, pos);
      setAddBulletAllowed(canAddManualBullet(newValue, pos, pos));
    },
    [bulletsEnabled, onValueChange]
  );

  const insertBulletAtCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const v = el.value;
    if (!canAddManualBullet(v, start, end)) return;
    const newValue =
      v.slice(0, start) + BULLET_MANUAL_INSERT + v.slice(end);
    flushSync(() => {
      onValueChange(newValue);
    });
    const pos = start + BULLET_MANUAL_INSERT.length;
    el.focus();
    el.setSelectionRange(pos, pos);
    setAddBulletAllowed(canAddManualBullet(newValue, pos, pos));
  }, [onValueChange]);

  const showToolbar = bulletsEnabled && showAddBulletButton;

  if (!bulletsEnabled) {
    return (
      <Textarea
        {...textareaProps}
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {showToolbar && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            label ? "justify-between" : "justify-end"
          )}
        >
          {label ? (
            <div className="min-w-0 flex-1">{label}</div>
          ) : null}
          <div
            className="flex shrink-0 flex-wrap items-center justify-end gap-1 pr-0.5"
            data-bullet-textarea-toolbar
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!addBulletAllowed}
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertBulletAtCursor}
              className="h-7 gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
              title={
                addBulletAllowed
                  ? "Insert a bullet (•) at the start of this line"
                  : "Move the cursor to the beginning of a line that does not already start with •"
              }
            >
              Add •
            </Button>
            {toolbarEndSlot}
          </div>
        </div>
      )}
      <Textarea
        {...textareaProps}
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onValueChange(v);
          setAddBulletAllowed(
            canAddManualBullet(
              v,
              e.target.selectionStart,
              e.target.selectionEnd
            )
          );
        }}
        onFocus={syncAddBulletGate}
        onBlur={handleBlur}
        onSelect={syncAddBulletGate}
        onKeyUp={syncAddBulletGate}
        onClick={syncAddBulletGate}
        onKeyDown={handleKeyDown}
        className={className}
      />
    </div>
  );
}
