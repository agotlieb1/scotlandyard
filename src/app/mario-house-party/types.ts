// House types
export type MainHouse = "mario-bros" | "mushroom-kingdom" | "kong-island" | "bowsers-castle";
export type House = MainHouse | "wa";

export const HOUSE_NAMES: Record<House, string> = {
  "mario-bros": "Mario Bros Plumbing",
  "mushroom-kingdom": "Mushroom Kingdom",
  "kong-island": "Kong Island",
  "bowsers-castle": "Bowser's Castle",
  "wa": "Wa! (Wild)",
};

export const HOUSE_TROPHIES: Record<MainHouse, string> = {
  "mario-bros": "Mario Bros Plumbing Cup",
  "mushroom-kingdom": "Mushroom Kingdom Cup",
  "kong-island": "Kong Island Cup",
  "bowsers-castle": "Koopa Cup",
};

// Collectable types
export type CollectableHouse = "mario-bros" | "mushroom-kingdom" | "kong-island";
export type CollectableValue = 1 | 2 | 3 | 5; // 5 is for Golden collectables

export interface CollectableCard {
  type: "collectable";
  house: CollectableHouse;
  value: CollectableValue;
  isGolden?: boolean;
}

export interface MysteryBoxCard {
  type: "mystery-box";
  // Declared house is set during scoring
  declaredHouse?: CollectableHouse;
  isSafe: boolean; // true = +5, false = gamble
}

// Hero types
export interface HeroCard {
  type: "hero";
  /** A Tanuki Suit went on it: it cannot be destroyed, moved or stolen. */
  invincible?: boolean;
  house: House;
  name?: string; // Character name (e.g., "Mario", "Peach")
  // Pledged house for Wa! cards
  pledgedHouse?: MainHouse;
  // During scoring: which monster is this hero canceling?
  cancelingMonsterId?: string;
}

// Monster types
export type MonsterValue = -1 | -2 | -3 | -10;

export interface MonsterCard {
  type: "monster";
  value: MonsterValue;
  name: string; // Monster name (e.g., "Goomba", "Big Boo", "Bob-omb")
  fileName: string; // Image filename
  rules: string; // Special rules text
  isBobOmb?: boolean; // Bob-omb cannot be canceled
  isTappable?: boolean; // Can be tapped for special abilities
  isHideable?: boolean; // Boo cards can be hidden/revealed
  // During scoring: which hero is canceling this monster?
  canceledByHeroId?: string;
  // State for tappable/hideable monsters
  isTapped?: boolean; // Generic tapped state
  isHidden?: boolean; // For Boo cards
}

// Power-up/Item types
export interface PowerUpCard {
  type: "powerup";
  name: string; // e.g., "Fire Flower", "Star Power"
  fileName: string; // Image filename
  isUnique?: boolean; // Unique power-ups (Star, Blue Shell, etc.)
  rules: string; // Special rules text
}

// Trophy types
export interface TrophyCard {
  type: "trophy";
  name: string;
  isHouseTrophy?: boolean;
  house?: MainHouse;
}

// Union type for all cards
export type GameCard = CollectableCard | MysteryBoxCard | HeroCard | MonsterCard | PowerUpCard | TrophyCard;

// Card with ID for tracking in UI
export interface CardWithId {
  id: string;
  card: GameCard;
}

// Player's hand for scoring
export interface PlayerHand {
  cards: CardWithId[];
}

// Scoring result
export interface ScoreBreakdown {
  heroPoints: number;
  collectablePoints: number;
  mysteryBoxPoints: number;
  trophyPoints: number;
  monsterPenalty: number;
  houseTrophyBonus: number;
  totalScore: number;
  houseTrophiesWon: MainHouse[];
}
