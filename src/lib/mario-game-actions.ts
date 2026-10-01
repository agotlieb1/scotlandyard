import { getSupabaseClient } from "./supabase/client";
import type {
  ActionType,
  LastAction,
  MarioGame,
  MarioGamePlayer,
  MarioGameState,
  TurnAction,
} from "./mario-types";
import type { GameCard, MainHouse } from "@/app/mario-house-party/types";
import {
  createTurnAction,
  hasActionsRemaining,
  canPerformAction,
  resetTurnState,
  getCardsToDraw,
  isFinalRounds,
} from "./mario-game-rules";
import {
  emptyBoard,
  emptyEffects,
  endOfTurnOutcome,
  expireEffects,
  nextTurn,
  resolve,
  type Play,
  type Table,
} from "./mario-card-effects";

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
  const players = playersResult.data as MarioGamePlayer[];

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

  // Check if entering final rounds
  const enteringFinalRounds = !isFinalRounds(currentState) && newDeck.length === 0;
  const inFinalRounds = enteringFinalRounds || isFinalRounds(currentState);

  // Walk the table forward: a Piranha Plant costs its player this turn and is
  // eaten doing it, and Star Power runs out on the turn it was bought until.
  const effectsNow = currentState.effects ?? emptyEffects();
  const table: Table = {
    seats: players.map((p) => ({
      playerId: p.player_id,
      hand: p.player_id === playerId ? newHand : p.hand || [],
      board: p.board || emptyBoard(),
    })),
    deck: newDeck,
    discard: [...(currentState.discard_pile || [])],
    effects: effectsNow,
    turnPlayerId: playerId,
    turnNumber: currentState.turn_number,
  };

  const order = players.map((p) => p.player_id);
  const walked = nextTurn(table, order);
  const turnNumber = currentState.turn_number + 1;
  const expired = expireEffects(walked.effects, turnNumber);
  const effects = { ...expired, endsAfter: walked.effects.endsAfter };
  const discardPile = [...table.discard, ...walked.discarded];

  // The game ends when somebody goes out during the final rounds — unless
  // the 1 Up Mushroom is still in a hand. endOfTurnOutcome decides; this
  // only carries out what it says.
  const outcome = endOfTurnOutcome({
    actorId: playerId,
    actorHand: newHand,
    seats: walked.seats,
    inFinalRounds,
    effects,
    walkedNextPlayerId: walked.nextPlayerId,
  });

  const nextPlayerId = outcome.nextPlayerId;
  const finished = outcome.finished;
  let status: MarioGame["status"] | undefined = enteringFinalRounds
    ? "final_rounds"
    : undefined;

  if (outcome.oneUpSpentBy) {
    const holderSeat = walked.seats.find(
      (s) => s.playerId === outcome.oneUpSpentBy
    );
    const hand = holderSeat?.playerId === playerId ? newHand : holderSeat?.hand;
    if (hand) {
      const at = hand.findIndex(
        (c) => c.type === "powerup" && c.name === "1 Up Mushroom"
      );
      if (at !== -1) discardPile.push(...hand.splice(at, 1));
    }
  }

  if (finished) status = "finished";

  // Write every seat: the walk may have taken a plant off a board, and the
  // 1 Up out of a hand.
  const seatWrites = walked.seats.map((seat) =>
    supabase
      .from("mario_game_players")
      .update({
        hand: seat.playerId === playerId ? newHand : seat.hand,
        board: seat.board,
        updated_at: new Date().toISOString(),
      })
      .eq("game_code", gameCode)
      .eq("player_id", seat.playerId)
  );

  const seatResults = await Promise.all(seatWrites);
  const seatError = seatResults.find((r) => r.error);
  if (seatError?.error) {
    return { error: seatError.error.message };
  }

  // Update game state
  const { error: stateError } = await supabase
    .from("mario_game_state")
    .update({
      deck: newDeck,
      discard_pile: discardPile,
      current_turn_player_id: nextPlayerId,
      turn_number: turnNumber,
      effects: outcome.effects,
      // A new turn has nothing to thwomp.
      last_action: null,
      ...resetTurnState(),
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", gameCode);

  if (stateError) {
    return { error: stateError.message };
  }

  // Update game status if it changed
  if (status) {
    const { error: statusError } = await supabase
      .from("mario_games")
      .update({ status })
      .eq("code", gameCode);

    if (statusError) {
      return { error: statusError.message };
    }
  }

  return {
    ok: true,
    enteringFinalRounds,
    nextPlayerId,
    skipped: walked.skipped,
    finished,
    extraTurnFor: outcome.effects.endsAfter,
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

/**
 * Play a card from your hand onto someone else's mat — a monster into their
 * Koopa pen, a Piranha Plant into their temporary row. The card leaves your
 * hand and lands on their board, which is two rows to write, so a failure
 * part way through leaves the card in your hand rather than in both places.
 */
export async function playCardOnPlayer(
  gameCode: string,
  actorPlayerId: string,
  targetPlayerId: string,
  card: GameCard,
  targetZone: PlayTarget
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  if (actorPlayerId === targetPlayerId) {
    return playCard(gameCode, actorPlayerId, card, targetZone);
  }

  const { data: rows, error: fetchError } = await supabase
    .from("mario_game_players")
    .select("*")
    .eq("game_code", gameCode)
    .in("player_id", [actorPlayerId, targetPlayerId]);

  if (fetchError || !rows || rows.length !== 2) {
    return { error: fetchError?.message || "Could not find both players." };
  }

  const actor = rows.find((p) => p.player_id === actorPlayerId);
  const target = rows.find((p) => p.player_id === targetPlayerId);
  if (!actor || !target) {
    return { error: "Could not find both players." };
  }

  const hand: GameCard[] = actor.hand || [];
  const cardIndex = hand.findIndex(
    (c: GameCard) => JSON.stringify(c) === JSON.stringify(card)
  );
  if (cardIndex === -1) {
    return { error: "Card not in hand." };
  }

  const board = target.board || {
    "mario-bros": { heroes: [], collectables: [] },
    "mushroom-kingdom": { heroes: [], collectables: [] },
    "kong-island": { heroes: [], collectables: [] },
    "bowsers-castle": { heroes: [], collectables: [], monsters: [] },
  };
  const newBoard = { ...board };

  if (targetZone === "in-play") {
    newBoard.inPlay = [...(newBoard.inPlay || []), card];
  } else {
    const houseBoard = { ...newBoard[targetZone] };
    if (card.type === "hero") {
      houseBoard.heroes = [...(houseBoard.heroes || []), card];
    } else if (card.type === "collectable") {
      houseBoard.collectables = [...(houseBoard.collectables || []), card];
    } else if (card.type === "monster" && targetZone === "bowsers-castle") {
      houseBoard.monsters = [...(houseBoard.monsters || []), card];
    } else {
      houseBoard.heroes = [...(houseBoard.heroes || []), card];
    }
    newBoard[targetZone] = houseBoard;
  }

  // Land it on their board first. If this fails nothing has moved; if the
  // hand update fails afterwards the card is on the table twice, which is
  // visible and fixable, rather than lost.
  const { error: boardError } = await supabase
    .from("mario_game_players")
    .update({ board: newBoard, updated_at: new Date().toISOString() })
    .eq("game_code", gameCode)
    .eq("player_id", targetPlayerId);

  if (boardError) {
    return { error: boardError.message };
  }

  const { error: handError } = await supabase
    .from("mario_game_players")
    .update({
      hand: hand.filter((_: GameCard, i: number) => i !== cardIndex),
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", gameCode)
    .eq("player_id", actorPlayerId);

  if (handError) {
    return { error: handError.message };
  }

  await recordAction(gameCode, "play", card.type, targetPlayerId);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Cards that do something
// ---------------------------------------------------------------------------

/**
 * Play a power-up, or tap a monster. The rules live in `mario-card-effects`
 * as pure functions; this reads the table, hands it over, and writes back
 * what comes out — plus the snapshot Thwomp needs to put it all back.
 */
export async function playEffect(
  gameCode: string,
  actorPlayerId: string,
  play: Play,
  /** The card leaving the actor's hand, if this play came from one. */
  fromHand?: GameCard
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const [stateResult, playersResult] = await Promise.all([
    supabase.from("mario_game_state").select("*").eq("game_code", gameCode).maybeSingle(),
    supabase.from("mario_game_players").select("*").eq("game_code", gameCode).order("created_at"),
  ]);

  if (stateResult.error || !stateResult.data) {
    return { error: stateResult.error?.message || "Game state not found." };
  }
  if (playersResult.error || !playersResult.data) {
    return { error: playersResult.error?.message || "Players not found." };
  }

  const state = stateResult.data as MarioGameState;
  const rows = playersResult.data as MarioGamePlayer[];

  if (state.current_turn_player_id !== actorPlayerId) {
    return { error: "It's not your turn." };
  }
  if (!hasActionsRemaining(state)) {
    return { error: "No actions left this turn." };
  }

  const seats = rows.map((row) => ({
    playerId: row.player_id,
    hand: row.hand || [],
    board: row.board || emptyBoard(),
  }));

  const before = {
    seats: JSON.parse(JSON.stringify(seats)),
    deck: state.deck || [],
    discard: state.discard_pile || [],
    effects: state.effects ?? emptyEffects(),
    actionsTaken: state.actions_taken || [],
  };

  const table: Table = {
    seats,
    deck: [...(state.deck || [])],
    discard: [...(state.discard_pile || [])],
    effects: state.effects ?? emptyEffects(),
    turnPlayerId: actorPlayerId,
    turnNumber: state.turn_number,
  };

  // Take the card out of hand before resolving, so a card cannot be played
  // and still be held.
  if (fromHand) {
    const actorSeat = table.seats.find((s) => s.playerId === actorPlayerId);
    const index = actorSeat?.hand.findIndex(
      (c) => JSON.stringify(c) === JSON.stringify(fromHand)
    );
    if (actorSeat === undefined || index === undefined || index === -1) {
      return { error: "Card not in hand." };
    }
    actorSeat.hand.splice(index, 1);
  }

  const resolution = resolve(table, actorPlayerId, play);
  if (!resolution.ok) {
    return { error: resolution.error };
  }

  const after = resolution.table;
  const writes = after.seats.map((seat) =>
    supabase
      .from("mario_game_players")
      .update({
        hand: seat.hand,
        board: seat.board,
        updated_at: new Date().toISOString(),
      })
      .eq("game_code", gameCode)
      .eq("player_id", seat.playerId)
  );

  const results = await Promise.all(writes);
  const writeError = results.find((r) => r.error);
  if (writeError?.error) {
    return { error: writeError.error.message };
  }

  const lastAction: LastAction = {
    byPlayerId: actorPlayerId,
    label: resolution.label,
    at: new Date().toISOString(),
    before,
  };

  const { error: stateError } = await supabase
    .from("mario_game_state")
    .update({
      deck: after.deck,
      discard_pile: after.discard,
      effects: after.effects,
      actions_taken: [
        ...(state.actions_taken || []),
        createTurnAction(play.kind.startsWith("tap") ? "tap" : "play"),
      ],
      last_action: lastAction,
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", gameCode);

  if (stateError) {
    return { error: stateError.message };
  }

  return { ok: true, label: resolution.label };
}

/**
 * Thwomp: put the table back the way it was before the last action. The card
 * is spent whether or not it was your action that is being reversed, and a
 * Thwomp cannot itself be thwomped.
 */
export async function thwompLastAction(
  gameCode: string,
  actorPlayerId: string,
  thwompCard: GameCard
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const [stateResult, playerResult] = await Promise.all([
    supabase.from("mario_game_state").select("*").eq("game_code", gameCode).maybeSingle(),
    supabase
      .from("mario_game_players")
      .select("*")
      .eq("game_code", gameCode)
      .eq("player_id", actorPlayerId)
      .maybeSingle(),
  ]);

  if (stateResult.error || !stateResult.data) {
    return { error: stateResult.error?.message || "Game state not found." };
  }
  if (playerResult.error || !playerResult.data) {
    return { error: "Player not found." };
  }

  const state = stateResult.data as MarioGameState;
  const actor = playerResult.data as MarioGamePlayer;
  const last = state.last_action;

  if (!last) {
    return { error: "There is nothing to stop." };
  }
  if (last.label.startsWith("Thwomp")) {
    return { error: "A Thwomp cannot be thwomped." };
  }

  const handIndex = (actor.hand || []).findIndex(
    (c) => JSON.stringify(c) === JSON.stringify(thwompCard)
  );
  if (handIndex === -1) {
    return { error: "Card not in hand." };
  }

  // Put every seat back as it was, then take the Thwomp out of the hand it
  // was played from — the restore would otherwise hand it straight back.
  const writes = last.before.seats.map((seat) => {
    const hand =
      seat.playerId === actorPlayerId
        ? (seat.hand || []).filter(
            (c, i) =>
              i !==
              (seat.hand || []).findIndex(
                (h) => JSON.stringify(h) === JSON.stringify(thwompCard)
              )
          )
        : seat.hand;
    return supabase
      .from("mario_game_players")
      .update({ hand, board: seat.board, updated_at: new Date().toISOString() })
      .eq("game_code", gameCode)
      .eq("player_id", seat.playerId);
  });

  const results = await Promise.all(writes);
  const writeError = results.find((r) => r.error);
  if (writeError?.error) {
    return { error: writeError.error.message };
  }

  const { error: stateError } = await supabase
    .from("mario_game_state")
    .update({
      deck: last.before.deck,
      discard_pile: [...last.before.discard, thwompCard],
      effects: last.before.effects,
      actions_taken: last.before.actionsTaken,
      last_action: {
        byPlayerId: actorPlayerId,
        label: `Thwomp stopped: ${last.label}`,
        at: new Date().toISOString(),
        before: last.before,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", gameCode);

  if (stateError) {
    return { error: stateError.message };
  }

  return { ok: true, stopped: last.label };
}
