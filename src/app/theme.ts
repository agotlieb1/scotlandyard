import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8b1c24",
      contrastText: "#fdf7ee",
    },
    secondary: {
      main: "#b07a2a",
    },
    info: {
      main: "#2563eb",
      contrastText: "#fdf7ee",
    },
    background: {
      default: "#f6efe4",
      paper: "#fff7e6",
    },
    text: {
      primary: "#2f2720",
      secondary: "#5c4a3c",
    },
    divider: "#d7c5ad",
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "var(--font-dossier), serif",
    fontSize: 16.5,
    h1: {
      fontFamily: "var(--font-typewriter), serif",
      fontWeight: 400,
      letterSpacing: "0.04em",
    },
    h2: {
      fontFamily: "var(--font-typewriter), serif",
      fontWeight: 400,
      letterSpacing: "0.04em",
    },
    h3: {
      fontFamily: "var(--font-typewriter), serif",
      fontWeight: 400,
      letterSpacing: "0.04em",
    },
    h4: {
      fontFamily: "var(--font-typewriter), serif",
      fontWeight: 400,
      letterSpacing: "0.03em",
    },
    h5: {
      fontFamily: "var(--font-typewriter), serif",
      fontWeight: 400,
      letterSpacing: "0.03em",
    },
    overline: {
      fontFamily: "var(--font-typewriter), serif",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
    body1: {
      fontSize: "1.05rem",
      lineHeight: 1.7,
    },
    body2: {
      fontSize: "1rem",
      lineHeight: 1.65,
    },
    subtitle2: {
      fontSize: "0.98rem",
    },
    caption: {
      fontSize: "0.92rem",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.02))",
          borderColor: "#d7c5ad",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "var(--map-paper)",
          backgroundImage: "var(--map-bg)",
          color: "var(--map-ink)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#fffdf7",
        },
        notchedOutline: {
          borderColor: "#d7c5ad",
        },
      },
    },
  },
});

export default theme;
