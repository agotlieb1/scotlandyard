"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { PlayMat, type MatBoard } from "../components/PlayMat";
import { TableView, type Seat } from "../components/TableView";
import { COLLECTABLE_CARDS, HERO_CARDS } from "../card-library";
import { MONSTER_CARDS, POWERUP_CARDS } from "../card-data";
import BrandHomeLink from "@/app/brand-home-link";
import { TABLE } from "../theme";

/**
 * A dealt-out table, with no database behind it: this is what the mat layout
 * and the overhead view look like once there are cards on them. It needs no
 * game, so it can be opened on a phone or a TV to judge the size of things.
 */

const heroesOf = (house: string, n: number) =>
  HERO_CARDS.filter((c) => c.house === house).slice(0, n);
const collectablesOf = (house: string, n: number) =>
  COLLECTABLE_CARDS.filter((c) => c.house === house).slice(0, n);

const board = (seed: number): MatBoard => ({
  inPlay: seed % 2 === 0 ? [POWERUP_CARDS[seed % POWERUP_CARDS.length]] : [],
  heroes: {
    "mario-bros": heroesOf("mario-bros", 1 + (seed % 3)),
    "mushroom-kingdom": heroesOf("mushroom-kingdom", seed % 4),
    "kong-island": heroesOf("kong-island", 1 + ((seed + 1) % 3)),
    "bowsers-castle": heroesOf("bowsers-castle", (seed + 2) % 3),
  },
  collectables: {
    "mario-bros": collectablesOf("mario-bros", 1 + (seed % 4)),
    "mushroom-kingdom": collectablesOf("mushroom-kingdom", (seed + 1) % 4),
    "kong-island": collectablesOf("kong-island", (seed + 2) % 5),
  },
  monsters: MONSTER_CARDS.slice(seed % 3, (seed % 3) + (1 + (seed % 3))),
});

const PLAYERS = [
  { id: "p1", name: "Aaron", colour: "#e74c3c" },
  { id: "p2", name: "Damond", colour: "#3498db" },
  { id: "p3", name: "Jules", colour: "#2ecc71" },
  { id: "p4", name: "Mia", colour: "#f39c12" },
  { id: "p5", name: "Sam", colour: "#9b59b6" },
  { id: "p6", name: "Rook", colour: "#1abc9c" },
];

export default function TablePreviewPage() {
  const [seatCount, setSeatCount] = useState(4);
  const [rotateSeats, setRotateSeats] = useState(true);
  const [corners, setCorners] = useState<boolean | undefined>(undefined);

  const seats: Seat[] = PLAYERS.slice(0, seatCount).map((p, i) => ({
    ...p,
    board: board(i + 1),
    isTurn: i === 1,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography variant="overline" sx={{ color: TABLE.brass }}>
            Preview — no game behind it
          </Typography>
          <Typography variant="h4">The table from above</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
            Every player&apos;s mat on one screen: a temporary slot on top,
            heroes in Mario / Mushroom / Kong / Koopa order, then collectables
            in the same order with the monster pen under Koopa. Cards stack and
            peek, so a full zone still reads at a glance.
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={seatCount}
            onChange={(_, v) => v && setSeatCount(v)}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <ToggleButton key={n} value={n}>
                {n} players
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={rotateSeats}
            onChange={(_, v) => v !== null && setRotateSeats(v)}
          >
            <ToggleButton value={true}>Tops face the middle</ToggleButton>
            <ToggleButton value={false}>All upright</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={corners ?? (seatCount === 2 || seatCount === 4)}
            onChange={(_, v) => v !== null && setCorners(v)}
          >
            <ToggleButton value={false}>Along the sides</ToggleButton>
            <ToggleButton value={true}>Round the corners</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* The overhead view is for the screen everyone looks at. Below the
            width it needs, it pans rather than squashing into a scrum. */}
        <Box sx={{ overflowX: "auto", pb: 1, mx: { xs: -2, sm: 0 } }}>
          <Box sx={{ minWidth: 960, px: { xs: 2, sm: 0 } }}>
            <TableView
              seats={seats}
              rotateSeats={rotateSeats}
              corners={corners}
              deckCount={42}
              discardCount={7}
            />
          </Box>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: { xs: "block", md: "none" }, mt: -2 }}
        >
          Drag sideways to pan — the overhead table wants a laptop, a tablet or
          a TV. On a phone you would look at your own mat, below.
        </Typography>

        <Stack spacing={2}>
          <Typography variant="h6">One mat, full size</Typography>
          <Typography variant="body2" color="text.secondary">
            What a player sees of their own board on a phone or laptop.
          </Typography>
          <Box sx={{ overflowX: "auto", pb: 1 }}>
            <PlayMat
              board={board(2)}
              name="Aaron"
              colour="#e74c3c"
              cardWidth={76}
            />
          </Box>
        </Stack>

        <BrandHomeLink sx={{ color: TABLE.cyan }} />
      </Stack>
    </Container>
  );
}
