import { BoxSkeleton } from "@/components/box/box-skeleton";

export default function BoxLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="skeleton mb-2 mt-6 h-9 w-40" />
      <div className="skeleton mb-8 h-5 w-56" />
      <BoxSkeleton />
      <div className="skeleton mt-6 h-12 w-full rounded-lg" />
    </main>
  );
}
