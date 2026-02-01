import { NextResponse } from "next/server";
import { nextTurnRequestSchema } from "@/lib/types/conversation";
import { generateNextTurn } from "@/lib/conversation/generate";
import { getFallbackFirstTurn } from "@/lib/conversation/fallback";
import type { NextTurnRequest } from "@/lib/types/conversation";

export async function POST(request: Request) {
  let body: NextTurnRequest | null = null;

  try {
    const raw = await request.json();
    const parsed = nextTurnRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body.",
          },
        },
        { status: 400 }
      );
    }

    body = parsed.data as NextTurnRequest;

    // Check for force-fallback query param
    const url = new URL(request.url);
    const forceFallback = url.searchParams.get("fallback") === "1";

    if (forceFallback && body.history.length === 0) {
      const fallbackTurn = getFallbackFirstTurn(body.context);
      return NextResponse.json({
        success: true,
        turn: fallbackTurn,
        done: false,
        fallback: true,
      });
    }

    const result = await generateNextTurn(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[conversation] next-turn failed:", error);

    // Fallback: if this is the first turn, return rule-based turn
    if (body && body.history.length === 0) {
      const fallbackTurn = getFallbackFirstTurn(body.context);
      return NextResponse.json({
        success: true,
        turn: fallbackTurn,
        done: false,
        fallback: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GENERATION_ERROR",
          message: "Failed to generate next turn.",
        },
      },
      { status: 500 }
    );
  }
}
