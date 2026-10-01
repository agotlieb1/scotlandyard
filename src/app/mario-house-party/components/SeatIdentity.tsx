"use client";

import { useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";

import { TABLE } from "../theme";

export type SeatColour = { key: string; primary: string; name: string };

/**
 * Who you are at this table. A seat arrives called "Player 3" in whatever
 * colour was free, and this is where that gets fixed — it stays open until a
 * name has been chosen, then folds away to a line you can tap.
 */
export function SeatIdentity({
  name,
  colourKey,
  colours,
  takenColours,
  saving,
  onSave,
}: {
  name: string;
  colourKey: string;
  colours: SeatColour[];
  takenColours: string[];
  saving?: boolean;
  onSave: (name: string, colourKey: string) => void;
}) {
  const unnamed = /^Player \d+$/.test(name.trim()) || name.trim() === "";
  const [open, setOpen] = useState(unnamed);
  const [draftName, setDraftName] = useState(name);
  const [draftColour, setDraftColour] = useState(colourKey);

  const current = colours.find((c) => c.key === draftColour) ?? colours[0];

  if (!open) {
    return (
      <Paper sx={{ px: 2, py: 1.25 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              bgcolor: current.primary,
              boxShadow: `0 0 10px ${current.primary}`,
              flexShrink: 0,
            }}
          />
          <Typography sx={{ flex: 1, fontWeight: 600 }}>{name}</Typography>
          <Button size="small" onClick={() => setOpen(true)}>
            Change
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, borderColor: `${TABLE.brass}66` }}>
      <Stack spacing={2}>
        <Typography variant="overline" sx={{ color: TABLE.brass }}>
          Your seat
        </Typography>
        <TextField
          label="Your name"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value.slice(0, 24))}
          size="small"
          fullWidth
          autoComplete="off"
        />
        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Your colour
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {colours.map((colour) => {
              const taken =
                takenColours.includes(colour.key) && colour.key !== colourKey;
              const chosen = colour.key === draftColour;
              return (
                <Box
                  key={colour.key}
                  component="button"
                  type="button"
                  aria-label={colour.name}
                  aria-pressed={chosen}
                  disabled={taken}
                  onClick={() => setDraftColour(colour.key)}
                  sx={{
                    width: 40,
                    height: 40,
                    p: 0,
                    borderRadius: "50%",
                    bgcolor: colour.primary,
                    cursor: taken ? "not-allowed" : "pointer",
                    opacity: taken ? 0.25 : 1,
                    border: chosen
                      ? `3px solid ${TABLE.cream}`
                      : "2px solid rgba(0,0,0,0.4)",
                    boxShadow: chosen ? `0 0 14px ${colour.primary}` : "none",
                    transition: "transform 120ms ease",
                    "&:active": { transform: "scale(0.94)" },
                  }}
                />
              );
            })}
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            disabled={saving || draftName.trim().length === 0}
            onClick={() => {
              onSave(draftName.trim(), draftColour);
              setOpen(false);
            }}
          >
            {saving ? "Saving…" : "That's me"}
          </Button>
          {!unnamed && (
            <Button onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
