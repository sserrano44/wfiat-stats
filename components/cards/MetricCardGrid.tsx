import { MetricCard } from "./MetricCard";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface MetricCardGridProps {
  metrics: Array<{
    title: string;
    value: number;
    subtitle?: string;
    format?: "number" | "compact" | "percent";
  }>;
  isLoading?: boolean;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function MetricCardGrid({
  metrics,
  isLoading = false,
  columns = 4,
}: MetricCardGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${gridCols[columns]}`}>
        {Array.from({ length: columns }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${gridCols[columns]}`}>
      {metrics.map((metric, i) => (
        <MetricCard
          key={i}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          format={metric.format}
        />
      ))}
    </div>
  );
}
