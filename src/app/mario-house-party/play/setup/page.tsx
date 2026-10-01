"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  CircularProgress,
  TextField,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { createMarioGame, fetchMarioGame } from "@/lib/mario-games";

export default function MarioGameSetup() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateGame = async () => {
    setCreating(true);
    setError(null);

    // Get or create a unique device ID
    let deviceId = localStorage.getItem("mario-device-id");
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("mario-device-id", deviceId);
    }

    const result = await createMarioGame(deviceId);

    if ("error" in result) {
      setError(result.error ?? "Unknown error");
      setCreating(false);
      return;
    }

    // Redirect to the game page (this device becomes the display)
    router.push(`/mario-house-party/play/${result.code}`);
  };

  const handleJoinGame = async () => {
    const trimmedCode = gameCode.trim().toUpperCase();

    if (!trimmedCode) {
      setError("Please enter a game code");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      console.log('[MarioJoin] Attempting to join game:', trimmedCode);
      const result = await fetchMarioGame(trimmedCode);
      console.log('[MarioJoin] Result:', result);

      if ("error" in result) {
        const errorMsg = result.error ?? "Game not found";
        console.error('[MarioJoin] Error:', errorMsg);
        setError(`Could not find game: ${errorMsg}`);
        setJoining(false);
        return;
      }

      console.log('[MarioJoin] Game found, redirecting...');
      // Redirect to the game page
      router.push(`/mario-house-party/play/${trimmedCode}`);
    } catch (err) {
      console.error('[MarioJoin] Unexpected error:', err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setJoining(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={5} alignItems="center">
          <Stack spacing={2} textAlign="center">
            <Typography variant="h4" sx={{ color: "#6fd1ff" }}>
              Mario House Party
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(253, 247, 238, 0.8)" }}>
              Create a new game or join an existing one
            </Typography>
          </Stack>

          {error && (
            <Typography variant="body2" sx={{ color: "#e74c3c", textAlign: "center" }}>
              {error}
            </Typography>
          )}

          {/* Create Game Section */}
          <Stack spacing={2} sx={{ width: "100%" }}>
            <Typography variant="h6" sx={{ color: "#fdf7ee", textAlign: "center" }}>
              Create New Game
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleCreateGame}
              disabled={creating || joining}
              sx={{
                bgcolor: "#6fd1ff",
                color: "#081423",
                "&:hover": {
                  bgcolor: "#5ac1ef",
                },
                "&:disabled": {
                  bgcolor: "rgba(111, 209, 255, 0.3)",
                },
              }}
            >
              {creating ? <CircularProgress size={24} /> : "Create Game"}
            </Button>
          </Stack>

          <Divider sx={{ width: "100%", borderColor: "rgba(253, 247, 238, 0.2)" }}>
            <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.5)", px: 2 }}>
              OR
            </Typography>
          </Divider>

          {/* Join Game Section */}
          <Stack spacing={2} sx={{ width: "100%" }}>
            <Typography variant="h6" sx={{ color: "#fdf7ee", textAlign: "center" }}>
              Join Existing Game
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter game code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleJoinGame();
                }
              }}
              disabled={creating || joining}
              InputProps={{
                style: {
                  color: "#fdf7ee",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textAlign: "center",
                  backgroundColor: "rgba(8, 20, 35, 0.5)",
                },
              }}
              inputProps={{
                style: {
                  color: "#fdf7ee",
                  textAlign: "center",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fdf7ee !important",
                  backgroundColor: "rgba(8, 20, 35, 0.5)",
                  "& fieldset": {
                    borderColor: "rgba(111, 209, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(111, 209, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6fd1ff",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "#fdf7ee !important",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textAlign: "center",
                  WebkitTextFillColor: "#fdf7ee !important",
                },
                "& input": {
                  color: "#fdf7ee !important",
                  WebkitTextFillColor: "#fdf7ee !important",
                },
              }}
            />
            <Button
              variant="outlined"
              size="large"
              onClick={handleJoinGame}
              disabled={creating || joining || !gameCode.trim()}
              sx={{
                color: "#6fd1ff",
                borderColor: "#6fd1ff",
                "&:hover": {
                  borderColor: "#5ac1ef",
                  bgcolor: "rgba(111, 209, 255, 0.1)",
                },
                "&:disabled": {
                  color: "rgba(111, 209, 255, 0.3)",
                  borderColor: "rgba(111, 209, 255, 0.2)",
                },
              }}
            >
              {joining ? <CircularProgress size={24} /> : "Join Game"}
            </Button>
          </Stack>

          <Button
            variant="text"
            onClick={() => router.push("/mario-house-party")}
            sx={{
              color: "rgba(253, 247, 238, 0.6)",
              "&:hover": {
                color: "#fdf7ee",
              },
            }}
          >
            Back to Home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
