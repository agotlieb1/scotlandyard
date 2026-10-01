import { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useDraggable } from "@dnd-kit/core";
import type { GameCard } from "../types";
import {
  COLLECTABLE_CARDS,
  MYSTERY_BOX_CARD,
  HERO_CARDS,
  MONSTER_CARDS,
  ALL_TROPHY_CARDS,
} from "../card-library";
import { CardDisplay } from "./CardDisplay";

interface DraggableCardSourceProps {
  card: GameCard;
  id: string;
  onTap?: (card: GameCard) => void;
}

function DraggableCardSource({ card, id, onTap }: DraggableCardSourceProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { card },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger tap if not dragging
    if (!isDragging && onTap) {
      e.preventDefault();
      e.stopPropagation();
      onTap(card);
    }
  };

  return (
    // dnd-kit adds aria-describedby only once it is running in the browser, so
    // the server's markup is deliberately an attribute short of the client's.
    <div
      ref={setNodeRef}
      style={style}
      suppressHydrationWarning
      {...listeners}
      {...attributes}
      onClick={handleClick}
    >
      <CardDisplay card={card} size="small" />
    </div>
  );
}

interface CardPaletteProps {
  onCardTap?: (card: GameCard) => void;
}

export function CardPalette({ onCardTap }: CardPaletteProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  const renderCardGrid = (cards: GameCard[], prefix: string) => {
    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          p: 2,
        }}
      >
        {cards.map((card, index) => (
          <DraggableCardSource
            key={`${prefix}-${index}`}
            id={`${prefix}-${index}`}
            card={card}
            onTap={onCardTap}
          />
        ))}
      </Box>
    );
  };

  return (
    <Paper
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(111, 209, 255, 0.2)",
      }}
    >
      <Tabs
        value={selectedTab}
        onChange={(_, newValue) => setSelectedTab(newValue)}
        sx={{
          borderBottom: "1px solid rgba(111, 209, 255, 0.2)",
          "& .MuiTab-root": {
            color: "rgba(253, 247, 238, 0.6)",
          },
          "& .Mui-selected": {
            color: "#6fd1ff !important",
          },
        }}
      >
        <Tab label="Collectables" />
        <Tab label="Heroes" />
        <Tab label="Monsters" />
        <Tab label="Trophies" />
      </Tabs>

      <Box sx={{ minHeight: 400, maxHeight: 600, overflow: "auto" }}>
        {selectedTab === 0 && (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Accordion
              defaultExpanded
              sx={{
                bgcolor: "rgba(241, 196, 15, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#f1c40f", fontWeight: 600 }}>
                  Coins (Mario Bros Plumbing)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid(
                  COLLECTABLE_CARDS.filter((c) => c.house === "mario-bros"),
                  "coin"
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                bgcolor: "rgba(231, 76, 60, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#e74c3c", fontWeight: 600 }}>
                  Mushrooms (Mushroom Kingdom)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid(
                  COLLECTABLE_CARDS.filter((c) => c.house === "mushroom-kingdom"),
                  "mushroom"
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                bgcolor: "rgba(243, 156, 18, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#f39c12", fontWeight: 600 }}>
                  Bananas (Kong Island)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid(
                  COLLECTABLE_CARDS.filter((c) => c.house === "kong-island"),
                  "banana"
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                bgcolor: "rgba(155, 89, 182, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#9b59b6", fontWeight: 600 }}>
                  Mystery Box
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid([MYSTERY_BOX_CARD], "mystery-box")}
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}

        {selectedTab === 1 && (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Accordion
              defaultExpanded
              sx={{
                bgcolor: "rgba(231, 76, 60, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#e74c3c", fontWeight: 600 }}>
                  Mario Bros Heroes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid(
                  HERO_CARDS.filter((h) => h.house === "mario-bros"),
                  "hero-mario"
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                bgcolor: "rgba(230, 126, 34, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#e67e22", fontWeight: 600 }}>
                  Mushroom Kingdom Heroes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid(
                  HERO_CARDS.filter((h) => h.house === "mushroom-kingdom"),
                  "hero-mushroom"
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                bgcolor: "rgba(243, 156, 18, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#f39c12", fontWeight: 600 }}>
                  Kong Island Heroes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid(
                  HERO_CARDS.filter((h) => h.house === "kong-island"),
                  "hero-kong"
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                bgcolor: "rgba(142, 68, 173, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#8e44ad", fontWeight: 600 }}>
                  Bowser&apos;s Castle Heroes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid(
                  HERO_CARDS.filter((h) => h.house === "bowsers-castle"),
                  "hero-bowser"
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{
                bgcolor: "rgba(149, 165, 166, 0.1)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ color: "#95a5a6", fontWeight: 600 }}>
                  Wa! (Wild) Heroes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderCardGrid(
                  HERO_CARDS.filter((h) => h.house === "wa"),
                  "hero-wa"
                )}
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}

        {selectedTab === 2 && renderCardGrid(MONSTER_CARDS, "monster")}

        {selectedTab === 3 && renderCardGrid(ALL_TROPHY_CARDS, "trophy")}
      </Box>
    </Paper>
  );
}
