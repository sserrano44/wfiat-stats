"use client";

import type Graph from "graphology";
import { formatNumber } from "@/lib/utils/format";

interface GraphTooltipProps {
  nodeId: string | null;
  graph: Graph | null;
  position: { x: number; y: number } | null;
}

export function GraphTooltip({ nodeId, graph, position }: GraphTooltipProps) {
  if (!nodeId || !graph || !position || !graph.hasNode(nodeId)) {
    return null;
  }

  const attrs = graph.getNodeAttributes(nodeId);

  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      style={{
        left: position.x + 15,
        top: position.y - 10,
        maxWidth: 280,
      }}
    >
      <div className="mb-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
        {nodeId}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Cluster:</span>{" "}
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: attrs.color as string }}
          />{" "}
          <span className="font-medium text-zinc-900 dark:text-white">
            #{attrs.community}
          </span>
        </div>

        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Degree:</span>{" "}
          <span className="font-medium text-zinc-900 dark:text-white">
            {attrs.degree}
          </span>
        </div>

        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Volume:</span>{" "}
          <span className="font-medium text-zinc-900 dark:text-white">
            {formatNumber(attrs.totalVolume as number)}
          </span>
        </div>

        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Tx Count:</span>{" "}
          <span className="font-medium text-zinc-900 dark:text-white">
            {formatNumber(attrs.totalTxCount as number, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
