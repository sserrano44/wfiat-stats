interface Column {
  name: string;
  type: string;
  description: string;
}

interface TableSchemaProps {
  tableName: string;
  description?: string;
  columns: Column[];
}

export function TableSchema({ tableName, description, columns }: TableSchemaProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-700">
        <h4 className="font-mono font-semibold text-zinc-900 dark:text-white">
          {tableName}
        </h4>
        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Column</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Description</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => (
              <tr key={col.name} className="border-b border-zinc-50 dark:border-zinc-800/50">
                <td className="px-4 py-2 font-mono text-zinc-900 dark:text-zinc-100">{col.name}</td>
                <td className="px-4 py-2 font-mono text-zinc-500 dark:text-zinc-400">{col.type}</td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{col.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
