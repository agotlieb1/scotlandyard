import { NextResponse } from "next/server";

import { fetchCrewName } from "@/lib/down4-server";
import { normalizeInvestigationCode } from "@/lib/investigation-code";

/**
 * One manifest per crew, so installing from a crew page gives you an icon that
 * opens straight back to that crew, named after it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = normalizeInvestigationCode(rawCode);
  const crewName = await fetchCrewName(code);
  const label = crewName || `Crew ${code}`;

  return NextResponse.json(
    {
      name: `Down4 · ${label}`,
      short_name: crewName || "Down4",
      description: "What the crew is down for, right now.",
      start_url: `/down4/${code}`,
      scope: "/down4",
      display: "standalone",
      orientation: "portrait",
      background_color: "#12071f",
      theme_color: "#12071f",
      categories: ["social", "lifestyle"],
      icons: [
        {
          src: "/icons/down4-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/down4-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/down4-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
}
