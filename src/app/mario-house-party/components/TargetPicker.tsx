"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";

import type { GameCard } from "../types";
import {
  HOUSE_SHORT,
  toMatBoard,
  type CardRef,
  type MatRow,
  type MatZone,
} from "./PlayMat";
import { cardLabel } from "./PendingActionBar";
import type { PlayerBoard } from "@/lib/mario-types";
import { TABLE } from "../theme";

export type TargetablePlayer = {
  id: string;
  name: string;
  colour: string;
  board?: PlayerBoard | null;
};

type Row = { ref: CardRef; where: string };

/** Everything on a mat, as a flat list you can read down. */
export function cardsOnMat(
  player: TargetablePlayer,
  only?: (card: GameCard) => boolean
): Row[] {
  const mat = toMatBoard(player.board);
  const rows: Row[] = [];
  const push = (zone: MatZone, row: MatRow, where: string, cards: GameCard[]) =>
    cards.forEach((card, index) => {
      if (only && !only(card)) return;
      rows.push({ ref: { playerId: player.id, zone, row, index, card }, where });
    });

  push("in-play", "in-play", "In play", mat.inPlay);
  (Object.keys(mat.heroes) as (keyof typeof mat.heroes)[]).forEach((house) =>
    push(house, "heroes", `${HOUSE_SHORT[house]} heroes`, mat.heroes[house])
  );
  (Object.keys(mat.collectables) as (keyof typeof mat.collectables)[]).forEach(
    (house) =>
      push(
        house,
        "collectables",
        `${HOUSE_SHORT[house]} collectables`,
        mat.collectables[house]
      )
  );
  push("bowsers-castle", "monsters", "Monsters", mat.monsters);
  return rows;
}

/**
 * Picking a target without hunting for it on the mat: choose a player, then
 * choose a card by name. Tapping the card on the mat still works — this is
 * the same job done with a list, which is easier on a phone and the only
 * practical way to reach a card buried in a pile.
 */
export function TargetPicker({
  open,
  card,
  players,
  youId,
  onClose,
  onChooseCard,
  onChoosePlayer,
}: {
  open: boolean;
  card: GameCard | null;
  players: TargetablePlayer[];
  youId: string;
  onClose: () => void;
  onChooseCard: (ref: CardRef) => void;
  /** Chosen a player but no particular card: play it to their mat. */
  onChoosePlayer: (playerId: string) => void;
}) {
  const [chosen, setChosen] = useState<TargetablePlayer | null>(null);

  const close = () => {
    setChosen(null);
    onClose();
  };

  const rows = chosen ? cardsOnMat(chosen) : [];

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="overline" sx={{ color: TABLE.brass, display: "block" }}>
          {card ? `Use ${cardLabel(card)} on` : "Choose a target"}
        </Typography>
        <Typography variant="h6">
          {chosen ? chosen.name : "Which player?"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 1.5, pb: 2 }}>
        {!chosen ? (
          <List disablePadding>
            {players.map((player) => (
              <ListItemButton
                key={player.id}
                onClick={() => setChosen(player)}
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
        ) : (
          <Stack spacing={1}>
            <ListItemButton
              onClick={() => {
                onChoosePlayer(chosen.id);
                close();
              }}
              sx={{ borderRadius: 2, border: `1px solid ${TABLE.brass}55` }}
            >
              <Stack>
                <Typography sx={{ fontWeight: 600 }}>
                  Their mat, no particular card
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Plays it into their In play row
                </Typography>
              </Stack>
            </ListItemButton>

            <Divider flexItem />

            {rows.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, py: 3, textAlign: "center" }}
              >
                {chosen.name} has nothing on the table yet.
              </Typography>
            ) : (
              <List disablePadding sx={{ maxHeight: 340, overflowY: "auto" }}>
                {rows.map(({ ref, where }) => (
                  <ListItemButton
                    key={`${ref.zone}-${where}-${ref.index}`}
                    onClick={() => {
                      onChooseCard(ref);
                      close();
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
            )}

            <Button onClick={() => setChosen(null)} size="small">
              Back to players
            </Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
