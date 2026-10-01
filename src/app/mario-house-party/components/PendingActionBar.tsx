"use client";

import { Box, Button, Stack, Typography } from "@mui/material";

import type { GameCard } from "../types";
import type { CardRef, MatZone } from "./PlayMat";
import { HOUSE_SHORT } from "./PlayMat";
import { TABLE } from "../theme";

/**
 * What you are about to do, before anyone else can see it. Every play is
 * staged here first so it can be read back, thought about and taken back —
 * nothing is written to the game until Confirm.
 */
export type PendingAction =
  | { kind: "play"; card: GameCard; zone: MatZone; targetPlayerId: string }
  | { kind: "aim"; card: GameCard; target: CardRef }
  | { kind: "steal"; targetPlayerId: string };

/** A card in a few words, the way you would say it out loud. */
export function cardLabel(card: GameCard): string {
  switch (card.type) {
    case "hero":
      return card.name ?? `${HOUSE_SHORT[card.house as keyof typeof HOUSE_SHORT] ?? "Wa"} hero`;
    case "collectable": {
      const names: Record<string, string> = {
        "mario-bros": "Coin",
        "mushroom-kingdom": "Mushroom",
        "kong-island": "Banana",
      };
      const base = names[card.house] ?? "Collectable";
      return card.isGolden ? `Golden ${base}` : `${base} +${card.value}`;
    }
    case "monster":
      return card.name;
    case "powerup":
      return card.name;
    case "trophy":
      return card.name;
    case "mystery-box":
      return "Mystery Box";
  }
}

const zoneLabel = (zone: MatZone) =>
  zone === "in-play" ? "in play" : HOUSE_SHORT[zone];

export function describeAction(
  action: PendingAction,
  nameOf: (playerId: string) => string,
  youId: string
): string {
  const whose = (id: string) => (id === youId ? "your" : `${nameOf(id)}'s`);

  switch (action.kind) {
    case "play":
      return `Play ${cardLabel(action.card)} into ${whose(
        action.targetPlayerId
      )} ${zoneLabel(action.zone)}`;
    case "aim":
      return `Use ${cardLabel(action.card)} on ${whose(
        action.target.playerId
      )} ${cardLabel(action.target.card)}`;
    case "steal":
      return `Steal a card from ${nameOf(action.targetPlayerId)}`;
  }
}

export function PendingActionBar({
  action,
  description,
  busy,
  onUndo,
  onConfirm,
}: {
  action: PendingAction | null;
  description: string;
  busy?: boolean;
  onUndo: () => void;
  onConfirm: () => void;
}) {
  if (!action) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        px: 2,
        py: 1.5,
        pb: "calc(12px + env(safe-area-inset-bottom))",
        borderTop: `1px solid ${TABLE.brass}`,
        background: `linear-gradient(180deg, rgba(7,29,41,0.95), ${TABLE.rail})`,
        backdropFilter: "blur(10px)",
        boxShadow: "0 -12px 34px -14px rgba(0,0,0,0.95)",
      }}
    >
      {/* One row at every width: the buttons stay at the right, where a
          thumb is, and the bar stays short enough not to eat the mat. */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: TABLE.brass }}>
            Not played yet
          </Typography>
          <Typography
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            onClick={onUndo}
            disabled={busy}
            sx={{ borderColor: `${TABLE.cream}44` }}
          >
            Undo
          </Button>
          <Button
            variant="contained"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Playing…" : "Confirm"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
