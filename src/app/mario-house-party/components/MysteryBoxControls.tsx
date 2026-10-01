import {
  Box,
  Button,
  ButtonGroup,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { CardWithId, MysteryBoxCard, CollectableHouse } from "../types";

interface MysteryBoxControlsProps {
  mysteryBoxes: CardWithId[];
  onUpdateMysteryBox: (id: string, updates: Partial<MysteryBoxCard>) => void;
}

export function MysteryBoxControls({
  mysteryBoxes,
  onUpdateMysteryBox,
}: MysteryBoxControlsProps) {
  if (mysteryBoxes.length === 0) return null;

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: "rgba(155, 89, 182, 0.1)",
        border: "1px solid rgba(155, 89, 182, 0.3)",
      }}
    >
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ color: "#9b59b6", fontWeight: 600 }}>
          Mystery Box Decisions
        </Typography>

        {mysteryBoxes.map((boxCard) => {
          const box = boxCard.card as MysteryBoxCard;

          return (
            <Box key={boxCard.id}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
                  Mystery Box #{boxCard.id.slice(-6)}
                </Typography>

                <ButtonGroup size="small" fullWidth>
                  <Button
                    variant={box.isSafe ? "contained" : "outlined"}
                    onClick={() =>
                      onUpdateMysteryBox(boxCard.id, {
                        isSafe: true,
                        declaredHouse: undefined,
                      })
                    }
                    sx={{
                      bgcolor: box.isSafe ? "#9b59b6" : "transparent",
                      borderColor: "#9b59b6",
                      color: box.isSafe ? "white" : "#9b59b6",
                      "&:hover": {
                        bgcolor: box.isSafe ? "#8e44ad" : "rgba(155, 89, 182, 0.1)",
                        borderColor: "#9b59b6",
                      },
                    }}
                  >
                    Safe (+5)
                  </Button>
                  <Button
                    variant={!box.isSafe ? "contained" : "outlined"}
                    onClick={() =>
                      onUpdateMysteryBox(boxCard.id, {
                        isSafe: false,
                        declaredHouse: box.declaredHouse || "mario-bros",
                      })
                    }
                    sx={{
                      bgcolor: !box.isSafe ? "#9b59b6" : "transparent",
                      borderColor: "#9b59b6",
                      color: !box.isSafe ? "white" : "#9b59b6",
                      "&:hover": {
                        bgcolor: !box.isSafe ? "#8e44ad" : "rgba(155, 89, 182, 0.1)",
                        borderColor: "#9b59b6",
                      },
                    }}
                  >
                    Gamble (+10 or 0)
                  </Button>
                </ButtonGroup>

                {!box.isSafe && (
                  <ButtonGroup size="small" fullWidth>
                    <Button
                      variant={box.declaredHouse === "mario-bros" ? "contained" : "outlined"}
                      onClick={() =>
                        onUpdateMysteryBox(boxCard.id, {
                          declaredHouse: "mario-bros",
                        })
                      }
                      sx={{
                        bgcolor: box.declaredHouse === "mario-bros" ? "#f1c40f" : "transparent",
                        borderColor: "#f1c40f",
                        color: box.declaredHouse === "mario-bros" ? "#081423" : "#f1c40f",
                        fontSize: "0.7rem",
                        "&:hover": {
                          bgcolor:
                            box.declaredHouse === "mario-bros"
                              ? "#e4b400"
                              : "rgba(241, 196, 15, 0.1)",
                          borderColor: "#f1c40f",
                        },
                      }}
                    >
                      Coin
                    </Button>
                    <Button
                      variant={
                        box.declaredHouse === "mushroom-kingdom" ? "contained" : "outlined"
                      }
                      onClick={() =>
                        onUpdateMysteryBox(boxCard.id, {
                          declaredHouse: "mushroom-kingdom",
                        })
                      }
                      sx={{
                        bgcolor:
                          box.declaredHouse === "mushroom-kingdom" ? "#e74c3c" : "transparent",
                        borderColor: "#e74c3c",
                        color: box.declaredHouse === "mushroom-kingdom" ? "white" : "#e74c3c",
                        fontSize: "0.7rem",
                        "&:hover": {
                          bgcolor:
                            box.declaredHouse === "mushroom-kingdom"
                              ? "#d63027"
                              : "rgba(231, 76, 60, 0.1)",
                          borderColor: "#e74c3c",
                        },
                      }}
                    >
                      Mushroom
                    </Button>
                    <Button
                      variant={box.declaredHouse === "kong-island" ? "contained" : "outlined"}
                      onClick={() =>
                        onUpdateMysteryBox(boxCard.id, {
                          declaredHouse: "kong-island",
                        })
                      }
                      sx={{
                        bgcolor: box.declaredHouse === "kong-island" ? "#f39c12" : "transparent",
                        borderColor: "#f39c12",
                        color: box.declaredHouse === "kong-island" ? "#081423" : "#f39c12",
                        fontSize: "0.7rem",
                        "&:hover": {
                          bgcolor:
                            box.declaredHouse === "kong-island"
                              ? "#e08e0b"
                              : "rgba(243, 156, 18, 0.1)",
                          borderColor: "#f39c12",
                        },
                      }}
                    >
                      Banana
                    </Button>
                  </ButtonGroup>
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
