"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  MAX_NAME_LENGTH,
  createCrew,
  fetchCrew,
  fetchMyCrews,
  normalizeCrewCode,
} from "@/lib/down4";
import type { Down4CrewSummary } from "@/lib/down4";
import { getPlayerId } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabase/client";
import { NEON } from "./theme";

export default function Down4HomePage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [crewCode, setCrewCode] = useState("");
  const [crewName, setCrewName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [myCrews, setMyCrews] = useState<Down4CrewSummary[]>([]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      const result = await fetchMyCrews(getPlayerId());
      if (isActive && "data" in result) {
        setMyCrews(result.data);
      }
    };

    load();

    // Beacons are lit and expire elsewhere; keep the glow honest.
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    const timer = setInterval(refreshIfVisible, 30_000);

    return () => {
      isActive = false;
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
      clearInterval(timer);
    };
  }, []);

  const handleJoin = async () => {
    const normalized = normalizeCrewCode(crewCode);
    if (normalized.length < 4) {
      setStatus("Enter a valid crew code.");
      return;
    }

    setStatus(null);
    setIsJoining(true);
    const result = await fetchCrew(normalized);
    setIsJoining(false);

    if ("error" in result) {
      setStatus(result.error);
      return;
    }

    router.push(`/down4/${normalized}`);
  };

  const handleCreate = async () => {
    setStatus(null);
    setIsCreating(true);
    const result = await createCrew(crewName);
    setIsCreating(false);

    if ("error" in result) {
      setStatus(result.error);
      return;
    }

    router.push(`/down4/${result.code}`);
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack spacing={4}>
        <Stack spacing={1.5}>
          <Typography variant="overline" sx={{ color: NEON.cyan }}>
            No plans? Same.
          </Typography>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "3.4rem", md: "4.6rem" }, lineHeight: 0.95 }}
          >
            Down
            <Box component="span" sx={{ color: NEON.lime }}>
              4
            </Box>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Light a beacon for whatever you are up for — coffee, bowling, a
            drive with no destination. Your crew sees it, taps{" "}
            <Box component="span" sx={{ color: NEON.cyan }}>
              Me too!
            </Box>
            , and now you have plans. Bookmark it; the board never expires.
          </Typography>
        </Stack>

        {myCrews.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Your crews</Typography>
              <Stack spacing={1}>
                {myCrews.map((entry) => {
                  const isLit = entry.litCount > 0;
                  return (
                    <Button
                      key={entry.code}
                      variant="outlined"
                      onClick={() => router.push(`/down4/${entry.code}`)}
                      sx={{
                        justifyContent: "space-between",
                        gap: 1,
                        ...(isLit
                          ? {
                              borderColor: NEON.lime,
                              fontWeight: 800,
                              color: NEON.lime,
                              backgroundColor: "rgba(200, 255, 61, 0.08)",
                              boxShadow: `0 0 0 1px ${NEON.lime}, 0 12px 34px -18px ${NEON.lime}`,
                              "&:hover": {
                                borderColor: NEON.lime,
                                backgroundColor: "rgba(200, 255, 61, 0.16)",
                              },
                            }
                          : {
                              // Quiet crews recede, so one lit crew reads
                              // instantly against them.
                              borderColor: "rgba(247, 241, 255, 0.18)",
                              color: "text.secondary",
                              "&:hover": {
                                borderColor: "rgba(247, 241, 255, 0.34)",
                              },
                            }),
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ minWidth: 0 }}
                      >
                        {isLit && (
                          <Box
                            sx={{
                              flexShrink: 0,
                              width: 9,
                              height: 9,
                              borderRadius: "50%",
                              backgroundColor: NEON.lime,
                              boxShadow: `0 0 10px 3px ${NEON.lime}`,
                              "@keyframes down4ListPulse": {
                                "0%, 100%": { opacity: 1 },
                                "50%": { opacity: 0.35 },
                              },
                              animation:
                                "down4ListPulse 1.8s ease-in-out infinite",
                            }}
                          />
                        )}
                        <Box
                          component="span"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.name || "Unnamed crew"}
                        </Box>
                      </Stack>
                      <Box
                        component="span"
                        sx={{
                          flexShrink: 0,
                          color: isLit ? NEON.lime : NEON.cyan,
                        }}
                      >
                        {isLit
                          ? `${entry.litCount} lit`
                          : entry.code}
                      </Box>
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        )}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Join your crew</Typography>
            <TextField
              label="Crew code"
              value={crewCode}
              onChange={(event) =>
                setCrewCode(normalizeCrewCode(event.target.value))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleJoin();
                }
              }}
              inputProps={{ maxLength: 6 }}
              fullWidth
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? "Looking..." : "Take me there"}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Or start one</Typography>
            <TextField
              label="Crew name (optional)"
              placeholder="Sunday Crew"
              value={crewName}
              onChange={(event) => setCrewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleCreate();
                }
              }}
              inputProps={{ maxLength: MAX_NAME_LENGTH }}
              fullWidth
            />
            <Button
              variant="outlined"
              size="large"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? "Building..." : "Make a crew"}
            </Button>
          </Stack>
        </Paper>

        {status && (
          <Alert severity="warning" onClose={() => setStatus(null)}>
            {status}
          </Alert>
        )}
        {!supabase && (
          <Alert severity="info">
            Add your Supabase env vars to enable crews and realtime sync.
          </Alert>
        )}

        <Button
          variant="text"
          size="small"
          sx={{ alignSelf: "flex-start" }}
          onClick={() => router.push("/")}
        >
          Back to Scotland Yard
        </Button>
      </Stack>
    </Container>
  );
}
