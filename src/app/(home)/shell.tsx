"use client";

import { Box, ThemeProvider } from "@mui/material";

import homeTheme, { BRAND, HOME_PAGE_BG } from "./theme";

export default function HomeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={homeTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          color: "text.primary",
          backgroundColor: BRAND.night,
          backgroundImage: HOME_PAGE_BG,
          backgroundAttachment: "fixed",
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
