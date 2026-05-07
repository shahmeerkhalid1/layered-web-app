"use client";

import { useEffect, useState } from "react";
import { Fancybox, type FancyboxOptions } from "@fancyapps/ui/dist/fancybox/";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

const TRIGGER_SELECTOR = "[data-fancybox]";

export function useFancybox(
  rebindKey: string | number,
  options?: Partial<FancyboxOptions>
) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!container) return;

    Fancybox.bind(container, TRIGGER_SELECTOR, options ?? {});

    return () => {
      Fancybox.unbind(container);
      Fancybox.close();
    };
  }, [container, rebindKey, options]);

  return setContainer;
}
