"use client";

import type { GraphControlState, WeightMetric, ScaleType } from "@/lib/types/graph";

interface GraphControlsProps {
  state: GraphControlState;
  isLayoutRunning: boolean;
  onStartLayout: () => void;
  onStopLayout: () => void;
  onStabilize: () => void;
  onChange: (updates: Partial<GraphControlState>) => void;
}

export function GraphControls({
  state,
  isLayoutRunning,
  onStartLayout,
  onStopLayout,
  onStabilize,
  onChange,
}: GraphControlsProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">
        Graph Controls
      </h3>

      <div className="space-y-4">
        {/* Weight Metric */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Size By
          </label>
          <div className="flex gap-2">
            {(["volume", "txCount"] as WeightMetric[]).map((metric) => (
              <button
                key={metric}
                onClick={() => onChange({ metric })}
                className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  state.metric === metric
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {metric === "volume" ? "Volume" : "Tx Count"}
              </button>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Scale
          </label>
          <div className="flex gap-2">
            {(["linear", "log"] as ScaleType[]).map((scale) => (
              <button
                key={scale}
                onClick={() => onChange({ scale })}
                className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  state.scale === scale
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {scale === "linear" ? "Linear" : "Log"}
              </button>
            ))}
          </div>
        </div>

        {/* Max Nodes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Max Nodes: {state.maxNodes}
          </label>
          <select
            value={state.maxNodes}
            onChange={(e) => onChange({ maxNodes: parseInt(e.target.value) })}
            className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          >
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value={1000}>1,000</option>
            <option value={2000}>2,000</option>
            <option value={3000}>3,000</option>
            <option value={5000}>5,000</option>
            <option value={10000}>10,000</option>
          </select>
        </div>

        {/* Hide Isolated */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Hide Isolated Nodes
          </label>
          <button
            onClick={() => onChange({ hideIsolated: !state.hideIsolated })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              state.hideIsolated ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                state.hideIsolated ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Layout Controls */}
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Layout
          </label>
          <div className="flex gap-2">
            {isLayoutRunning ? (
              <button
                onClick={onStopLayout}
                className="flex-1 rounded bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={onStartLayout}
                className="flex-1 rounded bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
              >
                Start
              </button>
            )}
            <button
              onClick={onStabilize}
              disabled={isLayoutRunning}
              className="flex-1 rounded bg-zinc-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
            >
              Stabilize
            </button>
          </div>
          {isLayoutRunning && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Layout running...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
