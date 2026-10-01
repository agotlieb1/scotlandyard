import { Box, Chip, Stack, Typography, LinearProgress } from "@mui/material";
import type { MarioGameState } from "@/lib/mario-types";
import {
  getRemainingActions,
  getActionSummary,
  isFinalRounds,
  ACTIONS_PER_TURN,
} from "@/lib/mario-game-rules";

interface TurnDisplayProps {
  gameState: MarioGameState;
  currentPlayerName?: string;
  isYourTurn: boolean;
}

export function TurnDisplay({
  gameState,
  currentPlayerName,
  isYourTurn,
}: TurnDisplayProps) {
  const remainingActions = getRemainingActions(gameState);
  const actionSummary = getActionSummary(gameState.actions_taken);
  const finalRounds = isFinalRounds(gameState);
  const deckSize = gameState.deck?.length ?? 0;

  return (
    <Box
      sx={{
        bgcolor: isYourTurn ? "rgba(111, 209, 255, 0.1)" : "rgba(253, 247, 238, 0.05)",
        border: isYourTurn ? "2px solid #6fd1ff" : "1px solid rgba(253, 247, 238, 0.1)",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Stack spacing={2}>
        {/* Turn Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="caption" sx={{ color: "#6fd1ff", textTransform: "uppercase" }}>
              Turn {gameState.turn_number}
            </Typography>
            <Typography variant="h6" sx={{ color: "#fdf7ee" }}>
              {isYourTurn ? "Your Turn" : `${currentPlayerName || "Waiting..."}'s Turn`}
            </Typography>
          </Box>

          {finalRounds && (
            <Chip
              label="FINAL ROUNDS"
              sx={{
                bgcolor: "#e74c3c",
                color: "white",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            />
          )}
        </Box>

        {/* Actions Progress */}
        {isYourTurn && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: "rgba(253, 247, 238, 0.8)" }}>
                Actions Remaining
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#6fd1ff", fontWeight: 600 }}
              >
                {remainingActions} / {ACTIONS_PER_TURN}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(gameState.actions_taken.length / ACTIONS_PER_TURN) * 100}
              sx={{
                height: 6,
                borderRadius: 1,
                bgcolor: "rgba(253, 247, 238, 0.1)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#6fd1ff",
                },
              }}
            />
            {gameState.actions_taken.length > 0 && (
              <Typography
                variant="caption"
                sx={{ color: "rgba(253, 247, 238, 0.6)", mt: 0.5, display: "block" }}
              >
                {actionSummary}
              </Typography>
            )}
          </Box>
        )}

        {/* Deck Status */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
              Draw Pile
            </Typography>
            <Typography variant="body1" sx={{ color: "#fdf7ee", fontWeight: 600 }}>
              {deckSize} cards
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
              Discard Pile
            </Typography>
            <Typography variant="body1" sx={{ color: "#fdf7ee", fontWeight: 600 }}>
              {gameState.discard_pile.length} cards
            </Typography>
          </Box>

          {gameState.steal_used && isYourTurn && (
            <Chip
              label="Steal Used"
              size="small"
              sx={{
                bgcolor: "rgba(231, 76, 60, 0.2)",
                color: "#e74c3c",
                fontSize: "0.7rem",
              }}
            />
          )}
        </Box>
      </Stack>
    </Box>
  );
}
