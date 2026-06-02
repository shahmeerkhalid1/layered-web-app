"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function useClientSearch() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  return {
    search,
    setSearch,
    debouncedSearch,
  };
}
