import { redirect } from "next/navigation";
import {
  getCurrentBox,
  getAvailableSwapItems,
  getActiveVacation,
  getSkippedBox,
} from "@/lib/services/box";
import { getSimulation } from "@/lib/simulation/state";
import { getSimulatedNow } from "@/lib/simulation/clock";
import { getTimeMode, getHoursUntilLock } from "@/lib/simulation/time";
import { SimulationBanner } from "@/components/simulation/simulation-banner";
import { BoxView } from "@/components/box/box-view";

export const metadata = {
  title: "Your Box | Biokiste",
  description: "View and customize your weekly veggie box",
};

export default async function BoxPage() {
  const sim = await getSimulation();
  const vacation = await getActiveVacation(sim.userSlug);
  const skippedBox = await getSkippedBox(sim.userSlug);
  const result = await getCurrentBox(sim.userSlug);

  // If box is skipped, show skipped state
  if (skippedBox && !result) {
    const simulatedNow = getSimulatedNow(
      skippedBox.lock_at,
      sim.hoursUntilLock
    );
    const hours = getHoursUntilLock(skippedBox.lock_at, simulatedNow);
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
          Week of{" "}
          {new Date(skippedBox.week_start).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <BoxView
          box={skippedBox}
          items={[]}
          timeMode={sim.hoursUntilLock !== null ? timeMode : "relaxed"}
          hoursUntilLock={sim.hoursUntilLock !== null ? hours : 999}
          availableItems={[]}
          vacation={vacation}
          isSkipped
          userSlug={sim.userSlug}
        />
      </main>
    );
  }

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

  // Confirmed + deadline passed → redirect to confirmation page
  if (box.status === "confirmed" && hours <= 0) {
    redirect("/confirm");
  }

  const availableItems = await getAvailableSwapItems(box.id);

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
        Week of{" "}
        {new Date(box.week_start).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <BoxView
        box={box}
        items={items}
        timeMode={sim.hoursUntilLock !== null ? timeMode : "relaxed"}
        hoursUntilLock={sim.hoursUntilLock !== null ? hours : 999}
        availableItems={availableItems}
        vacation={vacation}
        userSlug={sim.userSlug}
      />
    </main>
  );
}
