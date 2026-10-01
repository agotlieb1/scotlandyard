import "server-only";

/**
 * Server-side crew lookup for the per-crew manifest. Uses the REST endpoint
 * directly so the route stays free of the browser Supabase client.
 *
 * Hard timeout: this runs inside a server render, and an unbounded fetch to a
 * slow or paused project means the function is killed by the platform and the
 * request 502s. A missing name is a cosmetic loss; a 502 is not.
 */
const LOOKUP_TIMEOUT_MS = 1500;
export const fetchCrewName = async (code: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !code) {
    return null;
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/down4_crews?select=name&code=eq.${encodeURIComponent(code)}`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      return null;
    }

    const rows: unknown = await response.json();
    if (Array.isArray(rows) && rows[0] && typeof rows[0].name === "string") {
      return rows[0].name as string;
    }
    return null;
  } catch {
    return null;
  }
};
