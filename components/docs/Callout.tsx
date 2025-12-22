type CalloutType = "info" | "warning" | "tip";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const styles: Record<CalloutType, { border: string; bg: string; title: string }> = {
  info: {
    border: "border-blue-300 dark:border-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    title: "text-blue-800 dark:text-blue-200",
  },
  warning: {
    border: "border-amber-300 dark:border-amber-700",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    title: "text-amber-800 dark:text-amber-200",
  },
  tip: {
    border: "border-green-300 dark:border-green-700",
    bg: "bg-green-50 dark:bg-green-900/20",
    title: "text-green-800 dark:text-green-200",
  },
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  const s = styles[type];
  return (
    <div className={`rounded-lg border p-4 ${s.border} ${s.bg}`}>
      {title && (
        <p className={`mb-2 font-medium ${s.title}`}>{title}</p>
      )}
      <div className="text-sm text-zinc-700 dark:text-zinc-300">{children}</div>
    </div>
  );
}
