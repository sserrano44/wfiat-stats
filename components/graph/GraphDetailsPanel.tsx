"use client";

import { useState } from "react";
import type Graph from "graphology";
import { formatNumber } from "@/lib/utils/format";

interface GraphDetailsPanelProps {
  nodeId: string;
  graph: Graph | null;
  onClose: () => void;
  onFocusCommunity?: (communityId: number) => void;
}

export function GraphDetailsPanel({
  nodeId,
  graph,
  onClose,
  onFocusCommunity,
}: GraphDetailsPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!graph || !graph.hasNode(nodeId)) {
    return null;
  }

  const attrs = graph.getNodeAttributes(nodeId);

  // Get top neighbors by edge weight
  const neighbors: Array<{
    address: string;
    weight: number;
    direction: "in" | "out";
  }> = [];

  graph.forEachEdge(nodeId, (_edge, edgeAttrs, source, target) => {
    const isOutgoing = source === nodeId;
    neighbors.push({
      address: isOutgoing ? target : source,
      weight: edgeAttrs.weight as number,
      direction: isOutgoing ? "out" : "in",
    });
  });

  // Sort by weight and take top 10
  const topNeighbors = neighbors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(nodeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Count nodes in this community
  let communitySize = 0;
  const communityId = attrs.community as number;
  graph.forEachNode((_node, nodeAttrs) => {
    if (nodeAttrs.community === communityId) communitySize++;
  });

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Node Details
        </h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Address */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Address
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
              {nodeId}
            </code>
            <button
              onClick={handleCopy}
              className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Cluster Info */}
        <div className="flex items-center justify-between">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Cluster
            </label>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: attrs.color as string }}
              />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                #{communityId}
              </span>
              <span className="text-xs text-zinc-500">
                ({communitySize} nodes)
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {onFocusCommunity && (
              <button
                onClick={() => onFocusCommunity(communityId)}
                className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Focus
              </button>
            )}
            <a
              href={`/clusters?cluster=${communityId}`}
              className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
            >
              View
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Volume
            </label>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {formatNumber(attrs.totalVolume as number)}
            </p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Tx Count
            </label>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {formatNumber(attrs.totalTxCount as number, 0)}
            </p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400">
              In Degree
            </label>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {attrs.inDegree}
            </p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400">
              Out Degree
            </label>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {attrs.outDegree}
            </p>
          </div>
        </div>

        {/* Top Neighbors */}
        {topNeighbors.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Top Connections ({topNeighbors.length})
            </label>
            <div className="max-h-40 overflow-y-auto rounded border border-zinc-100 dark:border-zinc-800">
              {topNeighbors.map((neighbor, index) => (
                <div
                  key={`${neighbor.address}-${neighbor.direction}-${index}`}
                  className="flex items-center justify-between border-b border-zinc-50 px-2 py-1.5 last:border-0 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        neighbor.direction === "out"
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {neighbor.direction === "out" ? "→" : "←"}
                    </span>
                    <code className="text-xs text-zinc-600 dark:text-zinc-400">
                      {neighbor.address.slice(0, 8)}...{neighbor.address.slice(-4)}
                    </code>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {neighbor.weight.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
