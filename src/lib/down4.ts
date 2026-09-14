import {
  generateInvestigationCode,
  normalizeInvestigationCode,
} from "./investigation-code";
import { getSupabaseClient } from "./supabase/client";
import type { Down4Crew, Down4Member } from "./types";

const MAX_CREATE_ATTEMPTS = 5;

// Explicit result unions so `"error" in result` narrows for callers.
export type Down4Result<T> = { error: string } | { data: T };

export const MAX_DOWN_FOR_LENGTH = 140;
export const MAX_NAME_LENGTH = 40;

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
      return { error: error.message };
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
    return { error: error.message };
  }

  if (!data) {
    return { error: "Crew not found. Check the code and try again." };
  }

  return { data: data as Down4Crew };
};

export const fetchMembers = async (
  code: string
): Promise<Down4Result<Down4Member[]>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("down4_members")
    .select("*")
    .eq("crew_code", code)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: (data ?? []) as Down4Member[] };
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
    return { error: error.message };
  }

  if (!data) {
    return { error: "Unable to load your spot on the board." };
  }

  return { data: data as Down4Member };
};

export const updateStatus = async (
  code: string,
  memberId: string,
  changes: { is_down?: boolean; down_for?: string }
): Promise<Down4Result<Down4Member>> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof changes.is_down === "boolean") {
    payload.is_down = changes.is_down;
  }

  if (typeof changes.down_for === "string") {
    payload.down_for = changes.down_for.slice(0, MAX_DOWN_FOR_LENGTH);
  }

  const { data, error } = await supabase
    .from("down4_members")
    .update(payload)
    .eq("crew_code", code)
    .eq("member_id", memberId)
    .select()
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Your spot on the board is missing. Rejoin the crew." };
  }

  return { data: data as Down4Member };
};

export const leaveCrew = async (
  code: string,
  memberId: string
): Promise<{ error: string } | { ok: true }> => {
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
    return { error: error.message };
  }

  return { ok: true };
};
