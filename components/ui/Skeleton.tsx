interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
      <Skeleton className="h-5 w-40 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
