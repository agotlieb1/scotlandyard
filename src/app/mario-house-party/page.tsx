"use client";

import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

import BrandHomeLink from "@/app/brand-home-link";

export default function MarioHousePartyHome() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, md: 10 },
        background: "linear-gradient(160deg, #0c2a3e, #081423)",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={5}>
          <Stack spacing={2}>
            <Typography variant="overline" sx={{ color: "#6fd1ff" }}>
              Companion for game night
            </Typography>
            <Typography variant="h3" component="h1" sx={{ color: "#fdf7ee" }}>
              Mario House Party
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(253, 247, 238, 0.8)" }}>
              Calculate your final score with collectables, heroes, and trophies.
            </Typography>
          </Stack>

          <Stack spacing={3}>
            <Stack spacing={1}>
              <Button
                variant="contained"
                size="large"
                disabled
                sx={{
                  bgcolor: "#6fd1ff",
                  color: "#081423",
                  "&.Mui-disabled": {
                    bgcolor: "rgba(111, 209, 255, 0.25)",
                    color: "rgba(253, 247, 238, 0.5)",
                  },
                }}
              >
                Play Online
              </Button>
              <Typography
                variant="caption"
                sx={{ color: "rgba(253, 247, 238, 0.55)", px: 1 }}
              >
                Online play is waiting on its game engine — the lib/mario-*
                modules did not come across with the rest of the app.
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push("/mario-house-party/scoring")}
              sx={{
                color: "#6fd1ff",
                borderColor: "#6fd1ff",
                "&:hover": {
                  borderColor: "#5ac1ef",
                  bgcolor: "rgba(111, 209, 255, 0.1)",
                },
              }}
            >
              Score Calculator
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push("/mario-house-party/cards")}
              sx={{
                color: "#6fd1ff",
                borderColor: "#6fd1ff",
                "&:hover": {
                  borderColor: "#5ac1ef",
                  bgcolor: "rgba(111, 209, 255, 0.1)",
                },
              }}
            >
              Card Reference
            </Button>
          </Stack>

          <BrandHomeLink sx={{ color: "#6fd1ff" }} />
        </Stack>
      </Container>
    </Box>
  );
}
