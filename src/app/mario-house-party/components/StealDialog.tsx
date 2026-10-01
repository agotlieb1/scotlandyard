import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import type { MarioGamePlayer } from "@/lib/mario-types";

interface StealDialogProps {
  open: boolean;
  onClose: () => void;
  players: MarioGamePlayer[];
  currentPlayerId: string;
  onSelectPlayer: (playerId: string) => void;
}

export function StealDialog({
  open,
  onClose,
  players,
  currentPlayerId,
  onSelectPlayer,
}: StealDialogProps) {
  const otherPlayers = players.filter((p) => p.player_id !== currentPlayerId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "#081423", color: "#fdf7ee" }}>
        Choose a Player to Steal From
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#0c2a3e", color: "#fdf7ee", p: 0 }}>
        <Box sx={{ pt: 2 }}>
          <Typography
            variant="body2"
            sx={{ color: "rgba(253, 247, 238, 0.7)", px: 3, pb: 2 }}
          >
            You will steal one random card from the selected player&apos;s hand.
          </Typography>

          <List>
            {otherPlayers.map((player) => {
              const handSize = player.hand?.length || 0;
              const canStealFrom = handSize > 0;

              return (
                <ListItem key={player.player_id} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      if (canStealFrom) {
                        onSelectPlayer(player.player_id);
                      }
                    }}
                    disabled={!canStealFrom}
                    sx={{
                      "&:hover": {
                        bgcolor: canStealFrom
                          ? "rgba(111, 209, 255, 0.1)"
                          : "transparent",
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography sx={{ color: "#fdf7ee" }}>
                            {player.player_name || "Player"}
                          </Typography>
                          <Chip
                            label={`${handSize} ${handSize === 1 ? "card" : "cards"}`}
                            size="small"
                            sx={{
                              bgcolor: canStealFrom
                                ? "rgba(111, 209, 255, 0.2)"
                                : "rgba(253, 247, 238, 0.1)",
                              color: canStealFrom
                                ? "#6fd1ff"
                                : "rgba(253, 247, 238, 0.5)",
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        !canStealFrom ? (
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(253, 247, 238, 0.5)" }}
                          >
                            No cards to steal
                          </Typography>
                        ) : null
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: "#0c2a3e", px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: "#6fd1ff",
            "&:hover": {
              bgcolor: "rgba(111, 209, 255, 0.1)",
            },
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
