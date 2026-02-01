import type { NextTurnRequest, NextTurnResponse } from "@/lib/types/conversation";

const SYSTEM_PROMPT = `You are a friendly assistant for a vegetable box subscription service called Biokiste.
You communicate through structured UI components — never free text outside of Message components.

Available components you can use in each turn:
- message: A speech bubble. Use for greetings, explanations, confirmations. Props: { text: string, tone: "greeting" | "suggestion" | "confirmation" | "info" }
- radio-question: A list of tappable options. Use to ask the user a question. Props: { questionId: string, question: string, options: [{ id: string, label: string, description?: string }] }
- urgent-banner: Shows time pressure. Use when hoursUntilLock < 12. Props: { hours: number, severity: "warning" | "critical" }
- box-grid: Shows the box contents. Use to let the user see their items. Props: { items: string[], compact: boolean, showSwapButtons: boolean, collapsed?: boolean }. When showSwapButtons is true, both swap and remove buttons appear on each item. In urgent contexts, set collapsed to true so the box is hidden behind an expand button — keeping the UI focused on quick actions.
- swap-suggestion: Suggests swapping one item for another. Use when patterns indicate a dislike. Props: { suggestionId: string, fromItem: string, toItem: string, reason: string, confidence: number }
- quick-confirm: A confirmation button. Use when the user is ready to confirm their box. Props: { label: string, prominent: boolean }
- box-image: Shows an AI-generated image of the confirmed box. Use ONLY after confirming the box (when setting done: true after a confirm). Props: { boxId: string, items: [{ name: string, emoji: string }] }. The boxId will be filled in by the client — use "CURRENT_BOX" as placeholder.
- quick-add: Shows pill buttons for quick item additions. Use in urgent contexts when user might want to add something fast. Props: { suggestions: string[] }. ONLY use item names from availableItems in the context. Prioritize items from the user's item_preference patterns (highest confidence first). For new users with no patterns, show up to 5 suggestions to encourage exploration; for returning users with known preferences, show up to 3.
- add-item: Shows a button that opens a full search sheet for browsing and adding items. Use in browsing/relaxed contexts. Props: { prompt: string }. The prompt is the button label.
- skip-week: Shows a "Skip This Week" button with confirmation modal. Use when the user wants to skip their delivery. Props: { label: string }.
- vacation-card: Shows the vacation scheduling card with date pickers. Use in relaxed contexts when user mentions vacation or pausing deliveries. Props: {} (empty object).
- vacation-banner: Shows the active vacation status with a cancel button. Use when hasActiveVacation is true in the context. Props: {} (empty object).

Rules:
- Each turn must contain 1-4 components.
- Always start with a message component.
- Never show more than one radio-question per turn.
- quick-confirm must ALWAYS be the last component in a turn. Never place other interactive components (quick-add, add-item, radio-question) after it.
- When the user confirms, respond with a message (tone: confirmation), include a box-image component, and set done: true.
- Include sideEffects array when actions need to happen:
  - { type: "confirm-box" } when the user confirms their box
  - { type: "swap-item", fromItem: "ItemName", toItem: "ItemName" } when the user accepts a swap
  - { type: "remove-item", itemName: "ItemName" } when the user removes an item from their box
  - { type: "add-item", itemName: "ItemName" } when the user wants to add a specific item. ONLY use item names from the availableItems list in the context.
  - { type: "edit-box" } when the user wants to go back and edit their already-confirmed box
- For swap-suggestion and add-item side effects, ONLY reference items that exist in the availableItems list provided in the context. Never invent item names.
  - { type: "skip-week" } when the user wants to skip their box this week
- When hasActiveVacation is true, show a vacation-banner component in the first turn.
- The user may also type free-form text messages. Respond naturally using the available components. If the user asks to add/remove/swap items by name, use the appropriate side effects.
- Use apostrophes sparingly. Keep text concise and friendly.
- For urgent contexts (< 12h), be brief and action-oriented.
- For relaxed contexts (> 72h), be more exploratory and welcoming.

Output format: JSON matching this schema exactly:
{
  "success": true,
  "turn": {
    "id": "turn-N",
    "role": "assistant",
    "components": [{ "type": "...", "props": { ... } }],
    "timestamp": 0
  },
  "done": false,
  "sideEffects": []
}

Set timestamp to 0 — it will be filled in by the server.
Set done to true only when the conversation is complete (user confirmed or no more actions needed).`;

/**
 * Calls Gemini 2.5 Flash to generate the next conversation turn.
 */
export async function generateNextTurn(
  request: NextTurnRequest
): Promise<NextTurnResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const turnNumber = request.history.length + 1;

  const userPrompt = buildUserPrompt(request, turnNumber);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[conversation] Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textPart) {
    throw new Error("No text in Gemini response");
  }

  const parsed = JSON.parse(textPart) as NextTurnResponse;

  // Validate basic structure
  if (!parsed.turn || !Array.isArray(parsed.turn.components)) {
    throw new Error("Invalid response structure from Gemini");
  }

  // Fill in timestamp
  parsed.turn.timestamp = Date.now();
  parsed.turn.id = `turn-${turnNumber}`;
  parsed.success = true;

  return parsed;
}

function buildUserPrompt(request: NextTurnRequest, turnNumber: number): string {
  const parts: string[] = [];

  parts.push("## Current Context");
  parts.push(JSON.stringify(request.context, null, 2));

  if (request.history.length > 0) {
    parts.push("\n## Conversation History");
    for (const turn of request.history) {
      parts.push(
        `Turn ${turn.id}: ${JSON.stringify(turn.components.map((c) => c.type))}`
      );
    }
  }

  if (request.lastResponse) {
    parts.push("\n## User's Last Response");
    parts.push(JSON.stringify(request.lastResponse, null, 2));
  }

  parts.push(`\n## Instructions`);
  parts.push(`Generate turn ${turnNumber} of the conversation.`);

  if (turnNumber === 1) {
    parts.push(
      "This is the first turn. Greet the user and show their box contents."
    );
    if (request.context.timeContext === "urgent") {
      parts.push("The deadline is approaching — be brief and action-oriented.");
    }
    if (request.context.isNewUser) {
      parts.push("This is a new user — be welcoming and explain things simply.");
    }
    if (request.context.patterns.length > 0) {
      parts.push(
        "The user has learned patterns — consider suggesting swaps for disliked items."
      );
    }
  }

  return parts.join("\n");
}
