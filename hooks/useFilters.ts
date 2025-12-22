"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMemo, useCallback } from "react";
import type {
  FilterState,
  TokenSymbol,
  ChainName,
  TimeRange,
  P2PTier,
} from "@/lib/types/filters";

const DEFAULT_FILTERS: FilterState = {
  token: "all",
  chain: "all",
  range: "30d",
  p2pTier: "all",
};

export function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current filters from URL
  const filters: FilterState = useMemo(() => {
    const tierParam = searchParams.get("tier");
    let p2pTier: P2PTier = "all";
    if (tierParam === "1" || tierParam === "2" || tierParam === "3") {
      p2pTier = parseInt(tierParam, 10) as 1 | 2 | 3;
    }

    return {
      token: (searchParams.get("token") as TokenSymbol) || DEFAULT_FILTERS.token,
      chain: (searchParams.get("chain") as ChainName) || DEFAULT_FILTERS.chain,
      range: (searchParams.get("range") as TimeRange) || DEFAULT_FILTERS.range,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      p2pTier,
    };
  }, [searchParams]);

  // Build query string for API calls
  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.token !== "all") {
      params.set("token", filters.token);
    }
    if (filters.chain !== "all") {
      params.set("chain", filters.chain);
    }
    if (filters.range !== "30d") {
      params.set("range", filters.range);
    }
    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }
    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }
    if (filters.p2pTier !== "all") {
      params.set("tier", String(filters.p2pTier));
    }

    return params.toString();
  }, [filters]);

  // Update a single filter
  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const params = new URLSearchParams(searchParams.toString());

      if (
        value === "all" ||
        value === undefined ||
        value === DEFAULT_FILTERS[key]
      ) {
        params.delete(key === "p2pTier" ? "tier" : key);
      } else {
        params.set(key === "p2pTier" ? "tier" : key, String(value));
      }

      // Clear custom dates when switching to preset range
      if (key === "range" && value !== "custom") {
        params.delete("startDate");
        params.delete("endDate");
      }

      const queryStr = params.toString();
      router.push(queryStr ? `${pathname}?${queryStr}` : pathname, {
        scroll: false,
      });
    },
    [searchParams, pathname, router]
  );

  // Update multiple filters at once
  const setFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        const paramKey = key === "p2pTier" ? "tier" : key;
        if (
          value === "all" ||
          value === undefined ||
          value === DEFAULT_FILTERS[key as keyof FilterState]
        ) {
          params.delete(paramKey);
        } else {
          params.set(paramKey, String(value));
        }
      });

      const queryStr = params.toString();
      router.push(queryStr ? `${pathname}?${queryStr}` : pathname, {
        scroll: false,
      });
    },
    [searchParams, pathname, router]
  );

  // Reset to defaults
  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    queryString,
    setFilter,
    setFilters,
    resetFilters,
  };
}
