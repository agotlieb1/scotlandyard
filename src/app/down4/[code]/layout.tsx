import type { Metadata } from "next";

import { fetchCrewName } from "@/lib/down4-server";
import { normalizeInvestigationCode } from "@/lib/investigation-code";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = normalizeInvestigationCode(rawCode);
  const crewName = await fetchCrewName(code);
  const label = crewName || `Crew ${code}`;

  return {
    title: `Down4 · ${label}`,
    // Per-crew manifest, so "add to home screen" pins this crew.
    manifest: `/down4/${code}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: crewName || "Down4",
      statusBarStyle: "black-translucent",
    },
    other: {
      // Next emits the modern `mobile-web-app-capable`; iOS before 16.4 only
      // honours the prefixed one.
      "apple-mobile-web-app-capable": "yes",
    },
  };
}

export default function Down4CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
