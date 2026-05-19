"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** @deprecated Use `/exercises/new` — kept so old bookmarks redirect. */
export default function ExerciseMultistepRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/exercises/new");
  }, [router]);
  return null;
}
