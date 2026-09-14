"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  MAX_DOWN_FOR_LENGTH,
  MAX_NAME_LENGTH,
  fetchCrew,
  fetchMembers,
  joinCrew,
  leaveCrew,
  normalizeCrewCode,
  updateStatus,
} from "@/lib/down4";
import { getPlayerId } from "@/lib/player";
import { formatRelativeTime } from "@/lib/relative-time";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Down4Crew, Down4Member } from "@/lib/types";

const SAVE_DEBOUNCE_MS = 600;

const GRID_COLUMNS = {
  xs: "1fr",
  sm: "minmax(120px, 1fr) auto minmax(0, 2fr)",
};

export default function Down4BoardPage() {
  const router = useRouter();
  const params = useParams<{ code?: string }>();
  const code = useMemo(
    () =>
      normalizeCrewCode(
        Array.isArray(params.code) ? params.code[0] ?? "" : params.code ?? ""
      ),
    [params.code]
  );
  const memberId = useMemo(() => getPlayerId(), []);

  const [crew, setCrew] = useState<Down4Crew | null>(null);
  const [members, setMembers] = useState<Down4Member[]>([]);
  const [nameDraft, setNameDraft] = useState("");
  const [downForDraft, setDownForDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me = useMemo(
    () => members.find((member) => member.member_id === memberId) ?? null,
    [members, memberId]
  );
  const others = useMemo(
    () => members.filter((member) => member.member_id !== memberId),
    [members, memberId]
  );
  const downCount = members.filter((member) => member.is_down).length;

  const reloadMembers = useCallback(async () => {
    const result = await fetchMembers(code);
    if ("error" in result) {
      setStatus(result.error);
      return;
    }
    setMembers(result.data);
  }, [code]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!code) {
        setStatus("Missing crew code.");
        setIsLoading(false);
        return;
      }

      const crewResult = await fetchCrew(code);
      if (!isActive) {
        return;
      }
      if ("error" in crewResult) {
        setStatus(crewResult.error);
        setIsLoading(false);
        return;
      }
      setCrew(crewResult.data);

      const membersResult = await fetchMembers(code);
      if (!isActive) {
        return;
      }
      if ("error" in membersResult) {
        setStatus(membersResult.error);
      } else {
        setMembers(membersResult.data);
        const mine = membersResult.data.find(
          (member) => member.member_id === memberId
        );
        setDownForDraft(mine?.down_for ?? "");
      }
      setIsLoading(false);
    };

    load();

    return () => {
      isActive = false;
    };
  }, [code, memberId]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !code) {
      return;
    }

    const channel = supabase
      .channel(`down4:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "down4_members",
          filter: `crew_code=eq.${code}`,
        },
        () => {
          reloadMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, reloadMembers]);

  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    },
    []
  );

  const applyUpdate = useCallback(
    async (changes: { is_down?: boolean; down_for?: string }) => {
      const result = await updateStatus(code, memberId, changes);
      if ("error" in result) {
        setStatus(result.error);
        return;
      }
      setStatus(null);
      const updated = result.data;
      setMembers((current) =>
        current.map((member) =>
          member.member_id === updated.member_id ? updated : member
        )
      );
    },
    [code, memberId]
  );

  const handleJoin = async () => {
    setIsJoining(true);
    const result = await joinCrew(code, memberId, nameDraft);
    setIsJoining(false);

    if ("error" in result) {
      setStatus(result.error);
      return;
    }

    setStatus(null);
    setNameDraft("");
    setDownForDraft(result.data.down_for ?? "");
    await reloadMembers();
  };

  const handleToggleDown = () => {
    if (!me) {
      return;
    }
    applyUpdate({ is_down: !me.is_down });
  };

  const handleDownForChange = (value: string) => {
    setDownForDraft(value);

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      applyUpdate({ down_for: value });
    }, SAVE_DEBOUNCE_MS);
  };

  const handleDownForBlur = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (me && downForDraft !== me.down_for) {
      applyUpdate({ down_for: downForDraft });
    }
  };

  const handleLeave = async () => {
    const result = await leaveCrew(code, memberId);
    if ("error" in result) {
      setStatus(result.error);
      return;
    }
    setDownForDraft("");
    await reloadMembers();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof window === "undefined" ? code : window.location.href
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setStatus("Unable to copy the crew link.");
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
        <Typography>Loading the board...</Typography>
      </Container>
    );
  }

  if (!crew) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Stack spacing={2}>
          <Alert severity="warning">{status ?? "Crew not found."}</Alert>
          <Button variant="outlined" onClick={() => router.push("/down4")}>
            Back to Down4
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 6, md: 10 },
        backgroundImage: "var(--map-bg)",
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
                Crew {code}
              </Typography>
              <Typography variant="h4" component="h1">
                {crew.name || "Down4"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {members.length === 0
                  ? "Nobody on the board yet."
                  : `${downCount} of ${members.length} down right now.`}
              </Typography>
            </Stack>
            <Button variant="outlined" onClick={handleCopy}>
              {copied ? "Copied" : "Copy crew link"}
            </Button>
          </Stack>

          {status && <Alert severity="warning">{status}</Alert>}

          {!me && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Add yourself to the board</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your name shows up for the whole crew. This device remembers
                  you, so bookmark the page and come straight back.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Your name"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleJoin();
                      }
                    }}
                    inputProps={{ maxLength: MAX_NAME_LENGTH }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleJoin}
                    disabled={isJoining}
                  >
                    {isJoining ? "Joining..." : "Join the board"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: { xs: "none", sm: "grid" },
                  gridTemplateColumns: GRID_COLUMNS,
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Friend
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="overline" color="text.secondary">
                  Down for
                </Typography>
              </Box>

              {members.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Share the crew link and the list fills in.
                </Typography>
              )}

              {me && (
                <>
                  <Divider />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: GRID_COLUMNS,
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle1">
                        {me.name}{" "}
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          (you)
                        </Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated {formatRelativeTime(me.updated_at)}
                      </Typography>
                    </Stack>
                    <Button
                      onClick={handleToggleDown}
                      variant={me.is_down ? "contained" : "outlined"}
                      color={me.is_down ? "primary" : "inherit"}
                      sx={{
                        minWidth: 104,
                        justifySelf: { xs: "flex-start", sm: "center" },
                        color: me.is_down ? undefined : "text.disabled",
                        borderColor: me.is_down ? undefined : "divider",
                      }}
                    >
                      Down4
                    </Button>
                    <TextField
                      value={downForDraft}
                      onChange={(event) =>
                        handleDownForChange(event.target.value)
                      }
                      onBlur={handleDownForBlur}
                      placeholder="Pizza tonight? A run at 6? Say the word."
                      size="small"
                      fullWidth
                      inputProps={{ maxLength: MAX_DOWN_FOR_LENGTH }}
                    />
                  </Box>
                </>
              )}

              {others.map((member) => (
                <Box key={member.id}>
                  <Divider sx={{ mb: 2 }} />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: GRID_COLUMNS,
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle1">{member.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated {formatRelativeTime(member.updated_at)}
                      </Typography>
                    </Stack>
                    <Chip
                      label="Down4"
                      color={member.is_down ? "primary" : "default"}
                      variant={member.is_down ? "filled" : "outlined"}
                      sx={{
                        minWidth: 104,
                        justifySelf: { xs: "flex-start", sm: "center" },
                        color: member.is_down ? undefined : "text.disabled",
                      }}
                    />
                    <Typography
                      variant="body2"
                      color={
                        member.down_for ? "text.primary" : "text.secondary"
                      }
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {member.down_for || "Nothing yet."}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button variant="text" onClick={() => router.push("/down4")}>
              Back to Down4
            </Button>
            {me && (
              <Button variant="text" color="secondary" onClick={handleLeave}>
                Remove me from the board
              </Button>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
