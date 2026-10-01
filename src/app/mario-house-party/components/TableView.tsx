"use client";

import { Box, Stack, Typography } from "@mui/material";

import { PlayMat, type MatBoard } from "./PlayMat";
import { TABLE } from "../theme";

export type Seat = {
  id: string;
  name: string;
  colour: string;
  board: MatBoard;
  isTurn?: boolean;
};

/**
 * Every mat on one screen, seen from above.
 *
 * `rotateSeats` is the difference between the two places this screen can
 * live. Flat in the middle of the table, each mat should face its player, the
 * way the real cards do. Propped up on a TV everyone reads from the same
 * side, so they all stay upright.
 */
export function TableView({
  seats,
  rotateSeats = true,
  deckCount,
  discardCount,
  cardWidth,
  corners,
}: {
  seats: Seat[];
  rotateSeats?: boolean;
  deckCount?: number;
  discardCount?: number;
  cardWidth?: number;
  /**
   * Seat people at the corners rather than along the straight sides. Measured
   * on a 16:10 screen, the corners buy real room at two and four seats (the
   * clearance to the rail goes from -18px to +15px, and from +9px to +33px),
   * because a seat at the top or bottom edge is only ever 31% of the screen
   * height from the middle. At six seats the sides are the roomier of the two,
   * so this defaults per seat count rather than to a fixed answer.
   */
  corners?: boolean;
}) {
  const atCorners = corners ?? (seats.length === 2 || seats.length === 4);
  // Seats sit on an ellipse matched to the table, and each mat's rotation is
  // derived from where it landed rather than written down: the top of a mat
  // always points at the middle, which is how the cards face on a real table.
  //
  // `corners` turns the ring by half a seat. On a 16:10 table the corners are
  // further from the middle than the short edges are, so for five and six
  // seats that buys room the straight sides do not have.
  const n = Math.max(seats.length, 1);
  // A 16:10 screen makes the ring an ellipse, and stepping round an ellipse by
  // equal angles bunches seats at the ends of the short axis — which is
  // exactly where mats started colliding. Step by equal *distance* instead.
  const rx = 36;
  const ry = 31;
  const samples = 720;
  const pointAt = (t: number) => ({
    x: 50 + rx * Math.sin(t),
    // Screen pixels, not percent: a 16:10 box makes a percent of height
    // shorter than a percent of width, and the spacing has to know that.
    y: 50 + ry * Math.cos(t),
  });
  const arc: number[] = [0];
  for (let i = 1; i <= samples; i++) {
    const a = pointAt(((i - 1) / samples) * 2 * Math.PI);
    const b = pointAt((i / samples) * 2 * Math.PI);
    arc.push(arc[i - 1] + Math.hypot((b.x - a.x) * 1.6, b.y - a.y));
  }
  const total = arc[samples];
  const tForDistance = (d: number) => {
    const target = ((d % total) + total) % total;
    let i = arc.findIndex((v) => v >= target);
    if (i < 1) i = 1;
    return ((i - 1) / samples) * 2 * Math.PI;
  };
  const offset = atCorners ? total / (2 * n) : 0;

  const placements = seats.map((_, i) => {
    const { x, y } = pointAt(tForDistance((i * total) / n + offset));
    // Point the mat's top edge (0, -1) at the middle of the table.
    const tx = 50 - x;
    const ty = (50 - y) * 0.625; // percent of height is shorter than of width
    const len = Math.hypot(tx, ty) || 1;
    const angle = (Math.atan2(tx / len, -(ty / len)) * 180) / Math.PI;
    return { x, y, angle };
  });

  // Six mats need smaller cards than two do.
  const fittedWidth =
    cardWidth ?? (seats.length <= 2 ? 48 : seats.length <= 4 ? 44 : seats.length === 5 ? 36 : 30);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 10",
        minHeight: 560,
        borderRadius: "48px",
        overflow: "hidden",
        // The table: felt inside a padded rail with a brass line on the lip.
        background: `
          radial-gradient(ellipse 70% 60% at 50% 50%, ${TABLE.feltHigh}, transparent 70%),
          linear-gradient(180deg, ${TABLE.felt}, ${TABLE.feltLow})
        `,
        border: `14px solid ${TABLE.rail}`,
        boxShadow: `
          inset 0 0 0 2px ${TABLE.brass}55,
          inset 0 0 120px 40px rgba(2, 12, 18, 0.75),
          0 30px 60px -30px rgba(0,0,0,0.9)
        `,
      }}
    >
      {/* The pile in the middle: deck, discard, and whose turn it is. */}
      <Stack
        spacing={1}
        alignItems="center"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          px: 3,
          py: 2,
          borderRadius: 4,
          border: `1px solid ${TABLE.brass}44`,
          background: "rgba(3, 16, 23, 0.4)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: TABLE.brass, fontSize: "0.6rem" }}
        >
          Mario House Party
        </Typography>
        {deckCount !== undefined && (
          <Typography variant="caption" sx={{ color: "rgba(253,247,238,0.7)" }}>
            {deckCount} in the deck
            {discardCount !== undefined ? ` · ${discardCount} discarded` : ""}
          </Typography>
        )}
        {seats.find((s) => s.isTurn) && (
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: TABLE.cream }}>
            {seats.find((s) => s.isTurn)!.name}&apos;s turn
          </Typography>
        )}
      </Stack>

      {seats.map((seat, i) => {
        const { x, y, angle } = placements[i];

        return (
          <Box
            key={seat.id}
            sx={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${
                rotateSeats ? angle : 0
              }deg)`,
              transformOrigin: "center",
              transition: "transform 400ms cubic-bezier(0.2, 0.8, 0.3, 1)",
              filter: seat.isTurn
                ? `drop-shadow(0 0 14px ${seat.colour}88)`
                : undefined,
            }}
          >
            <PlayMat
              board={seat.board}
              name={seat.name}
              colour={seat.colour}
              cardWidth={fittedWidth}
              maxVisible={4}
              dimmed={seats.some((s) => s.isTurn) && !seat.isTurn}
            />
          </Box>
        );
      })}
    </Box>
  );
}
