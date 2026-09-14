import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";

import Down4Shell from "./shell";

const displayFont = Bricolage_Grotesque({
  variable: "--font-down4-display",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Space_Grotesk({
  variable: "--font-down4-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Down4",
  description: "What the crew is down for, right now.",
};

export default function Down4Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable}`}>
      <Down4Shell>{children}</Down4Shell>
    </div>
  );
}
