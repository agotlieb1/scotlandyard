# Count Mittens Games

The site hosts three small projects, each with its own look, behind one home
page:

- **Scotland Yard** — a companion for a murder mystery night: start an
  investigation, set up The Murder, and keep clues synced in realtime.
- **Mario House Party** — the scoreboard for the card game: a drag-and-drop
  score calculator and the full card reference.
- **Down4** — a permanent board for a friend group: light a beacon for whatever
  you are up for and see who else is down.

`/` is the Count Mittens Games home and the only crossroads between them. Each
project links back up to it; neither links directly to the other.

## Getting started

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the `sb_publishable_…` key; the legacy
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` still works as a fallback)

Run the dev server:

```bash
npm run dev
```

## Supabase setup

Run the SQL in `supabase/schema.sql` in your Supabase project. This creates:

- `investigations` for investigation codes
- `investigation_players` for aliases, identities, and evidence
- `investigation_case_files` for the locked case file
- `investigation_accusations` for Scotland Yard announcements

Then run the SQL in `supabase/down4-schema.sql` for the Down4 board:

- `down4_crews` for permanent crew codes
- `down4_beacons` for one plan each: the activity, the area, and when it expires
- `down4_members` for each friend's name and the beacon they are currently on

It is safe to re-run, and it upgrades the first version of the Down4 tables in
place.

And the SQL in `supabase/mario-schema.sql` for Mario House Party's online game:

- `mario_games` for game codes and status
- `mario_game_players` for each seat's hand and house boards
- `mario_game_state` for the deck, the turn, and the actions spent on it

The score calculator and card reference need none of this — they run entirely
in the browser.

The SQL enables open RLS policies for MVP testing. Tighten these before shipping.

## Deploy to Vercel

Vercel auto-detects Next.js, so no extra config is needed. Before the first
deploy, add both env vars in **Project Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

These are `NEXT_PUBLIC_*` values, so they are inlined at build time — set them
before deploying (or redeploy after adding them). Without them the app still
builds and runs, but every page shows a "Supabase is not configured" notice.

## Project layout

- `src/app/(home)` the Count Mittens Games home page, with its own theme
- `src/app/(scotland-yard)` the investigation pages (route group; the group name
  is not part of the URL)
- `src/app/mario-house-party` the Mario House Party pages
- `src/app/down4` the Down4 pages
- `src/lib` Supabase helpers, investigation utilities, and game data

- `public/brand` the Count Mittens crest and emblem

Each product nests its own MUI theme inside the root providers, so the three
looks never leak into each other. The root providers sit inside MUI's
`AppRouterCacheProvider`, which keeps emotion's style tags in the same order on
the server and the client — without it every page hydrates with a mismatch.

## Brand art

Two marks, cut out of the source artwork for different jobs:

- `public/brand/count-mittens-crest.webp` — the full crest, with the paper
  behind it removed, so it hangs on the home page's dark background as art.
- `public/brand/count-mittens-emblem.webp` — the round emblem, which keeps its
  own pale disc and so stays legible on any background. It is the mark on the
  "Count Mittens Games" link back from either product, and the source for
  `src/app/favicon.ico` and `src/app/apple-icon.png`.

## MVP flow

1. Start an investigation and share the code.
2. The Murder: lock an alias, confirm identity, submit evidence.
3. The Notebook: track clues with auto-checked evidence.
4. Crime Computer: call Scotland Yard with an accusation.

## Routes

- `/` Count Mittens Games home: pick a project.
- `/scotland-yard` Join or start an investigation.
- `/setup` Generate a new investigation code.
- `/investigation/[code]` Investigation overview.
- `/investigation/[code]/murder` The Murder setup.
- `/investigation/[code]/notebook` The Notebook.
- `/investigation/[code]/crime-computer` Crime Computer.
- `/mario-house-party` Mario House Party home.
- `/mario-house-party/scoring` Score calculator.
- `/mario-house-party/cards` Card reference.
- `/down4` Join or start a Down4 crew.
- `/down4/[code]` The crew's permanent Down4 board.

## Mario House Party

A companion for the physical card game: tap or drag cards into a scoring zone
and it totals collectables, heroes, monsters and trophies, with a card
reference alongside. The card art lives in `public/cards/` — 73 WebP files
across five folders, listed exactly in `public/cards/README.md`. Any card whose
image is missing falls back to a drawn card with its name and value, so the
calculator still works if one is absent.

The pages are dressed as a card table — felt, a dark rail, brass on the
fittings — through a theme nested in `mario-house-party/layout.tsx`, the same
way Down4 nests its own. Cards carry a printed white edge and a real shadow, so
they sit on the felt rather than in boxes.

**On a phone, tapping is the gesture.** Tap a card to deal it in, tap it again
to take it back. Dragging also works, after a short press: the sensors are
split so a mouse drags on an 8px move while a finger needs to hold still for
180ms first, which leaves quick taps and scroll swipes alone. A single
PointerSensor could not drag on touch at all — the browser claimed the gesture
before dnd-kit saw it. Even fixed, dragging is awkward on a small screen, since
the palette and the hand cannot both be on screen, so a rail pinned to the
bottom carries the card count and running total (the current player's name in
Full Game mode, where scores stay hidden) with a button that jumps to the hand.

### The play mat and the table

`/mario-house-party/table-preview` shows the mat layout with cards dealt onto
it and no database behind it, so it can be opened on any screen to judge the
size of things.

A mat is three rows, the way the game is played at the table: a temporary slot
on top (a Piranha Plant, a Star, a mini-game), heroes in Mario / Mushroom /
Kong / Koopa order, then collectables in that same order with a wider monster
pen under Koopa. Cards in a zone stack like solitaire — each covers the one
below but leaves its top edge showing — and a tally on the corner gives the
true count when a pile runs deeper than the four cards that peek.

`TableView` puts every mat on the shared screen at once, seen from above, each
one turned so the top of the mat faces the middle. Seats are spaced by
distance round an ellipse rather than by angle: equal angles bunch seats at
the ends of the short axis, which is where mats used to collide. Seating round
the corners rather than along the sides is the roomier choice at two and four
players (clearance to the rail goes from -6px to +27px, and from +9px to
+33px) and the poorer one at six (+56px to +40px), so it defaults per seat
count. Measured on a 16:10 screen at 1600px wide, nothing overlaps at any seat
count from two to six.

`toMatBoard` turns a stored `PlayerBoard` into what the mat wants. The stored
board carries `inPlay` for the temporary row; boards saved before it simply
have no such key and read as an empty row, so there is nothing to migrate.

**The live board uses both.** A device that created the game (its
`display_device_id`) is the shared screen and shows `TableView`; everyone
else sees their own mat and their own hand.

On a phone a player can:

- **say who they are** — a seat arrives called "Player 3" in whatever colour
  was free, and `SeatIdentity` is where that gets fixed. It stays open until a
  name is chosen, then folds to a line. Colours already taken are shown
  disabled.
- **look at anyone's mat** — a strip of players above the mat switches whose
  board is on screen.
- **play at someone else** — a monster into their Koopa pen, a Piranha Plant
  into their temporary row. `playCardOnPlayer` writes their board first and
  your hand second, so a failure half way leaves the card in your hand rather
  than nowhere.
- **aim a power-up at a card**, either way round. While a power-up is held,
  the cards on the mat become targets — only a power-up does this, or a pile
  of cards would swallow every tap meant for the zone underneath it. But a
  card buried in a stack only shows its peeking strip, so **Choose a target
  from a list** does the same job in words: pick a player, then pick a card by
  name and where it sits ("Mario — Marios heroes"), or "their mat, no
  particular card" to play it into their In play row. Choosing from the list
  switches the view to that player's mat, so the aim is visible as well as
  written down.
- **think again** — nothing is written until Confirm. Every play, steal and
  aim is staged in `PendingActionBar`, which reads the action back in words
  ("Play Mario into Damond's Koopas", "Use Fire Flower on Damond's
  DiddyKong") with Undo beside it.

A confirmed aim puts the power-up in the target's temporary row, so the table
can see what was played at whom. What it then *does* — Fireball discarding its
target, Ice Flower freezing one — is resolved at the table, not in the app. Playing a card is: tap it in your
hand to pick it up, which lifts the card, lights every zone on the mat and
scrolls the mat into view, then tap a zone to put it down. Dragging still
works on a desktop — a zone reads the card off the drag event. This replaced
an HTML5 drag that could not work on a phone at all, which is to say the game
could not be played on a phone before. `components/PlayerBoard.tsx` is what
the mat replaced and is no longer used by anything.

Online play lives at `/mario-house-party/play/setup` (create or join a game by
code) and `/mario-house-party/play/[code]` (the board). A turn is three
actions — play, tap, steal — with one steal per turn and only while you hold
fewer than five cards; ending a turn refills your hand to five, and when the
deck runs out the game moves to its final rounds. `/mario-house-party/diagnostic`
dumps a game's raw rows when something looks wrong.

The game logic sits in `src/lib/mario-*.ts`: `mario-types` (row shapes),
`mario-games` (reads and writes), `mario-deck-builder` (deck composition, which
scales with player count — 62 cards for two players, 90 for four),
`mario-game-rules` (turn and action rules), `mario-game-start` (deal and open
the game) and `mario-game-actions` (play, steal, end turn).

Run the SQL in `supabase/mario-schema.sql` for the three tables it needs:

- `mario_games` for the game code, status and start time
- `mario_game_players` for each seat: hand and the four house boards
- `mario_game_state` for the deck, whose turn it is, and the actions spent

It is safe to re-run, and it enables realtime on all three tables so every seat
sees a card the moment it is played.

## Down4

Down4 is a parallel app on the same site, with its own look. A crew code works
like an investigation code, but the board never ends: bookmark `/down4/[code]`
and come back whenever.

1. Start a crew (or join one with its code) and share the link.
2. Add your name. The device remembers you.
3. Light a beacon: what you are down for, optionally an area, optionally a time
   it runs until.
4. Anyone can hit **Me too!** to step onto someone else's beacon.

### Install a crew as an app

Each crew page serves its own web app manifest at
`/down4/[code]/manifest.webmanifest`, so installing from a crew page pins that
crew: the icon opens straight back to it and carries the crew's name. On Chrome,
Edge and Android an **Install** button appears in the header when the browser
offers one; on iOS use Share → Add to Home Screen.

A service worker (`public/sw.js`) is registered with scope `/down4`, so it never
touches the investigation side of the site. Pages are network-first and cached
only as an offline fallback, so a board is never served stale while the network
is up, and Supabase requests are never intercepted. Opened without a connection,
the board says so instead of failing.

A crew with a beacon lit right now glows in "Your crews" on `/down4` and in the
switcher, with a count, and sorts to the top — so you can tell at a glance which
board is worth opening.

The crew code at the top of the board is a switcher: it lists every crew this
device has joined, so you can hop between them without hunting for links. The
same list appears on `/down4`. A crew created without a name shows a **Name this
crew** button, and a named one can be renamed from the header. The board also
lists everyone in the crew at the bottom, with whoever is currently lit
highlighted.

A beacon reads as a sentence, and blank parts are simply left out:

```
Aaron is down4 coffee around Decatur until 3pm.
Aaron is down4 coffee around Decatur.
Aaron is down4 coffee until 3pm.
Aaron and Damond are down4 bowling at Cosmic Lanes.
```

Every beacon says how to join in, and that choice picks the preposition:

- **Just show up** — already there, so the area is somewhere you can walk into
  and the sentence reads "**at** Cosmic Lanes".
- **Text 2 Plan** — up for it but not out yet, so the area is a general one
  and it reads "**around** Decatur".

Only lit beacons are listed — someone with their beacon off is not shown at all.
A beacon with an `until` time drops off the board on its own once that time
passes; one without runs until its owner turns it off. When the last person
steps off a beacon it is deleted.
# scotlandyard
