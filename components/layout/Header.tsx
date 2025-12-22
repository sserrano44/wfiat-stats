"use client";

import { usePathname } from "next/navigation";

const pageNames: Record<string, string> = {
  "/overview": "Overview",
  "/p2p": "P2P Transfers",
  "/network": "Network Analysis",
  "/dex": "DEX Trading",
  "/docs": "Documentation",
};

export function Header() {
  const pathname = usePathname();
  const pageName = pageNames[pathname] || "Dashboard";

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
        {pageName}
      </h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          UTC timezone
        </span>
      </div>
    </header>
  );
}
