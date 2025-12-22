import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  isLoading = false,
  error,
  onRetry,
  children,
}: ChartContainerProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : (
        children
      )}
    </div>
  );
}
