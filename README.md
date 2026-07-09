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
# scotlandyard
