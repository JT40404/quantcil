import type { Metadata } from "next";
import { Oswald, Inconsolata, PT_Sans } from "next/font/google";
import "./globals.css";

const display = Oswald({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-display" });
const mono = Inconsolata({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" });
const body = PT_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "The Quantcil — Solana meme coin calls",
  description:
    "Four quant models score trending Solana meme coins on momentum, order flow, rug risk and crowding. Opinions, not financial advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body>
        <div className="curtain" aria-hidden="true">
          <span>LOADING</span>
        </div>
        {children}
      </body>
    </html>
  );
}
