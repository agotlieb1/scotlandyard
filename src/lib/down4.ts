import {
  generateInvestigationCode,
  normalizeInvestigationCode,
} from "./investigation-code";
import { getSupabaseClient } from "./supabase/client";
import type { Down4Beacon, Down4Crew, Down4Member } from "./types";

const MAX_CREATE_ATTEMPTS = 5;

export const MAX_NAME_LENGTH = 40;
export const MAX_ACTIVITY_LENGTH = 80;
export const MAX_AREA_LENGTH = 60;

// Explicit result unions so `"error" in result` narrows for callers.
export type Down4Result<T> = { error: string } | { data: T };
type WriteResult = { error: string } | { ok: true };

export type BeaconDraft = {
  activity: string;
  area: string;
  untilAt: string | null;
};

/**
 * Supabase surfaces a dropped connection as "TypeError: Failed to fetch",
 * which is meaningless to someone whose train went into a tunnel.
 */
const describeError = (message: string) =>
  typeof navigator !== "undefined" && !navigator.onLine
    ? "You are offline. The board will catch up when you are back."
    : message;

export const generateCrewCode = () => generateInvestigationCode();

export const normalizeCrewCode = (value: string) =>
  normalizeInvestigationCode(value);

export const createCrew = async (
  name: string
): Promise<{ error: string } | { code: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const code = generateCrewCode();
    const { error } = await supabase
      .from("down4_crews")
      .insert({ code, name: trimmed || null });

    if (error) {
      if (error.code === "23505") {
        continue;
      }
      return { error: describeError(error.message) };
    }

    return { code };
  }

  return { error: "Could not generate a unique crew code." };
};

export const fetchCrew = async (
  code: string
): Promise<Down4Result<Down4Crew>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("down4_crews")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return { error: describeError(error.message) };
  }

  if (!data) {
    return { error: "Crew not found. Check the code and try again." };
  }

  return { data: data as Down4Crew };
};

export const updateCrewName = async (
  code: string,
  name: string
): Promise<Down4Result<Down4Crew>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (!trimmed) {
    return { error: "Give the crew a name." };
  }

  const { data, error } = await supabase
    .from("down4_crews")
    .update({ name: trimmed })
    .eq("code", code)
    .select()
    .maybeSingle();

  if (error) {
    return { error: describeError(error.message) };
  }

  if (!data) {
    return { error: "That crew is gone." };
  }

  return { data: data as Down4Crew };
};

export type Down4CrewSummary = { code: string; name: string | null };

/** Every crew this device has joined, so you can hop between them. */
export const fetchMyCrews = async (
  memberId: string
): Promise<Down4Result<Down4CrewSummary[]>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data: memberships, error } = await supabase
    .from("down4_members")
    .select("crew_code")
    .eq("member_id", memberId);

  if (error) {
    return { error: describeError(error.message) };
  }

  const codes = [
    ...new Set((memberships ?? []).map((row) => row.crew_code as string)),
  ];
  if (codes.length === 0) {
    return { data: [] };
  }

  const { data: crews, error: crewError } = await supabase
    .from("down4_crews")
    .select("code, name")
    .in("code", codes);

  if (crewError) {
    return { error: describeError(crewError.message) };
  }

  const sorted = ((crews ?? []) as Down4CrewSummary[]).sort((a, b) =>
    (a.name || a.code).localeCompare(b.name || b.code)
  );

  return { data: sorted };
};

export type Down4Board = {
  members: Down4Member[];
  beacons: Down4Beacon[];
};

export const fetchBoard = async (
  code: string
): Promise<Down4Result<Down4Board>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const [membersResult, beaconsResult] = await Promise.all([
    supabase
      .from("down4_members")
      .select("*")
      .eq("crew_code", code)
      .order("created_at", { ascending: true }),
    supabase
      .from("down4_beacons")
      .select("*")
      .eq("crew_code", code)
      .order("created_at", { ascending: false }),
  ]);

  if (membersResult.error) {
    return { error: describeError(membersResult.error.message) };
  }
  if (beaconsResult.error) {
    return { error: describeError(beaconsResult.error.message) };
  }

  return {
    data: {
      members: (membersResult.data ?? []) as Down4Member[],
      beacons: (beaconsResult.data ?? []) as Down4Beacon[],
    },
  };
};

export const joinCrew = async (
  code: string,
  memberId: string,
  name: string
): Promise<Down4Result<Down4Member>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (!trimmed) {
    return { error: "Add your name so the crew knows who is down." };
  }

  const { data, error } = await supabase
    .from("down4_members")
    .upsert(
      {
        crew_code: code,
        member_id: memberId,
        name: trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "crew_code,member_id" }
    )
    .select()
    .maybeSingle();

  if (error) {
    return { error: describeError(error.message) };
  }

  if (!data) {
    return { error: "Unable to load your spot on the board." };
  }

  return { data: data as Down4Member };
};

const pointMemberAtBeacon = async (
  code: string,
  memberId: string,
  beaconId: string | null
): Promise<WriteResult> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("down4_members")
    .update({
      beacon_id: beaconId,
      beacon_joined_at: beaconId ? now : null,
      updated_at: now,
    })
    .eq("crew_code", code)
    .eq("member_id", memberId);

  if (error) {
    return { error: describeError(error.message) };
  }

  return { ok: true };
};

/** Delete a beacon once the last person has stepped off it. */
const sweepBeaconIfEmpty = async (beaconId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from("down4_members")
    .select("id")
    .eq("beacon_id", beaconId)
    .limit(1);

  if (error || (data && data.length > 0)) {
    return;
  }

  await supabase.from("down4_beacons").delete().eq("id", beaconId);
};

export const lightBeacon = async (
  code: string,
  memberId: string,
  draft: BeaconDraft,
  previousBeaconId: string | null
): Promise<Down4Result<Down4Beacon>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const activity = draft.activity.trim().slice(0, MAX_ACTIVITY_LENGTH);
  if (!activity) {
    return { error: "Say what you are down for." };
  }

  const { data, error } = await supabase
    .from("down4_beacons")
    .insert({
      crew_code: code,
      activity,
      area: draft.area.trim().slice(0, MAX_AREA_LENGTH),
      until_at: draft.untilAt,
    })
    .select()
    .maybeSingle();

  if (error) {
    return { error: describeError(error.message) };
  }

  if (!data) {
    return { error: "Unable to light your beacon." };
  }

  const beacon = data as Down4Beacon;
  const pointed = await pointMemberAtBeacon(code, memberId, beacon.id);
  if ("error" in pointed) {
    return { error: pointed.error };
  }

  if (previousBeaconId && previousBeaconId !== beacon.id) {
    await sweepBeaconIfEmpty(previousBeaconId);
  }

  return { data: beacon };
};

export const updateBeacon = async (
  beaconId: string,
  draft: BeaconDraft
): Promise<Down4Result<Down4Beacon>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const activity = draft.activity.trim().slice(0, MAX_ACTIVITY_LENGTH);
  if (!activity) {
    return { error: "Say what you are down for." };
  }

  const { data, error } = await supabase
    .from("down4_beacons")
    .update({
      activity,
      area: draft.area.trim().slice(0, MAX_AREA_LENGTH),
      until_at: draft.untilAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", beaconId)
    .select()
    .maybeSingle();

  if (error) {
    return { error: describeError(error.message) };
  }

  if (!data) {
    return { error: "That beacon is gone." };
  }

  return { data: data as Down4Beacon };
};

/** "Me too" — step onto someone else's beacon. */
export const joinBeacon = async (
  code: string,
  memberId: string,
  beaconId: string,
  previousBeaconId: string | null
): Promise<WriteResult> => {
  const pointed = await pointMemberAtBeacon(code, memberId, beaconId);
  if ("error" in pointed) {
    return pointed;
  }

  if (previousBeaconId && previousBeaconId !== beaconId) {
    await sweepBeaconIfEmpty(previousBeaconId);
  }

  return { ok: true };
};

export const clearBeacon = async (
  code: string,
  memberId: string,
  beaconId: string | null
): Promise<WriteResult> => {
  const pointed = await pointMemberAtBeacon(code, memberId, null);
  if ("error" in pointed) {
    return pointed;
  }

  if (beaconId) {
    await sweepBeaconIfEmpty(beaconId);
  }

  return { ok: true };
};

export const leaveCrew = async (
  code: string,
  memberId: string,
  beaconId: string | null
): Promise<WriteResult> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("down4_members")
    .delete()
    .eq("crew_code", code)
    .eq("member_id", memberId);

  if (error) {
    return { error: describeError(error.message) };
  }

  if (beaconId) {
    await sweepBeaconIfEmpty(beaconId);
  }

  return { ok: true };
};
