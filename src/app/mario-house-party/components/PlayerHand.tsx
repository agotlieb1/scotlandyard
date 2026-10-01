"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import type { GameCard } from "../types";
import { CardDisplay } from "./CardDisplay";

interface PlayerHandProps {
  hand: GameCard[];
  playerId: string;
  isCurrentPlayer: boolean;
  onCardDragStart?: (card: GameCard) => void;
}

export function PlayerHand({
  hand,
  playerId,
  isCurrentPlayer,
  onCardDragStart,
}: PlayerHandProps) {
  const handleDragStart = (e: React.DragEvent, card: GameCard) => {
    if (!isCurrentPlayer) return;

    // Set the card data for the drag operation
    e.dataTransfer.setData("application/json", JSON.stringify(card));
    e.dataTransfer.effectAllowed = "move";

    if (onCardDragStart) {
      onCardDragStart(card);
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        bgcolor: "#0c2a3e",
        border: "2px solid #6fd1ff",
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: "#6fd1ff",
          mb: 2,
          textAlign: "center",
        }}
      >
        Your Hand ({hand.length} cards)
      </Typography>

      {hand.length === 0 && (
        <Typography
          variant="body2"
          sx={{
            color: "rgba(253, 247, 238, 0.4)",
            textAlign: "center",
            fontStyle: "italic",
            py: 4,
          }}
        >
          No cards in hand
        </Typography>
      )}

      {hand.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "center",
          }}
        >
          {hand.map((card, idx) => (
            <Box
              key={`hand-card-${idx}`}
              draggable={isCurrentPlayer}
              onDragStart={(e) => handleDragStart(e, card)}
              sx={{
                width: { xs: 80, sm: 100 },
                cursor: isCurrentPlayer ? "grab" : "default",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": isCurrentPlayer
                  ? {
                      transform: "translateY(-8px) scale(1.05)",
                      boxShadow: "0 8px 20px rgba(111, 209, 255, 0.4)",
                    }
                  : {},
                "&:active": isCurrentPlayer
                  ? {
                      cursor: "grabbing",
                    }
                  : {},
              }}
            >
              <CardDisplay card={card} size="medium" />
            </Box>
          ))}
        </Box>
      )}

      {isCurrentPlayer && hand.length > 0 && (
        <Typography
          variant="caption"
          sx={{
            color: "rgba(253, 247, 238, 0.6)",
            textAlign: "center",
            display: "block",
            mt: 2,
            fontStyle: "italic",
          }}
        >
          Drag cards to your boards to play them
        </Typography>
      )}
    </Paper>
  );
}
