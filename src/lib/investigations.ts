import { generateInvestigationCode } from "./investigation-code";
import { getSupabaseClient } from "./supabase/client";
import type {
  EvidenceItem,
  InvestigationAccusation,
  Investigation,
  InvestigationCaseFile,
  InvestigationPlayer,
} from "./types";

const MAX_CREATE_ATTEMPTS = 5;

export const createInvestigation = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const code = generateInvestigationCode();
    const { error } = await supabase
      .from("investigations")
      .insert({ code });

    if (error) {
      if (error.code === "23505") {
        continue;
      }
      return { error: error.message };
    }

    return { code };
  }

  return { error: "Could not generate a unique investigation code." };
};

export const fetchInvestigation = async (code: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("investigations")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Investigation not found." };
  }

  return { data: data as Investigation };
};

export const fetchPlayers = async (code: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("investigation_players")
    .select("*")
    .eq("investigation_code", code);

  if (error) {
    return { error: error.message };
  }

  return { data: (data ?? []) as InvestigationPlayer[] };
};

export const upsertPlayer = async (code: string, playerId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("investigation_players")
    .upsert(
      {
        investigation_code: code,
        player_id: playerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "investigation_code,player_id" }
    );

  if (error) {
    return { error: error.message };
  }

  const { data, error: fetchError } = await supabase
    .from("investigation_players")
    .select("*")
    .eq("investigation_code", code)
    .eq("player_id", playerId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!data) {
    return { error: "Unable to load player details." };
  }

  return { data: data as InvestigationPlayer };
};

export const lockAlias = async (
  code: string,
  playerId: string,
  aliasTitle: string,
  aliasColor: string
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("investigation_players")
    .update({
      alias_title: aliasTitle,
      alias_color: aliasColor,
      alias_locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq("investigation_code", code)
    .eq("player_id", playerId);

  if (error) {
    return { error: error.message, code: error.code };
  }

  return { ok: true };
};

export const updateIdentity = async (
  code: string,
  playerId: string,
  identity: string
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("investigation_players")
    .update({
      identity,
      is_murderer: identity === "The Murderer",
      updated_at: new Date().toISOString(),
    })
    .eq("investigation_code", code)
    .eq("player_id", playerId);

  if (error) {
    return { error: error.message, code: error.code };
  }

  return { ok: true };
};

export const submitEvidence = async (
  code: string,
  playerId: string,
  evidence: EvidenceItem[]
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("investigation_players")
    .update({
      evidence,
      updated_at: new Date().toISOString(),
    })
    .eq("investigation_code", code)
    .eq("player_id", playerId);

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};

export const updateNotebookChecks = async (
  code: string,
  playerId: string,
  notebookChecks: EvidenceItem[]
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("investigation_players")
    .update({
      notebook_checks: notebookChecks,
      updated_at: new Date().toISOString(),
    })
    .eq("investigation_code", code)
    .eq("player_id", playerId);

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};

export const upsertCaseFile = async (
  code: string,
  caseFile: Omit<InvestigationCaseFile, "investigation_code" | "created_at">
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("investigation_case_files")
    .upsert({
      investigation_code: code,
      murderer_alias: caseFile.murderer_alias,
      weapon: caseFile.weapon,
      location: caseFile.location,
      motive: caseFile.motive,
    });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};

export const fetchCaseFile = async (code: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("investigation_case_files")
    .select("*")
    .eq("investigation_code", code)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Case file not found." };
  }

  return { data: data as InvestigationCaseFile };
};

export const createAccusation = async (
  code: string,
  payload: Omit<InvestigationAccusation, "id" | "created_at" | "investigation_code">
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("investigation_accusations").insert({
    investigation_code: code,
    ...payload,
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};

export const fetchAccusations = async (code: string, limit?: number) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  let query = supabase
    .from("investigation_accusations")
    .select("*")
    .eq("investigation_code", code)
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data: (data ?? []) as InvestigationAccusation[] };
};
