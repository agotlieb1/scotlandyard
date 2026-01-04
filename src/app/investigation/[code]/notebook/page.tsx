"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ALIAS_COLOR_HEX,
  ALIAS_COLORS,
  LOCATIONS,
  MOTIVES,
  WEAPONS,
} from "@/lib/investigation-data";
import { normalizeInvestigationCode } from "@/lib/investigation-code";
import {
  fetchPlayers,
  updateNotebookChecks,
  upsertPlayer,
} from "@/lib/investigations";
import { formatAlias } from "@/lib/alias";
import { getPlayerId } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { EvidenceItem, InvestigationPlayer } from "@/lib/types";

const buildChecked = (
  items: EvidenceItem[] | null,
  type: EvidenceItem["type"]
) => items?.filter((item) => item.type === type).map((item) => item.value) ?? [];

const buildNotebookChecks = ({
  aliases,
  weapons,
  locations,
  motives,
}: {
  aliases: string[];
  weapons: string[];
  locations: string[];
  motives: string[];
}): EvidenceItem[] => [
  ...aliases.map((value) => ({ type: "alias", value })),
  ...weapons.map((value) => ({ type: "weapon", value })),
  ...locations.map((value) => ({ type: "location", value })),
  ...motives.map((value) => ({ type: "motive", value })),
];

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingUncheck, setPendingUncheck] = useState<{
    value: string;
    label: string;
    category: EvidenceItem["type"];
  } | null>(null);

  const murdererEvidence = useMemo(() => {
    const evidenceMap = {
      alias: new Set<string>(),
      weapon: new Set<string>(),
      location: new Set<string>(),
      motive: new Set<string>(),
    };
    player?.evidence?.forEach((item) => {
      evidenceMap[item.type].add(item.value);
    });
    return evidenceMap;
  }, [player?.evidence]);

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
      const notebookChecks =
        playerResult.data.notebook_checks ?? playerResult.data.evidence ?? [];
      setCheckedAliases(buildChecked(notebookChecks, "alias"));
      setCheckedWeapons(buildChecked(notebookChecks, "weapon"));
      setCheckedLocations(buildChecked(notebookChecks, "location"));
      setCheckedMotives(buildChecked(notebookChecks, "motive"));

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

  const notebookInk = useMemo(() => {
    if (!player?.alias_color) {
      return {
        color: "inherit",
        shadow: "none",
      };
    }

    if (player.alias_color === "Gold") {
      return {
        color: "#7a5a00",
        shadow: "0 1px 2px rgba(35, 26, 14, 0.35)",
      };
    }

    return {
      color: ALIAS_COLOR_HEX[player.alias_color] ?? "inherit",
      shadow: "0 1px 2px rgba(35, 26, 14, 0.22)",
    };
  }, [player?.alias_color]);

  const notebookPaperSx = useMemo(
    () => ({
      p: 3,
      bgcolor: "#fff9f0",
      color: notebookInk.color,
      fontFamily: "var(--font-handwriting), cursive",
      fontSize: "1.3rem",
      "& .MuiTypography-root": {
        fontFamily: "inherit",
        textShadow: notebookInk.shadow,
      },
      "& .MuiTypography-h6": {
        fontSize: "1.5rem",
      },
      "& button": {
        textShadow: notebookInk.shadow,
      },
    }),
    [notebookInk]
  );

  const persistNotebookChecks = async (
    nextAliases: string[],
    nextWeapons: string[],
    nextLocations: string[],
    nextMotives: string[]
  ) => {
    if (!code) {
      return;
    }
    const notebookChecks = buildNotebookChecks({
      aliases: nextAliases,
      weapons: nextWeapons,
      locations: nextLocations,
      motives: nextMotives,
    });
    setPlayer((prev) =>
      prev ? { ...prev, notebook_checks: notebookChecks } : prev
    );
    const result = await updateNotebookChecks(code, playerId, notebookChecks);
    if ("error" in result) {
      setStatus(result.error);
    }
  };

  const handleToggle = async (
    value: string,
    checked: string[],
    setChecked: (next: string[]) => void,
    label: string,
    category: "alias" | "weapon" | "location" | "motive"
  ) => {
    if (checked.includes(value)) {
      setPendingUncheck({ value, label, category });
      setConfirmOpen(true);
      return;
    }
    const next = [...checked, value];
    setChecked(next);
    await persistNotebookChecks(
      category === "alias" ? next : checkedAliases,
      category === "weapon" ? next : checkedWeapons,
      category === "location" ? next : checkedLocations,
      category === "motive" ? next : checkedMotives
    );
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setPendingUncheck(null);
  };

  const handleConfirmUncheck = async () => {
    if (!pendingUncheck) {
      return;
    }
    const { value, category } = pendingUncheck;
    const removeValue = (items: string[]) =>
      items.filter((item) => item !== value);

    const nextAliases =
      category === "alias" ? removeValue(checkedAliases) : checkedAliases;
    const nextWeapons =
      category === "weapon" ? removeValue(checkedWeapons) : checkedWeapons;
    const nextLocations =
      category === "location" ? removeValue(checkedLocations) : checkedLocations;
    const nextMotives =
      category === "motive" ? removeValue(checkedMotives) : checkedMotives;

    if (category === "alias") {
      setCheckedAliases(nextAliases);
    } else if (category === "weapon") {
      setCheckedWeapons(nextWeapons);
    } else if (category === "location") {
      setCheckedLocations(nextLocations);
    } else if (category === "motive") {
      setCheckedMotives(nextMotives);
    }

    await persistNotebookChecks(
      nextAliases,
      nextWeapons,
      nextLocations,
      nextMotives
    );
    handleConfirmClose();
  };

  const splitColumns = (items: string[]) => {
    const midpoint = Math.ceil(items.length / 2);
    return [items.slice(0, midpoint), items.slice(midpoint)];
  };

  const getAutoUnderline = (items: string[], checked: string[]) => {
    if (items.length !== 10 || checked.length !== 9) {
      return null;
    }
    return items.find((item) => !checked.includes(item)) ?? null;
  };

  const aliasAutoUnderline = getAutoUnderline(aliasOptions, checkedAliases);
  const weaponAutoUnderline = getAutoUnderline(WEAPONS, checkedWeapons);
  const locationAutoUnderline = getAutoUnderline(LOCATIONS, checkedLocations);
  const motiveAutoUnderline = getAutoUnderline(MOTIVES, checkedMotives);

  const getDecoration = (
    type: EvidenceItem["type"],
    label: string,
    checked: string[],
    autoUnderline: string | null
  ) => {
    if (checked.includes(label)) {
      if (player?.is_murderer && murdererEvidence[type].has(label)) {
        return "underline";
      }
      return "scratch";
    }
    if (player?.is_murderer) {
      return "none";
    }
    if (autoUnderline === label) {
      return "underline";
    }
    return "none";
  };

  const renderItem = (
    label: string,
    decoration: "none" | "scratch" | "underline",
    isChecked: boolean,
    onToggle: () => void
  ) => (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={isChecked}
      sx={{
        background: "transparent",
        border: "none",
        color: "inherit",
        cursor: "pointer",
        font: "inherit",
        fontSize: "inherit",
        lineHeight: 1.7,
        padding: 0,
        textAlign: "left",
        textDecoration:
          decoration === "scratch"
            ? "line-through"
            : decoration === "underline"
              ? "underline"
              : "none",
        textDecorationThickness: decoration === "underline" ? "2px" : undefined,
        opacity: decoration === "scratch" ? 0.5 : 1,
        width: "100%",
      }}
    >
      {label}
    </Box>
  );

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
              The Notebook
            </Typography>
            <Typography variant="h3" component="h1">
              Track your clues
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your submitted evidence is already crossed off. Mark additional
              clues as you learn them.
            </Typography>
          </Stack>

          {status && <Alert severity="warning">{status}</Alert>}
          {!player?.evidence?.length && (
            <Alert severity="info">
              Submit your evidence first to auto-check your clues.
            </Alert>
          )}

          <Stack spacing={3}>
            <Paper
              variant="outlined"
              sx={notebookPaperSx}
            >
              <Stack spacing={1.5}>
                <Typography variant="h6" align="center">
                  Aliases
                </Typography>
                {aliasOptions.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Aliases appear once they are locked in The Murder.
                  </Typography>
                )}
                {aliasOptions.length > 0 && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      gridTemplateColumns: "1fr 1fr",
                    }}
                  >
                    {splitColumns(aliasOptions).map((column, columnIndex) => (
                      <Stack key={`alias-column-${columnIndex}`} spacing={0.5}>
                        {column.map((alias) =>
                          renderItem(
                            alias,
                            getDecoration(
                              "alias",
                              alias,
                              checkedAliases,
                              aliasAutoUnderline
                            ),
                            checkedAliases.includes(alias),
                            () =>
                              handleToggle(
                                alias,
                                checkedAliases,
                                setCheckedAliases,
                                alias,
                                "alias"
                              )
                          )
                        )}
                      </Stack>
                    ))}
                  </Box>
                )}
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={notebookPaperSx}
            >
              <Stack spacing={1.5}>
                <Typography variant="h6" align="center">
                  Weapons
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  {splitColumns(WEAPONS).map((column, columnIndex) => (
                    <Stack key={`weapon-column-${columnIndex}`} spacing={0.5}>
                      {column.map((weapon) =>
                        renderItem(
                          weapon,
                          getDecoration(
                            "weapon",
                            weapon,
                            checkedWeapons,
                            weaponAutoUnderline
                          ),
                          checkedWeapons.includes(weapon),
                          () =>
                            handleToggle(
                              weapon,
                              checkedWeapons,
                              setCheckedWeapons,
                              weapon,
                              "weapon"
                            )
                        )
                      )}
                    </Stack>
                  ))}
                </Box>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={notebookPaperSx}
            >
              <Stack spacing={1.5}>
                <Typography variant="h6" align="center">
                  Locations
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  {splitColumns(LOCATIONS).map((column, columnIndex) => (
                    <Stack key={`location-column-${columnIndex}`} spacing={0.5}>
                      {column.map((location) =>
                        renderItem(
                          location,
                          getDecoration(
                            "location",
                            location,
                            checkedLocations,
                            locationAutoUnderline
                          ),
                          checkedLocations.includes(location),
                          () =>
                            handleToggle(
                              location,
                              checkedLocations,
                              setCheckedLocations,
                              location,
                              "location"
                            )
                        )
                      )}
                    </Stack>
                  ))}
                </Box>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={notebookPaperSx}
            >
              <Stack spacing={1.5}>
                <Typography variant="h6" align="center">
                  Motives
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  {splitColumns(MOTIVES).map((column, columnIndex) => (
                    <Stack key={`motive-column-${columnIndex}`} spacing={0.5}>
                      {column.map((motive) =>
                        renderItem(
                          motive,
                          getDecoration(
                            "motive",
                            motive,
                            checkedMotives,
                            motiveAutoUnderline
                          ),
                          checkedMotives.includes(motive),
                          () =>
                            handleToggle(
                              motive,
                              checkedMotives,
                              setCheckedMotives,
                              motive,
                              "motive"
                            )
                        )
                      )}
                    </Stack>
                  ))}
                </Box>
              </Stack>
            </Paper>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              onClick={() => router.push(`/investigation/${code}`)}
            >
              Back to overview
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push(`/investigation/${code}/crime-computer`)}
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
      </Container>

      <Dialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(250, 244, 232, 0.98)",
            border: "1px solid",
            borderColor: "secondary.main",
            boxShadow: "0 24px 48px rgba(33, 24, 14, 0.35)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--font-typewriter), serif",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Scotland Yard Notice
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              fontFamily: "var(--font-typewriter), serif",
              color: "text.primary",
            }}
          >
            Rewrite "{pendingUncheck?.label}" ?<br />
            Scotland Yard cautions against editing submitted evidence.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleConfirmClose}>
            Keep Scribble
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleConfirmUncheck}
          >
            Rewrite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
