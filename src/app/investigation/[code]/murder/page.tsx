"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Checkbox,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ALIAS_COLORS,
  ALIAS_TITLES,
  IDENTITIES,
  LOCATIONS,
  MOTIVES,
  WEAPONS,
} from "@/lib/investigation-data";
import { formatAlias } from "@/lib/alias";
import { normalizeInvestigationCode } from "@/lib/investigation-code";
import {
  fetchPlayers,
  lockAlias,
  submitEvidence,
  updateIdentity,
  upsertCaseFile,
  upsertPlayer,
} from "@/lib/investigations";
import { getPlayerId } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { EvidenceItem, InvestigationPlayer } from "@/lib/types";

type EvidenceChoice = EvidenceItem & { key: string };

const buildKey = (item: EvidenceItem) => `${item.type}:${item.value}`;

export default function MurderSetupPage() {
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
  const [player, setPlayer] = useState<InvestigationPlayer | null>(null);
  const [aliasTitle, setAliasTitle] = useState("");
  const [aliasColor, setAliasColor] = useState("");
  const [identityChoice, setIdentityChoice] = useState("");
  const [murderWeapon, setMurderWeapon] = useState("");
  const [murderLocation, setMurderLocation] = useState("");
  const [murderMotive, setMurderMotive] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceChoice[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!code) {
        setStatus("Missing investigation code.");
        return;
      }

      const playerResult = await upsertPlayer(code, playerId);
      if (isActive) {
        if ("error" in playerResult) {
          setStatus(playerResult.error);
        } else {
          setPlayer(playerResult.data);
        }
      }

      const playersResult = await fetchPlayers(code);
      if (isActive) {
        if ("error" in playersResult) {
          setStatus(playersResult.error);
        } else {
          setPlayers(playersResult.data);
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [code, playerId]);

  useEffect(() => {
    if (!player || initializedRef.current) {
      return;
    }

    if (player.alias_title) {
      setAliasTitle(player.alias_title);
    }
    if (player.alias_color) {
      setAliasColor(player.alias_color);
    }
    if (player.identity) {
      setIdentityChoice(player.identity);
    }

    if (player.evidence?.length) {
      const evidenceChoices = player.evidence.map((item) => ({
        ...item,
        key: buildKey(item),
      }));
      setSelectedEvidence(evidenceChoices);

      const murdererEvidence = player.evidence.reduce(
        (acc, item) => {
          if (item.type === "weapon") {
            acc.weapon = item.value;
          }
          if (item.type === "location") {
            acc.location = item.value;
          }
          if (item.type === "motive") {
            acc.motive = item.value;
          }
          return acc;
        },
        { weapon: "", location: "", motive: "" }
      );
      setMurderWeapon(murdererEvidence.weapon);
      setMurderLocation(murdererEvidence.location);
      setMurderMotive(murdererEvidence.motive);
    }

    initializedRef.current = true;
  }, [player]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !code) {
      return;
    }

    const channel = supabase
      .channel(`players:${code}`)
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
            const filtered = prev.filter((item) => item.id !== next.id);
            return [...filtered, next];
          });
          if (next.player_id === playerId) {
            setPlayer(next);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, playerId]);

  const takenColors = useMemo(() => {
    return new Set(
      players
        .filter((entry) => entry.alias_color && entry.alias_locked)
        .map((entry) => entry.alias_color as string)
    );
  }, [players]);

  const availableColors = useMemo(
    () =>
      ALIAS_COLORS.filter(
        (color) => !takenColors.has(color) || color === player?.alias_color
      ),
    [player?.alias_color, takenColors]
  );

  const evidenceLocked = Boolean(player?.evidence?.length);
  const usedEvidence = useMemo(() => {
    const used = new Set<string>();
    players.forEach((entry) => {
      if (entry.player_id === playerId) {
        return;
      }
      entry.evidence?.forEach((item) => {
        used.add(buildKey(item));
      });
    });
    return used;
  }, [players, playerId]);

  const lockedIdentity = player?.identity ?? "";
  const isMurderer =
    lockedIdentity === "The Murderer" || identityChoice === "The Murderer";

  const handleAliasLock = async () => {
    if (!aliasTitle || !aliasColor) {
      setStatus("Pick a title and color before locking it in.");
      return;
    }
    if (!code) {
      return;
    }

    setStatus(null);
    setIsSaving(true);
    const result = await lockAlias(code, playerId, aliasTitle, aliasColor);
    setIsSaving(false);

    if ("error" in result) {
      if (result.code === "23505") {
        setStatus("That color is already taken.");
      } else {
        setStatus(result.error);
      }
      return;
    }

    setPlayer((prev) =>
      prev
        ? {
            ...prev,
            alias_title: aliasTitle,
            alias_color: aliasColor,
            alias_locked: true,
          }
        : prev
    );
  };

  const handleIdentityLock = async () => {
    if (!identityChoice) {
      setStatus("Pick a secret identity before locking it in.");
      return;
    }
    if (!code) {
      return;
    }

    setStatus(null);
    setIsSaving(true);
    const result = await updateIdentity(code, playerId, identityChoice);
    setIsSaving(false);

    if ("error" in result) {
      if (result.code === "23505") {
        setStatus("That identity is already taken.");
      } else {
        setStatus(result.error);
      }
      return;
    }

    setPlayer((prev) =>
      prev
        ? { ...prev, identity: identityChoice, is_murderer: isMurderer }
        : prev
    );
  };

  const toggleEvidence = (item: EvidenceItem) => {
    if (evidenceLocked) {
      return;
    }
    const key = buildKey(item);
    setSelectedEvidence((prev) => {
      const exists = prev.find((entry) => entry.key === key);
      if (exists) {
        return prev.filter((entry) => entry.key !== key);
      }
      const withoutType = prev.filter((entry) => entry.type !== item.type);
      return [...withoutType, { ...item, key }];
    });
  };

  const handleSubmitEvidence = async () => {
    if (!code) {
      return;
    }
    if (evidenceLocked) {
      setStatus("Initial evidence is already locked.");
      return;
    }
    const aliasText = formatAlias(player?.alias_title, player?.alias_color);
    if (!player?.alias_locked || !aliasText) {
      setStatus("Lock your alias first.");
      return;
    }
    if (!player?.identity) {
      setStatus("Lock your identity first.");
      return;
    }

    setStatus(null);
    setIsSaving(true);

    if (player.identity === "The Murderer") {
      if (!murderWeapon || !murderLocation || !murderMotive) {
        setIsSaving(false);
        setStatus("Select a weapon, location, and motive.");
        return;
      }

      const evidence: EvidenceItem[] = [
        { type: "alias", value: aliasText },
        { type: "weapon", value: murderWeapon },
        { type: "location", value: murderLocation },
        { type: "motive", value: murderMotive },
      ];
      const hasDuplicates = evidence.some((item) =>
        usedEvidence.has(buildKey(item))
      );
      if (hasDuplicates) {
        setIsSaving(false);
        setStatus(
          "Double check your cards, it looks like there's been an error."
        );
        return;
      }

      const evidenceResult = await submitEvidence(code, playerId, evidence);
      if ("error" in evidenceResult) {
        setIsSaving(false);
        setStatus(evidenceResult.error);
        return;
      }

      const caseResult = await upsertCaseFile(code, {
        murderer_alias: aliasText,
        weapon: murderWeapon,
        location: murderLocation,
        motive: murderMotive,
      });
      setIsSaving(false);

      if ("error" in caseResult) {
        setStatus(caseResult.error);
        return;
      }

      setPlayer((prev) => (prev ? { ...prev, evidence } : prev));
      router.push(`/investigation/${code}/notebook`);
      return;
    }

    if (selectedEvidence.length !== 3) {
      setIsSaving(false);
      setStatus("Select one weapon, one location, and one motive.");
      return;
    }

    const evidence = selectedEvidence.map(({ key, ...item }) => item);
    const evidenceTypes = new Set(evidence.map((item) => item.type));
    if (evidenceTypes.size !== 3) {
      setIsSaving(false);
      setStatus("Select one weapon, one location, and one motive.");
      return;
    }
    const hasDuplicates = evidence.some((item) =>
      usedEvidence.has(buildKey(item))
    );
    if (hasDuplicates) {
      setIsSaving(false);
      setStatus("Double check your cards, it looks like there's been an error.");
      return;
    }
    const evidenceResult = await submitEvidence(code, playerId, evidence);
    setIsSaving(false);

    if ("error" in evidenceResult) {
      setStatus(evidenceResult.error);
      return;
    }

    setPlayer((prev) => (prev ? { ...prev, evidence } : prev));
    router.push(`/investigation/${code}/notebook`);
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
        backgroundImage: "var(--map-bg)",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              The Murder
            </Typography>
            <Typography variant="h3" component="h1">
              Lock in your role
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Choose an alias, confirm your secret identity, and submit your
              evidence.
            </Typography>
          </Stack>

          {status && <Alert severity="warning">{status}</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Alias</Typography>
                  <FormControl fullWidth>
                    <InputLabel id="alias-title-label">Title</InputLabel>
                    <Select
                      labelId="alias-title-label"
                      label="Title"
                      value={aliasTitle}
                      onChange={(event) => setAliasTitle(event.target.value)}
                      disabled={player?.alias_locked}
                    >
                      {ALIAS_TITLES.map((title) => (
                        <MenuItem key={title} value={title}>
                          {title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="alias-color-label">Color</InputLabel>
                    <Select
                      labelId="alias-color-label"
                      label="Color"
                      value={aliasColor}
                      onChange={(event) => setAliasColor(event.target.value)}
                      disabled={player?.alias_locked}
                    >
                      {availableColors.map((color) => (
                        <MenuItem key={color} value={color}>
                          {color}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Colors are unique per investigation.
                    </FormHelperText>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleAliasLock}
                    disabled={player?.alias_locked || isSaving}
                  >
                    {player?.alias_locked ? "Alias locked" : "Lock alias"}
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Secret identity</Typography>
                  <FormControl fullWidth>
                    <InputLabel id="identity-label">Identity</InputLabel>
                    <Select
                      labelId="identity-label"
                      label="Identity"
                      value={identityChoice}
                      onChange={(event) =>
                        setIdentityChoice(event.target.value)
                      }
                      disabled={Boolean(player?.identity)}
                    >
                      {IDENTITIES.map((identity) => (
                        <MenuItem key={identity} value={identity}>
                          {identity}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Identities stay visible but must be unique.
                    </FormHelperText>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleIdentityLock}
                    disabled={isSaving || Boolean(player?.identity)}
                  >
                    {player?.identity ? "Identity locked" : "Lock identity"}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h6">Initial Evidence</Typography>
              {evidenceLocked && (
                <Typography variant="body2" color="text.secondary">
                  Initial evidence is locked. Continue in The Notebook.
                </Typography>
              )}
              {isMurderer ? (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Alias:{" "}
                    {formatAlias(player?.alias_title, player?.alias_color) ||
                      "Lock your alias first."}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel id="weapon-label">Weapon</InputLabel>
                        <Select
                          labelId="weapon-label"
                          label="Weapon"
                          value={murderWeapon}
                          onChange={(event) =>
                            setMurderWeapon(event.target.value)
                          }
                          disabled={evidenceLocked}
                        >
                          {WEAPONS.map((weapon) => (
                            <MenuItem key={weapon} value={weapon}>
                              {weapon}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel id="location-label">Location</InputLabel>
                        <Select
                          labelId="location-label"
                          label="Location"
                          value={murderLocation}
                          onChange={(event) =>
                            setMurderLocation(event.target.value)
                          }
                          disabled={evidenceLocked}
                        >
                          {LOCATIONS.map((location) => (
                            <MenuItem key={location} value={location}>
                              {location}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel id="motive-label">Motive</InputLabel>
                        <Select
                          labelId="motive-label"
                          label="Motive"
                          value={murderMotive}
                          onChange={(event) =>
                            setMurderMotive(event.target.value)
                          }
                          disabled={evidenceLocked}
                        >
                          {MOTIVES.map((motive) => (
                            <MenuItem key={motive} value={motive}>
                              {motive}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Select one item from each category.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Selected {selectedEvidence.length} / 3
                  </Typography>
                  <Grid container spacing={2}>
                    {[{ label: "Weapons", items: WEAPONS, type: "weapon" },
                      { label: "Locations", items: LOCATIONS, type: "location" },
                      { label: "Motives", items: MOTIVES, type: "motive" }].map(
                      (group) => (
                        <Grid item xs={12} md={4} key={group.label}>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2">
                              {group.label}
                            </Typography>
                            {group.items.map((item) => {
                              const key = buildKey({
                                type: group.type as EvidenceItem["type"],
                                value: item,
                              });
                              const checked = selectedEvidence.some(
                                (entry) => entry.key === key
                              );
                              return (
                                <FormControlLabel
                                  key={key}
                                  control={
                                    <Checkbox
                                      checked={checked}
                                      disabled={evidenceLocked}
                                      onChange={() =>
                                        toggleEvidence({
                                          type: group.type as EvidenceItem["type"],
                                          value: item,
                                        })
                                      }
                                    />
                                  }
                                  label={item}
                                />
                              );
                            })}
                          </Stack>
                        </Grid>
                      )
                    )}
                  </Grid>
                </Stack>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSubmitEvidence}
                  disabled={isSaving || evidenceLocked}
                >
                  Submit evidence
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  onClick={() => router.push(`/investigation/${code}/notebook`)}
                >
                  Open The Notebook
                </Button>
                <Button
                  variant="text"
                  onClick={() => router.push(`/investigation/${code}`)}
                >
                  Back to overview
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    router.push(`/investigation/${code}/crime-computer`)
                  }
                  sx={{
                    bgcolor: "common.white",
                    "&:hover": {
                      bgcolor: "grey.100",
                    },
                  }}
                >
                  Crime Computer
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
