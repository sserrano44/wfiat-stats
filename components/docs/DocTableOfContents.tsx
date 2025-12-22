"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  label: string;
}

interface DocTableOfContentsProps {
  items: TocItem[];
}

export function DocTableOfContents({ items }: DocTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -35% 0%" }
    );

    items.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-6 hidden lg:block">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">
        On this page
      </h3>
      <ul className="space-y-2 border-l border-zinc-200 dark:border-zinc-700">
        {items.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`-ml-px block border-l-2 py-1 pl-4 text-sm transition-colors ${
                activeId === id
                  ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
