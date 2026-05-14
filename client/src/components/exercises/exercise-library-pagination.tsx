import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_CLASS =
  "flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:gap-6";

const MAX_PAGE_BUTTONS = 5;

function windowedPageNumbers(
  current: number,
  totalPages: number,
  maxVisible: number,
): number[] {
  const total = Math.max(1, totalPages);
  const currentClamped = Math.min(Math.max(1, current), total);
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const halfLeft = Math.floor((maxVisible - 1) / 2);
  let start = currentClamped - halfLeft;
  let end = start + maxVisible - 1;
  if (start < 1) {
    start = 1;
    end = maxVisible;
  }
  if (end > total) {
    end = total;
    start = total - maxVisible + 1;
  }
  return Array.from({ length: maxVisible }, (_, i) => start + i);
}

export type ExerciseLibraryPaginationProps =
  | {
      page: number;
      totalPages: number;
      onPageChange: (page: number) => void;
      loading?: boolean;
      ariaLabel?: string;
    }
  | {
      /** Accessible name for the disabled preview bar (e.g. under class plans). */
      previewAriaLabel?: string;
    };

/**
 * Pagination bar used under the exercise library grid. Omit handlers for the static preview;
 * pass `page`, `totalPages`, and `onPageChange` for live lists (e.g. admin user directory).
 */
export function ExerciseLibraryPagination(
  props?: ExerciseLibraryPaginationProps,
) {
  const previewAriaLabel =
    props && "previewAriaLabel" in props && props.previewAriaLabel
      ? props.previewAriaLabel
      : "Exercise list pagination";

  if (!props || !("onPageChange" in props) || !props.onPageChange) {
    return (
      <nav aria-label={previewAriaLabel} className={NAV_CLASS}>
        <p className="order-2 text-sm text-muted-foreground sm:order-1">
          Page <span className="font-medium text-foreground">1</span> of{" "}
          <span className="font-medium text-foreground">10</span>
        </p>

        <div className="order-1 flex flex-wrap items-center justify-center gap-1 sm:order-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled
            aria-label="First page"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="mx-1 flex items-center gap-1">
            <Button type="button" size="sm" variant="default" disabled>
              1
            </Button>
            {[2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant="outline"
                disabled
              >
                {n}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled
            aria-label="Last page"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </nav>
    );
  }

  const {
    page,
    totalPages,
    loading = false,
    onPageChange,
    ariaLabel = "Exercise list pagination",
  } = props;

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const pages = windowedPageNumbers(safePage, safeTotalPages, MAX_PAGE_BUTTONS);
  const busy = Boolean(loading);

  return (
    <nav aria-label={ariaLabel} className={NAV_CLASS}>
      <p className="order-2 text-sm text-muted-foreground sm:order-1">
        Page <span className="font-medium text-foreground">{safePage}</span> of{" "}
        <span className="font-medium text-foreground">{safeTotalPages}</span>
      </p>

      <div className="order-1 flex flex-wrap items-center justify-center gap-1 sm:order-2">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={busy || safePage <= 1}
          aria-label="First page"
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={busy || safePage <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="mx-1 flex items-center gap-1">
          {pages.map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={n === safePage ? "default" : "outline"}
              disabled={busy}
              aria-label={`Page ${n}`}
              aria-current={n === safePage ? "page" : undefined}
              onClick={() => onPageChange(n)}
            >
              {n}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={busy || safePage >= safeTotalPages}
          aria-label="Next page"
          onClick={() => onPageChange(safePage + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={busy || safePage >= safeTotalPages}
          aria-label="Last page"
          onClick={() => onPageChange(safeTotalPages)}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
