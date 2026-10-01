import { Fraunces, Outfit } from "next/font/google";

import HomeShell from "./shell";

const displayFont = Fraunces({
  variable: "--font-brand-display",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Outfit({
  variable: "--font-brand-body",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  themeColor: "#151119",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable}`}>
      <HomeShell>{children}</HomeShell>
    </div>
  );
}
