import "server-only";

/**
 * Server-side crew lookup for metadata and the per-crew manifest. Uses the REST
 * endpoint directly so the route stays free of the browser Supabase client.
 */
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
