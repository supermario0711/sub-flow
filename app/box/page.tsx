import { getCurrentBox } from "@/lib/services/box";
import { getSimulation } from "@/lib/simulation/state";
import { getSimulatedNow } from "@/lib/simulation/clock";
import { getTimeMode, getHoursUntilLock } from "@/lib/simulation/time";
import { SimulationBanner } from "@/components/simulation/simulation-banner";

export const metadata = {
  title: "Your Box | Biokiste",
  description: "View and customize your weekly veggie box",
};

export default async function BoxPage() {
  const sim = await getSimulation();
  const result = await getCurrentBox(sim.userSlug);

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-base-content/60">No box found for this week.</p>
      </main>
    );
  }

  const { box, items } = result;

  const simulatedNow = getSimulatedNow(box.lock_at, sim.hoursUntilLock);
  const hours = getHoursUntilLock(box.lock_at, simulatedNow);
  const timeMode = getTimeMode(hours);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <SimulationBanner
        userSlug={sim.userSlug}
        hoursUntilLock={sim.hoursUntilLock !== null ? hours : null}
        timeMode={sim.hoursUntilLock !== null ? timeMode : null}
      />

      <h1 className="mb-2 mt-6 text-3xl font-semibold tracking-tight">
        Your Box
      </h1>
      <p className="mb-8 text-base-content/60">
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
            className="flex items-center gap-4 rounded-lg bg-base-200 p-4"
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
