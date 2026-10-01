"use client";

import { Box, ThemeProvider } from "@mui/material";

import marioTheme, { FELT_SURFACE, TABLE } from "./theme";

export default function MarioShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={marioTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          color: "text.primary",
          backgroundColor: TABLE.felt,
          backgroundImage: FELT_SURFACE,
          backgroundAttachment: "fixed",
          // The rail: a dark edge with a brass line, as if the felt is set into
          // a table rather than painted on the page.
          boxShadow: `inset 0 0 0 1px ${TABLE.railEdge}, inset 0 0 90px 24px rgba(3, 14, 20, 0.75)`,
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
