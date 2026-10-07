import type { Metadata } from "next";
import { Silkscreen, VT323 } from "next/font/google";
import "./globals.css";

const display = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-display" });
const body = VT323({ subsets: ["latin"], weight: ["400"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "The Quantcil — Solana meme coin calls",
  description:
    "Four quant models score trending Solana meme coins on momentum, order flow, rug risk and crowding. Opinions, not financial advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
