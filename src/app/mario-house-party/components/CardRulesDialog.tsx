import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import type { PowerUpCard, MonsterCard } from "../types";
import { getCardImagePath } from "../card-images";

interface CardRulesDialogProps {
  open: boolean;
  onClose: () => void;
  card: PowerUpCard | MonsterCard;
}

export function CardRulesDialog({ open, onClose, card }: CardRulesDialogProps) {
  const imagePath = getCardImagePath(card);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: "#081423", color: "#fdf7ee", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" component="span">
            {card.name}
          </Typography>
          {card.type === "powerup" && card.isUnique && (
            <Chip
              label="UNIQUE"
              size="small"
              sx={{
                bgcolor: "#9b59b6",
                color: "white",
                fontWeight: 600,
              }}
            />
          )}
          {card.type === "monster" && card.isBobOmb && (
            <Chip
              label="Cannot Cancel"
              size="small"
              sx={{
                bgcolor: "#e74c3c",
                color: "white",
                fontWeight: 600,
              }}
            />
          )}
          {card.type === "monster" && card.isTappable && (
            <Chip
              label="Tappable"
              size="small"
              sx={{
                bgcolor: "#3498db",
                color: "white",
                fontWeight: 600,
              }}
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#0c2a3e", color: "#fdf7ee" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
          {/* Card Image */}
          {imagePath && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                src={imagePath}
                alt={card.name}
                sx={{
                  maxWidth: 200,
                  maxHeight: 280,
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                }}
              />
            </Box>
          )}

          {/* Card Type */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#6fd1ff",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              {card.type === "powerup" ? "Power-up / Item" : "Monster"}
            </Typography>
            {card.type === "monster" && (
              <Typography variant="h6" sx={{ color: "#fdf7ee", mt: 0.5 }}>
                {card.value} points
              </Typography>
            )}
          </Box>

          {/* Card Rules */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ color: "#6fd1ff", mb: 1, fontWeight: 600 }}
            >
              Rules
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(253, 247, 238, 0.9)",
                lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}
            >
              {card.rules}
            </Typography>
          </Box>
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
