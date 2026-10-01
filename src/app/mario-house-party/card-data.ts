import type { PowerUpCard, MonsterCard } from "./types";

// Power-up cards from CSV
export const POWERUP_CARDS: PowerUpCard[] = [
  {
    type: "powerup",
    name: "Fire Flower",
    fileName: "112.webp",
    rules: "Play Fire Flower to Shoot one card off the table with a fireball. Bob-omb is immune, A hero Card goes back into the Draw Pile, any other card goes into the Discard Pile",
  },
  {
    type: "powerup",
    name: "Ice Flower",
    fileName: "121.webp",
    rules: 'Play Ice Flower to "Freeze" one card on the Table, a forzen card can then be slid once to any other board on the table. Ice Flower is then Discarded.',
  },
  {
    type: "powerup",
    name: "Piranha Plant",
    fileName: "130.webp",
    rules: "Play a Piranha Plant to block a player's board, they are Skipped and lose their next turn. The Piranha Plant is discarded immediately after their 'skipped' turn",
  },
  {
    type: "powerup",
    name: "Warp Pipe",
    fileName: "136.webp",
    rules: "Play a Warp Pipe to warm any card on the table into your hand. Warp Pipe is then Discarded.",
  },
  {
    type: "powerup",
    name: "Thwomp",
    fileName: "142.webp",
    rules: "Play Thwomp at any time to stop any Action.",
  },
  {
    type: "powerup",
    name: "1 Up Mushroom",
    fileName: "154.webp",
    isUnique: true,
    rules: "Unique Power up. The game ends when the first player empties their hand during Final Rounds. If you have the 1 Up mushroom, you get to go again for a full extra turn (three Actions). If someone else goes out first you can free play the 1 ip mushroom and then take your turn. If you end your turn with the 1 up mushroom the only card in your hand, you both end the game and get an additional turn.",
  },
  {
    type: "powerup",
    name: "Star Power",
    fileName: "155.webp",
    isUnique: true,
    rules: "Unique Power up. Play the Star Card and you are Immune to all attacks and actions against you or your board until the end of your next turn.",
  },
  {
    type: "powerup",
    name: "Blue Shell",
    fileName: "156.webp",
    isUnique: true,
    rules: "Unique Power up. Play the Blue Shell to discard ALL the Heros from One House on One Player's Board. Heros and Blue shell are Discarded.",
  },
  {
    type: "powerup",
    name: "K.O. Hammer",
    fileName: "157.webp",
    isUnique: true,
    rules: "Unique Power up. Play the K.O. Hammer to discard all monsters from one PLayer's board. Hammer and monsters are discarded.",
  },
  {
    type: "powerup",
    name: "Lakitu",
    fileName: "158.webp",
    isUnique: true,
    rules: "Unique Power up. Play Lakitu to pull one card of your choice from the Discard Pile. Lakitu is discarded, selected card goes into your hand.",
  },
  {
    type: "powerup",
    name: "Tanuki Suit",
    fileName: "159.webp",
    isUnique: true,
    rules: "Unique Power up. Play Tanuki Suit on one hero Card to make it Invincible until the end of the game. It can not be destroyed, moved or stolen. Tanuki card stays with Hero card.",
  },
  {
    type: "powerup",
    name: "Red Shells",
    fileName: "160.webp",
    isUnique: true,
    rules: "Unique Power up. Play Red Shells to Shoot thre cards off the table with one Action. Bob-omb is immune. A hero card goes back into the draw pile, any other card goes in the Discard pile. Red shells is discarded.",
  },
  {
    type: "powerup",
    name: "Gold Pipe",
    fileName: "161.webp",
    isUnique: true,
    rules: "Unque Power up. Play Gold Pipe to warp any two cards on the table or from your hand to swap places with one another. Gold Pipe is discarded",
  },
];

// Monster cards from CSV
export const MONSTER_CARDS: MonsterCard[] = [
  {
    type: "monster",
    name: "Bob-omb",
    fileName: "Bob-omb.webp",
    value: -10,
    isBobOmb: true,
    isTappable: true,
    rules: 'Once played cannot be destroyed or removed from play. Card can be "Tapped" to throw to a different board on the table. -10pts during final scoring',
  },
  {
    type: "monster",
    name: "Big Boo",
    fileName: "M-BigBoo.webp",
    value: -2,
    isTappable: true,
    isHideable: true,
    rules: 'Once played, can be "Tapped" to be hidden or revealed. A Tapped (hidden) Big Boo does not affect scoring, a revealed Big Boo is worth -2 pts during final scoring.',
  },
  {
    type: "monster",
    name: "Boo",
    fileName: "M-Boo.webp",
    value: -1,
    isTappable: true,
    isHideable: true,
    rules: 'Once played, can be "Tapped" to be hidden or revealed. A Tapped (hidden) Boo does not affect scoring, a revealed Boo is worth -1 pts during final scoring.',
  },
  {
    type: "monster",
    name: "Goomba",
    fileName: "M-Goomba.webp",
    value: -1,
    rules: "-1 pts during final Scoring",
  },
  {
    type: "monster",
    name: "Shy Guy",
    fileName: "M-ShyGuy.webp",
    value: -2,
    rules: "-2 pts during final Scoring",
  },
  {
    type: "monster",
    name: "Dry Bones",
    fileName: "M-DryBones.webp",
    value: -3,
    isTappable: true,
    rules: 'Once played, can be "Tapped" to be returned to the draw pile. -3 pts during final scoring.',
  },
  {
    type: "monster",
    name: "Koopa Troopa",
    fileName: "M-KoopaTroopa.webp",
    value: -1,
    isTappable: true,
    rules: 'Once played, can be "Tapped" to be moved to a different board on the table. -1 pts during final scoring.',
  },
  {
    type: "monster",
    name: "Koopa Paratroopa",
    fileName: "M-KoopaParatroopa.webp",
    value: -2,
    isTappable: true,
    rules: 'Once played, can be "Tapped" to be moved to a different board on the table. -2pts during final scoring.',
  },
];

// Helper to get card image path
export const getCardImagePath = (card: PowerUpCard | MonsterCard): string => {
  if (card.type === "powerup") {
    return `/cards/powerups/${card.fileName}`;
  }
  return `/cards/monsters/${card.fileName}`;
};

// Helper to find card by name
export const findPowerUpByName = (name: string): PowerUpCard | undefined => {
  return POWERUP_CARDS.find((card) => card.name === name);
};

export const findMonsterByName = (name: string): MonsterCard | undefined => {
  return MONSTER_CARDS.find((card) => card.name === name);
};
