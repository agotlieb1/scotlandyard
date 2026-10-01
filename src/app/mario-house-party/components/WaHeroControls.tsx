import {
  Box,
  Button,
  ButtonGroup,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { CardWithId, HeroCard, MainHouse } from "../types";
import { HOUSE_NAMES } from "../types";

interface WaHeroControlsProps {
  waHeroes: CardWithId[];
  onPledgeWaHero: (heroId: string, house: MainHouse) => void;
  onUnpledgeWaHero: (heroId: string) => void;
}

export function WaHeroControls({
  waHeroes,
  onPledgeWaHero,
  onUnpledgeWaHero,
}: WaHeroControlsProps) {
  if (waHeroes.length === 0) return null;

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: "rgba(149, 165, 166, 0.1)",
        border: "1px solid rgba(149, 165, 166, 0.3)",
      }}
    >
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ color: "#95a5a6", fontWeight: 600 }}>
          Wa! Hero Pledges
        </Typography>

        {waHeroes.map((heroCard) => {
          const hero = heroCard.card as HeroCard;

          return (
            <Box key={heroCard.id}>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
                    Wa! Hero #{heroCard.id.slice(-6)}
                  </Typography>
                  {hero.pledgedHouse && (
                    <Button
                      size="small"
                      onClick={() => onUnpledgeWaHero(heroCard.id)}
                      sx={{
                        color: "#e74c3c",
                        fontSize: "0.65rem",
                        minWidth: "auto",
                        p: 0.5,
                      }}
                    >
                      Unpledge
                    </Button>
                  )}
                </Box>

                {hero.pledgedHouse ? (
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "rgba(46, 204, 113, 0.2)",
                      borderRadius: 1,
                      border: "1px solid rgba(46, 204, 113, 0.3)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#2ecc71" }}>
                      ✓ Pledged to {HOUSE_NAMES[hero.pledgedHouse]}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.5)", fontSize: "0.7rem" }}>
                      Pledge to a house for trophy eligibility:
                    </Typography>
                    <ButtonGroup size="small" orientation="vertical" fullWidth>
                      <Button
                        onClick={() => onPledgeWaHero(heroCard.id, "mario-bros")}
                        sx={{
                          bgcolor: "transparent",
                          borderColor: "#e74c3c",
                          color: "#e74c3c",
                          fontSize: "0.75rem",
                          justifyContent: "flex-start",
                          "&:hover": {
                            bgcolor: "rgba(231, 76, 60, 0.1)",
                            borderColor: "#e74c3c",
                          },
                        }}
                      >
                        {HOUSE_NAMES["mario-bros"]}
                      </Button>
                      <Button
                        onClick={() => onPledgeWaHero(heroCard.id, "mushroom-kingdom")}
                        sx={{
                          bgcolor: "transparent",
                          borderColor: "#e67e22",
                          color: "#e67e22",
                          fontSize: "0.75rem",
                          justifyContent: "flex-start",
                          "&:hover": {
                            bgcolor: "rgba(230, 126, 34, 0.1)",
                            borderColor: "#e67e22",
                          },
                        }}
                      >
                        {HOUSE_NAMES["mushroom-kingdom"]}
                      </Button>
                      <Button
                        onClick={() => onPledgeWaHero(heroCard.id, "kong-island")}
                        sx={{
                          bgcolor: "transparent",
                          borderColor: "#f39c12",
                          color: "#f39c12",
                          fontSize: "0.75rem",
                          justifyContent: "flex-start",
                          "&:hover": {
                            bgcolor: "rgba(243, 156, 18, 0.1)",
                            borderColor: "#f39c12",
                          },
                        }}
                      >
                        {HOUSE_NAMES["kong-island"]}
                      </Button>
                      <Button
                        onClick={() => onPledgeWaHero(heroCard.id, "bowsers-castle")}
                        sx={{
                          bgcolor: "transparent",
                          borderColor: "#8e44ad",
                          color: "#8e44ad",
                          fontSize: "0.75rem",
                          justifyContent: "flex-start",
                          "&:hover": {
                            bgcolor: "rgba(142, 68, 173, 0.1)",
                            borderColor: "#8e44ad",
                          },
                        }}
                      >
                        {HOUSE_NAMES["bowsers-castle"]}
                      </Button>
                    </ButtonGroup>
                  </>
                )}
              </Stack>
            </Box>
          );
        })}

        <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.5)", fontSize: "0.7rem", fontStyle: "italic" }}>
          Note: Unpledged Wa! heroes only count as +1 point and don&apos;t help win house trophies
        </Typography>
      </Stack>
    </Paper>
  );
}
