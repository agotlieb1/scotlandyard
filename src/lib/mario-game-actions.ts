import { getSupabaseClient } from "./supabase/client";
import type { MarioGameState, ActionType, TurnAction } from "./mario-types";
import type { GameCard, MainHouse } from "@/app/mario-house-party/types";
import {
  createTurnAction,
  hasActionsRemaining,
  canPerformAction,
  resetTurnState,
  getCardsToDraw,
  isFinalRounds,
} from "./mario-game-rules";

/**
 * Record an action in the current turn
 */
export async function recordAction(
  gameCode: string,
  actionType: ActionType,
  cardId?: string,
  targetPlayerId?: string
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  // Fetch current state
  const { data: state, error: fetchError } = await supabase
    .from("mario_game_state")
    .select("*")
    .eq("game_code", gameCode)
    .maybeSingle();

  if (fetchError || !state) {
    return { error: fetchError?.message || "Game state not found." };
  }

  const currentState = state as MarioGameState;

  // Create new action
  const newAction = createTurnAction(actionType, cardId, targetPlayerId);

  // Update state
  const updatedActions = [...currentState.actions_taken, newAction];
  const updatedStealUsed = currentState.steal_used || actionType === "steal";

  const { error: updateError } = await supabase
    .from("mario_game_state")
    .update({
      actions_taken: updatedActions,
      steal_used: updatedStealUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", gameCode);

  if (updateError) {
    return { error: updateError.message };
  }

  return { ok: true };
}

/**
 * End the current player's turn
 */
export async function endTurn(gameCode: string, playerId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  // Fetch current state and players
  const [stateResult, playersResult] = await Promise.all([
    supabase
      .from("mario_game_state")
      .select("*")
      .eq("game_code", gameCode)
      .maybeSingle(),
    supabase
      .from("mario_game_players")
      .select("*")
      .eq("game_code", gameCode)
      .order("created_at"),
  ]);

  if (stateResult.error || !stateResult.data) {
    return { error: stateResult.error?.message || "Game state not found." };
  }

  if (playersResult.error || !playersResult.data) {
    return { error: playersResult.error?.message || "Players not found." };
  }

  const currentState = stateResult.data as MarioGameState;
  const players = playersResult.data;

  // Verify it's this player's turn
  if (currentState.current_turn_player_id !== playerId) {
    return { error: "It's not your turn." };
  }

  // Get current player
  const currentPlayer = players.find((p) => p.player_id === playerId);
  if (!currentPlayer) {
    return { error: "Player not found." };
  }

  // Calculate cards to draw
  const handSize = currentPlayer.hand?.length || 0;
  const cardsToDraw = getCardsToDraw(currentState, handSize);

  // Draw cards from deck
  const newHand = [...(currentPlayer.hand || [])];
  const newDeck = [...currentState.deck];

  for (let i = 0; i < cardsToDraw; i++) {
    if (newDeck.length > 0) {
      const card = newDeck.shift()!;
      newHand.push(card);
    }
  }

  // Determine next player
  const currentIndex = players.findIndex((p) => p.player_id === playerId);
  const nextIndex = (currentIndex + 1) % players.length;
  const nextPlayerId = players[nextIndex].player_id;

  // Check if entering final rounds
  const enteringFinalRounds = !isFinalRounds(currentState) && newDeck.length === 0;
  const newStatus = enteringFinalRounds ? "final_rounds" : undefined;

  // Update player's hand
  const { error: handError } = await supabase
    .from("mario_game_players")
    .update({
      hand: newHand,
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", gameCode)
    .eq("player_id", playerId);

  if (handError) {
    return { error: handError.message };
  }

  // Update game state
  const { error: stateError } = await supabase
    .from("mario_game_state")
    .update({
      deck: newDeck,
      current_turn_player_id: nextPlayerId,
      turn_number: currentState.turn_number + 1,
      ...resetTurnState(),
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", gameCode);

  if (stateError) {
    return { error: stateError.message };
  }

  // Update game status if entering final rounds
  if (newStatus) {
    const { error: statusError } = await supabase
      .from("mario_games")
      .update({ status: newStatus })
      .eq("code", gameCode);

    if (statusError) {
      return { error: statusError.message };
    }
  }

  return {
    ok: true,
    enteringFinalRounds,
    nextPlayerId,
  };
}

/**
 * Perform a steal action
 */
export async function stealCard(
  gameCode: string,
  thiefPlayerId: string,
  targetPlayerId: string
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  // Fetch players
  const { data: players, error: playersError } = await supabase
    .from("mario_game_players")
    .select("*")
    .eq("game_code", gameCode)
    .in("player_id", [thiefPlayerId, targetPlayerId]);

  if (playersError || !players || players.length !== 2) {
    return { error: "Could not find players." };
  }

  const thief = players.find((p) => p.player_id === thiefPlayerId);
  const target = players.find((p) => p.player_id === targetPlayerId);

  if (!thief || !target) {
    return { error: "Invalid players." };
  }

  // Validate steal conditions
  if ((thief.hand?.length || 0) >= 5) {
    return { error: "You must have fewer than 5 cards to steal." };
  }

  if ((target.hand?.length || 0) === 0) {
    return { error: "Target has no cards to steal." };
  }

  // Randomly select a card from target
  const targetHand = target.hand || [];
  const randomIndex = Math.floor(Math.random() * targetHand.length);
  const stolenCard = targetHand[randomIndex];

  // Update hands
  const newTargetHand = targetHand.filter(
    (_: GameCard, i: number) => i !== randomIndex
  );
  const newThiefHand = [...(thief.hand || []), stolenCard];

  // Update both players
  await Promise.all([
    supabase
      .from("mario_game_players")
      .update({
        hand: newThiefHand,
        updated_at: new Date().toISOString(),
      })
      .eq("game_code", gameCode)
      .eq("player_id", thiefPlayerId),
    supabase
      .from("mario_game_players")
      .update({
        hand: newTargetHand,
        updated_at: new Date().toISOString(),
      })
      .eq("game_code", gameCode)
      .eq("player_id", targetPlayerId),
  ]);

  // Record the action
  await recordAction(gameCode, "steal", undefined, targetPlayerId);

  return {
    ok: true,
    stolenCard,
  };
}

/**
 * Play a card from hand to a board
 */
export type PlayTarget = MainHouse | "in-play";

export async function playCard(
  gameCode: string,
  playerId: string,
  card: GameCard,
  targetHouse: PlayTarget
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  // Fetch current player
  const { data: player, error: playerError } = await supabase
    .from("mario_game_players")
    .select("*")
    .eq("game_code", gameCode)
    .eq("player_id", playerId)
    .maybeSingle();

  if (playerError || !player) {
    return { error: "Player not found." };
  }

  // Validate card is in hand
  const hand = player.hand || [];
  const cardIndex = hand.findIndex((c: GameCard) =>
    JSON.stringify(c) === JSON.stringify(card)
  );

  if (cardIndex === -1) {
    return { error: "Card not in hand." };
  }

  // Remove card from hand
  const newHand = hand.filter((_: GameCard, i: number) => i !== cardIndex);

  // Get current board structure
  const board = player.board || {
    "mario-bros": { heroes: [], collectables: [] },
    "mushroom-kingdom": { heroes: [], collectables: [] },
    "kong-island": { heroes: [], collectables: [] },
    "bowsers-castle": { heroes: [], collectables: [], monsters: [] },
  };

  const newBoard = { ...board };

  if (targetHouse === "in-play") {
    // The temporary row at the top of the mat: a Piranha Plant, a Star, a
    // mini-game. Nothing lives here for long, so it is its own list rather
    // than part of a house.
    newBoard.inPlay = [...(newBoard.inPlay || []), card];
  } else {
    // Determine which category the card belongs to
    const houseBoard = { ...newBoard[targetHouse] };

    if (card.type === "hero") {
      houseBoard.heroes = [...(houseBoard.heroes || []), card];
    } else if (card.type === "collectable") {
      houseBoard.collectables = [...(houseBoard.collectables || []), card];
    } else if (card.type === "monster" && targetHouse === "bowsers-castle") {
      houseBoard.monsters = [...(houseBoard.monsters || []), card];
    } else {
      // For power-ups, trophies, etc., add to heroes array for now
      houseBoard.heroes = [...(houseBoard.heroes || []), card];
    }

    newBoard[targetHouse] = houseBoard;
  }

  // Update player
  const { error: updateError } = await supabase
    .from("mario_game_players")
    .update({
      hand: newHand,
      board: newBoard,
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", gameCode)
    .eq("player_id", playerId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Record the action
  await recordAction(gameCode, "play", card.type);

  return { ok: true };
}
