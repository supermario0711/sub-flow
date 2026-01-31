"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Skips the current week&apos;s box by setting its status to &apos;skipped&apos;.
 */
export async function skipWeek(boxId: string): Promise<ActionResult> {
  if (!UUID_RE.test(boxId)) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select("id, status")
    .eq("id", boxId)
    .single();

  if (boxError || !box) {
    return { success: false, error: "Box not found." };
  }

  if (box.status !== "draft" && box.status !== "confirmed") {
    return { success: false, error: "This box can no longer be skipped." };
  }

  const { error: updateError } = await supabase
    .from("boxes")
    .update({
      status: "skipped",
      confirmed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", boxId);

  if (updateError) {
    return { success: false, error: "Failed to skip box. Please try again." };
  }

  revalidatePath("/box");
  return { success: true };
}

/**
 * Adds a vacation for a user and skips any draft boxes in the date range.
 * Creates skipped boxes for weeks in the range that don&apos;t have a box yet.
 */
export async function addVacation(
  userSlug: string,
  startDate: string,
  endDate: string
): Promise<ActionResult> {
  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { success: false, error: "Invalid dates." };
  }

  if (end < start) {
    return { success: false, error: "End date must be on or after start date." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    return { success: false, error: "Start date must be today or later." };
  }

  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("slug", userSlug)
    .single();

  if (!user) {
    return { success: false, error: "User not found." };
  }

  // Insert vacation
  const { error: insertError } = await supabase.from("vacations").insert({
    user_id: user.id,
    start_date: startDate,
    end_date: endDate,
  });

  if (insertError) {
    return { success: false, error: "Failed to schedule vacation." };
  }

  // Skip any draft or confirmed boxes whose week_start falls in the range
  await supabase
    .from("boxes")
    .update({ status: "skipped", confirmed_at: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("status", ["draft", "confirmed"])
    .gte("week_start", startDate)
    .lte("week_start", endDate);

  // Create skipped boxes for weeks in range that don&apos;t have a box
  const weekStarts = getWeekStartsInRange(startDate, endDate);

  for (const weekStart of weekStarts) {
    const { data: existing } = await supabase
      .from("boxes")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (!existing) {
      const lockAt = new Date(weekStart);
      lockAt.setDate(lockAt.getDate() + 5); // Friday
      lockAt.setHours(18, 0, 0, 0);

      await supabase.from("boxes").insert({
        user_id: user.id,
        week_start: weekStart,
        lock_at: lockAt.toISOString(),
        status: "skipped",
      });
    }
  }

  revalidatePath("/box");
  return { success: true };
}

/**
 * Cancels a vacation and un-skips boxes in the date range.
 */
export async function cancelVacation(
  vacationId: string
): Promise<ActionResult> {
  if (!UUID_RE.test(vacationId)) {
    return { success: false, error: "Invalid request." };
  }

  const supabase = await createClient();

  // Fetch vacation to get date range and user
  const { data: vacation, error: vacError } = await supabase
    .from("vacations")
    .select("id, user_id, start_date, end_date")
    .eq("id", vacationId)
    .single();

  if (vacError || !vacation) {
    return { success: false, error: "Vacation not found." };
  }

  // Delete vacation
  const { error: deleteError } = await supabase
    .from("vacations")
    .delete()
    .eq("id", vacationId);

  if (deleteError) {
    return { success: false, error: "Failed to cancel vacation." };
  }

  // Un-skip boxes in the range that are still skipped
  await supabase
    .from("boxes")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("user_id", vacation.user_id)
    .eq("status", "skipped")
    .gte("week_start", vacation.start_date)
    .lte("week_start", vacation.end_date);

  revalidatePath("/box");
  return { success: true };
}

/**
 * Returns an array of Monday dates (YYYY-MM-DD) for each week
 * that overlaps with the given date range.
 */
function getWeekStartsInRange(startDate: string, endDate: string): string[] {
  const starts: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Find the Monday on or before start
  const current = new Date(start);
  const day = current.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 1
  current.setDate(current.getDate() - diff);

  while (current <= end) {
    starts.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 7);
  }

  return starts;
}
