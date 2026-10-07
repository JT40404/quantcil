export { usd } from "./quants";

export function price(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return "—";
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  if (n === 0) return "$0";
  // Tiny meme prices: show 4 significant digits.
  return `$${n.toPrecision(4).replace(/0+$/, "")}`;
}

export function change(n: number | null | undefined): { text: string; cls: string } {
  if (n == null || !isFinite(n)) return { text: "—", cls: "" };
  const t = `${n >= 0 ? "+" : ""}${n.toFixed(Math.abs(n) < 10 ? 1 : 0)}%`;
  return { text: t, cls: n > 0 ? "up" : n < 0 ? "down" : "" };
}

export function shortAddr(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}
