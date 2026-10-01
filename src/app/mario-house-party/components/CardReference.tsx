"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import { POWERUP_CARDS, MONSTER_CARDS } from "../card-data";
import { CardDisplay } from "./CardDisplay";
import { CardRulesDialog } from "./CardRulesDialog";
import type { PowerUpCard, MonsterCard } from "../types";

export function CardReference() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCard, setSelectedCard] = useState<PowerUpCard | MonsterCard | null>(null);

  const handleCardClick = (card: PowerUpCard | MonsterCard) => {
    setSelectedCard(card);
  };

  const handleCloseDialog = () => {
    setSelectedCard(null);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              color: "rgba(253, 247, 238, 0.7)",
              "&.Mui-selected": {
                color: "#6fd1ff",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#6fd1ff",
            },
          }}
        >
          <Tab label="Power-ups & Items" />
          <Tab label="Monsters" />
        </Tabs>
      </Paper>

      {/* Power-ups Tab */}
      {selectedTab === 0 && (
        <Box>
          <Typography
            variant="h6"
            sx={{ color: "#fdf7ee", mb: 2, fontWeight: 600 }}
          >
            Power-ups & Items
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(253, 247, 238, 0.7)", mb: 3 }}
          >
            Click on any card to view its rules
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(6, 1fr)",
              },
              gap: 2,
            }}
          >
            {POWERUP_CARDS.map((card, index) => (
              <Box
                key={index}
                onClick={() => handleCardClick(card)}
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                <CardDisplay card={card} size="medium" />
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    color: "#fdf7ee",
                    mt: 1,
                  }}
                >
                  {card.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Monsters Tab */}
      {selectedTab === 1 && (
        <Box>
          <Typography
            variant="h6"
            sx={{ color: "#fdf7ee", mb: 2, fontWeight: 600 }}
          >
            Monsters
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(253, 247, 238, 0.7)", mb: 3 }}
          >
            Click on any card to view its rules and point values
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(6, 1fr)",
              },
              gap: 2,
            }}
          >
            {MONSTER_CARDS.map((card, index) => (
              <Box
                key={index}
                onClick={() => handleCardClick(card)}
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                <CardDisplay card={card} size="medium" />
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    color: "#fdf7ee",
                    mt: 1,
                  }}
                >
                  {card.name} ({card.value} pts)
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Rules Dialog */}
      {selectedCard && (
        <CardRulesDialog
          open={!!selectedCard}
          onClose={handleCloseDialog}
          card={selectedCard}
        />
      )}
    </Box>
  );
}
