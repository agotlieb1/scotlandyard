"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, md: 10 },
        backgroundImage: "var(--map-bg)",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={5}>
          <Stack spacing={2}>
            <Typography variant="overline" color="text.secondary">
              Standing board for the group chat
            </Typography>
            <Typography variant="h3" component="h1">
              Down4
            </Typography>
            <Typography variant="body1" color="text.secondary">
              One code, one link, no expiry. Everyone posts what they are down
              for, flips their Down4 light on, and the crew knows who to text.
              Bookmark the board and come back whenever.
            </Typography>
          </Stack>

          <Stack spacing={3} direction={{ xs: "column", md: "row" }}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Join a crew</Typography>
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
                    helperText="5-6 characters, letters and numbers."
                    inputProps={{ maxLength: 6 }}
                  />
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  {isJoining ? "Finding crew..." : "Join crew"}
                </Button>
              </CardActions>
            </Card>

            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Start a crew</Typography>
                  <TextField
                    label="Crew name (optional)"
                    value={crewName}
                    onChange={(event) => setCrewName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleCreate();
                      }
                    }}
                    helperText="Something the group will recognize."
                    inputProps={{ maxLength: MAX_NAME_LENGTH }}
                  />
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating crew..." : "Create crew"}
                </Button>
              </CardActions>
            </Card>
          </Stack>

          {status && <Alert severity="warning">{status}</Alert>}
          {!supabase && (
            <Alert severity="info">
              Add your Supabase env vars to enable crews and realtime sync.
            </Alert>
          )}

          <Button
            variant="text"
            sx={{ alignSelf: "flex-start" }}
            onClick={() => router.push("/")}
          >
            Back to Scotland Yard
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
