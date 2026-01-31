/**
 * Skeleton loader matching BoxItemCard dimensions.
 * Renders 5 placeholder cards with shimmer animation.
 */
export function BoxSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading box items"
      className="flex flex-col gap-3"
    >
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
  );
}
