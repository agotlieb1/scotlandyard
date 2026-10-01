"use client";

import { Box, Paper, Typography } from "@mui/material";
import type { GameCard } from "../types";
import { CardDisplay } from "./CardDisplay";
import { TABLE } from "../theme";

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
        px: { xs: 1.5, sm: 2.5 },
        pt: 1.5,
        pb: 2,
        borderRadius: 3,
        border: `1px solid ${TABLE.railEdge}`,
        background: `linear-gradient(180deg, ${TABLE.rail}, ${TABLE.railEdge})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(0,0,0,0.38)",
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: TABLE.brass,
          letterSpacing: "0.18em",
          mb: 1,
          textAlign: "center",
          display: "block",
        }}
      >
        Your hand · {hand.length}
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
            // Centred, but a hand too wide to fit must still scroll to its
            // first card rather than overflowing past the left edge.
            justifyContent: "center",
            "@supports (justify-content: safe center)": {
              justifyContent: "safe center",
            },
            alignItems: "flex-end",
            px: 1.5,
            pt: 2,
            pb: 1,
            overflowX: "auto",
            // Held cards overlap like a real hand; the last one shows in full.
            "& > *:not(:first-of-type)": { ml: { xs: "-18px", sm: "-10px" } },
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
                flexShrink: 0,
                borderRadius: 2,
                cursor: isCurrentPlayer ? "grab" : "default",
                // Later cards sit over earlier ones, and a picked one over all.
                zIndex: selectedCard === card ? 20 : idx,
                position: "relative",
                // A picked-up card lifts out of the hand and stays there.
                transform:
                  selectedCard === card
                    ? "translateY(-16px) rotate(0deg)"
                    : `rotate(${(idx - (hand.length - 1) / 2) * 2}deg)`,
                filter:
                  selectedCard === card
                    ? "drop-shadow(0 10px 18px rgba(111, 209, 255, 0.55))"
                    : undefined,
                transition: "transform 0.2s, filter 0.2s",
                "&:hover": isCurrentPlayer
                  ? {
                      zIndex: 30,
                      transform:
                        selectedCard === card
                          ? "translateY(-18px) scale(1.04)"
                          : "translateY(-10px) scale(1.04)",
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
            color: "rgba(253, 247, 238, 0.55)",
            textAlign: "center",
            display: "block",
            mt: 1,
          }}
        >
          Tap a card to pick it up, then tap where it goes. Dragging works too,
          on a desktop.
        </Typography>
      )}
    </Paper>
  );
}
