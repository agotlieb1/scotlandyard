import { createTheme } from "@mui/material/styles";

/**
 * Down4 deliberately does not look like the rest of Scotland Yard. The
 * investigation is sepia, serif and hushed; this is a neon flyer stapled to a
 * pole. Applied through a nested ThemeProvider in `down4/layout.tsx`.
 */
export const NEON = {
  lime: "#c8ff3d",
  pink: "#ff4d9d",
  cyan: "#3ee8ff",
  violet: "#a06bff",
  ink: "#150a22",
  night: "#12071f",
};

export const DOWN4_PAGE_BG = `
  radial-gradient(circle at 12% 8%, rgba(160, 107, 255, 0.5), transparent 45%),
  radial-gradient(circle at 88% 4%, rgba(62, 232, 255, 0.32), transparent 42%),
  radial-gradient(circle at 72% 82%, rgba(255, 77, 157, 0.34), transparent 46%),
  radial-gradient(circle at 20% 92%, rgba(200, 255, 61, 0.22), transparent 44%)
`;

const down4Theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: NEON.lime, contrastText: NEON.ink },
    secondary: { main: NEON.pink, contrastText: NEON.ink },
    info: { main: NEON.cyan, contrastText: NEON.ink },
    background: { default: NEON.night, paper: "#1d1030" },
    text: {
      primary: "#f7f1ff",
      secondary: "rgba(247, 241, 255, 0.66)",
    },
    divider: "rgba(247, 241, 255, 0.16)",
  },
  shape: { borderRadius: 22 },
  typography: {
    fontFamily: "var(--font-down4-body), system-ui, sans-serif",
    h1: { fontFamily: "var(--font-down4-display), system-ui, sans-serif", fontWeight: 800 },
    h2: { fontFamily: "var(--font-down4-display), system-ui, sans-serif", fontWeight: 800 },
    h3: {
      fontFamily: "var(--font-down4-display), system-ui, sans-serif",
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h4: {
      fontFamily: "var(--font-down4-display), system-ui, sans-serif",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h5: { fontFamily: "var(--font-down4-display), system-ui, sans-serif", fontWeight: 700 },
    h6: { fontFamily: "var(--font-down4-display), system-ui, sans-serif", fontWeight: 700 },
    overline: {
      fontFamily: "var(--font-down4-display), system-ui, sans-serif",
      fontWeight: 700,
      letterSpacing: "0.24em",
      textTransform: "uppercase",
    },
    button: { textTransform: "none", fontWeight: 800, letterSpacing: "0.01em" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(35, 19, 56, 0.72)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(247, 241, 255, 0.14)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 22, paddingBlock: 10 },
        contained: { boxShadow: "0 10px 30px -12px rgba(200, 255, 61, 0.8)" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 999 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(247, 241, 255, 0.06)",
          borderRadius: 16,
        },
        notchedOutline: { borderColor: "rgba(247, 241, 255, 0.22)" },
      },
    },
  },
});

export default down4Theme;
