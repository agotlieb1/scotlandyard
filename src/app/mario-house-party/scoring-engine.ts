import type {
  CardWithId,
  HeroCard,
  CollectableCard,
  MonsterCard,
  TrophyCard,
  MysteryBoxCard,
  MainHouse,
  ScoreBreakdown,
} from "./types";

export function calculateScore(
  cards: CardWithId[],
  options?: { autoCalculateTrophies?: boolean }
): ScoreBreakdown {
  let heroPoints = 0;
  let collectablePoints = 0;
  let mysteryBoxPoints = 0;
  let trophyPoints = 0;
  let monsterPenalty = 0;
  let houseTrophyBonus = 0;
  const houseTrophiesWon: MainHouse[] = [];

  // Separate cards by type
  const heroes: CardWithId[] = [];
  const collectables: CardWithId[] = [];
  const monsters: CardWithId[] = [];
  const trophies: CardWithId[] = [];
  const mysteryBoxes: CardWithId[] = [];

  cards.forEach((cardWithId) => {
    const card = cardWithId.card;
    if (card.type === "hero") heroes.push(cardWithId);
    else if (card.type === "collectable") collectables.push(cardWithId);
    else if (card.type === "monster") monsters.push(cardWithId);
    else if (card.type === "trophy") trophies.push(cardWithId);
    else if (card.type === "mystery-box") mysteryBoxes.push(cardWithId);
  });

  // Step 1: Determine house trophy winners
  const houseCardCounts = countCardsByHouse(heroes, collectables);
  let wonTrophies: MainHouse[];

  if (options?.autoCalculateTrophies) {
    // Auto-calculate trophies based on heroes (for Full Game mode with complete data)
    wonTrophies = determineHouseTrophies(heroes);
  } else {
    // Require manual trophy cards (for Score Yourself mode)
    wonTrophies = trophies
      .filter((t) => (t.card as TrophyCard).isHouseTrophy)
      .map((t) => (t.card as TrophyCard).house as MainHouse);
  }

  houseTrophiesWon.push(...wonTrophies);

  // Step 2: Calculate hero points
  // Heroes that cancel monsters don't count as points
  const heroesCancelingMonsters = heroes.filter((h) => {
    const hero = h.card as HeroCard;
    return hero.cancelingMonsterId !== undefined;
  });
  const heroesForPoints = heroes.filter((h) => {
    const hero = h.card as HeroCard;
    return hero.cancelingMonsterId === undefined;
  });
  heroPoints = heroesForPoints.length;

  // Step 3: Calculate collectable points
  collectablePoints = collectables.reduce((sum, c) => {
    const card = c.card as CollectableCard;
    return sum + card.value;
  }, 0);

  // Step 4: Calculate monster penalty
  // Monsters canceled by heroes don't count
  // If Koopa Cup is won, all monsters = 0
  const hasKoopaCup = wonTrophies.includes("bowsers-castle");

  if (hasKoopaCup) {
    // Koopa Cup: all monsters = 0, then +1pt per monster card
    const bowserHeroes = heroes.filter((h) => {
      const hero = h.card as HeroCard;
      const effectiveHouse = hero.house === "wa" && hero.pledgedHouse
        ? hero.pledgedHouse
        : hero.house;
      return effectiveHouse === "bowsers-castle";
    });

    // Monsters don't contribute negative points
    monsterPenalty = 0;
    // But they do contribute to house trophy bonus
    houseTrophyBonus += monsters.length; // +1 per monster
    houseTrophyBonus += bowserHeroes.length; // +1 per Bowser hero
  } else {
    // Normal monster scoring
    monsters.forEach((m) => {
      const monster = m.card as MonsterCard;
      // If this monster is canceled, skip it
      if (monster.canceledByHeroId) return;

      monsterPenalty += monster.value; // Remember: monster.value is negative
    });
  }

  // Step 5: Calculate mystery box points
  mysteryBoxes.forEach((mb) => {
    const box = mb.card as MysteryBoxCard;
    if (box.isSafe) {
      mysteryBoxPoints += 5;
    } else {
      // Gamble: +10 if won the trophy, 0 if not
      if (box.declaredHouse && wonTrophies.includes(box.declaredHouse)) {
        mysteryBoxPoints += 10;
      }
      // Otherwise it's 0
    }
  });

  // Step 6: Calculate house trophy bonuses
  // For each house trophy won (except Koopa which we handled above)
  wonTrophies.forEach((house) => {
    if (house === "bowsers-castle") return; // Already handled

    // Count cards from this house
    const count = houseCardCounts[house] || 0;
    houseTrophyBonus += count;
  });

  // Step 7: Calculate other trophy points
  const otherTrophies = trophies.filter((t) => {
    const trophy = t.card as TrophyCard;
    return !trophy.isHouseTrophy;
  });
  trophyPoints = otherTrophies.length * 5;

  const totalScore =
    heroPoints +
    collectablePoints +
    mysteryBoxPoints +
    trophyPoints +
    monsterPenalty + // This is negative
    houseTrophyBonus;

  return {
    heroPoints,
    collectablePoints,
    mysteryBoxPoints,
    trophyPoints,
    monsterPenalty,
    houseTrophyBonus,
    totalScore,
    houseTrophiesWon,
  };
}

function countCardsByHouse(
  heroes: CardWithId[],
  collectables: CardWithId[]
): Record<MainHouse, number> {
  const counts: Record<MainHouse, number> = {
    "mario-bros": 0,
    "mushroom-kingdom": 0,
    "kong-island": 0,
    "bowsers-castle": 0,
  };

  // Count heroes
  heroes.forEach((h) => {
    const hero = h.card as HeroCard;
    let effectiveHouse: MainHouse | null = null;

    if (hero.house === "wa") {
      // Wa! card: only counts if pledged
      if (hero.pledgedHouse) {
        effectiveHouse = hero.pledgedHouse;
      }
    } else {
      effectiveHouse = hero.house as MainHouse;
    }

    if (effectiveHouse) {
      counts[effectiveHouse]++;
    }
  });

  // Count collectables
  collectables.forEach((c) => {
    const card = c.card as CollectableCard;
    counts[card.house]++;
  });

  return counts;
}

function determineHouseTrophies(heroes: CardWithId[]): MainHouse[] {
  const heroCounts: Record<MainHouse, number> = {
    "mario-bros": 0,
    "mushroom-kingdom": 0,
    "kong-island": 0,
    "bowsers-castle": 0,
  };

  // Count heroes per house
  heroes.forEach((h) => {
    const hero = h.card as HeroCard;
    let effectiveHouse: MainHouse | null = null;

    if (hero.house === "wa") {
      if (hero.pledgedHouse) {
        effectiveHouse = hero.pledgedHouse;
      }
    } else {
      effectiveHouse = hero.house as MainHouse;
    }

    if (effectiveHouse) {
      heroCounts[effectiveHouse]++;
    }
  });

  // For a single-player calculator, just check if they have any heroes in the house
  // In a multi-player version, you'd compare between players
  const trophies: MainHouse[] = [];

  // For now, award trophy if player has at least 1 hero in that house
  // This is a simplification - in the real game you'd need to compare against other players
  (Object.keys(heroCounts) as MainHouse[]).forEach((house) => {
    if (heroCounts[house] > 0) {
      trophies.push(house);
    }
  });

  return trophies;
}
