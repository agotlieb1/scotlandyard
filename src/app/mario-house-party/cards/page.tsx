"use client";

import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { CardReference } from "../components/CardReference";

export default function MarioCardsReference() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Header */}
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/mario-house-party")}
              sx={{
                color: "#6fd1ff",
                mb: 2,
                "&:hover": {
                  bgcolor: "rgba(111, 209, 255, 0.1)",
                },
              }}
            >
              Back to Home
            </Button>
            <Typography variant="h4" component="h1" sx={{ color: "#fdf7ee" }}>
              Card Reference
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "rgba(253, 247, 238, 0.8)", mt: 1 }}
            >
              Browse all power-ups, items, and monsters with their special rules
            </Typography>
          </Box>

          {/* Card Reference */}
          <CardReference />
        </Stack>
      </Container>
    </Box>
  );
}
