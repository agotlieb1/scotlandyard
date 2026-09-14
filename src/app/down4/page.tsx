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
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  MAX_NAME_LENGTH,
  createCrew,
  fetchCrew,
  normalizeCrewCode,
} from "@/lib/down4";
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
