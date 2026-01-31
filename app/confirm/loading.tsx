export default function ConfirmLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mt-6 text-center">
        <div className="skeleton mx-auto h-16 w-16 rounded-full" />
        <div className="skeleton mx-auto mb-2 mt-4 h-9 w-48" />
        <div className="skeleton mx-auto mb-8 h-5 w-40" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg bg-base-200 p-4"
          >
            <div className="skeleton h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton mt-8 h-48 w-full rounded-lg" />
    </main>
  );
}
