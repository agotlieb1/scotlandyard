"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";

import type { GameCard, MainHouse } from "../types";
import { HOUSE_SHORT, toSpot, type CardRef } from "./PlayMat";
import { cardsOnMat, type TargetablePlayer } from "./TargetPicker";
import { cardLabel } from "./PendingActionBar";
import {
  requirementFor,
  type Play,
  type Spot,
} from "@/lib/mario-card-effects";
import { TABLE } from "../theme";

/**
 * Walks a card's targets as lists: pick a player, then pick a card by name.
 * Every power-up wants something different — one card, three cards, a player
 * and a house, something out of the discard pile — so the steps come from
 * `requirementFor` rather than being written out per card.
 */
export function EffectWizard({
  open,
  card,
  players,
  youId,
  discard,
  onClose,
  onReady,
}: {
  open: boolean;
  card: GameCard | null;
  players: TargetablePlayer[];
  youId: string;
  discard: GameCard[];
  onClose: () => void;
  onReady: (play: Play, label: string) => void;
}) {
  const [picked, setPicked] = useState<TargetablePlayer | null>(null);
  const [cards, setCards] = useState<CardRef[]>([]);
  const requirement = useMemo(
    () => (card ? requirementFor(card) : { kind: "none" as const }),
    [card]
  );

  const reset = () => {
    setPicked(null);
    setCards([]);
  };
  const close = () => {
    reset();
    onClose();
  };

  if (!card) return null;

  const finish = (play: Play, label: string) => {
    onReady(play, label);
    reset();
    onClose();
  };

  // ---- what we still need -------------------------------------------------
  const wantedCards =
    requirement.kind === "cards"
      ? requirement.count
      : requirement.kind === "two-any"
        ? 2
        : requirement.kind === "card-and-destination" ||
            requirement.kind === "hero"
          ? 1
          : 0;

  const needsMoreCards = cards.length < wantedCards;
  const needsDestination =
    requirement.kind === "card-and-destination" && cards.length === 1;

  const heading = () => {
    if (requirement.kind === "player" || requirement.kind === "player-and-house") {
      return picked ? "Which house?" : "Which player?";
    }
    if (requirement.kind === "discard-card") return "From the discard pile";
    if (needsDestination) return "Slide it to whose mat?";
    if (needsMoreCards) {
      const n = wantedCards - cards.length;
      return picked
        ? `Pick a card (${n} to go)`
        : `Which player? (${n} card${n === 1 ? "" : "s"} to go)`;
    }
    return "Ready";
  };

  // ---- the steps ----------------------------------------------------------
  const playerList = (onPick: (p: TargetablePlayer) => void) => (
    <List disablePadding>
      {players.map((player) => (
        <ListItemButton
          key={player.id}
          onClick={() => onPick(player)}
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: player.colour,
              boxShadow: `0 0 8px ${player.colour}`,
              mr: 1.5,
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontWeight: 600 }}>
            {player.id === youId ? `${player.name} (you)` : player.name}
          </Typography>
        </ListItemButton>
      ))}
    </List>
  );

  const cardList = (
    player: TargetablePlayer,
    only?: (c: GameCard) => boolean
  ) => {
    const rows = cardsOnMat(player, only).filter(
      (row) =>
        !cards.some(
          (chosen) =>
            chosen.playerId === row.ref.playerId &&
            chosen.row === row.ref.row &&
            chosen.zone === row.ref.zone &&
            chosen.index === row.ref.index
        )
    );
    if (rows.length === 0) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, py: 3, textAlign: "center" }}
        >
          Nothing here to pick.
        </Typography>
      );
    }
    return (
      <List disablePadding sx={{ maxHeight: 320, overflowY: "auto" }}>
        {rows.map(({ ref, where }) => (
          <ListItemButton
            key={`${ref.row}-${ref.zone}-${ref.index}`}
            onClick={() => {
              setCards((prev) => [...prev, ref]);
              setPicked(null);
            }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <Stack sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }} noWrap>
                {cardLabel(ref.card)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {where}
              </Typography>
            </Stack>
          </ListItemButton>
        ))}
      </List>
    );
  };

  const body = () => {
    // Nothing to choose: play it and be done.
    if (requirement.kind === "none") {
      const name = card.type === "powerup" ? card.name : "";
      // The 1 Up is never played by hand: it spends itself when the game ends.
      const playsItself = name === "1 Up Mushroom";
      return (
        <Stack spacing={2} sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {card.type === "powerup" ? card.rules : "Play this card."}
          </Typography>
          {playsItself ? (
            <Typography variant="body2" sx={{ color: TABLE.brass }}>
              Keep hold of it. When the game ends it buys you one more turn on
              its own.
            </Typography>
          ) : (
            <Button
              variant="contained"
              onClick={() =>
                finish(
                  name === "Thwomp"
                    ? { kind: "thwomp", card }
                    : { kind: "star", card },
                  name === "Thwomp"
                    ? "Thwomp — stop the last action"
                    : "Star Power — untouchable until the end of your next turn"
                )
              }
            >
              Play it
            </Button>
          )}
        </Stack>
      );
    }

    if (requirement.kind === "discard-card") {
      if (discard.length === 0) {
        return (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 3, textAlign: "center" }}
          >
            The discard pile is empty.
          </Typography>
        );
      }
      return (
        <List disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
          {discard.map((c, index) => (
            <ListItemButton
              key={`${index}-${cardLabel(c)}`}
              onClick={() =>
                finish(
                  { kind: "lakitu", card, discardIndex: index },
                  `Lakitu took ${cardLabel(c)} from the discard pile`
                )
              }
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <Typography sx={{ fontWeight: 600 }}>{cardLabel(c)}</Typography>
            </ListItemButton>
          ))}
        </List>
      );
    }

    if (requirement.kind === "player") {
      return playerList((player) =>
        finish(
          card.type === "powerup" && card.name === "K.O. Hammer"
            ? { kind: "ko-hammer", card, targetPlayerId: player.id }
            : { kind: "piranha", card, targetPlayerId: player.id },
          card.type === "powerup" && card.name === "K.O. Hammer"
            ? `K.O. Hammer clears ${player.name}'s monsters`
            : `Piranha Plant costs ${player.name} their next turn`
        )
      );
    }

    if (requirement.kind === "player-and-house") {
      if (!picked) return playerList(setPicked);
      return (
        <List disablePadding>
          {(
            [
              "mario-bros",
              "mushroom-kingdom",
              "kong-island",
              "bowsers-castle",
            ] as MainHouse[]
          ).map((house) => (
            <ListItemButton
              key={house}
              onClick={() =>
                finish(
                  { kind: "blue-shell", card, targetPlayerId: picked.id, house },
                  `Blue Shell clears ${picked.name}'s ${HOUSE_SHORT[house]} heroes`
                )
              }
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <Typography sx={{ fontWeight: 600 }}>
                {HOUSE_SHORT[house]}
              </Typography>
            </ListItemButton>
          ))}
        </List>
      );
    }

    // Everything else starts by picking cards.
    if (needsMoreCards) {
      const heroesOnly = requirement.kind === "hero";
      if (!picked) return playerList(setPicked);
      return cardList(picked, heroesOnly ? (c) => c.type === "hero" : undefined);
    }

    if (needsDestination) {
      return playerList((player) =>
        finish(
          {
            kind: "slide",
            card,
            target: toSpot(cards[0]),
            toPlayerId: player.id,
          },
          `Ice Flower slides ${cardLabel(cards[0].card)} to ${player.name}'s mat`
        )
      );
    }

    // Enough cards: build the play.
    const spots = cards.map(toSpot) as Spot[];
    const name = card.type === "powerup" ? card.name : "";
    const play: Play =
      name === "Warp Pipe"
        ? { kind: "warp", card, target: spots[0] }
        : name === "Gold Pipe"
          ? { kind: "swap", card, a: spots[0], b: spots[1] }
          : name === "Tanuki Suit"
            ? { kind: "tanuki", card, target: spots[0] }
            : { kind: "shoot", card, targets: spots };
    const label =
      name === "Warp Pipe"
        ? `Warp Pipe takes ${cardLabel(cards[0].card)} into your hand`
        : name === "Gold Pipe"
          ? `Gold Pipe swaps ${cardLabel(cards[0].card)} and ${cardLabel(cards[1].card)}`
          : name === "Tanuki Suit"
            ? `Tanuki Suit makes ${cardLabel(cards[0].card)} invincible`
            : `${name} shoots ${cards.map((c) => cardLabel(c.card)).join(", ")}`;

    return (
      <Stack spacing={2} sx={{ p: 2 }}>
        <Typography>{label}</Typography>
        <Button variant="contained" onClick={() => finish(play, label)}>
          That&apos;s the play
        </Button>
      </Stack>
    );
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="overline" sx={{ color: TABLE.brass, display: "block" }}>
          {cardLabel(card)}
        </Typography>
        <Typography variant="h6">{heading()}</Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 1.5, pb: 2 }}>
        {cards.length > 0 && (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }} useFlexGap>
              {cards.map((ref, i) => (
                <Chip
                  key={i}
                  size="small"
                  label={cardLabel(ref.card)}
                  onDelete={() =>
                    setCards((prev) => prev.filter((_, at) => at !== i))
                  }
                />
              ))}
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
          </>
        )}
        {body()}
        {picked && (
          <Button size="small" onClick={() => setPicked(null)} sx={{ mt: 1 }}>
            Back to players
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
