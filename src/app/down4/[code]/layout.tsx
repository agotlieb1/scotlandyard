import type { Metadata } from "next";

import { normalizeInvestigationCode } from "@/lib/investigation-code";

/**
 * Deliberately does no network work: this blocks the page render, and the crew
 * name is not worth a round trip in front of every board. The board sets the
 * document title from the crew once it has loaded, and the manifest route
 * carries the name for the installed app.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = normalizeInvestigationCode(rawCode);

  return {
    title: `Down4 · Crew ${code}`,
    manifest: `/down4/${code}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: "Down4",
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
