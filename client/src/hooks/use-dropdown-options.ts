import { startTransition, useEffect, useState } from "react";
import { dropdownApi } from "@/services/dropdown-api";
import type { DropdownOptionRow } from "@/lib/types";

const cache = new Map<string, DropdownOptionRow[]>();

export function useDropdownOptions(categoryKey: string) {
  const initialCached = cache.get(categoryKey);
  const [options, setOptions] = useState<DropdownOptionRow[]>(
    () => initialCached ?? []
  );
  const [loading, setLoading] = useState(initialCached === undefined);

  useEffect(() => {
    if (cache.has(categoryKey)) {
      const rows = cache.get(categoryKey)!;
      startTransition(() => {
        setOptions(rows);
        setLoading(false);
      });
      return;
    }

    let cancelled = false;
    startTransition(() => setLoading(true));
    dropdownApi
      .getOptions(categoryKey)
      .then((rows) => {
        if (cancelled) return;
        cache.set(categoryKey, rows);
        setOptions(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryKey]);

  return { options, loading };
}

/** Invalidate cached options for a category (e.g. after add/delete). */
export function invalidateDropdownCache(categoryKey: string) {
  cache.delete(categoryKey);
}
