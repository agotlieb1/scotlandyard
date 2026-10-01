"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import type { GameCard, MainHouse } from "../types";
import { CardDisplay } from "./CardDisplay";

interface PlayerBoardProps {
  playerId: string;
  playerName: string;
  board: {
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
  };
  isCurrentPlayer: boolean;
  onCardDrop?: (card: GameCard, house: MainHouse) => void;
}

const HOUSE_COLORS = {
  "mario-bros": "#e74c3c",
  "mushroom-kingdom": "#9b59b6",
  "kong-island": "#f39c12",
  "bowsers-castle": "#2c3e50",
};

const HOUSE_NAMES = {
  "mario-bros": "Mario Bros",
  "mushroom-kingdom": "Mushroom Kingdom",
  "kong-island": "Kong Island",
  "bowsers-castle": "Bowser's Castle",
};

export function PlayerBoard({
  playerId,
  playerName,
  board,
  isCurrentPlayer,
  onCardDrop,
}: PlayerBoardProps) {
  const houses: MainHouse[] = ["mario-bros", "mushroom-kingdom", "kong-island", "bowsers-castle"];

  const handleDragOver = (e: React.DragEvent) => {
    if (isCurrentPlayer) {
      e.preventDefault();
    }
  };

  const handleDrop = (e: React.DragEvent, house: MainHouse) => {
    if (!isCurrentPlayer || !onCardDrop) return;

    e.preventDefault();
    const cardData = e.dataTransfer.getData("application/json");
    if (cardData) {
      try {
        const card = JSON.parse(cardData) as GameCard;
        onCardDrop(card, house);
      } catch (err) {
        console.error("[PlayerBoard] Error parsing dropped card:", err);
      }
    }
  };

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          color: "#fdf7ee",
          mb: 2,
          textAlign: "center",
        }}
      >
        {playerName}&apos;s Boards {isCurrentPlayer && "(You)"}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
          gap: 2,
        }}
      >
        {houses.map((house) => {
          const houseData = board[house];
          const heroes = houseData?.heroes || [];
          const collectables = houseData?.collectables || [];
          const monsters = house === "bowsers-castle" ? (houseData as typeof board["bowsers-castle"])?.monsters || [] : [];

          const totalCards = heroes.length + collectables.length + monsters.length;

          return (
            <Paper
              key={house}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, house)}
              sx={{
                p: 2,
                bgcolor: "#0c2a3e",
                border: `2px solid ${HOUSE_COLORS[house]}`,
                borderRadius: 2,
                minHeight: 200,
                opacity: isCurrentPlayer ? 1 : 0.8,
                transition: "all 0.2s",
                "&:hover": isCurrentPlayer
                  ? {
                      borderColor: HOUSE_COLORS[house],
                      boxShadow: `0 0 20px ${HOUSE_COLORS[house]}40`,
                    }
                  : {},
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: HOUSE_COLORS[house],
                  fontWeight: 600,
                  mb: 2,
                  textAlign: "center",
                }}
              >
                {HOUSE_NAMES[house]}
              </Typography>

              {totalCards === 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(253, 247, 238, 0.4)",
                    textAlign: "center",
                    fontStyle: "italic",
                    py: 4,
                  }}
                >
                  {isCurrentPlayer ? "Drop cards here" : "No cards"}
                </Typography>
              )}

              {totalCards > 0 && (
                <Stack spacing={2}>
                  {/* Heroes Section */}
                  {heroes.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(253, 247, 238, 0.6)",
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Heroes ({heroes.length})
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {heroes.map((card, idx) => (
                          <Box key={`hero-${idx}`} sx={{ width: 60 }}>
                            <CardDisplay card={card} size="small" />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Collectables Section */}
                  {collectables.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(253, 247, 238, 0.6)",
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Collectables ({collectables.length})
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {collectables.map((card, idx) => (
                          <Box key={`collectable-${idx}`} sx={{ width: 60 }}>
                            <CardDisplay card={card} size="small" />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Monsters Section */}
                  {monsters.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(253, 247, 238, 0.6)",
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Monsters ({monsters.length})
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {monsters.map((card, idx) => (
                          <Box key={`monster-${idx}`} sx={{ width: 60 }}>
                            <CardDisplay card={card} size="small" />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Stack>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
