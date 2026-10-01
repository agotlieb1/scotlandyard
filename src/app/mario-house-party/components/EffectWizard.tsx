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
  ListSubheader,
  Stack,
  Typography,
} from "@mui/material";

import type { GameCard, MainHouse } from "../types";
import { HOUSE_SHORT, toSpot, type CardRef } from "./PlayMat";
import { cardsOnMat, type TargetablePlayer } from "./TargetPicker";
import { cardLabel } from "./PendingActionBar";
import {
  requirementFor,
  type AnySpot,
  type Play,
  type Spot,
} from "@/lib/mario-card-effects";
import { TABLE } from "../theme";

/** A card the wizard has been pointed at: on a mat, or in your own hand. */
type Pick = { spot: AnySpot; card: GameCard; where: string };

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
  hand,
  discard,
  onClose,
  onReady,
}: {
  open: boolean;
  card: GameCard | null;
  players: TargetablePlayer[];
  youId: string;
  /** Your hand, so Gold Pipe can swap a card you are holding. */
  hand: GameCard[];
  discard: GameCard[];
  onClose: () => void;
  onReady: (play: Play, label: string) => void;
}) {
  const [player, setPlayer] = useState<TargetablePlayer | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const requirement = useMemo(
    () => (card ? requirementFor(card) : { kind: "none" as const }),
    [card]
  );

  const reset = () => {
    setPlayer(null);
    setPicks([]);
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

  const needsMoreCards = picks.length < wantedCards;
  const needsDestination =
    requirement.kind === "card-and-destination" && picks.length === 1;
  // Only Gold Pipe reaches into a hand.
  const handAllowed = requirement.kind === "two-any";

  const heading = () => {
    if (requirement.kind === "player" || requirement.kind === "player-and-house") {
      return player ? "Which house?" : "Which player?";
    }
    if (requirement.kind === "discard-card") return "From the discard pile";
    if (needsDestination) return "Slide it to whose mat?";
    if (needsMoreCards) {
      const n = wantedCards - picks.length;
      return player
        ? `Pick a card (${n} to go)`
        : `Which player? (${n} card${n === 1 ? "" : "s"} to go)`;
    }
    return "Ready";
  };

  const sameSpot = (a: AnySpot, b: AnySpot) =>
    a.playerId === b.playerId && a.row === b.row && a.index === b.index;

  const take = (pick: Pick) => {
    setPicks((prev) => [...prev, pick]);
    setPlayer(null);
  };

  // ---- the steps ----------------------------------------------------------
  const playerList = (onPick: (p: TargetablePlayer) => void) => (
    <List disablePadding>
      {players.map((p) => (
        <ListItemButton
          key={p.id}
          onClick={() => onPick(p)}
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: p.colour,
              boxShadow: `0 0 8px ${p.colour}`,
              mr: 1.5,
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontWeight: 600 }}>
            {p.id === youId ? `${p.name} (you)` : p.name}
          </Typography>
        </ListItemButton>
      ))}
    </List>
  );

  const cardList = (
    chosen: TargetablePlayer,
    only?: (c: GameCard) => boolean
  ) => {
    const taken = (spot: AnySpot) => picks.some((p) => sameSpot(p.spot, spot));
    const matRows: Pick[] = cardsOnMat(chosen, only)
      .map(({ ref, where }: { ref: CardRef; where: string }) => ({
        spot: toSpot(ref) as AnySpot,
        card: ref.card,
        where,
      }))
      .filter((pick) => !taken(pick.spot));
    // Gold Pipe can swap a card out of your own hand, which nothing else can.
    const handRows: Pick[] =
      handAllowed && chosen.id === youId
        ? hand
            .map((c, index) => ({
              spot: { playerId: youId, row: "hand" as const, index },
              card: c,
              where: "In your hand",
            }))
            .filter((pick) => pick.card !== card && !taken(pick.spot))
        : [];

    if (matRows.length === 0 && handRows.length === 0) {
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

    const row = (pick: Pick) => (
      <ListItemButton
        key={`${pick.spot.row}-${pick.spot.index}-${cardLabel(pick.card)}`}
        onClick={() => take(pick)}
        sx={{ borderRadius: 2, mb: 0.5 }}
      >
        <Stack sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {cardLabel(pick.card)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {pick.where}
          </Typography>
        </Stack>
      </ListItemButton>
    );

    return (
      <List disablePadding sx={{ maxHeight: 320, overflowY: "auto" }}>
        {handRows.length > 0 && (
          <>
            <ListSubheader disableSticky sx={{ bgcolor: "transparent", px: 2 }}>
              Your hand
            </ListSubheader>
            {handRows.map(row)}
            {matRows.length > 0 && (
              <ListSubheader disableSticky sx={{ bgcolor: "transparent", px: 2 }}>
                On the mat
              </ListSubheader>
            )}
          </>
        )}
        {matRows.map(row)}
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
      return playerList((p) =>
        finish(
          card.type === "powerup" && card.name === "K.O. Hammer"
            ? { kind: "ko-hammer", card, targetPlayerId: p.id }
            : { kind: "piranha", card, targetPlayerId: p.id },
          card.type === "powerup" && card.name === "K.O. Hammer"
            ? `K.O. Hammer clears ${p.name}'s monsters`
            : `Piranha Plant costs ${p.name} their next turn`
        )
      );
    }

    if (requirement.kind === "player-and-house") {
      if (!player) return playerList(setPlayer);
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
                  { kind: "blue-shell", card, targetPlayerId: player.id, house },
                  `Blue Shell clears ${player.name}'s ${HOUSE_SHORT[house]} heroes`
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
      if (!player) return playerList(setPlayer);
      return cardList(player, heroesOnly ? (c) => c.type === "hero" : undefined);
    }

    if (needsDestination) {
      return playerList((p) =>
        finish(
          {
            kind: "slide",
            card,
            target: picks[0].spot as Spot,
            toPlayerId: p.id,
          },
          `Ice Flower slides ${cardLabel(picks[0].card)} to ${p.name}'s mat`
        )
      );
    }

    // Enough cards: build the play.
    const name = card.type === "powerup" ? card.name : "";
    const spots = picks.map((p) => p.spot);
    const play: Play =
      name === "Warp Pipe"
        ? { kind: "warp", card, target: spots[0] as Spot }
        : name === "Gold Pipe"
          ? { kind: "swap", card, a: spots[0], b: spots[1] }
          : name === "Tanuki Suit"
            ? { kind: "tanuki", card, target: spots[0] as Spot }
            : { kind: "shoot", card, targets: spots as Spot[] };
    const label =
      name === "Warp Pipe"
        ? `Warp Pipe takes ${cardLabel(picks[0].card)} into your hand`
        : name === "Gold Pipe"
          ? `Gold Pipe swaps ${cardLabel(picks[0].card)} and ${cardLabel(picks[1].card)}`
          : name === "Tanuki Suit"
            ? `Tanuki Suit makes ${cardLabel(picks[0].card)} invincible`
            : `${name} shoots ${picks.map((p) => cardLabel(p.card)).join(", ")}`;

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
        {picks.length > 0 && (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }} useFlexGap>
              {picks.map((pick, i) => (
                <Chip
                  key={i}
                  size="small"
                  label={cardLabel(pick.card)}
                  onDelete={() =>
                    setPicks((prev) => prev.filter((_, at) => at !== i))
                  }
                />
              ))}
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
          </>
        )}
        {body()}
        {player && (
          <Button size="small" onClick={() => setPlayer(null)} sx={{ mt: 1 }}>
            Back to players
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
