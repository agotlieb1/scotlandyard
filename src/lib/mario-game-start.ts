import { getSupabaseClient } from "./supabase/client";
import { buildDeck, dealCards } from "./mario-deck-builder";
import { fetchMarioPlayers } from "./mario-games";
import { HAND_SIZE } from "./mario-game-rules";

/**
 * Start the game: initialize deck, deal hands, set first player
 */
export async function startMarioGame(gameCode: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  // Fetch all players
  const playersResult = await fetchMarioPlayers(gameCode);
  if ("error" in playersResult) {
    return { error: playersResult.error };
  }

  const players = playersResult.data;

  if (players.length === 0) {
    return { error: "No players in game." };
  }

  // Build and shuffle deck based on player count
  let deck = buildDeck(players.length);
  console.log(`[GameStart] Built deck with ${deck.length} cards for ${players.length} players`);

  // Deal initial hands to all players
  const updatedPlayers = [];
  for (const player of players) {
    const { dealt, remaining } = dealCards(deck, HAND_SIZE);
    deck = remaining;

    updatedPlayers.push({
      ...player,
      hand: dealt,
    });

    console.log(`[GameStart] Dealt ${dealt.length} cards to ${player.player_name}`);
  }

  // Update all player hands
  const updatePromises = updatedPlayers.map((player) =>
    supabase
      .from("mario_game_players")
      .update({
        hand: player.hand,
        updated_at: new Date().toISOString(),
      })
      .eq("game_code", gameCode)
      .eq("player_id", player.player_id)
  );

  const updateResults = await Promise.all(updatePromises);
  const updateError = updateResults.find((r) => r.error);
  if (updateError?.error) {
    return { error: updateError.error.message };
  }

  // Initialize game state
  const { error: stateError } = await supabase
    .from("mario_game_state")
    .upsert({
      game_code: gameCode,
      deck,
      discard_pile: [],
      current_turn_player_id: players[0].player_id, // First player goes first
      turn_number: 1,
      actions_taken: [],
      steal_used: false,
      updated_at: new Date().toISOString(),
    });

  if (stateError) {
    return { error: stateError.message };
  }

  // Update game status to "playing"
  const { error: gameError } = await supabase
    .from("mario_games")
    .update({
      status: "playing",
      started_at: new Date().toISOString(),
    })
    .eq("code", gameCode);

  if (gameError) {
    return { error: gameError.message };
  }

  console.log(`[GameStart] Game ${gameCode} started successfully`);
  console.log(`[GameStart] Remaining deck: ${deck.length} cards`);

  return {
    ok: true,
    deckSize: deck.length,
    playersCount: players.length,
  };
}
