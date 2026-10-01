"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { PlayMat, type CardRef, type MatBoard, type MatZone } from "../components/PlayMat";
import { PlayerHand } from "../components/PlayerHand";
import { SeatIdentity } from "../components/SeatIdentity";
import { TargetPicker } from "../components/TargetPicker";
import { EffectWizard } from "../components/EffectWizard";
import { MonsterTapDialog, MonsterTapList } from "../components/MonsterTapDialog";
import {
  emptyEffects,
  requirementFor,
  resolve,
  type Play,
  type Table,
} from "@/lib/mario-card-effects";
import {
  PendingActionBar,
  describeAction,
  type PendingAction,
} from "../components/PendingActionBar";
import type { GameCard } from "../types";
import type { PlayerBoard } from "@/lib/mario-types";
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

// The same six seats the live game offers.
const SEAT_COLOURS = [
  { key: "red", primary: "#e74c3c", name: "Red" },
  { key: "blue", primary: "#3498db", name: "Blue" },
  { key: "green", primary: "#2ecc71", name: "Green" },
  { key: "orange", primary: "#f39c12", name: "Orange" },
  { key: "purple", primary: "#9b59b6", name: "Purple" },
  { key: "teal", primary: "#1abc9c", name: "Teal" },
];

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

  // A hand and a mat that answer to taps, so the flow the live board uses can
  // be tried here with no game behind it.
  const [hand, setHand] = useState<GameCard[]>([
    HERO_CARDS[0],
    HERO_CARDS[8],
    COLLECTABLE_CARDS[0],
    MONSTER_CARDS[3],
    POWERUP_CARDS[0],
  ]);
  const [picked, setPicked] = useState<GameCard | null>(null);
  const [myBoard, setMyBoard] = useState<MatBoard>(board(2));
  const [theirBoard, setTheirBoard] = useState<MatBoard>(board(3));
  const [viewing, setViewing] = useState<"me" | "them">("me");
  const [aimedAt, setAimedAt] = useState<CardRef | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [me, setMe] = useState({ name: "Player 1", colour: "red" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [tapTarget, setTapTarget] = useState<CardRef | null>(null);
  const [tapListOpen, setTapListOpen] = useState(false);
  const [discard, setDiscard] = useState<GameCard[]>([MONSTER_CARDS[3]]);
  const [note, setNote] = useState<string | null>(null);

  const nameOf = (id: string) => (id === "me" ? me.name : "Damond");

  // The picker takes a stored board, which is what the live game holds; the
  // harness keeps mat-shaped ones, so turn them back.
  const asStored = (mat: MatBoard): PlayerBoard => ({
    "mario-bros": {
      heroes: mat.heroes["mario-bros"],
      collectables: mat.collectables["mario-bros"],
    },
    "mushroom-kingdom": {
      heroes: mat.heroes["mushroom-kingdom"],
      collectables: mat.collectables["mushroom-kingdom"],
    },
    "kong-island": {
      heroes: mat.heroes["kong-island"],
      collectables: mat.collectables["kong-island"],
    },
    "bowsers-castle": {
      heroes: mat.heroes["bowsers-castle"],
      collectables: [],
      monsters: mat.monsters,
    },
    inPlay: mat.inPlay,
  });
  const viewedId = viewing === "me" ? "me" : "them";

  const addTo = (prev: MatBoard, zone: MatZone, card: GameCard): MatBoard => {
    const next: MatBoard = {
      inPlay: [...prev.inPlay],
      heroes: { ...prev.heroes },
      collectables: { ...prev.collectables },
      monsters: [...prev.monsters],
    };
    if (zone === "in-play") {
      next.inPlay = [...next.inPlay, card];
    } else if (card.type === "monster" && zone === "bowsers-castle") {
      next.monsters = [...next.monsters, card];
    } else if (card.type === "collectable" && zone !== "bowsers-castle") {
      next.collectables = {
        ...next.collectables,
        [zone]: [...(next.collectables[zone] ?? []), card],
      };
    } else {
      next.heroes = { ...next.heroes, [zone]: [...(next.heroes[zone] ?? []), card] };
    }
    return next;
  };

  // Staging only — nothing moves until Confirm, exactly as the live board.
  const stageZone = (zone: MatZone, card?: GameCard) => {
    const playing = card ?? picked;
    if (!playing) return;
    setPending({ kind: "play", card: playing, zone, targetPlayerId: viewedId });
  };
  const stageCard = (ref: CardRef) => {
    if (!picked) {
      if (ref.playerId === "me" && ref.card.type === "monster") setTapTarget(ref);
      return;
    }
    setAimedAt(ref);
    setViewing(ref.playerId === "me" ? "me" : "them");
    setPending({ kind: "aim", card: picked, target: ref });
  };
  // The engine hands back stored boards; the harness draws mat-shaped ones.
  const toMat = (stored: PlayerBoard): MatBoard => ({
    inPlay: stored.inPlay ?? [],
    heroes: {
      "mario-bros": stored["mario-bros"].heroes,
      "mushroom-kingdom": stored["mushroom-kingdom"].heroes,
      "kong-island": stored["kong-island"].heroes,
      "bowsers-castle": stored["bowsers-castle"].heroes,
    },
    collectables: {
      "mario-bros": stored["mario-bros"].collectables,
      "mushroom-kingdom": stored["mushroom-kingdom"].collectables,
      "kong-island": stored["kong-island"].collectables,
    },
    monsters: stored["bowsers-castle"].monsters,
  });

  const liveTable = (): Table => ({
    seats: [
      { playerId: "me", hand, board: asStored(myBoard) },
      { playerId: "them", hand: [], board: asStored(theirBoard) },
    ],
    deck: HERO_CARDS.slice(20, 24),
    discard,
    effects: emptyEffects(),
    turnPlayerId: "me",
    turnNumber: 3,
  });

  const applyEffect = (play: Play) => {
    const table = liveTable();
    if (play.kind !== "tap-hide" && play.kind !== "tap-move" && play.kind !== "tap-to-deck") {
      const seat = table.seats[0];
      const at = seat.hand.findIndex((c) => c === pendingCard(play));
      if (at !== -1) seat.hand.splice(at, 1);
    }
    const outcome = resolve(table, "me", play);
    if (!outcome.ok) {
      setNote(outcome.error);
      return;
    }
    setHand(outcome.table.seats[0].hand);
    setMyBoard(toMat(outcome.table.seats[0].board));
    setTheirBoard(toMat(outcome.table.seats[1].board));
    setDiscard(outcome.table.discard);
    setNote(outcome.label);
  };

  const pendingCard = (play: Play): GameCard | undefined =>
    "card" in play ? play.card : undefined;

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === "effect") {
      applyEffect(pending.play);
      setPicked(null);
      setPending(null);
      setAimedAt(null);
      return;
    }
    if (pending.kind === "play") {
      const put = pending.targetPlayerId === "me" ? setMyBoard : setTheirBoard;
      put((prev) => addTo(prev, pending.zone, pending.card));
      setHand((h) => h.filter((c) => c !== pending.card));
    } else if (pending.kind === "aim") {
      const put = pending.target.playerId === "me" ? setMyBoard : setTheirBoard;
      put((prev) => addTo(prev, "in-play", pending.card));
      setHand((h) => h.filter((c) => c !== pending.card));
    }
    setPicked(null);
    setPending(null);
    setAimedAt(null);
  };

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
          <Typography variant="h6">What a player sees on their phone</Typography>
          <Typography variant="body2" color="text.secondary">
            Name and colour, the hand, a strip to pick whose mat you are
            looking at, and nothing reaching the table until you confirm it.
            This copy keeps its cards in the page rather than in a game.
          </Typography>

          <SeatIdentity
            name={me.name}
            colourKey={me.colour}
            colours={SEAT_COLOURS}
            takenColours={["blue"]}
            onSave={(name, colour) => setMe({ name, colour })}
          />

          <PlayerHand
            hand={hand}
            playerId="preview"
            isCurrentPlayer
            selectedCard={picked}
            onCardTap={(card) =>
              setPicked((prev) => {
                const next = prev === card ? null : card;
                if (next) {
                  document
                    .getElementById("my-mat")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                return next;
              })
            }
          />

          {picked && (
            <Button variant="outlined" onClick={() => setPickerOpen(true)}>
              Choose a target from a list
            </Button>
          )}

          {!picked && (
            <Button variant="outlined" onClick={() => setTapListOpen(true)}>
              Tap one of your monsters
            </Button>
          )}

          <MonsterTapList
            open={tapListOpen}
            you={{ id: "me", name: me.name, colour: "#e74c3c", board: asStored(myBoard) }}
            onClose={() => setTapListOpen(false)}
            onPick={setTapTarget}
          />

          {picked?.type === "powerup" && (
            <Button variant="contained" onClick={() => setWizardOpen(true)}>
              {requirementFor(picked).kind === "none"
                ? `Play ${picked.name}`
                : `${picked.name}: choose targets`}
            </Button>
          )}

          {note && (
            <Paper sx={{ px: 2, py: 1.25 }}>
              <Typography variant="body2">{note}</Typography>
            </Paper>
          )}

          <EffectWizard
            open={wizardOpen}
            card={picked}
            youId="me"
            discard={discard}
            players={[
              { id: "me", name: me.name, colour: "#e74c3c", board: asStored(myBoard) },
              { id: "them", name: "Damond", colour: "#3498db", board: asStored(theirBoard) },
            ]}
            onClose={() => setWizardOpen(false)}
            onReady={(play, label) => {
              if (!picked) return;
              setPending({ kind: "effect", card: picked, play, label });
            }}
          />

          <MonsterTapDialog
            target={tapTarget}
            youId="me"
            players={[
              { id: "me", name: me.name, colour: "#e74c3c", board: asStored(myBoard) },
              { id: "them", name: "Damond", colour: "#3498db", board: asStored(theirBoard) },
            ]}
            onClose={() => setTapTarget(null)}
            onReady={(play, label) => {
              if (!tapTarget) return;
              setPending({ kind: "effect", card: tapTarget.card, play, label });
              setTapTarget(null);
            }}
          />

          <TargetPicker
            open={pickerOpen}
            card={picked}
            youId="me"
            players={[
              { id: "me", name: me.name, colour: "#e74c3c", board: asStored(myBoard) },
              { id: "them", name: "Damond", colour: "#3498db", board: asStored(theirBoard) },
            ]}
            onClose={() => setPickerOpen(false)}
            onChooseCard={stageCard}
            onChoosePlayer={(targetPlayerId) => {
              if (!picked) return;
              setPending({
                kind: "play",
                card: picked,
                zone: "in-play",
                targetPlayerId,
              });
            }}
          />

          <Stack direction="row" spacing={1}>
            {(["me", "them"] as const).map((who) => (
              <ToggleButton
                key={who}
                value={who}
                selected={viewing === who}
                onChange={() => {
                  setViewing(who);
                  setAimedAt(null);
                }}
                size="small"
              >
                {who === "me" ? "Your mat" : "Damond's mat"}
              </ToggleButton>
            ))}
          </Stack>

          <Box id="my-mat" sx={{ overflowX: "auto", pb: 1 }}>
            <PlayMat
              board={viewing === "me" ? myBoard : theirBoard}
              name={viewing === "me" ? me.name : "Damond"}
              colour={viewing === "me" ? "#e74c3c" : "#3498db"}
              playerId={viewedId}
              cardWidth={64}
              armed={Boolean(picked)}
              aimAtCards={picked?.type === "powerup" || (!picked && viewing === "me")}
              aimedAt={aimedAt}
              onZoneChoose={(zone) => stageZone(zone)}
              onZoneDropCard={(zone, card) => stageZone(zone, card)}
              onCardChoose={stageCard}
            />
          </Box>
        </Stack>

        <PendingActionBar
          action={pending}
          description={pending ? describeAction(pending, nameOf, "me") : ""}
          onUndo={() => {
            setPending(null);
            setAimedAt(null);
          }}
          onConfirm={confirm}
        />

        <BrandHomeLink sx={{ color: TABLE.cyan }} />
      </Stack>
    </Container>
  );
}
