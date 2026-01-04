"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
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

type TextSegment = {
  text: string;
  sx?: SxProps<Theme>;
};

type TextLine = {
  segments: TextSegment[];
  variant: "body2" | "subtitle2";
  sx?: SxProps<Theme>;
};

type LogEntryProps = {
  announcement: InvestigationAccusation;
  accuserName: string;
  accusationText: string;
  isNewest: boolean;
};

const TYPE_SPEED_MS = 24;
const LOG_PREVIEW_COUNT = 6;

const useTypewriter = (length: number, active: boolean, key: string) => {
  const [visibleCount, setVisibleCount] = useState(active ? 0 : length);

  useEffect(() => {
    if (!active) {
      setVisibleCount(length);
      return;
    }

    setVisibleCount(0);
    let current = 0;
    const interval = window.setInterval(() => {
      current += 1;
      if (current >= length) {
        setVisibleCount(length);
        window.clearInterval(interval);
      } else {
        setVisibleCount(current);
      }
    }, TYPE_SPEED_MS);

    return () => window.clearInterval(interval);
  }, [active, key, length]);

  return visibleCount;
};

const renderSegments = (segments: TextSegment[], visibleCount: number) => {
  let remaining = visibleCount;
  const rendered: JSX.Element[] = [];
  segments.forEach((segment, index) => {
    if (remaining <= 0) {
      return;
    }
    const slice = segment.text.slice(0, remaining);
    remaining -= slice.length;
    rendered.push(
      <Box component="span" key={`${segment.text}-${index}`} sx={segment.sx}>
        {slice}
      </Box>
    );
  });
  return { rendered, consumed: visibleCount - remaining };
};

const LogEntry = ({
  announcement,
  accuserName,
  accusationText,
  isNewest,
}: LogEntryProps) => {
  const lines = useMemo<TextLine[]>(() => {
    if (announcement.message === "REVEAL") {
      return [
        {
          variant: "body2",
          segments: [
            { text: "Scotland Yard reports " },
            { text: announcement.accused_alias, sx: { fontWeight: 700 } },
            { text: " has been " },
            { text: "EXPOSED", sx: { color: "#7c3aed", fontWeight: 700 } },
            { text: " as " },
            { text: announcement.accused_identity, sx: { fontWeight: 700 } },
            { text: ", and has been " },
            { text: "DISCREDITED!", sx: { color: "#2563eb", fontWeight: 700 } },
          ],
        },
      ];
    }

    return [
      {
        variant: "body2",
        segments: [{ text: "Scotland Yard reports the Accusation:" }],
      },
      {
        variant: "body2",
        sx: { fontStyle: "italic" },
        segments: [{ text: `${accusationText}.` }],
      },
      {
        variant: "body2",
        segments: [{ text: `by ${accuserName} is...` }],
      },
      {
        variant: "subtitle2",
        sx: {
          fontWeight: 700,
          color: announcement.is_correct ? "success.main" : "error.main",
        },
        segments: [
          { text: announcement.is_correct ? "CORRECT!" : "INCORRECT!" },
        ],
      },
    ];
  }, [accusationText, accuserName, announcement]);

  const totalLength = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          line.segments.reduce((lineSum, segment) => lineSum + segment.text.length, 0),
        0
      ),
    [lines]
  );

  const visibleCount = useTypewriter(totalLength, isNewest, announcement.id);
  let remaining = visibleCount;

  return (
    <>
      {lines.map((line, index) => {
        const { rendered, consumed } = renderSegments(line.segments, remaining);
        remaining -= consumed;
        return (
          <Typography key={`${announcement.id}-${index}`} variant={line.variant} sx={line.sx}>
            {rendered}
          </Typography>
        );
      })}
    </>
  );
};

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
  const [showFullLog, setShowFullLog] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

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

  const accuserLabel = (playerIdValue: string) => {
    const accuser = players.find(
      (entry) => entry.player_id === playerIdValue && entry.alias_locked
    );
    const alias = accuser
      ? formatAlias(accuser.alias_title, accuser.alias_color)
      : "";
    if (alias) {
      return alias;
    }
    return `Player ${playerIdValue.slice(-4)}`;
  };

  const formatAccusation = (accusation: InvestigationAccusation) => {
    const base = `${accusation.accused_alias} is ${accusation.accused_identity}`;
    if (accusation.accused_identity === "The Murderer") {
      return `${base} with ${accusation.weapon ?? "?"} in ${
        accusation.location ?? "?"
      } for ${accusation.motive ?? "?"}`;
    }
    return base;
  };

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

    };

    load();

    return () => {
      isActive = false;
    };
  }, [code, playerId]);

  useEffect(() => {
    let isActive = true;
    const loadLog = async () => {
      if (!code) {
        return;
      }
      const accusationsResult = await fetchAccusations(
        code,
        showFullLog ? undefined : LOG_PREVIEW_COUNT
      );
      if (!isActive) {
        return;
      }
      if ("error" in accusationsResult) {
        setStatus(accusationsResult.error);
      } else {
        setAnnouncements(accusationsResult.data);
      }
    };

    loadLog();

    return () => {
      isActive = false;
    };
  }, [code, showFullLog]);

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
          setAnnouncements((prev) => {
            const nextAnnouncements = [next, ...prev];
            return showFullLog
              ? nextAnnouncements
              : nextAnnouncements.slice(0, LOG_PREVIEW_COUNT);
          });
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
  }, [code, showFullLog]);

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
    let message = "ACCUSATION";

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
      message = "ACCUSATION";
    } else {
      const accused = players.find(
        (entry) =>
          entry.alias_locked &&
          formatAlias(entry.alias_title, entry.alias_color) === aliasChoice
      );
      isCorrect = Boolean(accused && accused.identity === identityChoice);
      message = "ACCUSATION";
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

    if (isCorrect) {
      const revealResult = await createAccusation(code, {
        accuser_player_id: playerId,
        accused_alias: aliasChoice,
        accused_identity: identityChoice,
        weapon: null,
        location: null,
        motive: null,
        is_correct: true,
        message: "REVEAL",
      });
      if ("error" in revealResult) {
        setStatus(revealResult.error);
        return;
      }
    }

    setStatus(null);
    logRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Accusation</Typography>
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
                <FormControl fullWidth>
                  <InputLabel id="identity-label">Secret identity</InputLabel>
                  <Select
                    labelId="identity-label"
                    label="Secret identity"
                    value={identityChoice}
                    onChange={(event) => setIdentityChoice(event.target.value)}
                  >
                    {IDENTITIES.map((identity) => (
                      <MenuItem key={identity} value={identity}>
                        {identity}
                      </MenuItem>
                    ))}
                  </Select>
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
                        onChange={(event) => setWeaponChoice(event.target.value)}
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
                        onChange={(event) => setMotiveChoice(event.target.value)}
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
                    variant="contained"
                    color="info"
                    onClick={() =>
                      router.push(`/investigation/${code}/notebook`)
                    }
                  >
                    Open The Notebook
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
            <Paper variant="outlined" sx={{ p: 3 }} ref={logRef}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Typography variant="h6">Scotland Yard log</Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowFullLog((prev) => !prev)}
                  >
                    {showFullLog ? "Show recent only" : "Show full log"}
                  </Button>
                </Stack>
                {announcements.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No accusations yet.
                  </Typography>
                )}
                {announcements.map((announcement, index) => (
                  <Paper
                    key={announcement.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: announcement.is_correct
                        ? "action.hover"
                        : "transparent",
                      borderColor: index === 0 ? "#d97706" : "divider",
                      borderWidth: index === 0 ? 2 : 1,
                      boxShadow: index === 0 ? "0 0 0 2px #fbbf24" : "none",
                    }}
                  >
                    <LogEntry
                      announcement={announcement}
                      accuserName={accuserLabel(
                        announcement.accuser_player_id
                      )}
                      accusationText={formatAccusation(announcement)}
                      isNewest={index === 0}
                    />
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
