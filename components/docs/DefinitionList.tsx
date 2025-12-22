interface Definition {
  term: string;
  definition: React.ReactNode;
}

interface DefinitionListProps {
  items: Definition[];
}

export function DefinitionList({ items }: DefinitionListProps) {
  return (
    <dl className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
          <dt className="font-medium text-zinc-900 dark:text-white">
            {item.term}
          </dt>
          <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {item.definition}
          </dd>
        </div>
      ))}
    </dl>
  );
}
