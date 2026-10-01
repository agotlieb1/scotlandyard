import type { GameCard, CollectableValue, MainHouse } from "@/app/mario-house-party/types";
import {
  HERO_CARDS,
  HOUSE_TROPHY_CARDS,
  OTHER_TROPHY_CARDS,
} from "@/app/mario-house-party/card-library";
import { POWERUP_CARDS, MONSTER_CARDS } from "@/app/mario-house-party/card-data";

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random items from an array
 */
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

/**
 * Build collectables for a house based on player count
 */
function buildCollectablesForHouse(house: "mario-bros" | "mushroom-kingdom" | "kong-island", playerCount: number): GameCard[] {
  const cards: GameCard[] = [];

  switch (playerCount) {
    case 2:
      // Two 1pt, One 2pt, One 3pt
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 2 as CollectableValue });
      cards.push({ type: "collectable", house, value: 3 as CollectableValue });
      break;
    case 3:
      // Three 1pt, One 2pt, One 3pt
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 2 as CollectableValue });
      cards.push({ type: "collectable", house, value: 3 as CollectableValue });
      break;
    case 4:
      // Three 1pt, Two 2pt, One 3pt
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 2 as CollectableValue });
      cards.push({ type: "collectable", house, value: 2 as CollectableValue });
      cards.push({ type: "collectable", house, value: 3 as CollectableValue });
      break;
    case 5:
    case 6:
      // All collectables: Three 1pt, Two 2pt, One 3pt, One Golden (5pt)
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 1 as CollectableValue });
      cards.push({ type: "collectable", house, value: 2 as CollectableValue });
      cards.push({ type: "collectable", house, value: 2 as CollectableValue });
      cards.push({ type: "collectable", house, value: 3 as CollectableValue });
      cards.push({ type: "collectable", house, value: 5 as CollectableValue, isGolden: true });
      break;
  }

  return cards;
}

/**
 * Build a deck based on player count following official rules
 */
export function buildDeck(playerCount: number): GameCard[] {
  const deck: GameCard[] = [];

  console.log(`[DeckBuilder] Building deck for ${playerCount} players`);

  // === ALWAYS INCLUDED ===

  // Both Wa! Heroes
  const waHeroes = HERO_CARDS.filter(h => h.house === "wa");
  deck.push(...waHeroes);
  console.log(`[DeckBuilder] Added ${waHeroes.length} Wa! heroes`);

  // Bob-omb
  const bobomb = MONSTER_CARDS.find(m => m.isBobOmb);
  if (bobomb) deck.push(bobomb);
  console.log(`[DeckBuilder] Added Bob-omb`);

  // Mystery Box
  deck.push({ type: "mystery-box", isSafe: true });
  console.log(`[DeckBuilder] Added Mystery Box`);

  // === HEROES ===
  // Number of heroes per house = playerCount + 2
  const heroesPerHouse = playerCount + 2;
  const mainHouses: MainHouse[] = ["mario-bros", "mushroom-kingdom", "kong-island", "bowsers-castle"];

  for (const house of mainHouses) {
    const houseHeroes = HERO_CARDS.filter(h => h.house === house);
    const selectedHeroes = houseHeroes.slice(0, heroesPerHouse);
    deck.push(...selectedHeroes);
  }
  console.log(`[DeckBuilder] Added ${heroesPerHouse} heroes per house`);

  // === COLLECTABLES ===
  const houses: ("mario-bros" | "mushroom-kingdom" | "kong-island")[] = ["mario-bros", "mushroom-kingdom", "kong-island"];
  for (const house of houses) {
    const collectables = buildCollectablesForHouse(house, playerCount);
    deck.push(...collectables);
  }
  console.log(`[DeckBuilder] Added collectables for ${playerCount} players`);

  // === POWER-UPS ===
  const fireFlowers = POWERUP_CARDS.filter(p => p.name === "Fire Flower");
  const iceFlowers = POWERUP_CARDS.filter(p => p.name === "Ice Flower");
  const piranhaPlants = POWERUP_CARDS.filter(p => p.name === "Piranha Plant");
  const warpPipes = POWERUP_CARDS.filter(p => p.name === "Warp Pipe");
  const thwomps = POWERUP_CARDS.filter(p => p.name === "Thwomp");

  // Add duplicates as needed (we only have 1 of each in card-data, so we'll add copies)
  for (let i = 0; i < playerCount + 3; i++) {
    if (fireFlowers[0]) deck.push(fireFlowers[0]);
    if (iceFlowers[0]) deck.push(iceFlowers[0]);
  }
  for (let i = 0; i < playerCount; i++) {
    if (piranhaPlants[0]) deck.push(piranhaPlants[0]);
    if (warpPipes[0]) deck.push(warpPipes[0]);
    if (thwomps[0]) deck.push(thwomps[0]);
  }
  console.log(`[DeckBuilder] Added power-ups`);

  // Rare Power-Ups: Always include Blue Shell & Star Power, + (playerCount - 2) random rare power-ups
  const blueShell = POWERUP_CARDS.find(p => p.name === "Blue Shell");
  const starPower = POWERUP_CARDS.find(p => p.name === "Star Power");
  if (blueShell) deck.push(blueShell);
  if (starPower) deck.push(starPower);

  const rarePowerUps = POWERUP_CARDS.filter(p =>
    p.isUnique && p.name !== "Blue Shell" && p.name !== "Star Power"
  );
  const additionalRares = Math.max(0, playerCount - 2);
  const selectedRares = getRandomItems(rarePowerUps, additionalRares);
  deck.push(...selectedRares);
  console.log(`[DeckBuilder] Added ${2 + additionalRares} rare power-ups`);

  // === MONSTERS ===
  // 2 of each monster (excluding Dry Bones for now)
  const regularMonsters = MONSTER_CARDS.filter(m => !m.isBobOmb && m.name !== "Dry Bones");

  // Base: 2 of each regular monster (Goomba, Shy Guy, Koopa Troopa, Koopa Paratroopa, Boo, Big Boo)
  for (const monster of regularMonsters) {
    deck.push(monster);
    deck.push(monster);
  }

  // Additional monsters by player count
  switch (playerCount) {
    case 2:
      // No additions beyond base
      break;
    case 3:
      // All Boos (already included in base), + 1 Dry Bones
      const dryBones1 = MONSTER_CARDS.find(m => m.name === "Dry Bones");
      if (dryBones1) deck.push(dryBones1);
      break;
    case 4:
      // All Boos & Koopas (already in base), + 2 Dry Bones
      const dryBones2 = MONSTER_CARDS.find(m => m.name === "Dry Bones");
      if (dryBones2) {
        deck.push(dryBones2);
        deck.push(dryBones2);
      }
      break;
    case 5:
    case 6:
      // All monsters - add 2 Dry Bones
      const dryBones3 = MONSTER_CARDS.find(m => m.name === "Dry Bones");
      if (dryBones3) {
        deck.push(dryBones3);
        deck.push(dryBones3);
      }
      break;
  }
  console.log(`[DeckBuilder] Added monsters for ${playerCount} players`);

  console.log(`[DeckBuilder] Total deck size: ${deck.length} cards`);

  // Shuffle the deck
  return shuffleArray(deck);
}

/**
 * Deal cards from the deck
 * Returns the dealt cards and the remaining deck
 */
export function dealCards(
  deck: GameCard[],
  count: number
): { dealt: GameCard[]; remaining: GameCard[] } {
  const dealt = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { dealt, remaining };
}

/**
 * Set aside house trophy cards (not in draw pile)
 */
export function getHouseTrophies(): GameCard[] {
  return [...HOUSE_TROPHY_CARDS];
}
