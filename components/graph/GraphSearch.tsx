"use client";

import { useState, useCallback } from "react";
import type Graph from "graphology";

interface GraphSearchProps {
  value: string;
  onChange: (value: string) => void;
  graph: Graph | null;
  onNodeFound?: (nodeId: string) => void;
}

export function GraphSearch({
  value,
  onChange,
  graph,
  onNodeFound,
}: GraphSearchProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(() => {
    if (!graph || !value.trim()) {
      setError(null);
      return;
    }

    const searchTerm = value.trim().toLowerCase();

    // Try to find exact match first
    if (graph.hasNode(searchTerm)) {
      setError(null);
      onNodeFound?.(searchTerm);
      return;
    }

    // Try case-insensitive match
    let foundNode: string | null = null;
    graph.forEachNode((nodeId) => {
      if (nodeId.toLowerCase() === searchTerm) {
        foundNode = nodeId;
      }
    });

    if (foundNode) {
      setError(null);
      onNodeFound?.(foundNode);
      return;
    }

    // Try partial match (starts with)
    graph.forEachNode((nodeId) => {
      if (!foundNode && nodeId.toLowerCase().startsWith(searchTerm)) {
        foundNode = nodeId;
      }
    });

    if (foundNode) {
      setError(null);
      onNodeFound?.(foundNode);
      return;
    }

    setError("Address not found in graph");
  }, [graph, value, onNodeFound]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Search Address
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="0x..."
          className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        />
        <button
          onClick={handleSearch}
          disabled={!value.trim()}
          className="rounded bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          Find
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
