"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import type { GameCard } from "../types";
import { CardDisplay } from "./CardDisplay";

interface PlayerHandProps {
  hand: GameCard[];
  playerId: string;
  isCurrentPlayer: boolean;
  /** The card picked up and waiting for a zone. */
  selectedCard?: GameCard | null;
  onCardTap?: (card: GameCard) => void;
  onCardDragStart?: (card: GameCard) => void;
}

export function PlayerHand({
  hand,
  playerId,
  isCurrentPlayer,
  selectedCard,
  onCardTap,
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
              onClick={
                isCurrentPlayer && onCardTap ? () => onCardTap(card) : undefined
              }
              sx={{
                width: { xs: 80, sm: 100 },
                cursor: isCurrentPlayer ? "grab" : "default",
                // A picked-up card lifts out of the hand and stays there.
                transform: selectedCard === card ? "translateY(-14px)" : "none",
                filter:
                  selectedCard === card
                    ? "drop-shadow(0 10px 18px rgba(111, 209, 255, 0.55))"
                    : undefined,
                transition: "transform 0.2s, filter 0.2s",
                "&:hover": isCurrentPlayer
                  ? {
                      transform:
                        selectedCard === card
                          ? "translateY(-16px) scale(1.05)"
                          : "translateY(-8px) scale(1.05)",
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
          Tap a card to pick it up, then tap a zone on your mat. Dragging
          works too, on a desktop.
        </Typography>
      )}
    </Paper>
  );
}
