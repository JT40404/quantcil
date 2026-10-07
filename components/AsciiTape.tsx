"use client";

import { useEffect, useRef } from "react";

/**
 * A decorative ASCII price tape: a random walk drawn in characters,
 * scrolling left. Pauses on hover and stays still for reduced-motion users.
 * `bias` nudges the drift (e.g. SOL's 24h change) so the mood matches the market.
 */
const COLS = 46;
const ROWS = 22;
const RAMP = ".:-=+*#%@";

export function AsciiTape({ bias = 0 }: { bias?: number }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const drift = Math.max(-0.25, Math.min(0.25, bias / 40));
    let p = ROWS / 2;
    const series: number[] = [];
    const step = () => {
      p += (Math.random() - 0.5) * 2.2 + drift;
      if (p < 2) p = 2 + Math.random();
      if (p > ROWS - 2) p = ROWS - 2 - Math.random();
      return p;
    };
    for (let i = 0; i < COLS; i++) series.push(step());

    const render = () => {
      const lines: string[] = [];
      for (let r = 0; r < ROWS; r++) {
        const y = ROWS - r; // row height from bottom
        let line = "";
        for (let c = 0; c < COLS; c++) {
          const v = series[c];
          const dist = v - y;
          let ch: string;
          if (Math.abs(dist) < 0.5) ch = "@";
          else if (dist > 0) {
            // below the line: fade the fill toward the floor
            const k = Math.min(RAMP.length - 2, Math.floor((dist / ROWS) * (RAMP.length - 1)));
            ch = RAMP[RAMP.length - 2 - k];
          } else ch = " ";
          line += ch === "." ? `<span class="d">.</span>` : ch;
        }
        lines.push(line);
      }
      el.innerHTML = lines.join("\n");
    };

    render();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return;

    let paused = false;
    const on = () => (paused = true);
    const off = () => (paused = false);
    el.addEventListener("mouseenter", on);
    el.addEventListener("mouseleave", off);
    const id = setInterval(() => {
      if (paused || document.hidden) return;
      series.shift();
      series.push(step());
      render();
    }, 140);
    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", on);
      el.removeEventListener("mouseleave", off);
    };
  }, [bias]);

  return <pre ref={ref} className="tape" aria-hidden="true" />;
}
