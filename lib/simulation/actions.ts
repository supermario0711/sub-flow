"use server";

import { setSimulation, type SimulationState } from "./state";

/**
 * Server action to update the simulation state cookie.
 */
export async function updateSimulation(state: SimulationState): Promise<void> {
  await setSimulation(state);
}
