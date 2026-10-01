"use client";

import { Box, Stack, Typography } from "@mui/material";

import type { GameCard, MainHouse } from "../types";
import type { Spot } from "@/lib/mario-card-effects";
import type { PlayerBoard } from "@/lib/mario-types";
import { CardDisplay } from "./CardDisplay";
import { TABLE } from "../theme";

/**
 * One player's mat, laid out the way the game is actually played:
 *
 *   row 1   a single temporary slot — a Piranha Plant, a Star, a mini-game
 *   row 2   heroes, in Mario / Mushroom / Kong / Koopa order
 *   row 3   collectables in that same order, with a wider monster pen under
 *           Koopa on the right
 *
 * Cards in a zone stack like a game of solitaire: each one covers the one
 * below but leaves its top edge showing, so a glance reads the whole pile.
 */

export type MatBoard = {
  inPlay: GameCard[];
  heroes: Record<MainHouse, GameCard[]>;
  collectables: Record<Exclude<MainHouse, "bowsers-castle">, GameCard[]>;
  monsters: GameCard[];
};

/** Where a card can be played: a house, or the temporary row on top. */
export type MatZone = MainHouse | "in-play";

/** Enough to point at one card on one mat: whose, which zone, which card. */
export type MatRow = "in-play" | "heroes" | "collectables" | "monsters";

export type CardRef = {
  playerId: string;
  zone: MatZone;
  row: MatRow;
  index: number;
  card: GameCard;
};

/** The same reference in the shape the rules engine takes. */
export function toSpot(ref: CardRef): Spot {
  switch (ref.row) {
    case "in-play":
      return { playerId: ref.playerId, row: "in-play", index: ref.index };
    case "monsters":
      return { playerId: ref.playerId, row: "monsters", index: ref.index };
    default:
      return {
        playerId: ref.playerId,
        row: ref.row,
        house: ref.zone as MainHouse,
        index: ref.index,
      };
  }
}

export const HOUSE_ORDER: MainHouse[] = [
  "mario-bros",
  "mushroom-kingdom",
  "kong-island",
  "bowsers-castle",
];

export const HOUSE_SHORT: Record<MainHouse, string> = {
  "mario-bros": "Marios",
  "mushroom-kingdom": "Mushroom",
  "kong-island": "Kong",
  "bowsers-castle": "Koopas",
};

const HOUSE_TINT: Record<MainHouse, string> = {
  "mario-bros": "#e74c3c",
  "mushroom-kingdom": "#e67e22",
  "kong-island": "#f1c40f",
  "bowsers-castle": "#9b59b6",
};

/** How much of each buried card stays visible, as a share of card height. */
const PEEK = 0.26;

function CardStack({
  cards,
  tint,
  width,
  minCards = 3,
  maxVisible,
  armed = false,
  zone,
  row,
  selectedIndex,
  onChoose,
  onDropCard,
  onCardClick,
}: {
  cards: GameCard[];
  tint: string;
  width: number;
  minCards?: number;
  /** Cap the peek so a deep pile cannot stretch the mat off the table. */
  maxVisible?: number;
  /** A card is waiting to be placed, so this zone is a live target. */
  armed?: boolean;
  /** Which zone this is, so a drop knows where it landed. */
  zone?: MatZone;
  /** Which row of the mat, since a house appears in two of them. */
  row?: "in-play" | "heroes" | "collectables" | "monsters";
  /** The card in this zone that is currently aimed at, if any. */
  selectedIndex?: number | null;
  onChoose?: () => void;
  /** A card dragged from the hand carries itself in the drag event. */
  onDropCard?: (card: GameCard) => void;
  onCardClick?: (card: GameCard, index: number) => void;
}) {
  const cardHeight = width * 1.4;
  const peek = cardHeight * PEEK;
  // Only the top few peek out; the tally says how many are really there.
  const shown = maxVisible ? cards.slice(-maxVisible) : cards;
  // Keep the slot a steady size until the pile outgrows it, so an empty mat
  // has the same shape as a full one.
  const slots = Math.max(shown.length, minCards);
  const height = cardHeight + peek * (slots - 1);

  return (
    <Box
      data-zone={zone}
      data-row={row}
      onClick={onChoose}
      onDragOver={
        onDropCard ? (e: React.DragEvent) => e.preventDefault() : undefined
      }
      onDrop={
        onDropCard
          ? (e: React.DragEvent) => {
              e.preventDefault();
              const raw = e.dataTransfer?.getData("application/json");
              if (!raw) return;
              try {
                onDropCard(JSON.parse(raw) as GameCard);
              } catch {
                // A drag from somewhere else; nothing to play.
              }
            }
          : undefined
      }
      sx={{
        position: "relative",
        width,
        height,
        flexShrink: 0,
        cursor: armed ? "pointer" : undefined,
      }}
    >
      {/* The printed outline of the zone on the mat. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: 1.5,
          border: armed ? `2px solid ${tint}` : `1px dashed ${tint}55`,
          background: armed
            ? `linear-gradient(180deg, ${tint}44, ${tint}18 70%)`
            : `linear-gradient(180deg, ${tint}14, transparent 70%)`,
          boxShadow: armed ? `0 0 0 4px ${tint}33` : undefined,
          transition: "border-color 160ms ease, box-shadow 160ms ease",
          "@keyframes matZonePulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.55 },
          },
          animation: armed ? "matZonePulse 1.6s ease-in-out infinite" : undefined,
        }}
      />
      {cards.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            right: -6,
            bottom: -6,
            zIndex: 100,
            minWidth: 18,
            height: 18,
            px: 0.5,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: TABLE.rail,
            border: `1px solid ${tint}`,
            color: TABLE.cream,
            fontSize: "0.62rem",
            fontWeight: 700,
            boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
          }}
        >
          {cards.length}
        </Box>
      )}
      {shown.map((card, i) => {
        // `shown` is the tail of the pile when it is deeper than the peek.
        const index = cards.length - shown.length + i;
        const aimedAt = selectedIndex === index;
        return (
        <Box
          key={index}
          onClick={
            onCardClick
              ? (e: React.MouseEvent) => {
                  e.stopPropagation();
                  onCardClick(card, index);
                }
              : undefined
          }
          sx={{
            position: "absolute",
            top: peek * i,
            left: 0,
            zIndex: aimedAt ? 98 : i + 1,
            cursor: onCardClick ? "pointer" : undefined,
            transform: aimedAt ? "translateY(-12px)" : undefined,
            filter: aimedAt
              ? `drop-shadow(0 0 0 2px ${TABLE.brass}) drop-shadow(0 8px 16px rgba(0,0,0,0.7))`
              : undefined,
            outline: aimedAt ? `3px solid ${TABLE.brass}` : undefined,
            outlineOffset: aimedAt ? "2px" : undefined,
            borderRadius: "10px",
            transition: "transform 160ms cubic-bezier(0.2, 0.8, 0.3, 1)",
            "&:hover": { transform: "translateY(-10px)", zIndex: 99 },
          }}
        >
          <CardDisplayScaled card={card} width={width} />
        </Box>
        );
      })}
    </Box>
  );
}

/** CardDisplay at an arbitrary width, so one mat can serve a table view too. */
function CardDisplayScaled({ card, width }: { card: GameCard; width: number }) {
  const base = 80; // CardDisplay's "small" width
  return (
    <Box
      sx={{
        width,
        height: width * 1.4,
        "& > *": {
          transform: `scale(${width / base})`,
          transformOrigin: "top left",
        },
      }}
    >
      <CardDisplay card={card} size="small" />
    </Box>
  );
}

function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: "0.58rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(253, 247, 238, 0.5)",
        textAlign: "center",
        lineHeight: 1.4,
      }}
    >
      {children}
    </Typography>
  );
}

export function PlayMat({
  board,
  name,
  colour,
  cardWidth = 64,
  dimmed = false,
  maxVisible,
  armed = false,
  aimAtCards = false,
  playerId = "",
  aimedAt,
  onZoneChoose,
  onZoneDropCard,
  onCardChoose,
}: {
  board: MatBoard;
  name: string;
  colour: string;
  cardWidth?: number;
  dimmed?: boolean;
  maxVisible?: number;
  /** A card is selected and every zone is a live target. */
  armed?: boolean;
  /**
   * The selected card is used *on* something — a Fireball, an Ice Flower — so
   * the cards already on the mat become targets too. Off by default, or a
   * pile of cards would swallow every tap meant for the zone under it.
   */
  aimAtCards?: boolean;
  /** Whose mat this is, so a chosen card can say where it came from. */
  playerId?: string;
  /** The card on this mat that is currently aimed at. */
  aimedAt?: CardRef | null;
  onZoneChoose?: (zone: MatZone) => void;
  onZoneDropCard?: (zone: MatZone, card: GameCard) => void;
  onCardChoose?: (ref: CardRef) => void;
}) {
  const target = (zone: MatZone) =>
    onZoneChoose ? () => onZoneChoose(zone) : undefined;
  const dropped = (zone: MatZone) =>
    onZoneDropCard ? (card: GameCard) => onZoneDropCard(zone, card) : undefined;
  const pick = (zone: MatZone, row: MatRow) =>
    onCardChoose && aimAtCards
      ? (card: GameCard, index: number) =>
          onCardChoose({ playerId, zone, row, index, card })
      : undefined;
  const aimed = (zone: MatZone) =>
    aimedAt && aimedAt.zone === zone && aimedAt.playerId === playerId
      ? aimedAt.index
      : null;
  const gap = Math.round(cardWidth * 0.14);

  return (
    <Box
      sx={{
        // Shrink to the cards, so a lone mat does not stretch across a wide
        // screen with its contents stranded in the middle.
        display: "inline-block",
        p: `${gap * 1.5}px`,
        borderRadius: 3,
        opacity: dimmed ? 0.72 : 1,
        // The mat itself: a darker rectangle of felt with a stitched edge in
        // the player's colour.
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.05), rgba(3,16,23,0.5) 70%)",
        border: `1px solid ${colour}66`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 28px -18px rgba(0,0,0,0.9)`,
        transition: "opacity 200ms ease",
      }}
    >
      <Stack spacing={`${gap}px`} alignItems="center">
        {/* Nameplate */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ alignSelf: "stretch", mb: `${gap * 0.25}px` }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: colour,
              boxShadow: `0 0 8px ${colour}`,
            }}
          />
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: TABLE.cream,
            }}
          >
            {name}
          </Typography>
        </Stack>

        {/* Row 1 — the temporary slot */}
        <Stack spacing={`${gap * 0.4}px`} alignItems="center">
          <ZoneLabel>In play</ZoneLabel>
          <CardStack
            cards={board.inPlay}
            tint={TABLE.brass}
            width={cardWidth}
            minCards={1}
            armed={armed}
            zone="in-play"
            row="in-play"
            onChoose={target("in-play")}
            onDropCard={dropped("in-play")}
            selectedIndex={aimed("in-play")}
            onCardClick={pick("in-play", "in-play")}
          />
        </Stack>

        {/* Row 2 — heroes, in play order */}
        <Stack direction="row" spacing={`${gap}px`} alignItems="flex-start">
          {HOUSE_ORDER.map((house) => (
            <Stack key={house} spacing={`${gap * 0.4}px`} alignItems="center">
              <ZoneLabel>{HOUSE_SHORT[house]}</ZoneLabel>
              <CardStack
                cards={board.heroes[house] ?? []}
                tint={HOUSE_TINT[house]}
                width={cardWidth}
                maxVisible={maxVisible}
                armed={armed}
                zone={house}
                row="heroes"
                onChoose={target(house)}
                onDropCard={dropped(house)}
                selectedIndex={aimed(house)}
                onCardClick={pick(house, "heroes")}
              />
            </Stack>
          ))}
        </Stack>

        {/* Row 3 — collectables, with the monster pen under Koopa */}
        <Stack direction="row" spacing={`${gap}px`} alignItems="flex-start">
          {(["mario-bros", "mushroom-kingdom", "kong-island"] as const).map(
            (house) => (
              <Stack key={house} spacing={`${gap * 0.4}px`} alignItems="center">
                <CardStack
                  cards={board.collectables[house] ?? []}
                  tint={HOUSE_TINT[house]}
                  width={cardWidth}
                  maxVisible={maxVisible}
                  armed={armed}
                  zone={house}
                  row="collectables"
                  onChoose={target(house)}
                  onDropCard={dropped(house)}
                  selectedIndex={aimed(house)}
                  onCardClick={pick(house, "heroes")}
                />
              </Stack>
            )
          )}
          <Stack spacing={`${gap * 0.4}px`} alignItems="center">
            <Box
              sx={{
                px: 1,
                borderRadius: 1,
                border: `1px solid ${HOUSE_TINT["bowsers-castle"]}55`,
              }}
            >
              <ZoneLabel>Monsters</ZoneLabel>
            </Box>
            <Stack direction="row" spacing={`${gap * 0.6}px`}>
              <CardStack
                cards={board.monsters}
                tint={HOUSE_TINT["bowsers-castle"]}
                width={cardWidth}
                maxVisible={maxVisible}
                armed={armed}
                zone="bowsers-castle"
                row="monsters"
                onChoose={target("bowsers-castle")}
                onDropCard={dropped("bowsers-castle")}
                selectedIndex={aimed("bowsers-castle")}
                onCardClick={pick("bowsers-castle", "monsters")}
              />
              <CardStack
                cards={[]}
                tint={HOUSE_TINT["bowsers-castle"]}
                width={cardWidth}
                minCards={3}
              />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

/**
 * The stored board, as the mat wants it. The two shapes are nearly the same —
 * this exists so the live game board can render a mat without reshaping
 * anything itself.
 */
export function toMatBoard(board: PlayerBoard | null | undefined): MatBoard {
  const zone = (house: MainHouse) => board?.[house];
  return {
    inPlay: board?.inPlay ?? [],
    heroes: {
      "mario-bros": zone("mario-bros")?.heroes ?? [],
      "mushroom-kingdom": zone("mushroom-kingdom")?.heroes ?? [],
      "kong-island": zone("kong-island")?.heroes ?? [],
      "bowsers-castle": zone("bowsers-castle")?.heroes ?? [],
    },
    collectables: {
      "mario-bros": zone("mario-bros")?.collectables ?? [],
      "mushroom-kingdom": zone("mushroom-kingdom")?.collectables ?? [],
      "kong-island": zone("kong-island")?.collectables ?? [],
    },
    monsters: board?.["bowsers-castle"]?.monsters ?? [],
  };
}
