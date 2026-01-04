"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Checkbox,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ALIAS_COLORS, LOCATIONS, MOTIVES, WEAPONS } from "@/lib/investigation-data";
import { normalizeInvestigationCode } from "@/lib/investigation-code";
import { fetchPlayers, upsertPlayer } from "@/lib/investigations";
import { formatAlias } from "@/lib/alias";
import { getPlayerId } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { EvidenceItem, InvestigationPlayer } from "@/lib/types";

const buildChecked = (items: EvidenceItem[] | null, type: EvidenceItem["type"]) =>
  items?.filter((item) => item.type === type).map((item) => item.value) ?? [];

export default function NotebookPage() {
  const router = useRouter();
  const params = useParams<{ code?: string }>();
  const code = useMemo(
    () =>
      normalizeInvestigationCode(
        Array.isArray(params.code) ? params.code[0] ?? "" : params.code ?? ""
      ),
    [params.code]
  );
  const playerId = useMemo(() => getPlayerId(), []);
  const [player, setPlayer] = useState<InvestigationPlayer | null>(null);
  const [players, setPlayers] = useState<InvestigationPlayer[]>([]);
  const [checkedAliases, setCheckedAliases] = useState<string[]>([]);
  const [checkedWeapons, setCheckedWeapons] = useState<string[]>([]);
  const [checkedLocations, setCheckedLocations] = useState<string[]>([]);
  const [checkedMotives, setCheckedMotives] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!code) {
        setStatus("Missing investigation code.");
        return;
      }
      const playerResult = await upsertPlayer(code, playerId);
      if (!isActive) {
        return;
      }
      if ("error" in playerResult) {
        setStatus(playerResult.error);
        return;
      }

      setPlayer(playerResult.data);
      setCheckedAliases(buildChecked(playerResult.data.evidence, "alias"));
      setCheckedWeapons(buildChecked(playerResult.data.evidence, "weapon"));
      setCheckedLocations(buildChecked(playerResult.data.evidence, "location"));
      setCheckedMotives(buildChecked(playerResult.data.evidence, "motive"));

      const playersResult = await fetchPlayers(code);
      if (!isActive) {
        return;
      }
      if ("error" in playersResult) {
        setStatus(playersResult.error);
        return;
      }
      setPlayers(playersResult.data);
    };

    load();

    return () => {
      isActive = false;
    };
  }, [code, playerId]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !code) {
      return;
    }

    const channel = supabase
      .channel(`players:${code}:notebook`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "investigation_players",
          filter: `investigation_code=eq.${code}`,
        },
        (payload) => {
          const next = payload.new as InvestigationPlayer | null;
          if (!next) {
            return;
          }
          setPlayers((prev) => {
            const filtered = prev.filter((entry) => entry.id !== next.id);
            return [...filtered, next];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  const aliasOptions = useMemo(() => {
    const order = new Map(ALIAS_COLORS.map((color, index) => [color, index]));
    return players
      .filter(
        (entry) =>
          entry.alias_locked && entry.alias_title && entry.alias_color
      )
      .map((entry) => ({
        label: formatAlias(entry.alias_title, entry.alias_color),
        color: entry.alias_color as string,
      }))
      .sort(
        (a, b) =>
          (order.get(a.color) ?? 99) - (order.get(b.color) ?? 99)
      )
      .map((entry) => entry.label);
  }, [players]);

  const toggleItem = (
    value: string,
    checked: string[],
    setChecked: (next: string[]) => void
  ) => {
    if (checked.includes(value)) {
      setChecked(checked.filter((item) => item !== value));
      return;
    }
    setChecked([...checked, value]);
  };

  if (!getSupabaseClient()) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="info">
          Supabase is not configured. Add your env vars to continue.
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 6, md: 10 },
        backgroundImage:
          "linear-gradient(135deg, #f6f1ea 0%, #efe5d6 45%, #e9dfce 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              The Notebook
            </Typography>
            <Typography variant="h3" component="h1">
              Track your clues
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your submitted evidence is already checked. Mark additional clues
              as you learn them.
            </Typography>
          </Stack>

          {status && <Alert severity="warning">{status}</Alert>}
          {!player?.evidence?.length && (
            <Alert severity="info">
              Submit your evidence first to auto-check your clues.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="h6">Aliases</Typography>
                  {aliasOptions.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Aliases appear once they are locked in The Murder.
                    </Typography>
                  )}
                  {aliasOptions.map((alias) => (
                    <FormControlLabel
                      key={alias}
                      control={
                        <Checkbox
                          checked={checkedAliases.includes(alias)}
                          onChange={() =>
                            toggleItem(alias, checkedAliases, setCheckedAliases)
                          }
                        />
                      }
                      label={alias}
                    />
                  ))}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="h6">Weapons</Typography>
                  {WEAPONS.map((weapon) => (
                    <FormControlLabel
                      key={weapon}
                      control={
                        <Checkbox
                          checked={checkedWeapons.includes(weapon)}
                          onChange={() =>
                            toggleItem(
                              weapon,
                              checkedWeapons,
                              setCheckedWeapons
                            )
                          }
                        />
                      }
                      label={weapon}
                    />
                  ))}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="h6">Locations</Typography>
                  {LOCATIONS.map((location) => (
                    <FormControlLabel
                      key={location}
                      control={
                        <Checkbox
                          checked={checkedLocations.includes(location)}
                          onChange={() =>
                            toggleItem(
                              location,
                              checkedLocations,
                              setCheckedLocations
                            )
                          }
                        />
                      }
                      label={location}
                    />
                  ))}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="h6">Motives</Typography>
                  {MOTIVES.map((motive) => (
                    <FormControlLabel
                      key={motive}
                      control={
                        <Checkbox
                          checked={checkedMotives.includes(motive)}
                          onChange={() =>
                            toggleItem(
                              motive,
                              checkedMotives,
                              setCheckedMotives
                            )
                          }
                        />
                      }
                      label={motive}
                    />
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              onClick={() => router.push(`/investigation/${code}`)}
            >
              Back to overview
            </Button>
            <Button
              variant="text"
              onClick={() => router.push(`/investigation/${code}/murder`)}
            >
              Return to The Murder
            </Button>
            <Button
              variant="text"
              onClick={() => router.push(`/investigation/${code}/crime-computer`)}
            >
              Crime Computer
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
