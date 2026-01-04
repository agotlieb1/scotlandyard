"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { normalizeInvestigationCode } from "@/lib/investigation-code";
import {
  fetchCaseFile,
  fetchInvestigation,
  upsertPlayer,
} from "@/lib/investigations";
import { formatAlias } from "@/lib/alias";
import { getPlayerId } from "@/lib/player";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { InvestigationCaseFile, InvestigationPlayer } from "@/lib/types";

export default function InvestigationPage() {
  const router = useRouter();
  const params = useParams<{ code?: string }>();
  const code = useMemo(
    () =>
      normalizeInvestigationCode(
        Array.isArray(params.code) ? params.code[0] ?? "" : params.code ?? ""
      ),
    [params.code]
  );
  const playerId = useMemo(() => getPlayerId(), []);
  const [player, setPlayer] = useState<InvestigationPlayer | null>(null);
  const [caseFile, setCaseFile] = useState<InvestigationCaseFile | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!code) {
        setStatus("Missing investigation code.");
        setIsLoading(false);
        return;
      }

      const investigationResult = await fetchInvestigation(code);
      if ("error" in investigationResult) {
        if (isActive) {
          setStatus(investigationResult.error);
          setIsLoading(false);
        }
        return;
      }

      const playerResult = await upsertPlayer(code, playerId);
      if (isActive) {
        if ("error" in playerResult) {
          setStatus(playerResult.error);
        } else {
          setPlayer(playerResult.data);
        }
      }

      const caseResult = await fetchCaseFile(code);
      if (isActive && "data" in caseResult) {
        setCaseFile(caseResult.data);
      }

      if (isActive) {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [code, playerId]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !code) {
      return;
    }

    const channel = supabase
      .channel(`case-file:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "investigation_case_files",
          filter: `investigation_code=eq.${code}`,
        },
        (payload) => {
          const next = payload.new as InvestigationCaseFile | null;
          if (!next) {
            return;
          }
          setCaseFile(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setStatus("Unable to copy the investigation code.");
    }
  };

  if (!getSupabaseClient()) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="info">
          Supabase is not configured. Add your env vars to continue.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography>Loading investigation...</Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 6, md: 10 },
        backgroundImage:
          "linear-gradient(135deg, #f7f2ea 0%, #efe6d7 45%, #e9dfce 100%)",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">
                Investigation {code}
              </Typography>
              <Typography variant="h4" component="h1">
                Investigation Overview
              </Typography>
            </Stack>
            <Button variant="outlined" onClick={handleCopy}>
              {copied ? "Copied" : "Copy code"}
            </Button>
          </Stack>

          {status && <Alert severity="warning">{status}</Alert>}

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Your progress</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={
                    player?.alias_locked
                      ? `Alias locked: ${formatAlias(
                          player.alias_title,
                          player.alias_color
                        )}`
                      : "Alias not locked"
                  }
                  color={player?.alias_locked ? "primary" : "default"}
                />
                <Chip
                  label={
                    player?.identity
                      ? `Identity set`
                      : "Identity not set"
                  }
                  color={player?.identity ? "primary" : "default"}
                />
                <Chip
                  label={
                    player?.evidence?.length
                      ? "Evidence submitted"
                      : "Evidence pending"
                  }
                  color={player?.evidence?.length ? "primary" : "default"}
                />
                <Chip
                  label={caseFile ? "Case file locked" : "Case file pending"}
                  color={caseFile ? "primary" : "default"}
                />
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Next steps</Typography>
              <Typography variant="body2" color="text.secondary">
                Visit The Murder to claim your alias, confirm your secret
                identity, and submit evidence. Use The Notebook to track clues
                and the Crime Computer when you are ready to accuse.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => router.push(`/investigation/${code}/murder`)}
                >
                  Go to The Murder
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/investigation/${code}/notebook`)}
                >
                  Open The Notebook
                </Button>
                <Button
                  variant="text"
                  onClick={() =>
                    router.push(`/investigation/${code}/crime-computer`)
                  }
                >
                  Crime Computer
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
