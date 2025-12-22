"use client";

import useSWR from "swr";
import { useFilters } from "./useFilters";
import type {
  OverviewResponse,
  P2PResponse,
  NetworkResponse,
  DexResponse,
  FiltersResponse,
  ApiError,
} from "@/lib/types/api";

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = (await res.json()) as ApiError;
    throw new Error(error.message || error.error || "Failed to fetch data");
  }
  return res.json();
};

// Fetch filter options (tokens, chains)
export function useFilterOptions() {
  const { data, error, isLoading } = useSWR<FiltersResponse>(
    "/api/filters",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3600000, // 1 hour
    }
  );

  return {
    tokens: data?.tokens || [],
    chains: data?.chains || [],
    error: error?.message,
    isLoading,
  };
}

// Fetch overview data
export function useOverviewData() {
  const { queryString } = useFilters();

  const { data, error, isLoading, mutate } = useSWR<OverviewResponse>(
    `/api/overview${queryString ? `?${queryString}` : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    data,
    error: error?.message,
    isLoading,
    refresh: mutate,
  };
}

// Fetch P2P data
export function useP2PData() {
  const { queryString } = useFilters();

  const { data, error, isLoading, mutate } = useSWR<P2PResponse>(
    `/api/p2p${queryString ? `?${queryString}` : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    error: error?.message,
    isLoading,
    refresh: mutate,
  };
}

// Fetch network data
export function useNetworkData(weekStart?: string) {
  const { queryString } = useFilters();

  let url = `/api/network${queryString ? `?${queryString}` : ""}`;
  if (weekStart) {
    url += `${queryString ? "&" : "?"}week=${weekStart}`;
  }

  const { data, error, isLoading, mutate } = useSWR<NetworkResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    error: error?.message,
    isLoading,
    refresh: mutate,
  };
}

// Fetch DEX data
export function useDexData() {
  const { queryString } = useFilters();

  const { data, error, isLoading, mutate } = useSWR<DexResponse>(
    `/api/dex${queryString ? `?${queryString}` : ""}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    error: error?.message,
    isLoading,
    refresh: mutate,
  };
}
