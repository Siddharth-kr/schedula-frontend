import React from "react";

export function AdminMetricSkeleton() {
  return <div className="h-28 bg-stone-100 rounded-2xl animate-pulse border border-border" />;
}

export function AdminTableSkeleton({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="w-full animate-pulse overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex border-b border-border bg-stone-50 px-6 py-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-stone-200 rounded mr-4 last:mr-0" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex px-6 py-5">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="flex-1 h-4 bg-stone-100 rounded mr-4 last:mr-0" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <AdminMetricSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 bg-stone-100 rounded-2xl animate-pulse border border-border" />
        <div className="h-96 bg-stone-100 rounded-2xl animate-pulse border border-border" />
      </div>
    </div>
  );
}
