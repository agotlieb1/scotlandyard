import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { MarioGameState } from "@/lib/mario-types";
import {
  canPerformAction,
  canSteal,
  hasActionsRemaining,
  getRemainingActions,
} from "@/lib/mario-game-rules";

interface ActionButtonsProps {
  gameState: MarioGameState;
  playerHandSize: number;
  isYourTurn: boolean;
  onEndTurn: () => void;
  selectedCardCanTap?: boolean;
}

export function ActionButtons({
  gameState,
  playerHandSize,
  isYourTurn,
  onEndTurn,
  selectedCardCanTap = false,
}: ActionButtonsProps) {
  if (!isYourTurn) {
    return null;
  }

  const canPlay = canPerformAction(gameState, "play", playerHandSize);
  const canTap = canPerformAction(gameState, "tap", playerHandSize) && selectedCardCanTap;
  const canStealAction = canSteal(gameState, playerHandSize);
  const hasActions = hasActionsRemaining(gameState);
  const remainingActions = getRemainingActions(gameState);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "rgba(8, 20, 35, 0.95)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(111, 209, 255, 0.2)",
        p: 2,
        zIndex: 1000,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Action Indicators */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
              Your Turn
            </Typography>
            <Typography variant="body2" sx={{ color: "#6fd1ff", fontWeight: 600 }}>
              {remainingActions} {remainingActions === 1 ? "Action" : "Actions"} Remaining
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Tooltip
              title={
                !canPlay
                  ? "No actions remaining"
                  : "Play a card from your hand to any board"
              }
            >
              <span>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  disabled={!canPlay}
                  sx={{
                    color: canPlay ? "#6fd1ff" : "rgba(253, 247, 238, 0.3)",
                    borderColor: canPlay ? "#6fd1ff" : "rgba(253, 247, 238, 0.2)",
                    "&:hover": canPlay
                      ? {
                          borderColor: "#5ac1ef",
                          bgcolor: "rgba(111, 209, 255, 0.1)",
                        }
                      : {},
                  }}
                >
                  Play
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                !hasActions
                  ? "No actions remaining"
                  : !selectedCardCanTap
                  ? "Select a tappable card on the board"
                  : "Tap card to use its special ability"
              }
            >
              <span>
                <Button
                  variant="outlined"
                  startIcon={<TouchAppIcon />}
                  disabled={!canTap}
                  sx={{
                    color: canTap ? "#6fd1ff" : "rgba(253, 247, 238, 0.3)",
                    borderColor: canTap ? "#6fd1ff" : "rgba(253, 247, 238, 0.2)",
                    "&:hover": canTap
                      ? {
                          borderColor: "#5ac1ef",
                          bgcolor: "rgba(111, 209, 255, 0.1)",
                        }
                      : {},
                  }}
                >
                  Tap
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                gameState.steal_used
                  ? "You've already stolen this turn"
                  : playerHandSize >= 5
                  ? "You must have fewer than 5 cards to steal"
                  : !hasActions
                  ? "No actions remaining"
                  : "Steal a random card from another player (once per turn)"
              }
            >
              <span>
                <Button
                  variant="outlined"
                  startIcon={<SwapHorizIcon />}
                  disabled={!canStealAction}
                  sx={{
                    color: canStealAction ? "#f39c12" : "rgba(253, 247, 238, 0.3)",
                    borderColor: canStealAction ? "#f39c12" : "rgba(253, 247, 238, 0.2)",
                    "&:hover": canStealAction
                      ? {
                          borderColor: "#e67e22",
                          bgcolor: "rgba(243, 156, 18, 0.1)",
                        }
                      : {},
                  }}
                >
                  Steal
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {/* End Turn Button */}
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={onEndTurn}
            sx={{
              bgcolor: "#27ae60",
              color: "white",
              minWidth: 120,
              "&:hover": {
                bgcolor: "#229954",
              },
            }}
          >
            End Turn
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
