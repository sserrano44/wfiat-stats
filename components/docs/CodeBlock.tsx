"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  title?: string;
}

export function CodeBlock({ code, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-4">
        <code className="text-sm text-zinc-800 dark:text-zinc-200">
          {code}
        </code>
      </pre>
    </div>
  );
}
