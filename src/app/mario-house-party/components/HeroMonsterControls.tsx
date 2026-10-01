import { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Chip,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { CardWithId, HeroCard, MonsterCard } from "../types";
import { HOUSE_NAMES } from "../types";

interface HeroMonsterControlsProps {
  heroes: CardWithId[];
  monsters: CardWithId[];
  onCancelMonster: (heroId: string, monsterId: string) => void;
  onUncancelMonster: (heroId: string) => void;
}

export function HeroMonsterControls({
  heroes,
  monsters,
  onCancelMonster,
  onUncancelMonster,
}: HeroMonsterControlsProps) {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const heroesWithCancellations = heroes.filter((h) => {
    const hero = h.card as HeroCard;
    return hero.cancelingMonsterId !== undefined;
  });

  const uncanceledMonsters = monsters.filter((m) => {
    const monster = m.card as MonsterCard;
    return !monster.canceledByHeroId && !monster.isBobOmb;
  });

  const availableHeroes = heroes.filter((h) => {
    const hero = h.card as HeroCard;
    return hero.cancelingMonsterId === undefined;
  });

  if (monsters.length === 0 && heroesWithCancellations.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: "rgba(142, 68, 173, 0.1)",
        border: "1px solid rgba(142, 68, 173, 0.3)",
      }}
    >
      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ color: "#8e44ad", fontWeight: 600 }}>
          Hero vs Monster
        </Typography>

        {/* Show active cancellations */}
        {heroesWithCancellations.length > 0 && (
          <Stack spacing={1}>
            <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
              Active Cancellations:
            </Typography>
            {heroesWithCancellations.map((heroCard) => {
              const hero = heroCard.card as HeroCard;
              const monsterCard = monsters.find(
                (m) => m.id === hero.cancelingMonsterId
              );
              const monster = monsterCard?.card as MonsterCard | undefined;

              return (
                <Box
                  key={heroCard.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1,
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ flex: 1, color: "#fdf7ee" }}>
                    {HOUSE_NAMES[hero.house]} Hero cancels Monster (
                    {monster?.value || "?"})
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => onUncancelMonster(heroCard.id)}
                    sx={{ color: "#e74c3c" }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Stack>
        )}

        {/* Quick cancel interface */}
        {uncanceledMonsters.length > 0 && availableHeroes.length > 0 && (
          <Stack spacing={1.5}>
            <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.6)" }}>
              {selectedHeroId
                ? "Now click a monster to cancel:"
                : "Click a hero, then a monster to cancel:"}
            </Typography>

            {/* Hero Selection */}
            {!selectedHeroId && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {availableHeroes.map((heroCard) => {
                  const hero = heroCard.card as HeroCard;
                  return (
                    <Chip
                      key={heroCard.id}
                      label={HOUSE_NAMES[hero.house]}
                      onClick={() => setSelectedHeroId(heroCard.id)}
                      sx={{
                        bgcolor: "rgba(46, 204, 113, 0.2)",
                        color: "#2ecc71",
                        fontSize: "0.7rem",
                        "&:hover": {
                          bgcolor: "rgba(46, 204, 113, 0.3)",
                        },
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {/* Monster Selection */}
            {selectedHeroId && (
              <Stack spacing={1}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={
                      HOUSE_NAMES[
                        (heroes.find((h) => h.id === selectedHeroId)?.card as HeroCard)
                          .house
                      ] + " Hero"
                    }
                    sx={{
                      bgcolor: "rgba(46, 204, 113, 0.3)",
                      color: "#2ecc71",
                      fontSize: "0.7rem",
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "rgba(253, 247, 238, 0.5)" }}>
                    →
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {uncanceledMonsters.map((monsterCard) => {
                    const monster = monsterCard.card as MonsterCard;
                    return (
                      <Chip
                        key={monsterCard.id}
                        label={`Monster ${monster.value}`}
                        onClick={() => {
                          onCancelMonster(selectedHeroId, monsterCard.id);
                          setSelectedHeroId(null);
                        }}
                        sx={{
                          bgcolor: "rgba(231, 76, 60, 0.2)",
                          color: "#e74c3c",
                          fontSize: "0.7rem",
                          "&:hover": {
                            bgcolor: "rgba(231, 76, 60, 0.3)",
                          },
                        }}
                      />
                    );
                  })}
                  <Button
                    size="small"
                    onClick={() => setSelectedHeroId(null)}
                    sx={{
                      color: "rgba(253, 247, 238, 0.5)",
                      fontSize: "0.65rem",
                      minWidth: "auto",
                      px: 1,
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Stack>
            )}
          </Stack>
        )}

        {uncanceledMonsters.length === 0 && monsters.length > 0 && (
          <Typography variant="caption" sx={{ color: "#2ecc71" }}>
            ✓ All cancelable monsters are neutralized
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
