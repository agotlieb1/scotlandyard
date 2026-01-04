"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createInvestigation } from "@/lib/investigations";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SetupPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }

    setIsCreating(true);
    setStatus(null);
    const result = await createInvestigation();
    setIsCreating(false);

    if ("error" in result) {
      setStatus(result.error);
      return;
    }

    router.push(`/investigation/${result.code}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 6, md: 10 },
        backgroundImage:
          "radial-gradient(circle at top right, #ffffff 0%, #f0e6d6 50%, #e5dccb 100%)",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              Setup
            </Typography>
            <Typography variant="h3" component="h1">
              Start an investigation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate a code, share it with the table, and guide everyone into
              The Murder setup.
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="contained" onClick={handleCreate}>
              {isCreating ? "Creating investigation..." : "Generate code"}
            </Button>
            <Button variant="text" onClick={() => router.push("/")}>
              Back to home
            </Button>
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
