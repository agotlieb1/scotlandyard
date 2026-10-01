import type {
  CollectableCard,
  MysteryBoxCard,
  HeroCard,
  MonsterCard,
  TrophyCard,
  CollectableHouse,
  MainHouse,
} from "./types";

// Generate collectable cards for a house
function generateCollectables(house: CollectableHouse): CollectableCard[] {
  const cards: CollectableCard[] = [];

  // 3x 1pt cards
  for (let i = 0; i < 3; i++) {
    cards.push({ type: "collectable", house, value: 1 });
  }

  // 2x 2pt cards
  for (let i = 0; i < 2; i++) {
    cards.push({ type: "collectable", house, value: 2 });
  }

  // 1x 3pt card
  cards.push({ type: "collectable", house, value: 3 });

  // 1x Golden (5pt) card
  cards.push({ type: "collectable", house, value: 5, isGolden: true });

  return cards;
}

// All collectable cards
export const COLLECTABLE_CARDS: CollectableCard[] = [
  ...generateCollectables("mario-bros"),
  ...generateCollectables("mushroom-kingdom"),
  ...generateCollectables("kong-island"),
];

// Mystery Box card
export const MYSTERY_BOX_CARD: MysteryBoxCard = {
  type: "mystery-box",
  isSafe: true, // Default to safe, player chooses during scoring
};

// Hero cards - each character appears exactly once
export const HERO_CARDS: HeroCard[] = [
  // Mario Bros heroes
  { type: "hero", house: "mario-bros", name: "Mario" },
  { type: "hero", house: "mario-bros", name: "Luigi" },
  { type: "hero", house: "mario-bros", name: "Yoshi" },
  { type: "hero", house: "mario-bros", name: "EGadd" },
  { type: "hero", house: "mario-bros", name: "BabyMarios" },
  { type: "hero", house: "mario-bros", name: "Rosalina" },

  // Mushroom Kingdom heroes
  { type: "hero", house: "mushroom-kingdom", name: "Peach" },
  { type: "hero", house: "mushroom-kingdom", name: "Daisy" },
  { type: "hero", house: "mushroom-kingdom", name: "Toad" },
  { type: "hero", house: "mushroom-kingdom", name: "Birdo" },
  { type: "hero", house: "mushroom-kingdom", name: "Toadsworth" },
  { type: "hero", house: "mushroom-kingdom", name: "Toadette" },

  // Kong Island heroes
  { type: "hero", house: "kong-island", name: "DonkeyKong" },
  { type: "hero", house: "kong-island", name: "DiddyKong" },
  { type: "hero", house: "kong-island", name: "Pauline" },
  { type: "hero", house: "kong-island", name: "Dixie" },
  { type: "hero", house: "kong-island", name: "Cranky" },
  { type: "hero", house: "kong-island", name: "Funky" },

  // Bowser's Castle heroes
  { type: "hero", house: "bowsers-castle", name: "Bowser" },
  { type: "hero", house: "bowsers-castle", name: "PeteyPiranha" },
  { type: "hero", house: "bowsers-castle", name: "Kamek" },
  { type: "hero", house: "bowsers-castle", name: "KoopaKids" },
  { type: "hero", house: "bowsers-castle", name: "Kammy" },
  { type: "hero", house: "bowsers-castle", name: "KingBoo" },

  // Wa! (Wild) heroes
  { type: "hero", house: "wa", name: "Wario" },
  { type: "hero", house: "wa", name: "Waluigi" },
];

// Monster cards - import from card-data for complete definitions with rules
// This is kept for backward compatibility with scoring system
export { MONSTER_CARDS } from "./card-data";

// House trophies
export const HOUSE_TROPHY_CARDS: TrophyCard[] = [
  {
    type: "trophy",
    name: "Mario Bros Plumbing Cup",
    isHouseTrophy: true,
    house: "mario-bros",
  },
  {
    type: "trophy",
    name: "Mushroom Kingdom Cup",
    isHouseTrophy: true,
    house: "mushroom-kingdom",
  },
  {
    type: "trophy",
    name: "Kong Island Cup",
    isHouseTrophy: true,
    house: "kong-island",
  },
  {
    type: "trophy",
    name: "Koopa Cup",
    isHouseTrophy: true,
    house: "bowsers-castle",
  },
];

// Other trophies (+5 each)
// You mentioned 13 total trophies, 4 are house trophies, so 9 others
export const OTHER_TROPHY_CARDS: TrophyCard[] = [
  { type: "trophy", name: "MarioFirstPlace" },
  { type: "trophy", name: "RainbowRoad" },
  { type: "trophy", name: "BowsersCastle" },
  { type: "trophy", name: "PeachsCastle" },
  { type: "trophy", name: "LuigisMansion" },
  { type: "trophy", name: "YoshisIsland" },
  { type: "trophy", name: "KoopaBeach" },
  { type: "trophy", name: "ToadsTurnpike" },
  { type: "trophy", name: "WariosStadium" },
];

export const ALL_TROPHY_CARDS = [...HOUSE_TROPHY_CARDS, ...OTHER_TROPHY_CARDS];
