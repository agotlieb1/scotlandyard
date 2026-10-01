"use client";

import { Box, ThemeProvider } from "@mui/material";

import down4Theme, { DOWN4_PAGE_BG, NEON } from "./theme";

export default function Down4Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={down4Theme}>
      <Box
        sx={{
          minHeight: "100vh",
          color: "text.primary",
          backgroundColor: NEON.night,
          backgroundImage: DOWN4_PAGE_BG,
          backgroundAttachment: "fixed",
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
