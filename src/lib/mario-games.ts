import { generateInvestigationCode } from "./investigation-code";
import { getSupabaseClient } from "./supabase/client";
import type { MarioGame, MarioGamePlayer, MarioGameState, PlayerBoard } from "./mario-types";
import type { GameCard } from "@/app/mario-house-party/types";

const MAX_CREATE_ATTEMPTS = 5;

// ============================================
// GAME CREATION & FETCHING
// ============================================

export const createMarioGame = async (displayDeviceId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const code = generateInvestigationCode();
    const { error } = await supabase
      .from("mario_games")
      .insert({ code, display_device_id: displayDeviceId });

    if (error) {
      if (error.code === "23505") {
        continue; // Code collision, retry
      }
      return { error: error.message };
    }

    return { code };
  }

  return { error: "Could not generate a unique game code." };
};

export const fetchMarioGame = async (code: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("mario_games")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Game not found." };
  }

  return { data: data as MarioGame };
};

// ============================================
// PLAYER OPERATIONS
// ============================================

export const fetchMarioPlayers = async (code: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("mario_game_players")
    .select("*")
    .eq("game_code", code);

  if (error) {
    return { error: error.message };
  }

  return { data: (data ?? []) as MarioGamePlayer[] };
};

export const upsertMarioPlayer = async (
  code: string,
  playerId: string,
  playerColor: string,
  playerName?: string
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("mario_game_players")
    .upsert(
      {
        game_code: code,
        player_id: playerId,
        player_color: playerColor,
        player_name: playerName || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "game_code,player_id" }
    );

  if (error) {
    return { error: error.message };
  }

  const { data, error: fetchError } = await supabase
    .from("mario_game_players")
    .select("*")
    .eq("game_code", code)
    .eq("player_id", playerId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!data) {
    return { error: "Unable to load player details." };
  }

  return { data: data as MarioGamePlayer };
};

export const updatePlayerName = async (
  code: string,
  playerId: string,
  playerName: string
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("mario_game_players")
    .update({
      player_name: playerName,
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", code)
    .eq("player_id", playerId);

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};

export const updatePlayerHand = async (
  code: string,
  playerId: string,
  hand: GameCard[]
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("mario_game_players")
    .update({
      hand,
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", code)
    .eq("player_id", playerId);

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};

export const updatePlayerBoard = async (
  code: string,
  playerId: string,
  board: PlayerBoard
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("mario_game_players")
    .update({
      board,
      updated_at: new Date().toISOString(),
    })
    .eq("game_code", code)
    .eq("player_id", playerId);

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};

// ============================================
// GAME STATE OPERATIONS
// ============================================

export const fetchGameState = async (code: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("mario_game_state")
    .select("*")
    .eq("game_code", code)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Game state not found." };
  }

  return { data: data as MarioGameState };
};

export const upsertGameState = async (
  code: string,
  state: Partial<Omit<MarioGameState, "game_code" | "updated_at">>
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("mario_game_state")
    .upsert({
      game_code: code,
      ...state,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};

export const updateGameStatus = async (
  code: string,
  status: "setup" | "playing" | "finished"
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const updates: Partial<MarioGame> = { status };
  if (status === "playing") {
    updates.started_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("mario_games")
    .update(updates)
    .eq("code", code);

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
};
