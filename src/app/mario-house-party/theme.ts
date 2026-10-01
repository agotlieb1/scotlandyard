import { createTheme } from "@mui/material/styles";

/**
 * Mario House Party is a card game, so its pages are a card table: felt under
 * the cards, a dark rail around the edge, brass on the fittings. The cyan it
 * started with stays as the interactive colour, so buttons and links still
 * read as controls against all that felt. Applied through a nested
 * ThemeProvider in `shell.tsx`.
 */
export const TABLE = {
  /** The felt, lit from above. */
  feltHigh: "#15607a",
  felt: "#0e3f55",
  feltLow: "#07293a",
  /** The rail the felt is set into. */
  rail: "#071d29",
  railEdge: "#0a2d3d",
  /** Brass on the trim, the plaque and anything won. */
  brass: "#d9b65f",
  brassDim: "#9c7f38",
  /** Cyan stays the colour of things you can press. */
  cyan: "#6fd1ff",
  cyanDim: "#3f9dc7",
  cream: "#fdf7ee",
  danger: "#ff7a6b",
};

/** The felt surface: a lit centre, a woven grain, and a vignette at the rail. */
export const FELT_SURFACE = `
  radial-gradient(ellipse 120% 90% at 50% 0%, ${TABLE.feltHigh}, transparent 62%),
  radial-gradient(ellipse 100% 70% at 50% 110%, ${TABLE.feltLow}, transparent 60%),
  repeating-linear-gradient(45deg, rgba(255,255,255,0.016) 0 2px, transparent 2px 4px),
  repeating-linear-gradient(-45deg, rgba(0,0,0,0.022) 0 2px, transparent 2px 4px),
  linear-gradient(180deg, ${TABLE.felt}, ${TABLE.feltLow})
`;

/** The shadow a real card casts: contact, then spread. */
export const CARD_SHADOW =
  "0 1px 2px rgba(0,0,0,0.5), 0 6px 14px -6px rgba(0,0,0,0.65)";
export const CARD_SHADOW_RAISED =
  "0 2px 4px rgba(0,0,0,0.45), 0 18px 32px -12px rgba(0,0,0,0.75)";

const marioTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: TABLE.cyan, contrastText: TABLE.rail },
    secondary: { main: TABLE.brass, contrastText: TABLE.rail },
    error: { main: TABLE.danger },
    background: { default: TABLE.felt, paper: "rgba(7, 29, 41, 0.72)" },
    text: {
      primary: TABLE.cream,
      secondary: "rgba(253, 247, 238, 0.68)",
    },
    divider: "rgba(217, 182, 95, 0.22)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "var(--font-table), system-ui, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 800, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600, letterSpacing: "0.01em" },
    overline: { fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          // Panels are inlays in the felt, not boxes sitting on top of it.
          backgroundColor: "rgba(6, 26, 36, 0.55)",
          border: "1px solid rgba(217, 182, 95, 0.18)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 30px -18px rgba(0,0,0,0.9)",
          backdropFilter: "blur(6px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 18 },
        contained: {
          boxShadow: "0 8px 20px -10px rgba(111, 209, 255, 0.9)",
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(7, 29, 41, 0.6)",
          borderRadius: 999,
          padding: 4,
          gap: 4,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: "999px !important",
          paddingInline: 16,
          paddingBlock: 7,
          color: "rgba(253, 247, 238, 0.66)",
          "&.Mui-selected": {
            backgroundColor: "rgba(111, 209, 255, 0.18)",
            color: TABLE.cyan,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
          backgroundColor: TABLE.brass,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          color: "rgba(253, 247, 238, 0.6)",
          "&.Mui-selected": { color: TABLE.cream },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(7, 29, 41, 0.6)",
          borderRadius: 12,
        },
        notchedOutline: { borderColor: "rgba(217, 182, 95, 0.28)" },
      },
    },
    MuiDialog: {
      styleOverrides: {
        // Panels are translucent inlays in the felt, but a dialog is a thing
        // held up in front of the table and has to be read, not seen through.
        paper: {
          backgroundColor: "rgba(6, 26, 36, 0.97)",
          backgroundImage: `linear-gradient(180deg, ${TABLE.brass}14, transparent 40%)`,
          border: `1px solid ${TABLE.brass}55`,
          backdropFilter: "none",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(6, 26, 36, 0.4)",
          border: "1px solid rgba(217, 182, 95, 0.14)",
          borderRadius: 14,
          "&::before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        },
      },
    },
  },
});

export default marioTheme;
