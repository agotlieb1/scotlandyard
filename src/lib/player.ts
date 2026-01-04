const PLAYER_STORAGE_KEY = "sya_player_id";

export const getPlayerId = () => {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(PLAYER_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(PLAYER_STORAGE_KEY, nextId);
  return nextId;
};
