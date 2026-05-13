import { cn } from "@/lib/utils";

/** Matches lines that begin with a bullet like BulletTextarea (`• ` or `•` at EOL). */
const BULLET_LINE = /^\s*•(?:\s|$)/;

export type ExercisePreTextProps = {
  children: string;
  className?: string;
};

/**
 * Read-only exercise copy: preserves line breaks like `whitespace-pre-wrap`.
 * Bullet lines use a hanging indent so wrapped text aligns under the content
 * after the marker, not flush with the block edge under the bullet column.
 */
export function ExercisePreText({ children, className }: ExercisePreTextProps) {
  const lines = children.split("\n");
  return (
    <div className={cn("min-w-0", className)}>
      {lines.map((line, i) => {
        const isBulletLine = BULLET_LINE.test(line);
        return (
          <p
            key={i}
            className={cn(
              "m-0  wrap-break-word",
              isBulletLine && "ps-[0.75em] indent-[-0.75em]",
            )}
          >
            {line.length === 0 ? "\u00a0" : line}
          </p>
        );
      })}
    </div>
  );
}
