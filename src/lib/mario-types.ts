import type { GameCard } from "@/app/mario-house-party/types";

export type MarioGame = {
  code: string;
  status: "setup" | "playing" | "final_rounds" | "finished";
  display_device_id: string | null;
  created_at: string;
  started_at: string | null;
};

export type PlayerBoard = {
  "mario-bros": {
    heroes: GameCard[];
    collectables: GameCard[];
  };
  "mushroom-kingdom": {
    heroes: GameCard[];
    collectables: GameCard[];
  };
  "kong-island": {
    heroes: GameCard[];
    collectables: GameCard[];
  };
  "bowsers-castle": {
    heroes: GameCard[];
    collectables: GameCard[];
    monsters: GameCard[];
  };
  /**
   * The temporary row at the top of the mat: a Piranha Plant, a Star, a
   * mini-game — whatever is in play right now and will not be there long.
   * Optional, because boards saved before it existed do not carry it.
   */
  inPlay?: GameCard[];
};

export type MarioGamePlayer = {
  id: string;
  game_code: string;
  player_id: string;
  player_name: string | null;
  player_color: string;
  hand: GameCard[];
  board: PlayerBoard;
  created_at: string;
  updated_at: string;
};

export type ActionType = "play" | "tap" | "steal";

export type TurnAction = {
  type: ActionType;
  timestamp: string;
  cardId?: string; // For play/tap actions
  targetPlayerId?: string; // For steal actions
};

/** What a card has left behind on the table: Star Power, Piranha Plants. */
export type TableEffectsRow = {
  /** Player id → the turn number after which their Star Power runs out. */
  starPower: Record<string, number>;
  /** Players who lose their next turn. */
  skipNext: string[];
  /** The 1 Up Mushroom bought this player the last turn of the game. */
  endsAfter?: string;
};

/**
 * Enough of the table to put it back, so Thwomp can reverse the last action.
 * Whole rows rather than a diff: a board is small, and restoring one is
 * exact where replaying a diff backwards would need every rule inverted.
 */
export type LastAction = {
  byPlayerId: string;
  label: string;
  at: string;
  before: {
    seats: { playerId: string; hand: GameCard[]; board: PlayerBoard }[];
    deck: GameCard[];
    discard: GameCard[];
    effects: TableEffectsRow;
    actionsTaken: TurnAction[];
  };
};

export type MarioGameState = {
  game_code: string;
  deck: GameCard[];
  discard_pile: GameCard[];
  current_turn_player_id: string | null;
  turn_number: number;
  actions_taken: TurnAction[]; // Track actions in current turn
  steal_used: boolean; // Track if steal has been used this turn
  /** Absent on games that started before cards had lasting effects. */
  effects?: TableEffectsRow;
  /** Absent until something has been played that could be thwomped. */
  last_action?: LastAction | null;
  updated_at: string;
};
