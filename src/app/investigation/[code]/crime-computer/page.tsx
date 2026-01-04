"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ALIAS_COLORS,
  IDENTITIES,
  LOCATIONS,
  MOTIVES,
  WEAPONS,
} from "@/lib/investigation-data";
import { normalizeInvestigationCode } from "@/lib/investigation-code";
import {
  createAccusation,
  fetchAccusations,
  fetchCaseFile,
  fetchPlayers,
  upsertPlayer,
} from "@/lib/investigations";
import { getPlayerId } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatAlias } from "@/lib/alias";
import type {
  InvestigationAccusation,
  InvestigationCaseFile,
  InvestigationPlayer,
} from "@/lib/types";

export default function CrimeComputerPage() {
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
  const [players, setPlayers] = useState<InvestigationPlayer[]>([]);
  const [caseFile, setCaseFile] = useState<InvestigationCaseFile | null>(null);
  const [announcements, setAnnouncements] = useState<InvestigationAccusation[]>(
    []
  );
  const [aliasChoice, setAliasChoice] = useState("");
  const [identityChoice, setIdentityChoice] = useState("");
  const [weaponChoice, setWeaponChoice] = useState("");
  const [locationChoice, setLocationChoice] = useState("");
  const [motiveChoice, setMotiveChoice] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMurdererAccusation = identityChoice === "The Murderer";
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

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!code) {
        setStatus("Missing investigation code.");
        return;
      }

      const playerResult = await upsertPlayer(code, playerId);
      if (isActive && "error" in playerResult) {
        setStatus(playerResult.error);
        return;
      }

      const playersResult = await fetchPlayers(code);
      if (isActive) {
        if ("error" in playersResult) {
          setStatus(playersResult.error);
        } else {
          setPlayers(playersResult.data);
        }
      }

      const caseResult = await fetchCaseFile(code);
      if (isActive && "data" in caseResult) {
        setCaseFile(caseResult.data);
      }

      const accusationsResult = await fetchAccusations(code, 6);
      if (isActive) {
        if ("error" in accusationsResult) {
          setStatus(accusationsResult.error);
        } else {
          setAnnouncements(accusationsResult.data);
        }
      }
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

    const accusationsChannel = supabase
      .channel(`accusations:${code}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "investigation_accusations",
          filter: `investigation_code=eq.${code}`,
        },
        (payload) => {
          const next = payload.new as InvestigationAccusation | null;
          if (!next) {
            return;
          }
          setAnnouncements((prev) => [next, ...prev].slice(0, 6));
        }
      )
      .subscribe();

    const playersChannel = supabase
      .channel(`players:${code}:accusations`)
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

    const caseFileChannel = supabase
      .channel(`case-file:${code}:accusations`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "investigation_case_files",
          filter: `investigation_code=eq.${code}`,
        },
        (payload) => {
          const next = payload.new as InvestigationCaseFile | null;
          if (!next) {
            return;
          }
          setCaseFile(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(accusationsChannel);
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(caseFileChannel);
    };
  }, [code]);

  const handleAccuse = async () => {
    if (!code) {
      return;
    }
    if (!aliasChoice || !identityChoice) {
      setStatus("Select an identity and an alias.");
      return;
    }

    setStatus(null);
    setIsSubmitting(true);

    let isCorrect = false;
    let message = "Scotland Yard reports the accusation is incorrect.";

    if (identityChoice === "The Murderer") {
      if (!caseFile) {
        setIsSubmitting(false);
        setStatus("The case file is not locked yet.");
        return;
      }
      if (!weaponChoice || !locationChoice || !motiveChoice) {
        setIsSubmitting(false);
        setStatus("Select weapon, location, and motive.");
        return;
      }
      isCorrect =
        caseFile.murderer_alias === aliasChoice &&
        caseFile.weapon === weaponChoice &&
        caseFile.location === locationChoice &&
        caseFile.motive === motiveChoice;
      message = isCorrect
        ? `Scotland Yard confirms the murderer: ${aliasChoice}. Case closed.`
        : "Scotland Yard reports the accusation is incorrect.";
    } else {
      const accused = players.find(
        (entry) =>
          entry.alias_locked &&
          formatAlias(entry.alias_title, entry.alias_color) === aliasChoice
      );
      isCorrect = Boolean(accused && accused.identity === identityChoice);
      message = isCorrect
        ? `Scotland Yard confirms ${aliasChoice} has been EXPOSED as the ${identityChoice}.`
        : "Scotland Yard reports the accusation is incorrect.";
    }

    const result = await createAccusation(code, {
      accuser_player_id: playerId,
      accused_alias: aliasChoice,
      accused_identity: identityChoice,
      weapon: weaponChoice || null,
      location: locationChoice || null,
      motive: motiveChoice || null,
      is_correct: isCorrect,
      message,
    });

    setIsSubmitting(false);

    if ("error" in result) {
      setStatus(result.error);
      return;
    }

    setStatus(null);
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
              Crime Computer
            </Typography>
            <Typography variant="h3" component="h1">
              Call Scotland Yard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Make an accusation. If it is correct, Scotland Yard will announce
              the exposure to everyone in the investigation.
            </Typography>
          </Stack>

          {status && <Alert severity="warning">{status}</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Accusation</Typography>
                  <FormControl fullWidth>
                    <InputLabel id="identity-label">Secret identity</InputLabel>
                    <Select
                      labelId="identity-label"
                      label="Secret identity"
                      value={identityChoice}
                      onChange={(event) =>
                        setIdentityChoice(event.target.value)
                      }
                    >
                      {IDENTITIES.map((identity) => (
                        <MenuItem key={identity} value={identity}>
                          {identity}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="alias-label">Alias</InputLabel>
                    <Select
                      labelId="alias-label"
                      label="Alias"
                      value={aliasChoice}
                      onChange={(event) => setAliasChoice(event.target.value)}
                    >
                      {aliasOptions.map((alias) => (
                        <MenuItem key={alias} value={alias}>
                          {alias}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Aliases appear once they are locked in The Murder.
                    </FormHelperText>
                  </FormControl>

                  {isMurdererAccusation && (
                    <Stack spacing={2}>
                      <FormHelperText>
                        Murderer accusations require the full case file.
                      </FormHelperText>
                      <FormControl fullWidth>
                        <InputLabel id="weapon-label">Weapon</InputLabel>
                        <Select
                          labelId="weapon-label"
                          label="Weapon"
                          value={weaponChoice}
                          onChange={(event) =>
                            setWeaponChoice(event.target.value)
                          }
                        >
                          {WEAPONS.map((weapon) => (
                            <MenuItem key={weapon} value={weapon}>
                              {weapon}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel id="location-label">Location</InputLabel>
                        <Select
                          labelId="location-label"
                          label="Location"
                          value={locationChoice}
                          onChange={(event) =>
                            setLocationChoice(event.target.value)
                          }
                        >
                          {LOCATIONS.map((location) => (
                            <MenuItem key={location} value={location}>
                              {location}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel id="motive-label">Motive</InputLabel>
                        <Select
                          labelId="motive-label"
                          label="Motive"
                          value={motiveChoice}
                          onChange={(event) =>
                            setMotiveChoice(event.target.value)
                          }
                        >
                          {MOTIVES.map((motive) => (
                            <MenuItem key={motive} value={motive}>
                              {motive}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  )}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button
                      variant="contained"
                      onClick={handleAccuse}
                      disabled={isSubmitting}
                    >
                      Submit accusation
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => router.push(`/investigation/${code}`)}
                    >
                      Back to overview
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Scotland Yard log</Typography>
                  {announcements.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No accusations yet.
                    </Typography>
                  )}
                  {announcements.map((announcement) => (
                    <Paper
                      key={announcement.id}
                      variant="outlined"
                      sx={{ p: 2, bgcolor: announcement.is_correct ? "action.hover" : "transparent" }}
                    >
                      <Typography variant="body2">
                        {announcement.message}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
