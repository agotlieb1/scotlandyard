# Scotland Yard Companion

Web companion for a murder mystery night: start an investigation, set up The Murder, and keep clues synced in realtime.

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

- `src/app` Next.js App Router pages
- `src/lib` Supabase helpers, investigation utilities, and game data

## MVP flow

1. Start an investigation and share the code.
2. The Murder: lock an alias, confirm identity, submit evidence.
3. The Notebook: track clues with auto-checked evidence.
4. Crime Computer: call Scotland Yard with an accusation.

## Routes

- `/` Join or start an investigation.
- `/setup` Generate a new investigation code.
- `/investigation/[code]` Investigation overview.
- `/investigation/[code]/murder` The Murder setup.
- `/investigation/[code]/notebook` The Notebook.
- `/investigation/[code]/crime-computer` Crime Computer.
- `/down4` Join or start a Down4 crew.
- `/down4/[code]` The crew's permanent Down4 board.

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
