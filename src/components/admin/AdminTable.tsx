import React, { ReactNode } from "react";
import { AdminEmptyState } from "./AdminEmptyState";

export interface AdminTableColumn<T> {
  key: string;
  title: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function AdminTable<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyStateTitle = "No records found", 
  emptyStateMessage = "There are no records to display at this time.",
  onRowClick,
  className = ""
}: AdminTableProps<T>) {
  
  if (data.length === 0) {
    return (
      <div className={`rounded-2xl border border-border bg-white shadow-sm overflow-hidden ${className}`}>
        <AdminEmptyState title={emptyStateTitle} description={emptyStateMessage} className="border-none rounded-none bg-white" />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-white shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-border">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-6 py-3.5 font-medium tracking-wide ${col.className || ""}`}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr 
                key={keyExtractor(item)} 
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-blue-50/60" : "hover:bg-blue-50/30"}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 ${col.className || ""}`}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
