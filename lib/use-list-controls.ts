"use client";

import { useRef, type TransitionStartFunction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * URL-as-state for list pages: filters and pagination live in the query string, so the
 * server component re-renders with fresh data. `set` changing anything but `page` resets to page 1.
 */
export function useListControls(startTransition: TransitionStartFunction) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function apply(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => router.replace(params.size ? `${pathname}?${params}` : pathname));
  }

  function set(key: string, value: string | undefined) {
    apply((params) => {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
      if (key !== "page") params.delete("page");
    });
  }

  function setSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      apply((params) => {
        if (value) params.set("search", value);
        else params.delete("search");
        params.delete("page");
      });
    }, 300);
  }

  return { set, setSearch };
}
