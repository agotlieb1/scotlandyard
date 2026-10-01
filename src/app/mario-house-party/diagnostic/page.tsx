"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Paper,
  TextField,
} from "@mui/material";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fetchMarioGame } from "@/lib/mario-games";

export default function MarioDiagnostic() {
  const [testCode, setTestCode] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const addResult = (msg: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const runDiagnostics = async () => {
    setResults([]);
    addResult("Starting diagnostics...");

    // Test 1: Check Supabase client
    addResult("Test 1: Checking Supabase client...");
    const supabase = getSupabaseClient();
    if (!supabase) {
      addResult("❌ FAILED: Supabase client is not configured");
      return;
    }
    addResult("✅ PASSED: Supabase client initialized");

    // Test 2: Check environment variables
    addResult("Test 2: Checking environment variables...");
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    addResult(`   SUPABASE_URL: ${hasUrl ? "✅ Set" : "❌ Missing"}`);
    addResult(`   SUPABASE_ANON_KEY: ${hasKey ? "✅ Set" : "❌ Missing"}`);

    // Test 3: Test database connection
    addResult("Test 3: Testing database connection...");
    try {
      const { data, error } = await supabase
        .from("mario_games")
        .select("code")
        .limit(1);

      if (error) {
        addResult(`❌ FAILED: Database error: ${error.message}`);
      } else {
        addResult(`✅ PASSED: Database connection works (found ${data?.length || 0} games)`);
      }
    } catch (err) {
      addResult(`❌ FAILED: Database connection error: ${err}`);
    }

    // Test 4: Test specific game if code provided
    if (testCode.trim()) {
      addResult(`Test 4: Testing game code "${testCode.toUpperCase()}"...`);
      try {
        const result = await fetchMarioGame(testCode.toUpperCase());
        if ("error" in result) {
          addResult(`❌ Game not found: ${result.error}`);
        } else {
          addResult(`✅ Game found: ${result.data.code} (status: ${result.data.status})`);
        }
      } catch (err) {
        addResult(`❌ Error fetching game: ${err}`);
      }
    }

    // Test 5: Browser info
    addResult("Test 5: Browser information...");
    addResult(`   User Agent: ${navigator.userAgent}`);
    addResult(`   Online: ${navigator.onLine ? "✅ Yes" : "❌ No"}`);
    addResult(`   Platform: ${navigator.platform}`);

    addResult("Diagnostics complete!");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 4, md: 6 },
        background: "linear-gradient(160deg, #0c2a3e, #081423)",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Typography variant="h4" sx={{ color: "#6fd1ff" }}>
            Mario House Party - Diagnostics
          </Typography>

          <Paper sx={{ p: 3, bgcolor: "#0c2a3e" }}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ color: "#fdf7ee" }}>
                Run Tests
              </Typography>

              <TextField
                fullWidth
                placeholder="Optional: Enter game code to test"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#fdf7ee",
                    "& fieldset": {
                      borderColor: "rgba(111, 209, 255, 0.3)",
                    },
                  },
                }}
              />

              <Button
                variant="contained"
                onClick={runDiagnostics}
                sx={{
                  bgcolor: "#6fd1ff",
                  color: "#081423",
                  "&:hover": {
                    bgcolor: "#5ac1ef",
                  },
                }}
              >
                Run Diagnostics
              </Button>
            </Stack>
          </Paper>

          {results.length > 0 && (
            <Paper sx={{ p: 3, bgcolor: "#0c2a3e" }}>
              <Typography variant="h6" sx={{ color: "#fdf7ee", mb: 2 }}>
                Results
              </Typography>
              <Box
                sx={{
                  bgcolor: "#081423",
                  p: 2,
                  borderRadius: 1,
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  maxHeight: 400,
                  overflow: "auto",
                }}
              >
                {results.map((result, i) => (
                  <Typography
                    key={i}
                    sx={{
                      color: result.includes("❌")
                        ? "#e74c3c"
                        : result.includes("✅")
                        ? "#27ae60"
                        : "#fdf7ee",
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                    }}
                  >
                    {result}
                  </Typography>
                ))}
              </Box>
            </Paper>
          )}

          <Paper sx={{ p: 3, bgcolor: "#0c2a3e" }}>
            <Typography variant="h6" sx={{ color: "#fdf7ee", mb: 2 }}>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                href="/mario-house-party/play/setup"
                sx={{
                  color: "#6fd1ff",
                  borderColor: "#6fd1ff",
                  justifyContent: "flex-start",
                }}
              >
                Create or Join Game
              </Button>
              <Button
                variant="outlined"
                href="/mario-house-party"
                sx={{
                  color: "#6fd1ff",
                  borderColor: "#6fd1ff",
                  justifyContent: "flex-start",
                }}
              >
                Back to Home
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
