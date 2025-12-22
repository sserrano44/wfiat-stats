interface ErrorAlertProps {
  title?: string;
  message: string;
  fallback?: boolean;
  onRetry?: () => void;
}

export function ErrorAlert({
  title = "Error",
  message,
  fallback = false,
  onRetry,
}: ErrorAlertProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        fallback
          ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
          : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
      }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {fallback ? (
            <svg
              className="h-5 w-5 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3
            className={`text-sm font-medium ${
              fallback
                ? "text-amber-800 dark:text-amber-200"
                : "text-red-800 dark:text-red-200"
            }`}
          >
            {title}
          </h3>
          <p
            className={`mt-1 text-sm ${
              fallback
                ? "text-amber-700 dark:text-amber-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className={`mt-2 text-sm font-medium underline ${
                fallback
                  ? "text-amber-800 hover:text-amber-600 dark:text-amber-200 dark:hover:text-amber-100"
                  : "text-red-800 hover:text-red-600 dark:text-red-200 dark:hover:text-red-100"
              }`}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
