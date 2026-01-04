"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { normalizeInvestigationCode } from "@/lib/investigation-code";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [investigationCode, setInvestigationCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    const normalized = normalizeInvestigationCode(investigationCode);
    if (normalized.length < 4) {
      setStatus("Enter a valid investigation code.");
      return;
    }
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }

    setStatus(null);
    setIsJoining(true);
    const { data, error } = await supabase
      .from("investigations")
      .select("code")
      .eq("code", normalized)
      .maybeSingle();
    setIsJoining(false);

    if (error || !data) {
      setStatus("Investigation not found. Check the code and try again.");
      return;
    }

    router.push(`/investigation/${normalized}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, md: 10 },
        backgroundImage:
          "radial-gradient(circle at top left, #ffffff 0%, #f3ede3 50%, #ece4d6 100%)",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={5}>
          <Stack spacing={2}>
            <Typography variant="overline" color="text.secondary">
              Companion for mystery night
            </Typography>
            <Typography variant="h3" component="h1">
              Scotland Yard Companion
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start an investigation, lock roles in The Murder, and track clues
              together in The Notebook.
            </Typography>
          </Stack>

          <Stack spacing={3} direction={{ xs: "column", md: "row" }}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Join an investigation</Typography>
                  <TextField
                    label="Investigation code"
                    value={investigationCode}
                    onChange={(event) =>
                      setInvestigationCode(
                        normalizeInvestigationCode(event.target.value)
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleJoin();
                      }
                    }}
                    helperText="5-6 characters, letters and numbers."
                    inputProps={{ maxLength: 6 }}
                  />
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  Join investigation
                </Button>
              </CardActions>
            </Card>

            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Start an investigation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate an investigation code and invite the table with a
                    single link.
                  </Typography>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push("/setup")}
                >
                  Start investigation
                </Button>
              </CardActions>
            </Card>
          </Stack>

          {status && <Alert severity="warning">{status}</Alert>}
          {!supabase && (
            <Alert severity="info">
              Add your Supabase env vars to enable investigations and realtime
              sync.
            </Alert>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
