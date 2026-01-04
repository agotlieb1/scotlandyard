import type { Metadata } from "next";
import { Caveat, Crimson_Pro, Special_Elite } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const dossierFont = Crimson_Pro({
  variable: "--font-dossier",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const typewriterFont = Special_Elite({
  variable: "--font-typewriter",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const handwritingFont = Caveat({
  variable: "--font-handwriting",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scotland Yard App",
  description: "Investigation companion app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dossierFont.variable} ${typewriterFont.variable} ${handwritingFont.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
