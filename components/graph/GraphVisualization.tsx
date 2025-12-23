"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import useSWR from "swr";
import { useFilters } from "@/hooks/useFilters";
import { useGraphState } from "./hooks/useGraph";
import {
  buildGraph,
  applyCommunities,
  computeNodeSizes,
} from "./utils/graphBuilder";
import { GraphControls } from "./GraphControls";
import { GraphTooltip } from "./GraphTooltip";
import { GraphDetailsPanel } from "./GraphDetailsPanel";
import { GraphSearch } from "./GraphSearch";
import { GraphLegend } from "./GraphLegend";
import { useForceLayout } from "./hooks/useForceLayout";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";
import type { GraphResponse } from "@/lib/types/graph";
import type { ApiError } from "@/lib/types/api";

interface GraphVisualizationProps {
  weekStart: string;
}

const fetcher = async (url: string): Promise<GraphResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = (await res.json()) as ApiError;
    throw new Error(error.message || error.error);
  }
  return res.json();
};

// ForceAtlas2 settings
const FA2_SETTINGS = {
  barnesHutOptimize: true,
  barnesHutTheta: 0.5,
  gravity: 0.05,
  scalingRatio: 10,
  strongGravityMode: false,
  adjustSizes: true,
};

export function GraphVisualization({ weekStart }: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);

  const { start: startLayout, stop: stopLayout, isRunning: isLayoutRunning } = useForceLayout(
    graphRef.current,
    { onStop: () => sigmaRef.current?.refresh() }
  );

  const { filters } = useFilters();
  const [state, dispatch] = useGraphState();
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null
  );

  // Build API URL with filters
  const tierParam = typeof filters.p2pTier === "number" ? `&tier=${filters.p2pTier}` : "";
  const apiUrl = `/api/graph/weekly?week_start=${weekStart}&token=${filters.token}&chain=${filters.chain}${tierParam}&max_nodes=${state.controls.maxNodes}&metric=${state.controls.metric}`;

  const { data, error, isLoading, mutate } = useSWR<GraphResponse>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Build graph when data changes
  useEffect(() => {
    if (!data || !data.nodes.length) {
      graphRef.current = null;
      dispatch({ type: "SET_GRAPH_READY", payload: false });
      return;
    }

    const graph = buildGraph(data);
    applyCommunities(graph);
    computeNodeSizes(graph, state.controls.metric, state.controls.scale);
    graphRef.current = graph;

    // Run initial stabilization synchronously
    try {
      forceAtlas2.assign(graph, { iterations: 50, settings: FA2_SETTINGS });
    } catch (e) {
      console.error("Layout stabilization error:", e);
    }

    dispatch({ type: "SET_GRAPH_READY", payload: true });
  }, [data, state.controls.metric, state.controls.scale, dispatch]);

  // Initialize Sigma when graph is ready
  useEffect(() => {
    if (!containerRef.current || !graphRef.current || !state.graphReady) {
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
      return;
    }

    // Kill existing instance
    if (sigmaRef.current) {
      sigmaRef.current.kill();
    }

    const graph = graphRef.current;

    // Create new Sigma instance
    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeColor: "#333333",
      defaultNodeColor: "#666666",
      labelColor: { color: "#ffffff" },
      labelSize: 10,
      labelRenderedSizeThreshold: 12,
      edgeLabelSize: 8,
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
    });

    // Handle hover
    sigma.on("enterNode", ({ node }) => {
      dispatch({ type: "SET_HOVERED_NODE", payload: node });

      // Get mouse position for tooltip
      const nodePosition = sigma.getNodeDisplayData(node);
      if (nodePosition) {
        setTooltipPos({ x: nodePosition.x, y: nodePosition.y });
      }
    });

    sigma.on("leaveNode", () => {
      dispatch({ type: "SET_HOVERED_NODE", payload: null });
      setTooltipPos(null);
    });

    // Handle click
    sigma.on("clickNode", ({ node }) => {
      dispatch({ type: "SET_SELECTED_NODE", payload: node });
    });

    sigma.on("clickStage", () => {
      dispatch({ type: "SET_SELECTED_NODE", payload: null });
    });

    sigmaRef.current = sigma;

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [state.graphReady, dispatch]);

  // Update rendering when interaction state changes
  useEffect(() => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;

    if (!sigma || !graph) return;

    const { hoveredNode, selectedNode, focusedCommunity } = state.interaction;

    // Set node reducer
    sigma.setSetting("nodeReducer", (node, data) => {
      const nodeData = { ...data };

      // Check if node exists in graph
      if (!graph.hasNode(node)) {
        nodeData.hidden = true;
        return nodeData;
      }

      const attrs = graph.getNodeAttributes(node);
      const community = attrs.community as number;

      // Community filter
      if (focusedCommunity !== null && community !== focusedCommunity) {
        nodeData.hidden = true;
        return nodeData;
      }

      // Hover/selection highlighting
      if (hoveredNode || selectedNode) {
        const activeNode = hoveredNode || selectedNode;
        if (graph.hasNode(activeNode!)) {
          const neighbors = new Set(graph.neighbors(activeNode!));

          if (node === activeNode) {
            nodeData.highlighted = true;
            nodeData.zIndex = 2;
          } else if (neighbors.has(node)) {
            nodeData.zIndex = 1;
          } else {
            nodeData.color = "#333333";
            nodeData.zIndex = 0;
          }
        }
      }

      return nodeData;
    });

    // Set edge reducer
    sigma.setSetting("edgeReducer", (edge, data) => {
      const edgeData = { ...data };

      // Check if edge exists in graph
      if (!graph.hasEdge(edge)) {
        edgeData.hidden = true;
        return edgeData;
      }

      const source = graph.source(edge);
      const target = graph.target(edge);

      // Community filter
      if (focusedCommunity !== null) {
        const sourceComm = graph.getNodeAttribute(source, "community");
        const targetComm = graph.getNodeAttribute(target, "community");
        if (sourceComm !== focusedCommunity || targetComm !== focusedCommunity) {
          edgeData.hidden = true;
          return edgeData;
        }
      }

      // Hover/selection highlighting
      if (hoveredNode || selectedNode) {
        const activeNode = hoveredNode || selectedNode;
        if (source === activeNode || target === activeNode) {
          edgeData.color = "#888888";
          edgeData.zIndex = 1;
        } else {
          edgeData.color = "#111111";
          edgeData.zIndex = 0;
        }
      }

      return edgeData;
    });

    sigma.refresh();
  }, [state.interaction, state.graphReady]);

  // Layout control functions
  const handleStabilize = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || graph.order === 0) return;

    try {
      forceAtlas2.assign(graph, { iterations: 100, settings: FA2_SETTINGS });
      sigmaRef.current?.refresh();
    } catch (e) {
      console.error("Layout stabilization error:", e);
    }
  }, []);

  // Handle search result
  const handleNodeFound = useCallback(
    (nodeId: string) => {
      dispatch({ type: "SET_SELECTED_NODE", payload: nodeId });

      // Zoom to node
      if (sigmaRef.current && graphRef.current?.hasNode(nodeId)) {
        const nodePosition = sigmaRef.current.getNodeDisplayData(nodeId);
        if (nodePosition) {
          sigmaRef.current.getCamera().animate(
            { x: nodePosition.x, y: nodePosition.y, ratio: 0.3 },
            { duration: 500 }
          );
        }
      }
    },
    [dispatch]
  );

  // Export graph data
  const handleExport = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graph-${weekStart}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, weekStart]);

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-900 dark:border-zinc-700">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-sm text-zinc-400">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load graph"
        message={error.message}
        onRetry={() => mutate()}
      />
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-900 dark:border-zinc-700">
        <div className="text-center">
          <p className="text-zinc-400">No graph data available for this week</p>
          <p className="mt-1 text-sm text-zinc-500">
            Try selecting a different week or adjusting filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Main graph area */}
      <div className="relative flex-1">
        <div
          ref={containerRef}
          className="h-[600px] rounded-lg border border-zinc-200 bg-zinc-950 dark:border-zinc-700"
        />

        {/* Tooltip */}
        <GraphTooltip
          nodeId={state.interaction.hoveredNode}
          graph={graphRef.current}
          position={tooltipPos}
        />

        {/* Stats overlay */}
        <div className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs text-white">
          {data.meta.totalNodes.toLocaleString()} nodes ·{" "}
          {data.meta.totalEdges.toLocaleString()} edges
          {state.controls.maxNodes < data.meta.totalNodes && (
            <span className="text-amber-400">
              {" "}
              (showing top {state.controls.maxNodes})
            </span>
          )}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-72 shrink-0 space-y-4">
        <GraphSearch
          value={state.interaction.searchQuery}
          onChange={(q) => dispatch({ type: "SET_SEARCH_QUERY", payload: q })}
          graph={graphRef.current}
          onNodeFound={handleNodeFound}
        />

        <GraphControls
          state={state.controls}
          isLayoutRunning={isLayoutRunning}
          onStartLayout={startLayout}
          onStopLayout={stopLayout}
          onStabilize={handleStabilize}
          onChange={(updates) =>
            dispatch({ type: "UPDATE_CONTROLS", payload: updates })
          }
        />

        <GraphLegend
          graph={graphRef.current}
          focusedCommunity={state.interaction.focusedCommunity}
          onFocusCommunity={(id) =>
            dispatch({ type: "SET_FOCUSED_COMMUNITY", payload: id })
          }
        />

        {state.interaction.selectedNode && (
          <GraphDetailsPanel
            nodeId={state.interaction.selectedNode}
            graph={graphRef.current}
            onClose={() => dispatch({ type: "SET_SELECTED_NODE", payload: null })}
            onFocusCommunity={(id) =>
              dispatch({ type: "SET_FOCUSED_COMMUNITY", payload: id })
            }
          />
        )}

        {/* Export button */}
        <button
          onClick={handleExport}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Export Graph JSON
        </button>
      </div>
    </div>
  );
}
