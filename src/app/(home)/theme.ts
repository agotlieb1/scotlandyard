import { createTheme } from "@mui/material/styles";

/**
 * The studio shell sits above both products, so it borrows from neither: the
 * investigation is sepia daylight, Down4 is a neon flyer, and this is the
 * dark room they are both hung in. Applied through a nested ThemeProvider in
 * `(home)/shell.tsx`.
 */
export const BRAND = {
  night: "#151119",
  panel: "#1f1a26",
  gold: "#e8b65a",
  rose: "#ef7f8e",
  cream: "#f5efe6",
  ink: "#1a1420",
};

export const HOME_PAGE_BG = `
  radial-gradient(circle at 15% 12%, rgba(232, 182, 90, 0.22), transparent 48%),
  radial-gradient(circle at 85% 8%, rgba(239, 127, 142, 0.18), transparent 44%),
  radial-gradient(circle at 50% 100%, rgba(232, 182, 90, 0.12), transparent 58%)
`;

const homeTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: BRAND.gold, contrastText: BRAND.ink },
    secondary: { main: BRAND.rose, contrastText: BRAND.ink },
    background: { default: BRAND.night, paper: BRAND.panel },
    text: {
      primary: BRAND.cream,
      secondary: "rgba(245, 239, 230, 0.66)",
    },
    divider: "rgba(245, 239, 230, 0.16)",
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: "var(--font-brand-body), system-ui, sans-serif",
    h1: {
      fontFamily: "var(--font-brand-display), Georgia, serif",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: "var(--font-brand-display), Georgia, serif",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontFamily: "var(--font-brand-display), Georgia, serif",
      fontWeight: 700,
    },
    h5: {
      fontFamily: "var(--font-brand-display), Georgia, serif",
      fontWeight: 700,
    },
    h6: {
      fontFamily: "var(--font-brand-display), Georgia, serif",
      fontWeight: 700,
    },
    overline: {
      fontFamily: "var(--font-brand-body), system-ui, sans-serif",
      fontWeight: 600,
      letterSpacing: "0.26em",
      textTransform: "uppercase",
    },
    button: { textTransform: "none", fontWeight: 700 },
    body1: { fontSize: "1.05rem", lineHeight: 1.65 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(245, 239, 230, 0.14)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20, paddingBlock: 9 },
      },
    },
  },
});

export default homeTheme;
