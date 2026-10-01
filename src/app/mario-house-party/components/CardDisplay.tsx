import { useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { CARD_SHADOW, CARD_SHADOW_RAISED } from "../theme";
import type { GameCard } from "../types";
import { HOUSE_NAMES } from "../types";
import { getCardImagePath, getCardColor } from "../card-images";

interface CardDisplayProps {
  card: GameCard;
  size?: "small" | "medium" | "large";
}

export function CardDisplay({ card, size = "medium" }: CardDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const imagePath = getCardImagePath(card);
  const cardColor = getCardColor(card);

  const getCardTitle = () => {
    if (card.type === "hero") {
      return HOUSE_NAMES[card.house] + " Hero";
    }
    if (card.type === "collectable") {
      const collectableNames: Record<string, string> = {
        "mario-bros": "Coin",
        "mushroom-kingdom": "Mushroom",
        "kong-island": "Banana",
      };
      const baseName = collectableNames[card.house];
      if (card.isGolden) return `Golden ${baseName}`;
      return baseName;
    }
    if (card.type === "monster") {
      return card.name;
    }
    if (card.type === "powerup") {
      return card.name;
    }
    if (card.type === "trophy") {
      return card.name;
    }
    if (card.type === "mystery-box") {
      return "Mystery Box";
    }
    return "Card";
  };

  const getCardValue = () => {
    if (card.type === "hero") return "+1";
    if (card.type === "collectable") return `+${card.value}`;
    if (card.type === "monster") return card.value.toString();
    if (card.type === "powerup") return ""; // Power-ups don't have point values
    if (card.type === "trophy") return "+5";
    if (card.type === "mystery-box") return "+5 / +10";
    return "";
  };

  const cardSizes = {
    small: { width: 80, height: 112, fontSize: "0.7rem" },
    medium: { width: 120, height: 168, fontSize: "0.85rem" },
    large: { width: 160, height: 224, fontSize: "1rem" },
  };

  const { width, height, fontSize } = cardSizes[size];

  return (
    <Box
      // The card's name, for picking one out of a mat or a hand in a test.
      data-card={getCardTitle()}
      sx={{
        width,
        height,
        flexShrink: 0,
        borderRadius: "8px",
        bgcolor: cardColor,
        // A printed card: a thin white edge, a dark rim, and a shadow with
        // both a contact and a spread, so it sits on the felt.
        border: "2px solid rgba(255, 255, 255, 0.78)",
        outline: "1px solid rgba(0, 0, 0, 0.45)",
        boxShadow: CARD_SHADOW,
        position: "relative",
        overflow: "hidden",
        cursor: "grab",
        // Quick taps stay instant; a press and hold is what starts a drag.
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        transition:
          "transform 160ms cubic-bezier(0.2, 0.8, 0.3, 1), box-shadow 160ms ease",
        "&:hover": {
          transform: "translateY(-6px) scale(1.02)",
          boxShadow: CARD_SHADOW_RAISED,
          zIndex: 2,
        },
        "&:active": {
          transform: "translateY(-2px) scale(0.99)",
          transition: "transform 60ms ease",
        },
      }}
    >
      {/* Card Image */}
      {imagePath && !imageError ? (
        <>
          <Box
            component="img"
            src={imagePath}
            alt={getCardTitle()}
            onError={() => setImageError(true)}
            ref={(node: HTMLImageElement | null) => {
              // An image that fails before React hydrates never fires onError,
              // so catch that case on mount and fall back to the drawn card.
              if (node?.complete && node.naturalWidth === 0) {
                setImageError(true);
              }
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
          {/* Overlay for badges */}
          {(card.type === "collectable" && card.isGolden) ||
          (card.type === "monster" && card.isBobOmb) ||
          (card.type === "monster" && card.isTapped) ||
          (card.type === "monster" && card.isHidden) ||
          (card.type === "powerup" && card.isUnique) ? (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                p: 0.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                alignItems: "center",
              }}
            >
              {card.type === "collectable" && card.isGolden && (
                <Chip
                  label="GOLDEN"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 215, 0, 0.9)",
                    color: "#000",
                    fontSize: "0.6rem",
                    height: "auto",
                    py: 0.25,
                    fontWeight: 700,
                  }}
                />
              )}
              {card.type === "monster" && card.isBobOmb && (
                <Chip
                  label="Cannot Cancel"
                  size="small"
                  sx={{
                    bgcolor: "rgba(231, 76, 60, 0.95)",
                    color: "white",
                    fontSize: "0.55rem",
                    height: "auto",
                    py: 0.25,
                    fontWeight: 600,
                  }}
                />
              )}
              {card.type === "monster" && card.isTapped && !card.isHidden && (
                <Chip
                  label="TAPPED"
                  size="small"
                  sx={{
                    bgcolor: "rgba(52, 152, 219, 0.9)",
                    color: "white",
                    fontSize: "0.55rem",
                    height: "auto",
                    py: 0.25,
                    fontWeight: 600,
                  }}
                />
              )}
              {card.type === "monster" && card.isHidden && (
                <Chip
                  label="HIDDEN"
                  size="small"
                  sx={{
                    bgcolor: "rgba(149, 165, 166, 0.9)",
                    color: "white",
                    fontSize: "0.55rem",
                    height: "auto",
                    py: 0.25,
                    fontWeight: 600,
                  }}
                />
              )}
              {card.type === "powerup" && card.isUnique && (
                <Chip
                  label="UNIQUE"
                  size="small"
                  sx={{
                    bgcolor: "rgba(155, 89, 182, 0.9)",
                    color: "white",
                    fontSize: "0.55rem",
                    height: "auto",
                    py: 0.25,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          ) : null}
        </>
      ) : (
        /* Fallback when no image */
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 1.5,
            height: "100%",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "white",
              fontSize,
              fontWeight: 600,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {getCardTitle()}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontWeight: 700,
              textAlign: "center",
              fontSize: size === "small" ? "1.5rem" : size === "medium" ? "2rem" : "2.5rem",
            }}
          >
            {getCardValue()}
          </Typography>

          {card.type === "collectable" && card.isGolden && (
            <Chip
              label="GOLDEN"
              size="small"
              sx={{
                bgcolor: "rgba(255, 215, 0, 0.3)",
                color: "white",
                fontSize: "0.6rem",
                height: "auto",
                py: 0.25,
              }}
            />
          )}

          {card.type === "monster" && card.isBobOmb && (
            <Chip
              label="Cannot Cancel"
              size="small"
              sx={{
                bgcolor: "rgba(231, 76, 60, 0.3)",
                color: "white",
                fontSize: "0.55rem",
                height: "auto",
                py: 0.25,
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
