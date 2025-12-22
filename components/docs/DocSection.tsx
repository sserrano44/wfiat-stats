interface DocSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function DocSection({ id, title, children }: DocSectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
        {title}
      </h2>
      <div className="space-y-4 text-zinc-600 dark:text-zinc-300">
        {children}
      </div>
    </section>
  );
}
