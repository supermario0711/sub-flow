import { getCurrentBox } from "@/lib/services/box";

export const metadata = {
  title: "Your Box | Biokiste",
  description: "View and customize your weekly veggie box",
};

export default async function BoxPage() {
  const result = await getCurrentBox("sarah");

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-text-muted">No box found for this week.</p>
      </main>
    );
  }

  const { box, items } = result;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">
        Your Box
      </h1>
      <p className="mb-8 text-text-muted">
        Week of {new Date(box.week_start).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        {" "}&mdash; {box.status}
      </p>

      <ul className="flex flex-col gap-3">
        {items.map((boxItem) => (
          <li
            key={boxItem.id}
            className="flex items-center gap-4 rounded-lg bg-stone p-4"
          >
            <span className="text-3xl" role="img" aria-label={boxItem.items.name}>
              {boxItem.items.emoji}
            </span>
            <div>
              <p className="font-medium">{boxItem.items.name}</p>
              <span className="badge badge-ghost badge-sm capitalize">
                {boxItem.items.category}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
