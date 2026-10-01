import type { GameCard, MainHouse } from "@/app/mario-house-party/types";
import type { PlayerBoard } from "./mario-types";

/**
 * What every card does, as pure functions over a snapshot of the table.
 *
 * Nothing here touches Supabase. The rules are the part worth being sure
 * about, so they are written where they can be run and checked on their own;
 * `mario-game-actions.ts` is the thin layer that reads a game, calls `resolve`
 * and writes back what comes out.
 *
 * The rules themselves come from the card text, with the nuances settled by
 * the table's owner:
 *
 *  - Playing a card and tapping a monster each spend one of a turn's three
 *    actions. Red Shells shoots three cards for a single action.
 *  - Bob-omb, a Tanuki'd hero and a player under Star Power cannot be touched
 *    by anyone else. The card's own owner can still move their own.
 *  - A hero shot off the table is shuffled back into the deck; everything else
 *    is discarded.
 *  - Ice Flower freezes and slides in one action; the freeze is flavour.
 *  - Thwomp reverses the last action, which is why `resolve` returns a
 *    snapshot of what it changed.
 */

// ---------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------

export type SeatState = {
  playerId: string;
  hand: GameCard[];
  board: PlayerBoard;
};

export type TableEffects = {
  /** Player id → the turn number after which their Star Power runs out. */
  starPower: Record<string, number>;
  /** Players who lose their next turn to a Piranha Plant. */
  skipNext: string[];
  /**
   * Somebody went out and the 1 Up Mushroom bought its holder one more turn.
   * The game finishes when this player's turn ends.
   */
  endsAfter?: string;
};

export type Table = {
  seats: SeatState[];
  deck: GameCard[];
  discard: GameCard[];
  effects: TableEffects;
  /** Whose turn it is, and which turn number, for Star Power's expiry. */
  turnPlayerId: string;
  turnNumber: number;
};

export const emptyEffects = (): TableEffects => ({ starPower: {}, skipNext: [] });

export const emptyBoard = (): PlayerBoard => ({
  "mario-bros": { heroes: [], collectables: [] },
  "mushroom-kingdom": { heroes: [], collectables: [] },
  "kong-island": { heroes: [], collectables: [] },
  "bowsers-castle": { heroes: [], collectables: [], monsters: [] },
  inPlay: [],
});

// ---------------------------------------------------------------------------
// Pointing at a card
// ---------------------------------------------------------------------------

/** Where a card sits on a mat. */
export type Spot =
  | { playerId: string; row: "in-play"; index: number }
  | { playerId: string; row: "heroes"; house: MainHouse; index: number }
  | { playerId: string; row: "collectables"; house: MainHouse; index: number }
  | { playerId: string; row: "monsters"; index: number };

/** A card in a hand, which only Gold Pipe can reach. */
export type HandSpot = { playerId: string; row: "hand"; index: number };

export type AnySpot = Spot | HandSpot;

const zoneOf = (board: PlayerBoard, spot: AnySpot): GameCard[] => {
  switch (spot.row) {
    case "in-play":
      return board.inPlay ?? [];
    case "heroes":
      return board[spot.house].heroes;
    case "collectables":
      return board[spot.house].collectables;
    case "monsters":
      return board["bowsers-castle"].monsters;
    case "hand":
      return [];
  }
};

const seatOf = (table: Table, playerId: string) =>
  table.seats.find((s) => s.playerId === playerId);

export function cardAt(table: Table, spot: AnySpot): GameCard | undefined {
  const seat = seatOf(table, spot.playerId);
  if (!seat) return undefined;
  if (spot.row === "hand") return seat.hand[spot.index];
  return zoneOf(seat.board, spot)[spot.index];
}

/** Every card on every mat, which is what "on the table" means. */
export function allSpots(table: Table): Spot[] {
  const spots: Spot[] = [];
  for (const seat of table.seats) {
    (seat.board.inPlay ?? []).forEach((_, index) =>
      spots.push({ playerId: seat.playerId, row: "in-play", index })
    );
    (
      [
        "mario-bros",
        "mushroom-kingdom",
        "kong-island",
        "bowsers-castle",
      ] as MainHouse[]
    ).forEach((house) => {
      seat.board[house].heroes.forEach((_, index) =>
        spots.push({ playerId: seat.playerId, row: "heroes", house, index })
      );
      seat.board[house].collectables.forEach((_, index) =>
        spots.push({ playerId: seat.playerId, row: "collectables", house, index })
      );
    });
    seat.board["bowsers-castle"].monsters.forEach((_, index) =>
      spots.push({ playerId: seat.playerId, row: "monsters", index })
    );
  }
  return spots;
}

// ---------------------------------------------------------------------------
// What cannot be touched
// ---------------------------------------------------------------------------

export const isBobOmb = (card: GameCard) =>
  card.type === "monster" && card.isBobOmb === true;

export const isInvincible = (card: GameCard) =>
  (card as { invincible?: boolean }).invincible === true;

/**
 * Why an actor cannot touch a card, or null if they can. A card's own owner
 * is always allowed: Bob-omb's whole trick is that its owner throws it at
 * someone else, and a Tanuki'd hero still belongs to the player who grew it.
 */
export function protectionOn(
  table: Table,
  spot: AnySpot,
  actorId: string
): string | null {
  if (spot.playerId === actorId) return null;

  const card = cardAt(table, spot);
  if (!card) return "That card is not there any more.";

  const starUntil = table.effects.starPower[spot.playerId];
  if (starUntil !== undefined && table.turnNumber <= starUntil) {
    return "They have Star Power — nothing can touch them or their board.";
  }
  if (isBobOmb(card)) {
    return "Bob-omb cannot be destroyed or removed from play.";
  }
  if (isInvincible(card)) {
    return "A Tanuki Suit makes that hero invincible.";
  }
  return null;
}

/** A whole player is off limits while their Star Power is up. */
export function playerProtected(
  table: Table,
  playerId: string,
  actorId: string
): string | null {
  if (playerId === actorId) return null;
  const starUntil = table.effects.starPower[playerId];
  if (starUntil !== undefined && table.turnNumber <= starUntil) {
    return "They have Star Power — nothing can touch them or their board.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// What each card asks for before it can be played
// ---------------------------------------------------------------------------

export type Requirement =
  | { kind: "none" }
  | { kind: "cards"; count: number; note: string }
  | { kind: "card-and-destination"; note: string }
  | { kind: "player"; note: string }
  | { kind: "player-and-house"; note: string }
  | { kind: "hero"; note: string }
  | { kind: "discard-card"; note: string }
  | { kind: "two-any"; note: string };

export function requirementFor(card: GameCard): Requirement {
  if (card.type !== "powerup") return { kind: "none" };
  switch (card.name) {
    case "Fire Flower":
      return { kind: "cards", count: 1, note: "Pick the card to shoot" };
    case "Red Shells":
      return { kind: "cards", count: 3, note: "Pick three cards to shoot" };
    case "Ice Flower":
      return {
        kind: "card-and-destination",
        note: "Pick a card, then whose mat it slides to",
      };
    case "Warp Pipe":
      return { kind: "cards", count: 1, note: "Pick the card to warp to your hand" };
    case "Gold Pipe":
      return { kind: "two-any", note: "Pick two cards to swap" };
    case "Blue Shell":
      return { kind: "player-and-house", note: "Pick a player and a house" };
    case "K.O. Hammer":
      return { kind: "player", note: "Pick whose monsters to clear" };
    case "Lakitu":
      return { kind: "discard-card", note: "Pick a card from the discard pile" };
    case "Tanuki Suit":
      return { kind: "hero", note: "Pick a hero to make invincible" };
    case "Piranha Plant":
      return { kind: "player", note: "Pick who loses their next turn" };
    default:
      // Star Power, Thwomp, 1 Up Mushroom need nothing.
      return { kind: "none" };
  }
}

/** Red Shells fires three cards for one action; everything else costs one. */
export const actionCostOf = (): number => 1;

// ---------------------------------------------------------------------------
// Resolving
// ---------------------------------------------------------------------------

export type Play =
  | { kind: "shoot"; card: GameCard; targets: Spot[] }
  | { kind: "slide"; card: GameCard; target: Spot; toPlayerId: string }
  | { kind: "warp"; card: GameCard; target: Spot }
  | { kind: "swap"; card: GameCard; a: AnySpot; b: AnySpot }
  | { kind: "blue-shell"; card: GameCard; targetPlayerId: string; house: MainHouse }
  | { kind: "ko-hammer"; card: GameCard; targetPlayerId: string }
  | { kind: "lakitu"; card: GameCard; discardIndex: number }
  | { kind: "tanuki"; card: GameCard; target: Spot }
  | { kind: "star"; card: GameCard }
  | { kind: "piranha"; card: GameCard; targetPlayerId: string }
  | { kind: "tap-move"; spot: Spot; toPlayerId: string }
  | { kind: "tap-hide"; spot: Spot }
  | { kind: "tap-to-deck"; spot: Spot }
  /** Handled by reversing the last action, never by `resolve`. */
  | { kind: "thwomp"; card: GameCard };

export type Resolution =
  | { ok: true; table: Table; label: string }
  | { ok: false; error: string };

const clone = (table: Table): Table => JSON.parse(JSON.stringify(table));

const removeAt = (table: Table, spot: AnySpot): GameCard | undefined => {
  const seat = seatOf(table, spot.playerId);
  if (!seat) return undefined;
  if (spot.row === "hand") return seat.hand.splice(spot.index, 1)[0];
  const zone = zoneOf(seat.board, spot);
  return zone.splice(spot.index, 1)[0];
};

/** Put a card where it belongs on a mat, the same way playing one does. */
const placeOnBoard = (board: PlayerBoard, card: GameCard, house?: MainHouse) => {
  if (card.type === "monster") {
    board["bowsers-castle"].monsters.push(card);
    return;
  }
  if (card.type === "collectable") {
    const home = (house ?? card.house) as MainHouse;
    board[home].collectables.push(card);
    return;
  }
  if (card.type === "hero") {
    const home = (house ??
      (card.house === "wa" ? card.pledgedHouse ?? "mario-bros" : card.house)) as MainHouse;
    board[home].heroes.push(card);
    return;
  }
  board.inPlay = [...(board.inPlay ?? []), card];
};

/** Back into the deck at a random position, so nobody can predict it. */
const shuffleInto = (deck: GameCard[], card: GameCard, rand = Math.random) => {
  deck.splice(Math.floor(rand() * (deck.length + 1)), 0, card);
};

const describe = (card: GameCard): string =>
  card.type === "powerup" || card.type === "monster" || card.type === "trophy"
    ? card.name
    : card.type === "hero"
      ? card.name ?? "hero"
      : card.type === "collectable"
        ? `${card.house} ${card.value}`
        : "Mystery Box";

/**
 * Apply one play to the table. The actor's own copy of the played card is
 * removed from their hand by the caller — this only deals with what the card
 * does once it is on its way.
 */
export function resolve(table: Table, actorId: string, play: Play): Resolution {
  const next = clone(table);
  const actor = seatOf(next, actorId);
  if (!actor) return { ok: false, error: "You are not in this game." };

  const spend = (card: GameCard) => next.discard.push(card);

  switch (play.kind) {
    case "shoot": {
      if (play.targets.length === 0) {
        return { ok: false, error: "Pick something to shoot." };
      }
      // Highest index first, so earlier removals cannot shift later ones.
      const ordered = [...play.targets].sort((a, b) => b.index - a.index);
      const seen = new Set<string>();
      for (const target of ordered) {
        const key = JSON.stringify(target);
        if (seen.has(key)) {
          return { ok: false, error: "Pick three different cards." };
        }
        seen.add(key);
        const why = protectionOn(next, target, actorId);
        if (why) return { ok: false, error: why };
      }
      const hit: string[] = [];
      for (const target of ordered) {
        const card = removeAt(next, target);
        if (!card) continue;
        hit.push(describe(card));
        if (card.type === "hero") {
          shuffleInto(next.deck, card);
        } else {
          next.discard.push(card);
        }
      }
      spend(play.card);
      return {
        ok: true,
        table: next,
        label: `${describe(play.card)} shot ${hit.reverse().join(", ")} off the table`,
      };
    }

    case "slide": {
      const why = protectionOn(next, play.target, actorId);
      if (why) return { ok: false, error: why };
      const destination = seatOf(next, play.toPlayerId);
      if (!destination) return { ok: false, error: "No such player." };
      if (play.toPlayerId === play.target.playerId) {
        return { ok: false, error: "Slide it to a different mat." };
      }
      const blocked = playerProtected(next, play.toPlayerId, actorId);
      if (blocked) return { ok: false, error: blocked };
      const card = removeAt(next, play.target);
      if (!card) return { ok: false, error: "That card is not there any more." };
      placeOnBoard(destination.board, card);
      spend(play.card);
      return {
        ok: true,
        table: next,
        label: `${describe(play.card)} slid ${describe(card)} to another mat`,
      };
    }

    case "warp": {
      const why = protectionOn(next, play.target, actorId);
      if (why) return { ok: false, error: why };
      const card = removeAt(next, play.target);
      if (!card) return { ok: false, error: "That card is not there any more." };
      actor.hand.push(card);
      spend(play.card);
      return {
        ok: true,
        table: next,
        label: `Warp Pipe took ${describe(card)} into your hand`,
      };
    }

    case "swap": {
      for (const spot of [play.a, play.b]) {
        if (spot.row === "hand" && spot.playerId !== actorId) {
          return { ok: false, error: "You can only swap from your own hand." };
        }
        if (spot.row !== "hand") {
          const why = protectionOn(next, spot, actorId);
          if (why) return { ok: false, error: why };
        }
      }
      const cardA = cardAt(next, play.a);
      const cardB = cardAt(next, play.b);
      if (!cardA || !cardB) {
        return { ok: false, error: "One of those cards is not there any more." };
      }
      const seatA = seatOf(next, play.a.playerId)!;
      const seatB = seatOf(next, play.b.playerId)!;
      // Write in place, so a swap cannot disturb anything else's index.
      if (play.a.row === "hand") seatA.hand[play.a.index] = cardB;
      else zoneOf(seatA.board, play.a)[play.a.index] = cardB;
      if (play.b.row === "hand") seatB.hand[play.b.index] = cardA;
      else zoneOf(seatB.board, play.b)[play.b.index] = cardA;
      spend(play.card);
      return {
        ok: true,
        table: next,
        label: `Gold Pipe swapped ${describe(cardA)} and ${describe(cardB)}`,
      };
    }

    case "blue-shell": {
      const blocked = playerProtected(next, play.targetPlayerId, actorId);
      if (blocked) return { ok: false, error: blocked };
      const target = seatOf(next, play.targetPlayerId);
      if (!target) return { ok: false, error: "No such player." };
      const zone = target.board[play.house].heroes;
      const kept = zone.filter((hero) => isInvincible(hero));
      const swept = zone.filter((hero) => !isInvincible(hero));
      target.board[play.house].heroes = kept;
      swept.forEach((hero) => next.discard.push(hero));
      spend(play.card);
      return {
        ok: true,
        table: next,
        label: `Blue Shell cleared ${swept.length} hero${
          swept.length === 1 ? "" : "es"
        } from a house`,
      };
    }

    case "ko-hammer": {
      const blocked = playerProtected(next, play.targetPlayerId, actorId);
      if (blocked) return { ok: false, error: blocked };
      const target = seatOf(next, play.targetPlayerId);
      if (!target) return { ok: false, error: "No such player." };
      const monsters = target.board["bowsers-castle"].monsters;
      // Bob-omb cannot be destroyed, so the hammer leaves it standing.
      const kept = monsters.filter((m) => isBobOmb(m));
      const swept = monsters.filter((m) => !isBobOmb(m));
      target.board["bowsers-castle"].monsters = kept;
      swept.forEach((m) => next.discard.push(m));
      spend(play.card);
      return {
        ok: true,
        table: next,
        label: `K.O. Hammer cleared ${swept.length} monster${
          swept.length === 1 ? "" : "s"
        }${kept.length ? ", Bob-omb stayed" : ""}`,
      };
    }

    case "lakitu": {
      const card = next.discard[play.discardIndex];
      if (!card) return { ok: false, error: "That card is not in the discard pile." };
      next.discard.splice(play.discardIndex, 1);
      actor.hand.push(card);
      spend(play.card);
      return {
        ok: true,
        table: next,
        label: `Lakitu fished ${describe(card)} out of the discard pile`,
      };
    }

    case "tanuki": {
      const blocked = playerProtected(next, play.target.playerId, actorId);
      if (blocked) return { ok: false, error: blocked };
      const card = cardAt(next, play.target);
      if (!card || card.type !== "hero") {
        return { ok: false, error: "A Tanuki Suit only goes on a hero." };
      }
      const seat = seatOf(next, play.target.playerId)!;
      const zone = zoneOf(seat.board, play.target);
      zone[play.target.index] = { ...card, invincible: true };
      // The suit stays with the hero rather than going to the discard pile.
      zone.splice(play.target.index + 1, 0, play.card);
      return {
        ok: true,
        table: next,
        label: `Tanuki Suit made ${describe(card)} invincible`,
      };
    }

    case "star": {
      // Covers the rest of this turn and everything up to the end of the
      // actor's next turn.
      next.effects.starPower[actorId] = next.turnNumber + next.seats.length;
      spend(play.card);
      return { ok: true, table: next, label: "Star Power — untouchable" };
    }

    case "piranha": {
      const blocked = playerProtected(next, play.targetPlayerId, actorId);
      if (blocked) return { ok: false, error: blocked };
      const target = seatOf(next, play.targetPlayerId);
      if (!target) return { ok: false, error: "No such player." };
      if (next.effects.skipNext.includes(play.targetPlayerId)) {
        return { ok: false, error: "They are already losing their next turn." };
      }
      next.effects.skipNext.push(play.targetPlayerId);
      // It sits on their mat until the turn it costs them, then discards.
      target.board.inPlay = [...(target.board.inPlay ?? []), play.card];
      return {
        ok: true,
        table: next,
        label: "Piranha Plant — they lose their next turn",
      };
    }

    case "tap-move": {
      if (play.spot.playerId !== actorId) {
        return { ok: false, error: "Only the player it sits on can tap it." };
      }
      const blocked = playerProtected(next, play.toPlayerId, actorId);
      if (blocked) return { ok: false, error: blocked };
      const destination = seatOf(next, play.toPlayerId);
      if (!destination) return { ok: false, error: "No such player." };
      if (play.toPlayerId === actorId) {
        return { ok: false, error: "Throw it to a different mat." };
      }
      const card = removeAt(next, play.spot);
      if (!card) return { ok: false, error: "That card is not there any more." };
      placeOnBoard(destination.board, card);
      return {
        ok: true,
        table: next,
        label: `${describe(card)} thrown to another mat`,
      };
    }

    case "tap-hide": {
      if (play.spot.playerId !== actorId) {
        return { ok: false, error: "Only the player it sits on can tap it." };
      }
      const seat = seatOf(next, actorId)!;
      const zone = zoneOf(seat.board, play.spot);
      const card = zone[play.spot.index];
      if (!card || card.type !== "monster" || !card.isHideable) {
        return { ok: false, error: "That one cannot be hidden." };
      }
      const hidden = !card.isHidden;
      zone[play.spot.index] = { ...card, isHidden: hidden, isTapped: hidden };
      return {
        ok: true,
        table: next,
        label: `${describe(card)} ${hidden ? "hidden" : "revealed"}`,
      };
    }

    case "thwomp":
      return {
        ok: false,
        error: "Thwomp is handled by reversing the last action.",
      };

    case "tap-to-deck": {
      if (play.spot.playerId !== actorId) {
        return { ok: false, error: "Only the player it sits on can tap it." };
      }
      const card = removeAt(next, play.spot);
      if (!card) return { ok: false, error: "That card is not there any more." };
      shuffleInto(next.deck, card);
      return {
        ok: true,
        table: next,
        label: `${describe(card)} shuffled back into the deck`,
      };
    }
  }
}

/**
 * Star Power and Piranha Plants are spent as turns pass: call this as each
 * turn ends, with the player whose turn it was.
 */
export function expireEffects(effects: TableEffects, turnNumber: number): TableEffects {
  const starPower: Record<string, number> = {};
  for (const [playerId, until] of Object.entries(effects.starPower)) {
    if (turnNumber <= until) starPower[playerId] = until;
  }
  return { starPower, skipNext: [...effects.skipNext] };
}

/**
 * Whose turn is next, skipping anyone a Piranha Plant has blocked and eating
 * the plant as it goes.
 */
export function nextTurn(
  table: Table,
  order: string[]
): {
  nextPlayerId: string;
  skipped: string[];
  effects: TableEffects;
  seats: SeatState[];
  discarded: GameCard[];
} {
  const seats = JSON.parse(JSON.stringify(table.seats)) as SeatState[];
  const effects: TableEffects = {
    starPower: { ...table.effects.starPower },
    skipNext: [...table.effects.skipNext],
  };
  const skipped: string[] = [];
  const discarded: GameCard[] = [];
  let index = order.indexOf(table.turnPlayerId);

  for (let step = 0; step < order.length + 1; step += 1) {
    index = (index + 1) % order.length;
    const candidate = order[index];
    const blockedAt = effects.skipNext.indexOf(candidate);
    if (blockedAt === -1) {
      return { nextPlayerId: candidate, skipped, effects, seats, discarded };
    }
    // They lose this turn, and the plant that did it is spent.
    effects.skipNext.splice(blockedAt, 1);
    skipped.push(candidate);
    const seat = seats.find((s) => s.playerId === candidate);
    if (seat) {
      const first = (seat.board.inPlay ?? []).findIndex(
        (c) => c.type === "powerup" && c.name === "Piranha Plant"
      );
      if (first !== -1) {
        discarded.push((seat.board.inPlay ?? [])[first]);
        seat.board.inPlay = (seat.board.inPlay ?? []).filter((_, i) => i !== first);
      }
    }
  }
  return { nextPlayerId: table.turnPlayerId, skipped, effects, seats, discarded };
}

/**
 * How a turn ends, as a decision rather than a database write.
 *
 * The game ends when someone goes out during the final rounds — unless the
 * 1 Up Mushroom is still in a hand, which buys its holder one more full turn,
 * played for free. That extra turn is the last one.
 */
export function endOfTurnOutcome(input: {
  actorId: string;
  /** The actor's hand after drawing. */
  actorHand: GameCard[];
  /** Every seat after the walk, the actor's hand included. */
  seats: SeatState[];
  inFinalRounds: boolean;
  effects: TableEffects;
  /** Who would play next if nothing special happened. */
  walkedNextPlayerId: string;
}): {
  nextPlayerId: string | null;
  finished: boolean;
  effects: TableEffects;
  /** The 1 Up was spent out of this player's hand to buy the last turn. */
  oneUpSpentBy?: string;
} {
  const effects: TableEffects = {
    starPower: { ...input.effects.starPower },
    skipNext: [...input.effects.skipNext],
    endsAfter: input.effects.endsAfter,
  };

  // The extra turn the 1 Up bought has just been played.
  if (effects.endsAfter === input.actorId) {
    return { nextPlayerId: null, finished: true, effects };
  }

  // "If you end your turn with the 1 Up Mushroom the only card in your hand,
  // you both end the game and get an additional turn" — so holding it alone
  // counts as going out, and buys you the extra turn yourself.
  const holdingOnlyOneUp =
    input.actorHand.length === 1 &&
    input.actorHand[0].type === "powerup" &&
    input.actorHand[0].name === "1 Up Mushroom";

  const goingOut =
    input.inFinalRounds && (input.actorHand.length === 0 || holdingOnlyOneUp);
  if (!goingOut) {
    return { nextPlayerId: input.walkedNextPlayerId, finished: false, effects };
  }

  const holder = input.seats.find((seat) =>
    (seat.playerId === input.actorId ? input.actorHand : seat.hand).some(
      (c) => c.type === "powerup" && c.name === "1 Up Mushroom"
    )
  );

  if (!holder) {
    return { nextPlayerId: null, finished: true, effects };
  }

  effects.endsAfter = holder.playerId;
  return {
    nextPlayerId: holder.playerId,
    finished: false,
    effects,
    oneUpSpentBy: holder.playerId,
  };
}
