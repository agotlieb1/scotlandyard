import type { MarioGameState, TurnAction, ActionType } from "./mario-types";
import type { GameCard } from "@/app/mario-house-party/types";

// Game constants
export const ACTIONS_PER_TURN = 3;
export const HAND_SIZE = 5;
export const MIN_CARDS_FOR_STEAL = 5; // Can only steal if you have fewer than 5 cards

/**
 * Check if the current turn has actions remaining
 */
export function hasActionsRemaining(state: MarioGameState): boolean {
  return state.actions_taken.length < ACTIONS_PER_TURN;
}

/**
 * Get remaining actions for the current turn
 */
export function getRemainingActions(state: MarioGameState): number {
  return Math.max(0, ACTIONS_PER_TURN - state.actions_taken.length);
}

/**
 * Check if steal action is available
 */
export function canSteal(state: MarioGameState, playerHandSize: number): boolean {
  return (
    !state.steal_used &&
    hasActionsRemaining(state) &&
    playerHandSize < MIN_CARDS_FOR_STEAL
  );
}

/**
 * Check if a specific action type is available
 */
export function canPerformAction(
  state: MarioGameState,
  actionType: ActionType,
  playerHandSize: number
): boolean {
  if (!hasActionsRemaining(state)) {
    return false;
  }

  if (actionType === "steal") {
    return canSteal(state, playerHandSize);
  }

  // Play and Tap actions are always available if actions remain
  return true;
}

/**
 * Check if the game is in final rounds (deck is empty)
 */
export function isFinalRounds(state: MarioGameState): boolean {
  return state.deck?.length === 0;
}

/**
 * Calculate how many cards the player should draw at end of turn
 */
export function getCardsToDraw(
  state: MarioGameState,
  currentHandSize: number
): number {
  if (isFinalRounds(state)) {
    return 0; // No drawing in final rounds
  }

  const needed = HAND_SIZE - currentHandSize;
  return Math.max(0, Math.min(needed, state.deck?.length ?? 0));
}

/**
 * Create a new turn action
 */
export function createTurnAction(
  type: ActionType,
  cardId?: string,
  targetPlayerId?: string
): TurnAction {
  return {
    type,
    timestamp: new Date().toISOString(),
    cardId,
    targetPlayerId,
  };
}

/**
 * Reset turn state (called when ending a turn)
 */
export function resetTurnState(): Pick<MarioGameState, "actions_taken" | "steal_used"> {
  return {
    actions_taken: [],
    steal_used: false,
  };
}

/**
 * Check if a card can be tapped
 */
export function canTapCard(card: GameCard): boolean {
  if (card.type === "monster") {
    return card.isTappable === true;
  }
  // Power-ups are played immediately, not tapped
  return false;
}

/**
 * Get action summary for display
 */
export function getActionSummary(actions: TurnAction[]): string {
  const counts = actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const parts: string[] = [];
  if (counts.play) parts.push(`${counts.play} Play`);
  if (counts.tap) parts.push(`${counts.tap} Tap`);
  if (counts.steal) parts.push(`${counts.steal} Steal`);

  return parts.join(", ") || "No actions taken";
}
