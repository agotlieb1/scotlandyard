import { Rubik } from "next/font/google";

import MarioShell from "./shell";

const tableFont = Rubik({
  variable: "--font-table",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Mario House Party",
  description: "Score the card game, and play it at the table or online.",
};

export const viewport = {
  themeColor: "#07293a",
};

export default function MarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // MUI portals dialogs and menus to document.body, outside this wrapper, so
  // publish the font variable at the root as well. Plain CSS rather than
  // emotion's GlobalStyles, so the markup is identical on server and client.
  const rootFontVars = `:root{--font-table:${tableFont.style.fontFamily};}`;

  return (
    <div className={tableFont.variable}>
      <style>{rootFontVars}</style>
      <MarioShell>{children}</MarioShell>
    </div>
  );
}
