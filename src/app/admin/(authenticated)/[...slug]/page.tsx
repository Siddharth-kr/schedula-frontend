export default async function ComingSoonPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const rawTitle = slug[slug.length - 1] || "Module";
  const title = rawTitle.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-8 text-center shadow-sm">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-stone-100">
        <svg className="size-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="mb-3 text-2xl font-bold text-stone-900">{title} Module</h2>
      <p className="max-w-md text-stone-500">
        This section is currently under development. The full <strong className="font-semibold">{title}</strong> functionality will be introduced in an upcoming phase of the Schedula Admin Portal.
      </p>
      <div className="mt-8 rounded-full bg-stone-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-stone-500">
        Coming Soon
      </div>
    </div>
  );
}
