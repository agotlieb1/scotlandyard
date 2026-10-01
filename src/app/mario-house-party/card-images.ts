import type { GameCard } from "./types";

// House code mapping for file names
const HOUSE_CODES: Record<string, string> = {
  "mario-bros": "CH",
  "mushroom-kingdom": "MC",
  "kong-island": "KC",
  "bowsers-castle": "BC",
  "wa": "WA",
};

// Hero character names for each house (cycle through these)
const HERO_NAMES: Record<string, string[]> = {
  "mario-bros": ["Mario", "Luigi", "Yoshi", "EGadd", "BabyMarios", "Rosalina"],
  "mushroom-kingdom": ["Peach", "Daisy", "Toad", "Birdo", "Toadsworth", "Toadette"],
  "kong-island": ["DonkeyKong", "DiddyKong", "Pauline", "Dixie", "Cranky", "Funky"],
  "bowsers-castle": ["Bowser", "PeteyPiranha", "Kamek", "KoopaKids", "Kammy", "KingBoo"],
  "wa": ["Wario", "Waluigi"],
};

// Monster names for each point value
const MONSTER_NAMES: Record<number, string[]> = {
  1: ["Goomba", "KoopaTroopa", "Boo", "BigBoo"],
  2: ["KoopaParatroopa", "ShyGuy"],
  3: ["DryBones"],
};

// Counter to cycle through heroes/monsters
const heroCounters: Record<string, number> = {
  "mario-bros": 0,
  "mushroom-kingdom": 0,
  "kong-island": 0,
  "bowsers-castle": 0,
  "wa": 0,
};

const monsterCounters: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
};

/**
 * Returns the image path for a given card.
 * Images should be placed in public/cards/ directory.
 */
export function getCardImagePath(card: GameCard): string | null {
  if (card.type === "collectable") {
    const houseCode = HOUSE_CODES[card.house];
    return `/cards/collectables/${houseCode}-${card.value}.webp`;
  }

  if (card.type === "mystery-box") {
    return `/cards/collectables/MysteryBox.webp`;
  }

  if (card.type === "hero") {
    const houseCode = HOUSE_CODES[card.house];

    // Use the specific hero name if provided
    if (card.name) {
      return `/cards/heroes/${houseCode}-${card.name}.webp`;
    }

    // Fallback: cycle through available hero names for this house
    const heroList = HERO_NAMES[card.house];
    if (!heroList || heroList.length === 0) {
      return null;
    }

    const heroName = heroList[heroCounters[card.house] % heroList.length];
    heroCounters[card.house]++;

    return `/cards/heroes/${houseCode}-${heroName}.webp`;
  }

  if (card.type === "monster") {
    // Use fileName if provided
    if (card.fileName) {
      return `/cards/monsters/${card.fileName}`;
    }

    if (card.isBobOmb) {
      return `/cards/monsters/Bob-omb.webp`;
    }

    // Use the specific monster name if provided
    if (card.name) {
      return `/cards/monsters/M-${card.name}.webp`;
    }

    // Fallback: cycle through available monster names for this point value
    const pointValue = Math.abs(card.value) as 1 | 2 | 3;
    const monsterList = MONSTER_NAMES[pointValue];

    if (!monsterList || monsterList.length === 0) {
      return null;
    }

    const monsterName = monsterList[monsterCounters[pointValue] % monsterList.length];
    monsterCounters[pointValue]++;

    return `/cards/monsters/M-${monsterName}.webp`;
  }

  if (card.type === "powerup") {
    // Power-ups use their fileName directly
    return `/cards/powerups/${card.fileName}`;
  }

  if (card.type === "trophy") {
    if (card.isHouseTrophy && card.house) {
      const houseCode = HOUSE_CODES[card.house];
      return `/cards/trophies/${houseCode}-HouseCup.webp`;
    }

    // For other trophies, use the exact name from the card
    const fileName = card.name.replace(/\s+/g, "");
    return `/cards/trophies/${fileName}.webp`;
  }

  return null;
}

/**
 * Returns a fallback color for a card (used when image is not available)
 */
export function getCardColor(card: GameCard): string {
  if (card.type === "hero") {
    const houseColors: Record<string, string> = {
      "mario-bros": "#e74c3c",
      "mushroom-kingdom": "#e67e22",
      "kong-island": "#f39c12",
      "bowsers-castle": "#8e44ad",
      "wa": "#95a5a6",
    };
    return houseColors[card.house] || "#95a5a6";
  }
  if (card.type === "collectable") {
    const collectableColors: Record<string, string> = {
      "mario-bros": "#f1c40f",
      "mushroom-kingdom": "#e74c3c",
      "kong-island": "#f39c12",
    };
    return collectableColors[card.house] || "#3498db";
  }
  if (card.type === "monster") {
    return "#34495e";
  }
  if (card.type === "trophy") {
    return "#f39c12";
  }
  if (card.type === "mystery-box") {
    return "#9b59b6";
  }
  if (card.type === "powerup") {
    return "#3498db"; // Blue for power-ups
  }
  return "#bdc3c7";
}
