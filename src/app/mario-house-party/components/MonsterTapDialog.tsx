"use client";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";

import { toSpot, type CardRef } from "./PlayMat";
import { cardsOnMat, type TargetablePlayer } from "./TargetPicker";
import type { Play } from "@/lib/mario-card-effects";
import { TABLE } from "../theme";

/**
 * What a monster on a mat can be tapped to do. Once a card is on a mat anyone
 * at the table can tap it — you can untap an enemy's Boo. What tapping does is
 * written on the cards: Bob-omb and the Koopas are thrown to another mat, Boos
 * hide and come back, Dry Bones goes into the deck. Tapping spends an action,
 * like playing a card does.
 */
export function MonsterTapDialog({
  target,
  players,
  youId,
  onClose,
  onReady,
}: {
  target: CardRef | null;
  players: TargetablePlayer[];
  youId: string;
  onClose: () => void;
  onReady: (play: Play, label: string) => void;
}) {
  if (!target || target.card.type !== "monster") return null;
  const monster = target.card;
  const spot = toSpot(target);

  const canThrow =
    monster.isTappable === true && monster.isHideable !== true &&
    monster.name !== "Dry Bones";
  const canHide = monster.isHideable === true;
  const canDeck = monster.name === "Dry Bones";
  const nothing = !canThrow && !canHide && !canDeck;

  const others = players.filter((p) => p.id !== target.playerId);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="overline" sx={{ color: TABLE.brass, display: "block" }}>
          Tap
        </Typography>
        <Typography variant="h6">{monster.name}</Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 1.5, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: 1, pb: 2 }}>
          {monster.rules}
        </Typography>

        {nothing && (
          <Typography variant="body2" sx={{ px: 1, pb: 2 }}>
            This one does nothing when tapped — it just sits there costing you
            points.
          </Typography>
        )}

        {canHide && (
          <Button
            fullWidth
            variant="contained"
            sx={{ mb: 1 }}
            onClick={() =>
              onReady(
                { kind: "tap-hide", spot },
                monster.isHidden
                  ? `${monster.name} turned face up`
                  : `${monster.name} hidden face down`
              )
            }
          >
            {monster.isHidden ? "Reveal it" : "Hide it"}
          </Button>
        )}

        {canDeck && (
          <Button
            fullWidth
            variant="contained"
            sx={{ mb: 1 }}
            onClick={() =>
              onReady(
                { kind: "tap-to-deck", spot },
                `${monster.name} shuffled back into the deck`
              )
            }
          >
            Shuffle it back into the deck
          </Button>
        )}

        {canThrow && (
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              Throw it to
            </Typography>
            <List disablePadding>
              {others.map((player) => (
                <ListItemButton
                  key={player.id}
                  onClick={() =>
                    onReady(
                      { kind: "tap-move", spot, toPlayerId: player.id },
                      `${monster.name} thrown onto ${player.name}'s mat`
                    )
                  }
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: player.colour,
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontWeight: 600 }}>
                    {player.id === youId ? `${player.name} (you)` : player.name}
                  </Typography>
                </ListItemButton>
              ))}
              {others.length === 0 && (
                <Typography variant="body2" sx={{ px: 2, py: 1 }}>
                  There is no other mat to throw it onto.
                </Typography>
              )}
            </List>
          </Stack>
        )}

        <Button fullWidth onClick={onClose} sx={{ mt: 1 }}>
          Leave it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Every monster on the table by name, for when the one you want to tap is
 * buried under a pile. Same escape hatch as choosing a target from a list.
 */
export function MonsterTapList({
  open,
  players,
  youId,
  onClose,
  onPick,
}: {
  open: boolean;
  players: TargetablePlayer[];
  youId: string;
  onClose: () => void;
  onPick: (ref: CardRef) => void;
}) {
  const rows = players.flatMap((player) =>
    cardsOnMat(player, (c) => c.type === "monster").map((row) => ({
      ...row,
      whose: player.id === youId ? "yours" : `${player.name}'s`,
      colour: player.colour,
    }))
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="overline" sx={{ color: TABLE.brass, display: "block" }}>
          Monsters on the table
        </Typography>
        <Typography variant="h6">Tap which one?</Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 1.5, pb: 2 }}>
        {rows.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 3, textAlign: "center" }}
          >
            There are no monsters on the table.
          </Typography>
        ) : (
          <List disablePadding>
            {rows.map(({ ref, whose, colour }) => {
              const monster = ref.card;
              const does =
                monster.type === "monster" && monster.isHideable
                  ? monster.isHidden
                    ? "hidden — tap to reveal"
                    : "tap to hide"
                  : monster.type === "monster" && monster.name === "Dry Bones"
                    ? "tap to shuffle back into the deck"
                    : monster.type === "monster" && monster.isTappable
                      ? "tap to throw at another mat"
                      : "nothing happens when tapped";
              return (
                <ListItemButton
                  key={`${ref.playerId}-${ref.index}`}
                  onClick={() => {
                    onPick(ref);
                    onClose();
                  }}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: colour,
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {monster.type === "monster" ? monster.name : "Card"}
                      <Box component="span" sx={{ opacity: 0.6, fontWeight: 400 }}>
                        {` — ${whose}`}
                      </Box>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {does}
                    </Typography>
                  </Stack>
                </ListItemButton>
              );
            })}
          </List>
        )}
        <Button fullWidth onClick={onClose} sx={{ mt: 1 }}>
          Never mind
        </Button>
      </DialogContent>
    </Dialog>
  );
}
