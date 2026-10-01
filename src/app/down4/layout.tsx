import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";

import Down4Shell from "./shell";
import RegisterServiceWorker from "./register-sw";

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
  icons: {
    icon: "/icons/down4-192.png",
    apple: "/icons/down4-apple-180.png",
  },
};

export const viewport = {
  themeColor: "#12071f",
};

export default function Down4Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // MUI portals menus to document.body, outside this wrapper, so publish the
  // font variables at the root as well. Plain CSS rather than emotion's
  // GlobalStyles, so the markup is identical on the server and the client.
  const rootFontVars = `:root{--font-down4-display:${displayFont.style.fontFamily};--font-down4-body:${bodyFont.style.fontFamily};}`;

  return (
    <div className={`${displayFont.variable} ${bodyFont.variable}`}>
      <style>{rootFontVars}</style>
      <RegisterServiceWorker />
      <Down4Shell>{children}</Down4Shell>
    </div>
  );
}
