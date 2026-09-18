"use client";

import {
  Box,
  Card,
  CardActionArea,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import NextLink from "next/link";

import { BRAND } from "./theme";

type Project = {
  href: string;
  eyebrow: string;
  name: string;
  blurb: string;
  cta: string;
  /** Each card wears its own product's colors, so the two never blur together. */
  accent: string;
  surface: string;
  border: string;
  heading: string;
  body: string;
  /** The studio narrates in one voice; each product name still speaks in its own. */
  nameSx: React.CSSProperties;
  nameTail?: string;
  swatches: string[];
};

const PROJECTS: Project[] = [
  {
    href: "/scotland-yard",
    eyebrow: "Murder mystery night",
    name: "Scotland Yard",
    blurb:
      "A companion for the table: start an investigation, lock aliases and secret identities in The Casefile, and keep every clue synced in The Notebook.",
    cta: "Open the casefile",
    accent: "#8b1c24",
    surface: "#f6efe4",
    border: "#d7c5ad",
    heading: "#2f2720",
    body: "rgba(47, 39, 32, 0.78)",
    nameSx: {
      // The investigation's own typewriter face, loaded by the root layout.
      fontFamily: "var(--font-typewriter), serif",
      fontWeight: 400,
      letterSpacing: "0.02em",
    },
    swatches: ["#8b1c24", "#b07a2a", "#fff7e6"],
  },
  {
    href: "/down4",
    eyebrow: "For the group chat",
    name: "Down",
    blurb:
      "A board that never expires. Light a beacon for whatever you are up for, and the crew taps Me too! until you suddenly have plans.",
    cta: "Light a beacon",
    accent: "#c8ff3d",
    surface: "#1d1030",
    border: "rgba(247, 241, 255, 0.24)",
    heading: "#f7f1ff",
    body: "rgba(247, 241, 255, 0.72)",
    nameSx: {
      // Down4's own display font only loads under /down4, so stand in with the
      // closest thing on hand: the brand grotesque, pushed heavy and tight.
      fontFamily: "var(--font-brand-body), system-ui, sans-serif",
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    nameTail: "4",
    swatches: ["#c8ff3d", "#ff4d9d", "#3ee8ff"],
  },
];

function PawMark() {
  return (
    <Box
      component="svg"
      viewBox="0 0 48 44"
      aria-hidden="true"
      sx={{ width: 44, height: 40, color: BRAND.gold }}
    >
      <ellipse cx="24" cy="31" rx="13" ry="10.5" fill="currentColor" />
      <ellipse cx="9.5" cy="17" rx="5.5" ry="7" fill="currentColor" />
      <ellipse cx="19.5" cy="9" rx="5.5" ry="7.5" fill="currentColor" />
      <ellipse cx="30.5" cy="9" rx="5.5" ry="7.5" fill="currentColor" />
      <ellipse cx="40.5" cy="17" rx="5.5" ry="7" fill="currentColor" />
    </Box>
  );
}

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 7, md: 12 } }}>
      <Stack spacing={{ xs: 5, md: 7 }}>
        <Stack spacing={2}>
          <PawMark />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.9rem", md: "4.2rem" },
              lineHeight: 1.02,
            }}
          >
            Count Mittens
            <Box component="span" sx={{ display: "block", color: BRAND.gold }}>
              Games
            </Box>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
            Small games and small tools for the people you actually hang out
            with. Pick a room and go in.
          </Typography>
        </Stack>

        <Stack spacing={3}>
          {PROJECTS.map((project) => (
            <Card
              key={project.href}
              sx={{
                backgroundColor: project.surface,
                borderColor: project.border,
                overflow: "hidden",
              }}
            >
              <CardActionArea
                component={NextLink}
                href={project.href}
                sx={{ p: { xs: 3, md: 4 } }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1}>
                    {project.swatches.map((swatch) => (
                      <Box
                        key={swatch}
                        sx={{
                          width: 26,
                          height: 8,
                          borderRadius: 999,
                          backgroundColor: swatch,
                        }}
                      />
                    ))}
                  </Stack>
                  <Stack spacing={0.5}>
                    <Typography
                      variant="overline"
                      sx={{ color: project.accent, fontSize: "0.72rem" }}
                    >
                      {project.eyebrow}
                    </Typography>
                    <Typography
                      variant="h4"
                      component="h2"
                      sx={{ color: project.heading, ...project.nameSx }}
                    >
                      {project.name}
                      {project.nameTail && (
                        <Box component="span" sx={{ color: project.accent }}>
                          {project.nameTail}
                        </Box>
                      )}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ maxWidth: 560, color: project.body }}
                  >
                    {project.blurb}
                  </Typography>
                  <Typography
                    variant="button"
                    sx={{ color: project.accent, pt: 0.5 }}
                  >
                    {project.cta} →
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
          ))}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          More rooms later. The cat is working on it.
        </Typography>
      </Stack>
    </Container>
  );
}
