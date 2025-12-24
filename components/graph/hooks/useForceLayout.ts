"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import type Graph from "graphology";

// ForceAtlas2 settings optimized for BubbleMaps-like visualization
const FA2_SETTINGS = {
  barnesHutOptimize: true,
  barnesHutTheta: 0.5,
  gravity: 0.05,
  scalingRatio: 10,
  strongGravityMode: false,
  adjustSizes: true,
};

interface UseForceLayoutOptions {
  onStart?: () => void;
  onStop?: () => void;
}

interface ForceLayoutReturn {
  start: () => void;
  stop: () => void;
  stabilize: (iterations?: number) => void;
  isRunning: boolean;
}

export function useForceLayout(
  graph: Graph | null,
  options: UseForceLayoutOptions = {}
): ForceLayoutReturn {
  // Using any for the layout instance as the worker type is complex
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layoutRef = useRef<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (layoutRef.current) {
        try {
          layoutRef.current.kill();
        } catch {
          // Layout may already be killed
        }
        layoutRef.current = null;
      }
    };
  }, []);

  const start = useCallback(async () => {
    if (!graph || isRunning || graph.order === 0) return;

    try {
      // Dynamic import of the worker version
      const FA2LayoutModule = await import("graphology-layout-forceatlas2/worker");
      const FA2Layout = FA2LayoutModule.default;

      // Calculate slowDown based on graph size
      const slowDown = 1 + Math.log(graph.order + 1);

      layoutRef.current = new FA2Layout(graph, {
        settings: {
          ...FA2_SETTINGS,
          slowDown,
        },
      });

      layoutRef.current.start();
      setIsRunning(true);
      options.onStart?.();
    } catch (error) {
      console.error("Failed to start ForceAtlas2 layout:", error);
    }
  }, [graph, isRunning, options]);

  const stop = useCallback(() => {
    if (layoutRef.current && isRunning) {
      try {
        layoutRef.current.stop();
      } catch {
        // May fail if already stopped
      }
      setIsRunning(false);
      options.onStop?.();
    }
  }, [isRunning, options]);

  const stabilize = useCallback(
    async (iterations: number = 100) => {
      if (!graph || graph.order === 0) return;

      try {
        // Use synchronous version for quick stabilization
        const forceAtlas2 = await import("graphology-layout-forceatlas2");
        forceAtlas2.default.assign(graph, {
          iterations,
          settings: FA2_SETTINGS,
        });
      } catch (error) {
        console.error("Failed to stabilize layout:", error);
      }
    },
    [graph]
  );

  return { start, stop, stabilize, isRunning };
}
