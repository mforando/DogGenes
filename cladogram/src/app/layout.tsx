import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Spectral, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = Spectral({ subsets: ["latin"], weight: ["300", "400", "600"], style: ["normal", "italic"], variable: "--font-body", display: "swap" });
const label = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-label", display: "swap" });

export const metadata: Metadata = {
  title: "Reading the Dog Family Tree",
  description:
    "A scrollytelling guide to the 161-breed dog cladogram from Parker et al., Cell Reports 2017.",
};

export const viewport: Viewport = { themeColor: "#0d1110" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${label.variable}`}>
      <body>{children}</body>
    </html>
  );
}
