"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";

// Dynamic import with SSR disabled - Sigma.js requires browser APIs
const GraphVisualization = dynamic(
  () =>
    import("./GraphVisualization").then((mod) => mod.GraphVisualization),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-900 dark:border-zinc-700">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-sm text-zinc-400">
            Loading graph visualization...
          </p>
        </div>
      </div>
    ),
  }
);

interface ForceGraphProps {
  weekStart: string;
}

export function ForceGraph({ weekStart }: ForceGraphProps) {
  return <GraphVisualization weekStart={weekStart} />;
}
