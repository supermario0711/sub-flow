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
import { autoConfirmBox } from "@/app/actions/box";
import { SimulationBanner } from "@/components/simulation/simulation-banner";
import { BoxView } from "@/components/box/box-view";
import { buildConversationContext } from "@/lib/conversation/context";
import { ConversationPage } from "@/components/conversation/conversation-page";

export const metadata = {
  title: "Your Box | Biokiste",
  description: "View and customize your weekly veggie box",
};

export default async function BoxPage() {
  const sim = await getSimulation();
  const vacation = await getActiveVacation(sim.userSlug);
  const skippedBox = await getSkippedBox(sim.userSlug);
  const result = await getCurrentBox(sim.userSlug);

  // If box is skipped, show skipped state (keep original BoxView)
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

  // Deadline passed → auto-confirm if draft, then redirect to confirmation
  if (hours <= 0) {
    if (box.status === "draft") {
      await autoConfirmBox(box.id);
    }
    redirect("/confirm");
  }

  // Build conversation context and item maps for the ConversationPage
  const context = await buildConversationContext(
    box.id,
    box.user_id,
    sim.userSlug
  );

  // Build item ID map: item name → { boxItemId, itemId }
  const itemIdMap: Record<string, { boxItemId: string; itemId: string }> = {};
  for (const item of items) {
    itemIdMap[item.items.name] = {
      boxItemId: item.id,
      itemId: item.items.id,
    };
  }

  // Build available items (full objects for quick-add + name→id map for side effects)
  const availableItems = await getAvailableSwapItems(box.id);
  const availableItemMap: Record<string, string> = {};
  const availableItemsFull = availableItems.map((item) => {
    availableItemMap[item.name] = item.id;
    return { id: item.id, name: item.name, emoji: item.emoji, category: item.category };
  });

  // Build item details map: item name → { emoji, category }
  const itemDetails: Record<string, { emoji: string; category: string }> = {};
  for (const item of items) {
    itemDetails[item.items.name] = {
      emoji: item.items.emoji,
      category: item.items.category,
    };
  }

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

      <ConversationPage
        context={context}
        boxId={box.id}
        userSlug={sim.userSlug}
        vacation={vacation}
        itemIdMap={itemIdMap}
        availableItemMap={availableItemMap}
        availableItemsFull={availableItemsFull}
        itemDetails={itemDetails}
      />
    </main>
  );
}
