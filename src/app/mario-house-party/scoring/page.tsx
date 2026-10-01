"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Tabs,
  Tab,
  Modal,
  Fade,
} from "@mui/material";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import type { CardWithId, GameCard } from "../types";
import { HOUSE_NAMES, HOUSE_TROPHIES } from "../types";
import {
  COLLECTABLE_CARDS,
  MYSTERY_BOX_CARD,
  HERO_CARDS,
  MONSTER_CARDS,
  ALL_TROPHY_CARDS,
} from "../card-library";
import { CardDisplay } from "../components/CardDisplay";
import { DropZone } from "../components/DropZone";
import { CardPalette } from "../components/CardPalette";
import { MysteryBoxControls } from "../components/MysteryBoxControls";
import { HeroMonsterControls } from "../components/HeroMonsterControls";
import { WaHeroControls } from "../components/WaHeroControls";
import { calculateScore } from "../scoring-engine";
import { TABLE } from "../theme";
import type { MysteryBoxCard, HeroCard, MonsterCard, MainHouse } from "../types";

// Player colors for Full Game mode
const PLAYER_COLORS = [
  { primary: "#e74c3c", secondary: "#c0392b", name: "Red" }, // Red
  { primary: "#3498db", secondary: "#2980b9", name: "Blue" }, // Blue
  { primary: "#2ecc71", secondary: "#27ae60", name: "Green" }, // Green
  { primary: "#f39c12", secondary: "#e67e22", name: "Orange" }, // Orange
  { primary: "#9b59b6", secondary: "#8e44ad", name: "Purple" }, // Purple
  { primary: "#1abc9c", secondary: "#16a085", name: "Teal" }, // Teal
];

/**
 * The running total, pinned to the bottom of a phone screen. The palette and
 * the hand cannot both be on screen at that size, so without this a tap looks
 * like it did nothing. Hidden once the layout is wide enough to show both.
 */
function ScoreRail({
  cardCount,
  total,
  label,
}: {
  cardCount: number;
  total?: number;
  label?: string;
}) {
  return (
    <Box
      sx={{
        display: { xs: "flex", lg: "none" },
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1200,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: 2.5,
        py: 1.5,
        pb: "calc(12px + env(safe-area-inset-bottom))",
        borderTop: `1px solid ${TABLE.brass}55`,
        background: `linear-gradient(180deg, rgba(7,29,41,0.92), ${TABLE.rail})`,
        backdropFilter: "blur(10px)",
        boxShadow: "0 -10px 30px -12px rgba(0,0,0,0.9)",
      }}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: "rgba(253, 247, 238, 0.6)", whiteSpace: "nowrap" }}
        >
          {label ? `${label} — ` : ""}
          {cardCount === 0
            ? "no cards yet"
            : `${cardCount} card${cardCount === 1 ? "" : "s"} in hand`}
        </Typography>
        {total !== undefined ? (
          <Typography
            variant="h5"
            sx={{
              color: total < 0 ? TABLE.danger : TABLE.cream,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {total}
            <Box
              component="span"
              sx={{ color: TABLE.brass, fontSize: "0.6em", ml: 0.75 }}
            >
              pts
            </Box>
          </Typography>
        ) : (
          <Typography variant="h6" sx={{ color: TABLE.brass, lineHeight: 1 }}>
            Hidden until scoring
          </Typography>
        )}
      </Stack>
      <Button
        size="small"
        variant="outlined"
        disabled={cardCount === 0}
        onClick={() =>
          document
            .getElementById("hand-zone")
            ?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        sx={{ borderColor: `${TABLE.brass}66`, color: TABLE.cream, flexShrink: 0 }}
      >
        See hand
      </Button>
    </Box>
  );
}

interface Player {
  id: string;
  name: string;
  color: { primary: string; secondary: string; name: string };
  cards: CardWithId[];
}

export default function ScoringPage() {
  const [mode, setMode] = useState<"calculator" | "game">("calculator");
  const [activeCard, setActiveCard] = useState<CardWithId | null>(null);
  const [scoringZone, setScoringZone] = useState<CardWithId[]>([]);

  // Full Game mode state
  const [gameSetup, setGameSetup] = useState<boolean>(true);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerTab, setCurrentPlayerTab] = useState<number>(0);
  const [showScoreReveal, setShowScoreReveal] = useState<boolean>(false);
  const [revealedScores, setRevealedScores] = useState<number>(0);

  // A single PointerSensor could not drag on a phone at all: the browser
  // claimed the gesture for scrolling before dnd-kit ever saw it. Splitting
  // the sensors fixes that — a mouse drags as soon as it moves 8px, and a
  // finger drags after holding still for a moment, which leaves quick taps
  // and scroll swipes to behave as they always did.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const cardData = event.active.data.current?.card;
    if (cardData) {
      setActiveCard({
        id: event.active.id as string,
        card: cardData,
      });
    }
  };

  // Helper function to add a card to scoring zone (used by both drag and tap)
  const addCardToScoringZone = (cardData: GameCard) => {
    // Check if this specific hero is already in the scoring zone
    // (heroes are unique)
    if (cardData.type === "hero") {
      const heroCard = cardData as HeroCard;
      if (heroCard.name) {
        const alreadyHasThisHero = scoringZone.some((c) => {
          if (c.card.type !== "hero") return false;
          const existingHero = c.card as HeroCard;
          return existingHero.name === heroCard.name && existingHero.house === heroCard.house;
        });
        if (alreadyHasThisHero) {
          return; // Don't add duplicate hero
        }
      }
    }

    // Check collectable limits (3x 1pt, 2x 2pt, 1x 3pt, 1x 5pt per house)
    if (cardData.type === "collectable") {
      const collectableCard = cardData as typeof cardData & { house: string; value: number };
      const existingCount = scoringZone.filter((c) => {
        if (c.card.type !== "collectable") return false;
        const existing = c.card as typeof collectableCard;
        return existing.house === collectableCard.house && existing.value === collectableCard.value;
      }).length;

      let limit = 0;
      if (collectableCard.value === 1) limit = 3;
      else if (collectableCard.value === 2) limit = 2;
      else if (collectableCard.value === 3) limit = 1;
      else if (collectableCard.value === 5) limit = 1; // Golden

      if (existingCount >= limit) {
        return; // Don't exceed collectable limit
      }
    }

    // Check mystery box limit (only 1 total)
    if (cardData.type === "mystery-box") {
      const hasMysteryBox = scoringZone.some((c) => c.card.type === "mystery-box");
      if (hasMysteryBox) {
        return; // Don't add more than one mystery box
      }
    }

    // Generate unique ID for this card instance
    const newCard: CardWithId = {
      id: `${Date.now()}-${Math.random()}`,
      card: cardData,
    };

    setScoringZone((prev) => [...prev, newCard]);
  };

  const handleCardTap = (cardData: GameCard) => {
    addCardToScoringZone(cardData);
  };

  const handleScoringZoneCardTap = (cardId: string) => {
    // Remove card from scoring zone when tapped
    setScoringZone((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const cardId = active.id as string;
    const isAlreadyInScoringZone = scoringZone.some((c) => c.id === cardId);

    // If dropped over the scoring zone
    if (over.id === "scoring-zone") {
      // If the card is already in the scoring zone, don't duplicate it
      if (isAlreadyInScoringZone) {
        return;
      }

      const cardData = active.data.current?.card as GameCard;
      if (!cardData) return;

      addCardToScoringZone(cardData);
    }

    // If dropped over the remove zone
    if (over.id === "remove-zone") {
      setScoringZone((prev) => prev.filter((c) => c.id !== cardId));
    }
  };

  const handleClearAll = () => {
    setScoringZone([]);
  };

  const handleUpdateMysteryBox = (
    id: string,
    updates: Partial<MysteryBoxCard>
  ) => {
    setScoringZone((prev) =>
      prev.map((cardWithId) => {
        if (cardWithId.id === id && cardWithId.card.type === "mystery-box") {
          return {
            ...cardWithId,
            card: {
              ...cardWithId.card,
              ...updates,
            },
          };
        }
        return cardWithId;
      })
    );
  };

  const handleCancelMonster = (heroId: string, monsterId: string) => {
    setScoringZone((prev) =>
      prev.map((cardWithId) => {
        // Update the hero to point to the monster
        if (cardWithId.id === heroId && cardWithId.card.type === "hero") {
          return {
            ...cardWithId,
            card: {
              ...cardWithId.card,
              cancelingMonsterId: monsterId,
            } as HeroCard,
          };
        }
        // Update the monster to point to the hero
        if (cardWithId.id === monsterId && cardWithId.card.type === "monster") {
          return {
            ...cardWithId,
            card: {
              ...cardWithId.card,
              canceledByHeroId: heroId,
            } as MonsterCard,
          };
        }
        return cardWithId;
      })
    );
  };

  const handleUncancelMonster = (heroId: string) => {
    setScoringZone((prev) => {
      // First find the monster that this hero is canceling
      const heroCard = prev.find((c) => c.id === heroId);
      if (!heroCard || heroCard.card.type !== "hero") return prev;

      const hero = heroCard.card as HeroCard;
      const monsterId = hero.cancelingMonsterId;

      return prev.map((cardWithId) => {
        // Clear the hero's cancellation
        if (cardWithId.id === heroId && cardWithId.card.type === "hero") {
          return {
            ...cardWithId,
            card: {
              ...cardWithId.card,
              cancelingMonsterId: undefined,
            } as HeroCard,
          };
        }
        // Clear the monster's canceled status
        if (
          monsterId &&
          cardWithId.id === monsterId &&
          cardWithId.card.type === "monster"
        ) {
          return {
            ...cardWithId,
            card: {
              ...cardWithId.card,
              canceledByHeroId: undefined,
            } as MonsterCard,
          };
        }
        return cardWithId;
      });
    });
  };

  const handlePledgeWaHero = (heroId: string, house: MainHouse) => {
    setScoringZone((prev) =>
      prev.map((cardWithId) => {
        if (cardWithId.id === heroId && cardWithId.card.type === "hero") {
          return {
            ...cardWithId,
            card: {
              ...cardWithId.card,
              pledgedHouse: house,
            } as HeroCard,
          };
        }
        return cardWithId;
      })
    );
  };

  const handleUnpledgeWaHero = (heroId: string) => {
    setScoringZone((prev) =>
      prev.map((cardWithId) => {
        if (cardWithId.id === heroId && cardWithId.card.type === "hero") {
          return {
            ...cardWithId,
            card: {
              ...cardWithId.card,
              pledgedHouse: undefined,
            } as HeroCard,
          };
        }
        return cardWithId;
      })
    );
  };

  // Get cards by type for the controls
  const mysteryBoxes = scoringZone.filter((c) => c.card.type === "mystery-box");
  const heroes = scoringZone.filter((c) => c.card.type === "hero");
  const monsters = scoringZone.filter((c) => c.card.type === "monster");
  const waHeroes = heroes.filter((h) => (h.card as HeroCard).house === "wa");

  // Calculate score whenever scoring zone changes
  const scoreBreakdown = calculateScore(scoringZone);

  // Full Game mode handlers
  const handleStartGame = () => {
    const newPlayers: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      newPlayers.push({
        id: `player-${i}`,
        name: `Player ${i + 1}`,
        color: PLAYER_COLORS[i],
        cards: [],
      });
    }
    setPlayers(newPlayers);
    setGameSetup(false);
  };

  const handlePlayerNameChange = (playerId: string, name: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, name: name || `Player ${players.indexOf(p) + 1}` } : p))
    );
  };

  const handleResetGame = () => {
    setGameSetup(true);
    setPlayers([]);
    setCurrentPlayerTab(0);
    setShowScoreReveal(false);
    setRevealedScores(0);
  };

  // Check if a card can be added to a player's zone (global card limits)
  const canAddCardToPlayer = (playerId: string, cardData: GameCard): boolean => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return false;

    // Check if this specific hero is already in ANY scoring zone
    if (cardData.type === "hero") {
      const heroCard = cardData as HeroCard;
      if (heroCard.name) {
        const alreadyHasThisHero = players.some((p) =>
          p.cards.some((c) => {
            if (c.card.type !== "hero") return false;
            const existingHero = c.card as HeroCard;
            return existingHero.name === heroCard.name && existingHero.house === heroCard.house;
          })
        );
        if (alreadyHasThisHero) return false;
      }
    }

    // Check collectable limits (3x 1pt, 2x 2pt, 1x 3pt, 1x 5pt per house - GLOBALLY)
    if (cardData.type === "collectable") {
      const collectableCard = cardData as typeof cardData & { house: string; value: number };
      let existingCount = 0;
      players.forEach((p) => {
        existingCount += p.cards.filter((c) => {
          if (c.card.type !== "collectable") return false;
          const existing = c.card as typeof collectableCard;
          return existing.house === collectableCard.house && existing.value === collectableCard.value;
        }).length;
      });

      let limit = 0;
      if (collectableCard.value === 1) limit = 3;
      else if (collectableCard.value === 2) limit = 2;
      else if (collectableCard.value === 3) limit = 1;
      else if (collectableCard.value === 5) limit = 1;

      if (existingCount >= limit) return false;
    }

    // Check mystery box limit (only 1 total GLOBALLY)
    if (cardData.type === "mystery-box") {
      const hasMysteryBox = players.some((p) => p.cards.some((c) => c.card.type === "mystery-box"));
      if (hasMysteryBox) return false;
    }

    return true;
  };

  const addCardToPlayer = (playerId: string, cardData: GameCard) => {
    if (!canAddCardToPlayer(playerId, cardData)) return;

    const newCard: CardWithId = {
      id: `${Date.now()}-${Math.random()}`,
      card: cardData,
    };

    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, cards: [...p.cards, newCard] } : p))
    );
  };

  const removeCardFromPlayer = (playerId: string, cardId: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, cards: p.cards.filter((c) => c.id !== cardId) } : p))
    );
  };

  const handleGameCardTap = (cardData: GameCard) => {
    const currentPlayer = players[currentPlayerTab];
    if (currentPlayer) {
      addCardToPlayer(currentPlayer.id, cardData);
    }
  };

  const handleGameScoringZoneCardTap = (cardId: string) => {
    const currentPlayer = players[currentPlayerTab];
    if (currentPlayer) {
      removeCardFromPlayer(currentPlayer.id, cardId);
    }
  };

  const handleReadyToScore = () => {
    setShowScoreReveal(true);
    setRevealedScores(0);

    // Sort players by score (lowest to highest)
    const sortedPlayers = [...players].sort((a, b) => {
      const scoreA = calculateScore(a.cards).totalScore;
      const scoreB = calculateScore(b.cards).totalScore;
      return scoreA - scoreB;
    });

    // Reveal scores one by one with delay
    sortedPlayers.forEach((_, index) => {
      setTimeout(() => {
        setRevealedScores(index + 1);
      }, 1000 * (index + 1));
    });
  };

  const handleCloseScoreReveal = () => {
    setShowScoreReveal(false);
    setRevealedScores(0);
  };

  // Check if any player has cards (to show Ready to Score button)
  const anyPlayerHasCards = players.some((p) => p.cards.length > 0);

  // Get sorted players for score reveal
  const sortedPlayersForReveal = [...players].sort((a, b) => {
    const scoreA = calculateScore(a.cards).totalScore;
    const scoreB = calculateScore(b.cards).totalScore;
    return scoreA - scoreB;
  });

  return (
    <>
      {mode === "calculator" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box
            sx={{
              minHeight: "100vh",
              py: 4,
              // Room for the fixed score rail on small screens.
              pb: { xs: 14, lg: 4 },
            }}
          >
            <Container maxWidth="xl">
              <Stack spacing={4}>
                {/* Header */}
                <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="overline" sx={{ color: TABLE.brass }}>
                    Mario House Party
                  </Typography>
                  <Typography variant="h4" sx={{ color: TABLE.cream }}>
                    {mode === "calculator" ? "Score Calculator" : "Full Game"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.68)" }}>
                    Tap a card to deal it in, tap it again to take it back.
                    Press and hold to drag.
                  </Typography>
                </Stack>

                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, newMode) => {
                    if (newMode !== null) setMode(newMode);
                  }}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    "& .MuiToggleButton-root": {
                      color: "rgba(253, 247, 238, 0.6)",
                      border: "1px solid rgba(111, 209, 255, 0.2)",
                      "&.Mui-selected": {
                        bgcolor: "rgba(111, 209, 255, 0.2)",
                        color: "#6fd1ff",
                        "&:hover": {
                          bgcolor: "rgba(111, 209, 255, 0.3)",
                        },
                      },
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                      },
                    },
                  }}
                >
                  <ToggleButton value="calculator">Score Yourself</ToggleButton>
                  <ToggleButton value="game">Score a Full Game</ToggleButton>
                </ToggleButtonGroup>
              </Box>
                </Stack>

                {/* Main Layout */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 400px" },
                    gap: 3,
                  }}
                >
                  {/* Left: Card Palette */}
                  <CardPalette onCardTap={handleCardTap} />

                  {/* Right: Scoring Zone */}
                  <Stack spacing={2}>
                    <Paper
                  sx={{ p: 2 }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        id="hand-zone"
                        variant="h6"
                        sx={{ color: TABLE.cream, scrollMarginTop: 80 }}
                      >
                        Your Cards
                      </Typography>
                      <Button
                        size="small"
                        onClick={handleClearAll}
                        disabled={scoringZone.length === 0}
                        sx={{ color: "#6fd1ff" }}
                      >
                        Clear All
                      </Button>
                    </Box>

                    <DropZone id="scoring-zone" cards={scoringZone} onCardTap={handleScoringZoneCardTap} />
                  </Stack>
                </Paper>

                {/* Mystery Box Controls */}
                <MysteryBoxControls
                  mysteryBoxes={mysteryBoxes}
                  onUpdateMysteryBox={handleUpdateMysteryBox}
                />

                {/* Hero vs Monster Controls */}
                <HeroMonsterControls
                  heroes={heroes}
                  monsters={monsters}
                  onCancelMonster={handleCancelMonster}
                  onUncancelMonster={handleUncancelMonster}
                />

                {/* Wa! Hero Pledging Controls */}
                <WaHeroControls
                  waHeroes={waHeroes}
                  onPledgeWaHero={handlePledgeWaHero}
                  onUnpledgeWaHero={handleUnpledgeWaHero}
                />

                {/* Score Display */}
                <Paper
                  id="score-plaque"
                  sx={{
                    p: 3,
                    borderColor: "rgba(217, 182, 95, 0.45)",
                    background:
                      "linear-gradient(180deg, rgba(217,182,95,0.10), rgba(6,26,36,0.72) 55%)",
                  }}
                >
                  <Stack spacing={1.5}>
                    <Typography
                      variant="overline"
                      sx={{ color: TABLE.brass, letterSpacing: "0.22em" }}
                    >
                      Total Score
                    </Typography>
                    <Typography
                      variant="h2"
                      sx={{
                        color: scoreBreakdown.totalScore < 0 ? TABLE.danger : TABLE.cream,
                        fontWeight: 800,
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                        textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                      }}
                    >
                      {scoreBreakdown.totalScore}
                    </Typography>
                    <Divider sx={{ bgcolor: "rgba(111, 209, 255, 0.2)" }} />

                    {/* Score Breakdown */}
                    <Stack spacing={1}>
                      {scoreBreakdown.heroPoints > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                            Heroes
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#6fd1ff" }}>
                            +{scoreBreakdown.heroPoints}
                          </Typography>
                        </Box>
                      )}

                      {scoreBreakdown.collectablePoints > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                            Collectables
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#6fd1ff" }}>
                            +{scoreBreakdown.collectablePoints}
                          </Typography>
                        </Box>
                      )}

                      {scoreBreakdown.mysteryBoxPoints > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                            Mystery Boxes
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#6fd1ff" }}>
                            +{scoreBreakdown.mysteryBoxPoints}
                          </Typography>
                        </Box>
                      )}

                      {scoreBreakdown.trophyPoints > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                            Trophies
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#6fd1ff" }}>
                            +{scoreBreakdown.trophyPoints}
                          </Typography>
                        </Box>
                      )}

                      {scoreBreakdown.houseTrophyBonus > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                            House Trophy Bonuses
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#6fd1ff" }}>
                            +{scoreBreakdown.houseTrophyBonus}
                          </Typography>
                        </Box>
                      )}

                      {scoreBreakdown.monsterPenalty < 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                            Monsters
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#e74c3c" }}>
                            {scoreBreakdown.monsterPenalty}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {/* House Trophies Won */}
                    {scoreBreakdown.houseTrophiesWon.length > 0 && (
                      <>
                        <Divider sx={{ bgcolor: "rgba(111, 209, 255, 0.2)" }} />
                        <Stack spacing={0.5}>
                          <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
                            House Trophies Won:
                          </Typography>
                          {scoreBreakdown.houseTrophiesWon.map((house) => (
                            <Chip
                              key={house}
                              label={HOUSE_TROPHIES[house]}
                              size="small"
                              sx={{
                                bgcolor: "rgba(111, 209, 255, 0.2)",
                                color: "#6fd1ff",
                                fontSize: "0.7rem",
                              }}
                            />
                          ))}
                        </Stack>
                      </>
                    )}
                  </Stack>
                    </Paper>
                  </Stack>
                </Box>

                {/* Drag Overlay */}
                <DragOverlay>
                  {activeCard ? (
                    <Box sx={{ transform: "rotate(5deg)", opacity: 0.9 }}>
                      <CardDisplay card={activeCard.card} />
                    </Box>
                  ) : null}
                </DragOverlay>
              </Stack>
            </Container>

            <ScoreRail
              cardCount={scoringZone.length}
              total={scoreBreakdown.totalScore}
            />
          </Box>
        </DndContext>
      ) : gameSetup ? (
        // Full Game Mode - Setup
        <Box
          sx={{
            minHeight: "100vh",
            py: 4,
          }}
        >
          <Container maxWidth="md">
            <Stack spacing={4}>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h4" sx={{ color: "#6fd1ff" }}>
                    Full Game Setup
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                    Score multiple players for a physical game
                  </Typography>
                </Stack>

                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, newMode) => {
                    if (newMode !== null) setMode(newMode);
                  }}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    "& .MuiToggleButton-root": {
                      color: "rgba(253, 247, 238, 0.6)",
                      border: "1px solid rgba(111, 209, 255, 0.2)",
                      "&.Mui-selected": {
                        bgcolor: "rgba(111, 209, 255, 0.2)",
                        color: "#6fd1ff",
                        "&:hover": {
                          bgcolor: "rgba(111, 209, 255, 0.3)",
                        },
                      },
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                      },
                    },
                  }}
                >
                  <ToggleButton value="calculator">Score Yourself</ToggleButton>
                  <ToggleButton value="game">Score a Full Game</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Setup Form */}
              <Paper sx={{ p: 4, bgcolor: "rgba(255, 255, 255, 0.05)" }}>
                <Stack spacing={4}>
                  <Typography variant="h6" sx={{ color: "#fdf7ee" }}>
                    How many players?
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {[2, 3, 4, 5, 6].map((count) => (
                      <Button
                        key={count}
                        variant={playerCount === count ? "contained" : "outlined"}
                        onClick={() => setPlayerCount(count)}
                        sx={{
                          minWidth: 60,
                          bgcolor: playerCount === count ? "#6fd1ff" : "transparent",
                          color: playerCount === count ? "#081423" : "#6fd1ff",
                          borderColor: "#6fd1ff",
                          "&:hover": {
                            bgcolor: playerCount === count ? "#5ac1ef" : "rgba(111, 209, 255, 0.1)",
                          },
                        }}
                      >
                        {count}
                      </Button>
                    ))}
                  </Box>

                  <Divider sx={{ bgcolor: "rgba(111, 209, 255, 0.2)" }} />

                  <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                    Players will be assigned colors: {PLAYER_COLORS.slice(0, playerCount).map(c => c.name).join(", ")}
                  </Typography>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStartGame}
                    sx={{
                      bgcolor: "#6fd1ff",
                      color: "#081423",
                      "&:hover": {
                        bgcolor: "#5ac1ef",
                      },
                    }}
                  >
                    Start Game
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Container>
        </Box>
      ) : (
        // Full Game Mode - Active Game
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            setActiveCard(null);

            if (!over) return;

            const cardId = active.id as string;
            const currentPlayer = players[currentPlayerTab];
            if (!currentPlayer) return;

            const isAlreadyInScoringZone = currentPlayer.cards.some((c) => c.id === cardId);

            if (over.id === `scoring-zone-${currentPlayer.id}`) {
              if (isAlreadyInScoringZone) return;

              const cardData = active.data.current?.card as GameCard;
              if (!cardData) return;

              addCardToPlayer(currentPlayer.id, cardData);
            }

            if (over.id === "remove-zone") {
              removeCardFromPlayer(currentPlayer.id, cardId);
            }
          }}
        >
          <Box
            sx={{
              minHeight: "100vh",
              py: 4,
            }}
          >
            <Container maxWidth="xl">
              <Stack spacing={4}>
                {/* Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="h4" sx={{ color: "#6fd1ff" }}>
                      Full Game Scorer
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                      Add cards to each player&apos;s zone, then click Ready to Score
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    {anyPlayerHasCards && (
                      <Button
                        variant="contained"
                        onClick={handleReadyToScore}
                        sx={{
                          bgcolor: "#2ecc71",
                          color: "#fff",
                          "&:hover": {
                            bgcolor: "#27ae60",
                          },
                        }}
                      >
                        Ready to Score
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={handleResetGame}
                      sx={{
                        color: "#6fd1ff",
                        borderColor: "#6fd1ff",
                        "&:hover": {
                          borderColor: "#5ac1ef",
                          bgcolor: "rgba(111, 209, 255, 0.1)",
                        },
                      }}
                    >
                      New Game
                    </Button>
                    <ToggleButtonGroup
                      value={mode}
                      exclusive
                      onChange={(_, newMode) => {
                        if (newMode !== null) setMode(newMode);
                      }}
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.05)",
                        "& .MuiToggleButton-root": {
                          color: "rgba(253, 247, 238, 0.6)",
                          border: "1px solid rgba(111, 209, 255, 0.2)",
                          "&.Mui-selected": {
                            bgcolor: "rgba(111, 209, 255, 0.2)",
                            color: "#6fd1ff",
                            "&:hover": {
                              bgcolor: "rgba(111, 209, 255, 0.3)",
                            },
                          },
                          "&:hover": {
                            bgcolor: "rgba(255, 255, 255, 0.08)",
                          },
                        },
                      }}
                    >
                      <ToggleButton value="calculator">Score Yourself</ToggleButton>
                      <ToggleButton value="game">Score a Full Game</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Box>

                {/* Player Tabs */}
                <Paper sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }}>
                  <Tabs
                    value={currentPlayerTab}
                    onChange={(_, newValue) => setCurrentPlayerTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      borderBottom: "1px solid rgba(111, 209, 255, 0.2)",
                      "& .MuiTab-root": {
                        color: "rgba(253, 247, 238, 0.6)",
                        minHeight: 64,
                      },
                      "& .Mui-selected": {
                        color: "#6fd1ff !important",
                      },
                    }}
                  >
                    {players.map((player, index) => (
                      <Tab
                        key={player.id}
                        label={
                          <Stack spacing={0.5} alignItems="center">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                bgcolor: player.color.primary,
                                border: currentPlayerTab === index ? "3px solid #6fd1ff" : "none",
                              }}
                            />
                            <Typography variant="caption">{player.name}</Typography>
                            <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.5)" }}>
                              {player.cards.length} cards
                            </Typography>
                          </Stack>
                        }
                      />
                    ))}
                  </Tabs>
                </Paper>

                {/* Current Player's View */}
                {players[currentPlayerTab] && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", lg: "1fr 400px" },
                      gap: 3,
                    }}
                  >
                    {/* Left: Card Palette */}
                    <CardPalette onCardTap={handleGameCardTap} />

                    {/* Right: Player's Scoring Zone */}
                    <Stack spacing={2}>
                      <Paper
                        id="hand-zone"
                        sx={{
                          p: 2,
                          scrollMarginTop: 80,
                          borderColor: players[currentPlayerTab].color.primary,
                          boxShadow: `inset 0 2px 0 ${players[currentPlayerTab].color.primary}, inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 30px -18px rgba(0,0,0,0.9)`,
                        }}
                      >
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  bgcolor: players[currentPlayerTab].color.primary,
                                }}
                              />
                              <TextField
                                value={players[currentPlayerTab].name}
                                onChange={(e) =>
                                  handlePlayerNameChange(players[currentPlayerTab].id, e.target.value)
                                }
                                variant="standard"
                                placeholder="Player name"
                                sx={{
                                  "& .MuiInput-root": {
                                    color: "#fdf7ee",
                                    fontSize: "1.25rem",
                                    fontWeight: 600,
                                  },
                                  "& .MuiInput-root:before": {
                                    borderColor: "rgba(111, 209, 255, 0.3)",
                                  },
                                  "& .MuiInput-root:hover:before": {
                                    borderColor: "rgba(111, 209, 255, 0.5)",
                                  },
                                }}
                              />
                            </Stack>
                            <Button
                              size="small"
                              onClick={() =>
                                setPlayers((prev) =>
                                  prev.map((p) =>
                                    p.id === players[currentPlayerTab].id ? { ...p, cards: [] } : p
                                  )
                                )
                              }
                              disabled={players[currentPlayerTab].cards.length === 0}
                              sx={{ color: players[currentPlayerTab].color.primary }}
                            >
                              Clear
                            </Button>
                          </Box>

                          <DropZone
                            id={`scoring-zone-${players[currentPlayerTab].id}`}
                            cards={players[currentPlayerTab].cards}
                            onCardTap={handleGameScoringZoneCardTap}
                          />
                        </Stack>
                      </Paper>

                      {/* Note about hidden scores */}
                      <Paper sx={{ p: 2, bgcolor: "rgba(255, 255, 255, 0.05)" }}>
                        <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)", textAlign: "center" }}>
                          Scores are hidden until you click &quot;Ready to Score&quot;
                        </Typography>
                      </Paper>
                    </Stack>
                  </Box>
                )}
              </Stack>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeCard ? (
                  <Box sx={{ transform: "rotate(5deg)", opacity: 0.9 }}>
                    <CardDisplay card={activeCard.card} />
                  </Box>
                ) : null}
              </DragOverlay>
            </Container>

            {players[currentPlayerTab] && (
              <ScoreRail
                label={players[currentPlayerTab].name}
                cardCount={players[currentPlayerTab].cards.length}
              />
            )}
          </Box>

          {/* Arcade-Style Score Reveal Modal */}
          <Modal
            open={showScoreReveal}
            onClose={handleCloseScoreReveal}
            closeAfterTransition
          >
            <Fade in={showScoreReveal}>
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: { xs: "90%", sm: 600 },
                  maxHeight: "90vh",
                  overflow: "auto",
                  bgcolor: "#000",
                  border: "4px solid #f39c12",
                  boxShadow: "0 0 40px rgba(243, 156, 18, 0.5)",
                  p: 4,
                }}
              >
                <Stack spacing={3}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: "#f39c12",
                      textAlign: "center",
                      fontFamily: "monospace",
                      letterSpacing: 4,
                      textShadow: "0 0 10px rgba(243, 156, 18, 0.8)",
                    }}
                  >
                    HIGH SCORES
                  </Typography>

                  <Divider sx={{ bgcolor: "#f39c12", height: 2 }} />

                  <Stack spacing={2}>
                    {sortedPlayersForReveal.map((player, index) => {
                      const score = calculateScore(player.cards).totalScore;
                      const isRevealed = index < revealedScores;
                      const rank = sortedPlayersForReveal.length - index;

                      return (
                        <Fade in={isRevealed} key={player.id} timeout={500}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              p: 2,
                              bgcolor: rank === 1 ? "rgba(243, 156, 18, 0.2)" : "rgba(255, 255, 255, 0.05)",
                              border: rank === 1 ? "2px solid #f39c12" : "1px solid rgba(111, 209, 255, 0.3)",
                              opacity: isRevealed ? 1 : 0,
                            }}
                          >
                            <Typography
                              variant="h4"
                              sx={{
                                color: rank === 1 ? "#f39c12" : "#6fd1ff",
                                fontFamily: "monospace",
                                minWidth: 60,
                                textAlign: "center",
                              }}
                            >
                              #{rank}
                            </Typography>

                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                bgcolor: player.color.primary,
                                border: rank === 1 ? "3px solid #f39c12" : "2px solid #6fd1ff",
                              }}
                            />

                            <Stack spacing={0} sx={{ flex: 1 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  color: "#fdf7ee",
                                  fontFamily: "monospace",
                                }}
                              >
                                {player.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "rgba(253, 247, 238, 0.6)",
                                  fontFamily: "monospace",
                                }}
                              >
                                {player.cards.length} cards
                              </Typography>
                            </Stack>

                            <Typography
                              variant="h3"
                              sx={{
                                color: rank === 1 ? "#f39c12" : "#6fd1ff",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                textShadow: rank === 1 ? "0 0 10px rgba(243, 156, 18, 0.8)" : "none",
                              }}
                            >
                              {score}
                            </Typography>
                          </Box>
                        </Fade>
                      );
                    })}
                  </Stack>

                  {revealedScores === players.length && (
                    <Fade in timeout={1000}>
                      <Button
                        variant="contained"
                        onClick={handleCloseScoreReveal}
                        sx={{
                          bgcolor: "#f39c12",
                          color: "#000",
                          fontFamily: "monospace",
                          fontSize: "1.2rem",
                          "&:hover": {
                            bgcolor: "#e67e22",
                          },
                        }}
                      >
                        CONTINUE
                      </Button>
                    </Fade>
                  )}
                </Stack>
              </Box>
            </Fade>
          </Modal>
        </DndContext>
      )}
    </>
  );
}
