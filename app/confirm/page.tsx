import Link from "next/link";
import { redirect } from "next/navigation";
import { getConfirmedBox } from "@/lib/services/box";
import { getSimulation } from "@/lib/simulation/state";
import { getSimulatedNow } from "@/lib/simulation/clock";
import { getTimeMode, getHoursUntilLock } from "@/lib/simulation/time";
import { SimulationBanner } from "@/components/simulation/simulation-banner";
import { ConfirmContent } from "@/components/confirm/confirm-content";

export const metadata = {
  title: "Box Confirmed | Biokiste",
  description: "Your weekly veggie box has been confirmed",
};

export default async function ConfirmPage() {
  const sim = await getSimulation();
  const result = await getConfirmedBox(sim.userSlug);

  if (!result) {
    redirect("/box");
  }

  const { box, items } = result;

  const simulatedNow = getSimulatedNow(box.lock_at, sim.hoursUntilLock);
  const hours = getHoursUntilLock(box.lock_at, simulatedNow);
  const timeMode = getTimeMode(hours);

  const weekLabel = new Date(box.week_start).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <SimulationBanner
        userSlug={sim.userSlug}
        hoursUntilLock={sim.hoursUntilLock !== null ? hours : null}
        timeMode={sim.hoursUntilLock !== null ? timeMode : null}
      />

      <ConfirmContent
        boxId={box.id}
        items={items}
        imageUrl={box.image_url}
        weekLabel={weekLabel}
      />

      {hours > 0 && (
        <Link
          href="/box"
          className="btn btn-outline mt-6 w-full min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          Edit Box
        </Link>
      )}

      {/* Recipe teaser — Phase 6 */}
      <section className="mt-4 rounded-lg border border-dashed border-base-300 p-6 text-center text-base-content/40">
        <p>Recipe suggestions coming in Phase 6</p>
      </section>
    </main>
  );
}
