import type { CoinSnapshot, CouncilCall, QuantId, QuantVote, Signal } from "./types";

/* ------------------------------------------------------------------ */
/* The members                                                          */
/* ------------------------------------------------------------------ */

export const QUANTS: Record<
  QuantId,
  { name: string; role: string; initials: string; thesis: string; tags: string[] }
> = {
  momo: {
    name: "Priya Raman",
    role: "Momentum",
    initials: "PR",
    thesis: "Rides strength. Wants rising price, accelerating volume and buyers in control on the hourly.",
    tags: ["price trend", "volume pace", "buy pressure"],
  },
  flow: {
    name: "Marcus Hale",
    role: "Order flow",
    initials: "MH",
    thesis: "Follows the wallets. More unique buyers than sellers, healthy turnover, no signs of bot churn.",
    tags: ["unique buyers", "turnover", "bot checks"],
  },
  risk: {
    name: "Jun Takeda",
    role: "Rug risk",
    initials: "JT",
    thesis: "Runs the safety screen: authorities, liquidity, holder concentration, dev bags. Holds the veto.",
    tags: ["mint / freeze", "liquidity", "veto"],
  },
  fade: {
    name: "Dani Okoro",
    role: "Contrarian",
    initials: "DO",
    thesis: "Fades what's already crowded, looks for quiet accumulation the timeline hasn't found yet.",
    tags: ["crowding", "extension", "accumulation"],
  },
};

export const QUANT_ORDER: QuantId[] = ["momo", "flow", "risk", "fade"];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(Math.abs(n) < 10 ? 1 : 0)}%`;

export function usd(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function signalFrom(score: number): Signal {
  if (score >= 65) return "BUY";
  if (score >= 45) return "WATCH";
  return "AVOID";
}

function ratio(a?: number, b?: number): number | null {
  if (a == null || b == null || a + b === 0) return null;
  return a / (a + b);
}

/* ------------------------------------------------------------------ */
/* Momentum                                                             */
/* ------------------------------------------------------------------ */

function momentum(c: CoinSnapshot): QuantVote {
  let s = 50;
  const r: string[] = [];
  const { h1, h6, h24 } = c.priceChange;

  if (h1 != null) {
    s += clamp(h1 / 2, -15, 15);
    r.push(`${pct(h1)} in the last hour.`);
  }
  if (h6 != null) {
    s += clamp(h6 / 4, -15, 15);
    if (Math.abs(h6) > 5) r.push(`${h6 > 0 ? "Uptrend" : "Downtrend"} over 6h (${pct(h6)}).`);
  }

  const v1 = c.volumeUsd.h1, v24 = c.volumeUsd.h24;
  if (v1 != null && v24 && v24 > 0) {
    const accel = (v1 * 24) / v24;
    if (accel >= 1.5) { s += 15; r.push(`Volume is running ${accel.toFixed(1)}x its 24h pace — something's starting.`); }
    else if (accel < 0.6) { s -= 12; r.push(`Volume is fading (${accel.toFixed(1)}x the 24h pace).`); }
  }

  const bp = ratio(c.txns.h1?.buys, c.txns.h1?.sells);
  if (bp != null) {
    if (bp > 0.58) { s += 10; r.push(`Buyers are ${Math.round(bp * 100)}% of trades this hour.`); }
    else if (bp < 0.45) { s -= 10; r.push(`Sellers have the hour (${Math.round((1 - bp) * 100)}% of trades).`); }
  }

  if (h24 != null && h24 < -40) { s -= 10; r.push(`Down ${Math.abs(h24).toFixed(0)}% on the day — no trend to ride.`); }

  s = clamp(Math.round(s));
  return { quant: "momo", score: s, signal: signalFrom(s), reasons: r.slice(0, 4) };
}

/* ------------------------------------------------------------------ */
/* Order flow                                                           */
/* ------------------------------------------------------------------ */

function flow(c: CoinSnapshot): QuantVote {
  let s = 50;
  const r: string[] = [];

  const b1 = ratio(c.txns.h1?.buyers, c.txns.h1?.sellers);
  const b6 = ratio(c.txns.h6?.buyers, c.txns.h6?.sellers);
  if (b1 != null) s += (b1 - 0.5) * 80;
  if (b6 != null) {
    s += (b6 - 0.5) * 60;
    const t = c.txns.h6!;
    r.push(`${t.buyers.toLocaleString()} unique buyers vs ${t.sellers.toLocaleString()} sellers over 6h.`);
  }

  const d = c.txns.h24;
  if (d) {
    if (d.buyers < 100) { s -= 10; r.push("Thin participation — under 100 buyers in 24h."); }
    else if (d.buyers > 1000) { s += 8; }
    if (d.buyers > 0 && d.buys / d.buyers > 6) {
      s -= 8;
      r.push(`~${(d.buys / d.buyers).toFixed(0)} buys per buyer — looks like bots cycling.`);
    }
  }

  const liq = c.liquidityUsd, v24 = c.volumeUsd.h24;
  if (liq && v24 != null) {
    const turn = v24 / liq;
    if (turn > 40) { s -= 15; r.push(`Volume is ${turn.toFixed(0)}x liquidity — likely wash trading.`); }
    else if (turn >= 2 && turn <= 20) { s += 5; r.push(`Turnover ${turn.toFixed(1)}x liquidity — active but believable.`); }
    else if (turn < 0.5) { s -= 10; r.push("Barely trading relative to its pool."); }
  }

  s = clamp(Math.round(s));
  return { quant: "flow", score: s, signal: signalFrom(s), reasons: r.slice(0, 4) };
}

/* ------------------------------------------------------------------ */
/* Rug risk (veto)                                                      */
/* ------------------------------------------------------------------ */

function risk(c: CoinSnapshot): QuantVote {
  const fails: string[] = [];
  const notes: string[] = [];
  const sec = c.security;

  if (!sec) fails.push("Couldn't pull security data — won't sign off on what I can't check.");
  else {
    if (sec.mintAuthority === "yes") fails.push("Mint authority is live — supply can be inflated.");
    if (sec.freezeAuthority === "yes") fails.push("Freeze authority is live — wallets can be frozen.");
    if (sec.isHoneypot === "yes") fails.push("Flagged as a honeypot.");
    if (sec.bondingCurveComplete === false) fails.push("Still on the launchpad bonding curve.");
    if (sec.devHoldingPct != null && sec.devHoldingPct > 15) fails.push(`Dev wallet holds ${sec.devHoldingPct.toFixed(1)}% of supply.`);
    if (sec.top10Pct != null && sec.top10Pct > 60) fails.push(`Top 10 wallets hold ${sec.top10Pct.toFixed(0)}% of supply.`);
  }
  if (c.liquidityUsd != null && c.liquidityUsd < 30_000) fails.push(`Only ${usd(c.liquidityUsd)} liquidity — easy to drain.`);
  if ((c.sentiment.susReports ?? 0) >= 5) fails.push(`${c.sentiment.susReports} community scam reports.`);

  if (fails.length) {
    return { quant: "risk", score: Math.max(5, 25 - fails.length * 5), signal: "AVOID", reasons: fails.slice(0, 4) };
  }

  let s = sec!.gtScore ?? 55;
  notes.push(
    `Passes the screen: mint ${sec!.mintAuthority === "no" ? "renounced" : "unknown"}, freeze ${sec!.freezeAuthority === "no" ? "off" : "unknown"}.`
  );
  if (sec!.gtScore != null) notes.push(`GeckoTerminal trust score ${sec!.gtScore.toFixed(0)}/100.`);

  const liq = c.liquidityUsd ?? 0;
  if (liq > 500_000) { s += 10; notes.push(`Deep pool: ${usd(liq)} liquidity.`); }
  else if (liq < 100_000) { s -= 10; notes.push(`Shallow pool: ${usd(liq)} liquidity.`); }

  if (sec!.top10Pct != null && sec!.top10Pct > 40) { s -= 10; notes.push(`Top 10 hold ${sec!.top10Pct.toFixed(0)}% (includes pool & exchange wallets).`); }
  if (sec!.holdersCount != null && sec!.holdersCount < 500) { s -= 10; notes.push(`Only ${sec!.holdersCount} holders.`); }

  if (c.poolCreatedAt) {
    const ageH = (Date.now() - Date.parse(c.poolCreatedAt)) / 36e5;
    if (ageH < 24) { s -= 10; notes.push(`Pool is ${Math.max(1, Math.round(ageH))}h old — no track record.`); }
  }

  s = clamp(Math.round(s));
  return { quant: "risk", score: s, signal: signalFrom(s), reasons: notes.slice(0, 4) };
}

/* ------------------------------------------------------------------ */
/* Contrarian                                                           */
/* ------------------------------------------------------------------ */

function fade(c: CoinSnapshot): QuantVote {
  const r: string[] = [];
  const h24 = c.priceChange.h24 ?? 0;
  const h1 = c.priceChange.h1 ?? 0;
  let s: number;

  if (h24 >= 200) { s = 25; r.push(`Up ${h24.toFixed(0)}% in 24h — the crowd is already in.`); }
  else if (h24 >= 80) { s = 42; r.push(`Up ${h24.toFixed(0)}% on the day — late, but not absurd.`); }
  else if (h24 <= -60) { s = 35; r.push(`Down ${Math.abs(h24).toFixed(0)}% — catching knives isn't contrarian, it's just early.`); }
  else if (h24 >= -30 && h24 <= 40) { s = 60; r.push(`Only ${pct(h24)} on the day — not crowded yet.`); }
  else { s = 50; }

  const b6 = ratio(c.txns.h6?.buyers, c.txns.h6?.sellers);
  if (h24 >= -30 && h24 <= 40 && b6 != null && b6 > 0.55) {
    s += 12;
    r.push("Buyers quietly outnumber sellers without a price spike — accumulation.");
  }
  if (h1 > 30) { s -= 10; r.push(`${pct(h1)} in an hour — not chasing a vertical candle.`); }

  const pos = c.sentiment.positivePct;
  if (pos != null && pos >= 85) { s -= 8; r.push(`${pos.toFixed(0)}% bullish community votes — consensus is the risk.`); }

  const cap = c.marketCapUsd ?? c.fdvUsd;
  if (cap != null && cap < 1_000_000) { s -= 5; r.push(`${usd(cap)} cap — coin-flip territory.`); }

  s = clamp(Math.round(s));
  return { quant: "fade", score: s, signal: signalFrom(s), reasons: r.slice(0, 4) };
}

/* ------------------------------------------------------------------ */
/* The council vote                                                     */
/* ------------------------------------------------------------------ */

export function convene(coin: CoinSnapshot): CouncilCall {
  const votes = [momentum(coin), flow(coin), risk(coin), fade(coin)];
  const buyCount = votes.filter((v) => v.signal === "BUY").length;
  const avoidCount = votes.filter((v) => v.signal === "AVOID").length;
  const riskVote = votes.find((v) => v.quant === "risk")!;
  const vetoed = riskVote.signal === "AVOID";

  let verdict: Signal;
  if (vetoed) verdict = "AVOID";
  else if (buyCount >= 3) verdict = "BUY";
  else if (avoidCount >= 2) verdict = "AVOID";
  else verdict = "WATCH";

  const conviction = Math.round(votes.reduce((a, v) => a + v.score, 0) / votes.length);

  let summary: string;
  if (vetoed) summary = `Vetoed by ${QUANTS.risk.name}: ${riskVote.reasons[0] ?? "failed the safety screen."}`;
  else if (verdict === "BUY") summary = `${buyCount} of 4 back it. ${strongest(votes)}`;
  else if (verdict === "AVOID") summary = `${avoidCount} of 4 say stay away. ${weakest(votes)}`;
  else summary = `Split council (${buyCount} buy, ${avoidCount} avoid). Worth watching, not chasing.`;

  return { coin, votes, verdict, conviction, buyCount, vetoed, summary, analyzedAt: new Date().toISOString() };
}

function strongest(votes: QuantVote[]) {
  const v = [...votes].sort((a, b) => b.score - a.score)[0];
  return v.reasons[0] ? `${QUANTS[v.quant].name.split(" ")[0]}: ${v.reasons[0]}` : "";
}
function weakest(votes: QuantVote[]) {
  const v = [...votes].sort((a, b) => a.score - b.score)[0];
  return v.reasons[0] ? `${QUANTS[v.quant].name.split(" ")[0]}: ${v.reasons[0]}` : "";
}
