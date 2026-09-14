"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  MAX_ACTIVITY_LENGTH,
  MAX_AREA_LENGTH,
  MAX_NAME_LENGTH,
  clearBeacon,
  fetchBoard,
  fetchCrew,
  joinBeacon,
  joinCrew,
  leaveCrew,
  lightBeacon,
  normalizeCrewCode,
  updateBeacon,
} from "@/lib/down4";
import {
  AREA_PREPOSITION,
  buildSentence,
  groupLitBeacons,
} from "@/lib/down4-sentence";
import { getPlayerId } from "@/lib/player";
import { formatRelativeTime } from "@/lib/relative-time";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Down4Beacon, Down4Crew, Down4Member } from "@/lib/types";
import { NEON } from "../theme";

/** Beacons expire on the clock, so re-check often enough to feel live. */
const TICK_MS = 20_000;

const QUICK_UNTIL: { label: string; minutes: number }[] = [
  { label: "+1 hr", minutes: 60 },
  { label: "+2 hrs", minutes: 120 },
  { label: "+4 hrs", minutes: 240 },
];

/** "15:30" in the user's own timezone, for an <input type="time">. */
const toTimeInput = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;

/** "+2 hrs" from whenever the chip is tapped. */
const untilFromNow = (minutes: number) =>
  toTimeInput(new Date(Date.now() + minutes * 60_000));

/** A bare "15:30" means the next time it is 15:30 — today, or tomorrow. */
const timeInputToIso = (value: string) => {
  if (!value) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= Date.now()) {
    target.setDate(target.getDate() + 1);
  }
  return target.toISOString();
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
  const [beacons, setBeacons] = useState<Down4Beacon[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const [nameDraft, setNameDraft] = useState("");
  const [activityDraft, setActivityDraft] = useState("");
  const [areaDraft, setAreaDraft] = useState("");
  const [untilDraft, setUntilDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const me = useMemo(
    () => members.find((member) => member.member_id === memberId) ?? null,
    [members, memberId]
  );

  const lit = useMemo(
    () => groupLitBeacons(members, beacons, now),
    [members, beacons, now]
  );
  const myBeacon = useMemo(
    () => lit.find((entry) => entry.beacon.id === me?.beacon_id) ?? null,
    [lit, me?.beacon_id]
  );
  const otherBeacons = useMemo(
    () => lit.filter((entry) => entry.beacon.id !== me?.beacon_id),
    [lit, me?.beacon_id]
  );

  const reload = useCallback(async () => {
    const result = await fetchBoard(code);
    if ("error" in result) {
      setStatus(result.error);
      return;
    }
    setMembers(result.data.members);
    setBeacons(result.data.beacons);
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

      const boardResult = await fetchBoard(code);
      if (!isActive) {
        return;
      }
      if ("error" in boardResult) {
        setStatus(boardResult.error);
      } else {
        setMembers(boardResult.data.members);
        setBeacons(boardResult.data.beacons);
      }
      setIsLoading(false);
    };

    load();

    return () => {
      isActive = false;
    };
  }, [code]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

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
        () => reload()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "down4_beacons",
          filter: `crew_code=eq.${code}`,
        },
        () => reload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, reload]);

  type ActionResult = { error: string } | { ok: true } | { data: unknown };

  const runAction = async (action: () => Promise<ActionResult>) => {
    setIsBusy(true);
    const result = await action();
    setIsBusy(false);
    if ("error" in result) {
      setStatus(result.error);
      return false;
    }
    setStatus(null);
    await reload();
    return true;
  };

  const handleJoinCrew = () =>
    runAction(async () => {
      const result = await joinCrew(code, memberId, nameDraft);
      if ("data" in result) {
        setNameDraft("");
      }
      return result;
    });

  const handleLight = () =>
    runAction(() =>
      lightBeacon(
        code,
        memberId,
        {
          activity: activityDraft,
          area: areaDraft,
          untilAt: timeInputToIso(untilDraft),
        },
        me?.beacon_id ?? null
      )
    );

  const handleSaveEdit = async () => {
    if (!myBeacon) {
      return;
    }
    const ok = await runAction(() =>
      updateBeacon(myBeacon.beacon.id, {
        activity: activityDraft,
        area: areaDraft,
        untilAt: timeInputToIso(untilDraft),
      })
    );
    if (ok) {
      setIsEditing(false);
    }
  };

  const handleMeToo = (beaconId: string) =>
    runAction(() => joinBeacon(code, memberId, beaconId, me?.beacon_id ?? null));

  const handleTurnOff = async () => {
    const ok = await runAction(() =>
      clearBeacon(code, memberId, me?.beacon_id ?? null)
    );
    if (ok) {
      setIsEditing(false);
      setActivityDraft("");
      setAreaDraft("");
      setUntilDraft("");
    }
  };

  const handleLeave = () =>
    runAction(() => leaveCrew(code, memberId, me?.beacon_id ?? null));

  const startEditing = () => {
    if (!myBeacon) {
      return;
    }
    setActivityDraft(myBeacon.beacon.activity);
    setAreaDraft(myBeacon.beacon.area);
    setUntilDraft(
      myBeacon.beacon.until_at
        ? toTimeInput(new Date(myBeacon.beacon.until_at))
        : ""
    );
    setIsEditing(true);
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
        <Typography variant="h6">Warming up the board...</Typography>
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

  const showBuilderForm = !myBeacon || isEditing;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 7 } }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Stack spacing={0.5}>
            <Typography variant="overline" sx={{ color: NEON.cyan }}>
              {code}
            </Typography>
            <Typography variant="h3" component="h1">
              {crew.name || "Down4"}
            </Typography>
          </Stack>
          <Button size="small" variant="outlined" onClick={handleCopy}>
            {copied ? "Copied" : "Share"}
          </Button>
        </Stack>

        {status && (
          <Alert severity="warning" onClose={() => setStatus(null)}>
            {status}
          </Alert>
        )}

        {!me ? (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">What should the crew call you?</Typography>
              <TextField
                label="Your name"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleJoinCrew();
                  }
                }}
                inputProps={{ maxLength: MAX_NAME_LENGTH }}
                fullWidth
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleJoinCrew}
                disabled={isBusy}
              >
                Let me in
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Paper
            sx={{
              p: 3,
              position: "relative",
              overflow: "hidden",
              borderColor: myBeacon ? NEON.lime : undefined,
              boxShadow: myBeacon
                ? `0 0 0 1px ${NEON.lime}, 0 18px 50px -24px ${NEON.lime}`
                : undefined,
            }}
          >
            <Stack spacing={2.5}>
              {myBeacon && !isEditing ? (
                <>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: NEON.lime,
                        boxShadow: `0 0 12px 3px ${NEON.lime}`,
                        "@keyframes down4Pulse": {
                          "0%, 100%": { opacity: 1 },
                          "50%": { opacity: 0.35 },
                        },
                        animation: "down4Pulse 1.8s ease-in-out infinite",
                      }}
                    />
                    <Typography variant="overline" sx={{ color: NEON.lime }}>
                      Your beacon is lit
                    </Typography>
                  </Stack>

                  <BeaconLine
                    names={myBeacon.members.map((member) => member.name)}
                    beacon={myBeacon.beacon}
                    size="large"
                  />

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleTurnOff}
                      disabled={isBusy}
                    >
                      Turn it off
                    </Button>
                    <Button variant="outlined" onClick={startEditing}>
                      Tweak it
                    </Button>
                  </Stack>
                </>
              ) : null}

              {showBuilderForm && (
                <>
                  <Typography variant="overline" sx={{ color: NEON.lime }}>
                    {isEditing ? "Tweak your beacon" : "I'm down4..."}
                  </Typography>

                  <TextField
                    label="down4 what?"
                    InputLabelProps={{ shrink: true }}
                    placeholder="coffee, bowling, a long walk"
                    value={activityDraft}
                    onChange={(event) => setActivityDraft(event.target.value)}
                    inputProps={{ maxLength: MAX_ACTIVITY_LENGTH }}
                    fullWidth
                  />
                  <TextField
                    label="around where? (optional)"
                    InputLabelProps={{ shrink: true }}
                    placeholder="Decatur, Cosmic Lanes, my porch"
                    value={areaDraft}
                    onChange={(event) => setAreaDraft(event.target.value)}
                    inputProps={{ maxLength: MAX_AREA_LENGTH }}
                    fullWidth
                  />

                  <Stack spacing={1}>
                    <TextField
                      label="until when? (optional)"
                      type="time"
                      value={untilDraft}
                      onChange={(event) => setUntilDraft(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {QUICK_UNTIL.map((option) => (
                        <Chip
                          key={option.label}
                          label={option.label}
                          onClick={() => setUntilDraft(untilFromNow(option.minutes))}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                      {untilDraft && (
                        <Chip
                          label="no end time"
                          onClick={() => setUntilDraft("")}
                          variant="outlined"
                          size="small"
                          color="secondary"
                        />
                      )}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={isEditing ? handleSaveEdit : handleLight}
                      disabled={isBusy || !activityDraft.trim()}
                    >
                      {isEditing ? "Save it" : "Light it up"}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="text"
                        onClick={() => setIsEditing(false)}
                        disabled={isBusy}
                      >
                        Never mind
                      </Button>
                    )}
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>
        )}

        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <Box
            sx={{
              height: 6,
              borderRadius: 999,
              backgroundImage: `linear-gradient(90deg, ${NEON.lime}, ${NEON.cyan}, ${NEON.violet}, ${NEON.pink})`,
            }}
          />
          <Typography variant="overline" color="text.secondary">
            {otherBeacons.length === 0
              ? "Nobody else is lit up"
              : `${otherBeacons.length} beacon${
                  otherBeacons.length === 1 ? "" : "s"
                } lit`}
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {otherBeacons.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              When someone lights a beacon it shows up here. Send them the link
              and it fills up fast.
            </Typography>
          )}

          {otherBeacons.map((entry) => (
            <Paper key={entry.beacon.id} sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <BeaconLine
                  names={entry.members.map((member) => member.name)}
                  beacon={entry.beacon}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Typography variant="caption" color="text.secondary">
                    lit {formatRelativeTime(entry.beacon.created_at)}
                  </Typography>
                  <Button
                    variant="contained"
                    color="info"
                    onClick={() => handleMeToo(entry.beacon.id)}
                    disabled={isBusy || !me}
                  >
                    Me too!
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ pt: 2 }} flexWrap="wrap" useFlexGap>
          <Button variant="text" size="small" onClick={() => router.push("/down4")}>
            Down4 home
          </Button>
          {me && (
            <Button
              variant="text"
              size="small"
              color="secondary"
              onClick={handleLeave}
            >
              Leave this crew
            </Button>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}

function BeaconLine({
  names,
  beacon,
  size = "normal",
}: {
  names: string[];
  beacon: Down4Beacon;
  size?: "normal" | "large";
}) {
  const sentence = buildSentence(names, beacon);
  const variant = size === "large" ? "h4" : "h5";

  return (
    <Typography variant={variant} component="p" sx={{ lineHeight: 1.35 }}>
      <Box component="span">{sentence.subject} </Box>
      <Box component="span" sx={{ color: "text.secondary" }}>
        {sentence.verb} down4{" "}
      </Box>
      <Box component="span" sx={{ color: NEON.lime }}>
        {sentence.activity}
      </Box>
      {sentence.area && (
        <>
          <Box component="span" sx={{ color: "text.secondary" }}>
            {` ${AREA_PREPOSITION} `}
          </Box>
          <Box component="span" sx={{ color: NEON.cyan }}>
            {sentence.area}
          </Box>
        </>
      )}
      {sentence.until && (
        <>
          <Box component="span" sx={{ color: "text.secondary" }}>
            {" "}
            until{" "}
          </Box>
          <Box component="span" sx={{ color: NEON.pink }}>
            {sentence.until}
          </Box>
        </>
      )}
      <Box component="span">.</Box>
    </Typography>
  );
}
