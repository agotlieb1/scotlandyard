"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useParams, useRouter } from "next/navigation";
import { normalizeInvestigationCode } from "@/lib/investigation-code";
import { getPlayerId } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  fetchMarioGame,
  fetchMarioPlayers,
  upsertMarioPlayer,
} from "@/lib/mario-games";
import { startMarioGame } from "@/lib/mario-game-start";
import { playCard, endTurn, stealCard } from "@/lib/mario-game-actions";
import type { MarioGame, MarioGamePlayer, MarioGameState } from "@/lib/mario-types";
import type { GameCard } from "@/app/mario-house-party/types";
import { PlayerHand } from "@/app/mario-house-party/components/PlayerHand";
import { PlayMat, toMatBoard, type MatZone } from "@/app/mario-house-party/components/PlayMat";
import { TableView, type Seat } from "@/app/mario-house-party/components/TableView";
import { TABLE } from "@/app/mario-house-party/theme";
import { TurnDisplay } from "@/app/mario-house-party/components/TurnDisplay";
import { ActionButtons } from "@/app/mario-house-party/components/ActionButtons";
import { StealDialog } from "@/app/mario-house-party/components/StealDialog";

const PLAYER_COLORS = [
  { key: "red", primary: "#e74c3c", secondary: "#c0392b", name: "Red" },
  { key: "blue", primary: "#3498db", secondary: "#2980b9", name: "Blue" },
  { key: "green", primary: "#2ecc71", secondary: "#27ae60", name: "Green" },
  { key: "orange", primary: "#f39c12", secondary: "#e67e22", name: "Orange" },
  { key: "purple", primary: "#9b59b6", secondary: "#8e44ad", name: "Purple" },
  { key: "teal", primary: "#1abc9c", secondary: "#16a085", name: "Teal" },
];

export default function MarioGamePage() {
  const params = useParams();
  const router = useRouter();
  const [code] = useState(() => normalizeInvestigationCode(params.code as string));
  const [playerId] = useState(() => getPlayerId());

  const [game, setGame] = useState<MarioGame | null>(null);
  const [players, setPlayers] = useState<MarioGamePlayer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<MarioGamePlayer | null>(null);
  const [gameState, setGameState] = useState<MarioGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stealDialogOpen, setStealDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDisplayMode, setIsDisplayMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // Fetch game
      const gameResult = await fetchMarioGame(code);
      if ("error" in gameResult) {
        setError(gameResult.error ?? "Unknown error");
        setLoading(false);
        return;
      }
      setGame(gameResult.data);

      // Check if this device is the display
      const deviceId = localStorage.getItem("mario-device-id");
      const isDisplay = deviceId === gameResult.data.display_device_id;
      setIsDisplayMode(isDisplay);

      // Fetch players
      const playersResult = await fetchMarioPlayers(code);
      if ("error" in playersResult) {
        setError(playersResult.error ?? "Unknown error");
        setLoading(false);
        return;
      }
      setPlayers(playersResult.data);

      // If this is the display, don't join as a player
      if (isDisplay) {
        setLoading(false);
        return;
      }

      // Find available color for this player
      const existingPlayer = playersResult.data.find((p) => p.player_id === playerId);
      if (existingPlayer) {
        setCurrentPlayer(existingPlayer);
        setLoading(false);
        return;
      }

      // Assign next available color
      const takenColors = playersResult.data.map((p) => p.player_color);
      const availableColor = PLAYER_COLORS.find((c) => !takenColors.includes(c.key));

      if (!availableColor) {
        setError("Game is full (max 6 players)");
        setLoading(false);
        return;
      }

      // Join game
      const joinResult = await upsertMarioPlayer(
        code,
        playerId,
        availableColor.key,
        `Player ${playersResult.data.length + 1}`
      );

      if ("error" in joinResult) {
        setError(joinResult.error ?? "Unknown error");
        setLoading(false);
        return;
      }

      setCurrentPlayer(joinResult.data);
      setLoading(false);
    };

    load();
  }, [code, playerId]);

  // Real-time subscriptions
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !code) return;

    // Subscribe to players changes
    const playersChannel = supabase
      .channel(`mario-players:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mario_game_players",
          filter: `game_code=eq.${code}`,
        },
        (payload) => {
          const updatedPlayer = payload.new as MarioGamePlayer;
          setPlayers((prev) => {
            const filtered = prev.filter((p) => p.id !== updatedPlayer.id);
            return [...filtered, updatedPlayer].sort((a, b) =>
              a.created_at.localeCompare(b.created_at)
            );
          });

          // Update current player if it's them
          if (updatedPlayer.player_id === playerId) {
            setCurrentPlayer(updatedPlayer);
          }
        }
      )
      .subscribe();

    // Subscribe to game status changes
    const gameChannel = supabase
      .channel(`mario-game:${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mario_games",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          const updatedGame = payload.new as MarioGame;
          setGame(updatedGame);
        }
      )
      .subscribe();

    // Subscribe to game state changes
    const stateChannel = supabase
      .channel(`mario-state:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mario_game_state",
          filter: `game_code=eq.${code}`,
        },
        (payload) => {
          const updatedState = payload.new as MarioGameState;
          setGameState(updatedState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(stateChannel);
    };
  }, [code, playerId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    setLoading(true);
    const result = await startMarioGame(code);
    if ("error" in result) {
      setError(result.error ?? "Unknown error");
      setLoading(false);
    }
    // Game state will update via real-time subscription
  };

  const handleCardPlay = async (card: GameCard, zone: MatZone) => {
    if (!currentPlayer || actionLoading) return;

    setActionLoading(true);
    const result = await playCard(code, playerId, card, zone);
    setActionLoading(false);
    setSelectedCard(null);

    if ("error" in result) {
      setError(result.error ?? "Unknown error");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Tap a card in hand to pick it up, tap a zone to put it down.
  const handleZoneChoose = (zone: MatZone) => {
    if (!selectedCard) return;
    handleCardPlay(selectedCard, zone);
  };

  const handleEndTurn = async () => {
    if (!currentPlayer || actionLoading) return;

    setActionLoading(true);
    const result = await endTurn(code, playerId);
    setActionLoading(false);

    if ("error" in result) {
      setError(result.error ?? "Unknown error");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSteal = async (targetPlayerId: string) => {
    if (!currentPlayer || actionLoading) return;

    setActionLoading(true);
    setStealDialogOpen(false);
    const result = await stealCard(code, playerId, targetPlayerId);
    setActionLoading(false);

    if ("error" in result) {
      setError(result.error ?? "Unknown error");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#6fd1ff" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={3} alignItems="center">
            <Typography variant="h5" sx={{ color: "#e74c3c" }}>
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push("/mario-house-party")}
              sx={{
                color: "#6fd1ff",
                borderColor: "#6fd1ff",
              }}
            >
              Back to Home
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  // Display mode doesn't need a currentPlayer
  if (!game) {
    return null;
  }

  // Player mode requires a currentPlayer
  if (!isDisplayMode && !currentPlayer) {
    return null;
  }

  // Show lobby if game is in setup
  if (game.status === "setup") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={4}>
            {/* Header */}
            <Stack spacing={2} alignItems="center">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="h4" sx={{ color: "#6fd1ff" }}>
                  Game Lobby
                </Typography>
                {isDisplayMode && (
                  <Chip
                    label="Display Mode"
                    sx={{
                      bgcolor: "rgba(111, 209, 255, 0.2)",
                      color: "#6fd1ff",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Stack>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "rgba(111, 209, 255, 0.1)",
                  border: "1px solid rgba(111, 209, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography variant="h5" sx={{ color: "#fdf7ee", fontFamily: "monospace" }}>
                  {code}
                </Typography>
                <Tooltip title={copied ? "Copied!" : "Copy code"}>
                  <IconButton onClick={handleCopyCode} sx={{ color: "#6fd1ff" }}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Paper>
              <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.7)" }}>
                Share this code with friends to invite them
              </Typography>
            </Stack>

            {/* Players List */}
            <Paper sx={{ p: 3, bgcolor: "rgba(255, 255, 255, 0.05)" }}>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ color: "#fdf7ee" }}>
                  Players ({players.length}/6)
                </Typography>
                <Stack spacing={1}>
                  {players.map((player) => {
                    const colorInfo = PLAYER_COLORS.find((c) => c.key === player.player_color);
                    return (
                      <Box
                        key={player.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          bgcolor: player.player_id === playerId
                            ? "rgba(111, 209, 255, 0.1)"
                            : "rgba(255, 255, 255, 0.02)",
                          borderRadius: 1,
                          border: player.player_id === playerId
                            ? "1px solid rgba(111, 209, 255, 0.3)"
                            : "1px solid transparent",
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor: colorInfo?.primary,
                          }}
                        />
                        <Stack spacing={0.5} sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ color: "#fdf7ee" }}>
                            {player.player_name || "Unnamed Player"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
                            {colorInfo?.name}
                          </Typography>
                        </Stack>
                        {player.player_id === playerId && (
                          <Chip
                            label="You"
                            size="small"
                            sx={{
                              bgcolor: "rgba(111, 209, 255, 0.2)",
                              color: "#6fd1ff",
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Stack>
            </Paper>

            {/* Start Game Button */}
            <Button
              variant="contained"
              size="large"
              onClick={handleStartGame}
              disabled={players.length < 2}
              sx={{
                bgcolor: "#2ecc71",
                color: "#fff",
                "&:hover": {
                  bgcolor: "#27ae60",
                },
                "&:disabled": {
                  bgcolor: "rgba(46, 204, 113, 0.3)",
                },
              }}
            >
              {players.length < 2 ? "Waiting for players..." : "Start Game"}
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  // Active game view
  const isMyTurn = gameState?.current_turn_player_id === playerId;
  const currentPlayerHand = currentPlayer?.hand || [];

  // DISPLAY MODE - Shared screen shows all boards, no hands
  if (isDisplayMode) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          py: 4,
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" sx={{ color: "#6fd1ff" }}>
                Mario House Party - Display Mode
              </Typography>
              <Chip
                label="Shared Display"
                sx={{
                  bgcolor: "rgba(111, 209, 255, 0.2)",
                  color: "#6fd1ff",
                  fontWeight: 600,
                }}
              />
            </Stack>

            {/* Turn Display */}
            {gameState && (
              <TurnDisplay
                gameState={gameState}
                currentPlayerName={
                  players.find((p) => p.player_id === gameState.current_turn_player_id)?.player_name || "Unknown"
                }
                isYourTurn={false}
              />
            )}

            {/* Every mat at once, seen from above */}
            <TableView
              seats={players.map<Seat>((player, i) => ({
                id: player.player_id,
                name: player.player_name || `Player ${i + 1}`,
                colour: player.player_color || PLAYER_COLORS[i % PLAYER_COLORS.length].primary,
                board: toMatBoard(player.board),
                isTurn: gameState?.current_turn_player_id === player.player_id,
              }))}
              deckCount={gameState?.deck?.length}
              discardCount={gameState?.discard_pile?.length}
            />
          </Stack>
        </Container>
      </Box>
    );
  }

  // PLAYER MODE - Individual phone shows only their hand and can take actions
  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={4}>
          {/* Header */}
          <Typography variant="h4" sx={{ color: "#6fd1ff", textAlign: "center" }}>
            Mario House Party
          </Typography>

          {/* Error Display */}
          {error && (
            <Paper
              sx={{
                p: 2,
                bgcolor: "rgba(231, 76, 60, 0.1)",
                border: "1px solid #e74c3c",
              }}
            >
              <Typography sx={{ color: "#e74c3c", textAlign: "center" }}>
                {error}
              </Typography>
            </Paper>
          )}

          {/* Turn Display */}
          {gameState && (
            <TurnDisplay
              gameState={gameState}
              currentPlayerName={
                players.find((p) => p.player_id === gameState.current_turn_player_id)?.player_name || "Unknown"
              }
              isYourTurn={isMyTurn}
            />
          )}

          {/* Action Buttons */}
          {gameState && (
            <ActionButtons
              gameState={gameState}
              playerHandSize={currentPlayerHand.length}
              isYourTurn={isMyTurn && !actionLoading}
              onEndTurn={handleEndTurn}
            />
          )}

          {/* Player Hand - ONLY visible on their own device */}
          <PlayerHand
            hand={currentPlayerHand}
            playerId={playerId}
            isCurrentPlayer={true}
            selectedCard={selectedCard}
            onCardTap={(card) => {
              setSelectedCard((prev) => {
                const next = prev === card ? null : card;
                if (next) {
                  document
                    .getElementById("my-mat")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                return next;
              });
            }}
          />

          {/* What to do next, in one line that changes as you go */}
          <Paper
            sx={{
              px: 2,
              py: 1.5,
              textAlign: "center",
              borderColor: selectedCard ? TABLE.brass : undefined,
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {!isMyTurn
                ? "Waiting for your turn."
                : selectedCard
                  ? "Now tap a zone on your mat to play it — or tap the card again to put it back."
                  : "Tap a card in your hand to pick it up."}
            </Typography>
          </Paper>

          {/* Player's Own Mat */}
          <Box
            id="my-mat"
            sx={{
              display: "flex",
              justifyContent: "center",
              overflowX: "auto",
              scrollMarginTop: 16,
            }}
          >
            <PlayMat
              board={toMatBoard(currentPlayer?.board)}
              name={currentPlayer?.player_name || "You"}
              colour={currentPlayer?.player_color || TABLE.cyan}
              cardWidth={64}
              armed={Boolean(selectedCard) && isMyTurn}
              onZoneChoose={handleZoneChoose}
              onZoneDropCard={(zone, card) => handleCardPlay(card, zone)}
            />
          </Box>

          {/* Steal Dialog */}
          <StealDialog
            open={stealDialogOpen}
            players={players}
            currentPlayerId={playerId}
            onClose={() => setStealDialogOpen(false)}
            onSelectPlayer={handleSteal}
          />
        </Stack>
      </Container>
    </Box>
  );
}
