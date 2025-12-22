"use client";

import { useState } from "react";

interface Column {
  key: string;
  header: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: unknown, row: any) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  columns: Column[];
  keyField: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable({
  data,
  columns,
  keyField,
  isLoading = false,
  emptyMessage = "No data available",
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortDirection === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      })
    : data;

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded mb-1"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 ${
                  alignClasses[column.align || "left"]
                } ${column.sortable ? "cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200" : ""}`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <span className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && sortKey === column.key && (
                    <span>{sortDirection === "asc" ? "^" : "v"}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={String(row[keyField]) || rowIndex}
              className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
            >
              {columns.map((column) => {
                const value = row[column.key];
                return (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-zinc-900 dark:text-zinc-100 ${
                      alignClasses[column.align || "left"]
                    }`}
                  >
                    {column.render
                      ? column.render(value, row)
                      : String(value ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
