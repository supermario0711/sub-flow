import "server-only";

import { cookies } from "next/headers";

export type UserSlug = "sarah" | "mark" | "lisa";

export type SimulationState = {
  userSlug: UserSlug;
  hoursUntilLock: number | null;
};

const COOKIE_NAME = "sim";

const DEFAULT_STATE: SimulationState = {
  userSlug: "sarah",
  hoursUntilLock: null,
};

/**
 * Reads the simulation state from the `sim` cookie.
 * Returns defaults if missing or invalid.
 */
export async function getSimulation(): Promise<SimulationState> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;

  if (!raw) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(raw);
    return {
      userSlug: ["sarah", "mark", "lisa"].includes(parsed.userSlug)
        ? parsed.userSlug
        : DEFAULT_STATE.userSlug,
      hoursUntilLock:
        typeof parsed.hoursUntilLock === "number"
          ? parsed.hoursUntilLock
          : DEFAULT_STATE.hoursUntilLock,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Writes the simulation state to the `sim` cookie.
 */
export async function setSimulation(state: SimulationState): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(state), {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 day
  });
}
