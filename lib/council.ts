import { cg } from "./coingecko";
import { convene } from "./quants";
import type { AnalyzeResult, Candidate, CoinSnapshot, CouncilCall, SecurityInfo, TxnWindow } from "./types";

const NETWORK = "solana";

/** Quote-side tokens: when one of these is the pool's base, the meme is on the other side. */
const QUOTE_ADDRESSES = new Set([
  "So11111111111111111111111111111111111111112", // wSOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
]);

/** Not meme coins — skipped during discovery. Edit to taste. */
const NON_MEME_SYMBOLS = new Set([
  "SOL", "WSOL", "USDC", "USDT", "USD1", "PYUSD", "USDS", "JUP", "JTO", "RAY", "PYTH",
  "JLP", "MSOL", "JITOSOL", "BSOL", "ORCA", "W", "HNT", "RENDER", "WBTC", "CBBTC", "WETH", "ETH",
]);

const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/* ------------------------------------------------------------------ */
/* Normalising CoinGecko responses                                      */
/* ------------------------------------------------------------------ */

const n = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(x) ? x : null;
};

const yn = (v: unknown): "yes" | "no" | "unknown" => {
  if (v === true || v === "yes") return "yes";
  if (v === false || v === "no" || v === null) return v === null ? "unknown" : "no";
  return "unknown";
};

function txn(t: any): TxnWindow | null {
  if (!t) return null;
  return { buys: t.buys ?? 0, sells: t.sells ?? 0, buyers: t.buyers ?? 0, sellers: t.sellers ?? 0 };
}

interface RawToken { address: string; symbol: string; name: string; image_url: string | null }

function tokenIndex(included: any[] | undefined): Map<string, RawToken> {
  const m = new Map<string, RawToken>();
  for (const it of included ?? []) {
    if (it.type === "token") m.set(it.id, it.attributes);
  }
  return m;
}

/** Pick the meme side of a pool and build a snapshot (without security data). */
function snapshotFromPool(pool: any, tokens: Map<string, RawToken>): CoinSnapshot | null {
  const a = pool.attributes;
  const baseId = pool.relationships?.base_token?.data?.id;
  const quoteId = pool.relationships?.quote_token?.data?.id;
  const base = tokens.get(baseId);
  const quote = tokens.get(quoteId);
  if (!base) return null;

  // If the base is SOL/USDC, the coin of interest is the quote token (price is then inverted).
  const flipped = QUOTE_ADDRESSES.has(base.address) && quote && !QUOTE_ADDRESSES.has(quote.address);
  const tok = flipped ? quote! : base;

  return {
    address: tok.address,
    symbol: tok.symbol,
    name: tok.name,
    imageUrl: tok.image_url && tok.image_url !== "missing.png" ? tok.image_url : null,
    poolAddress: a.address,
    poolName: a.name,
    poolCreatedAt: a.pool_created_at ?? null,
    priceUsd: n(flipped ? a.quote_token_price_usd : a.base_token_price_usd),
    marketCapUsd: flipped ? null : n(a.market_cap_usd),
    fdvUsd: flipped ? null : n(a.fdv_usd),
    liquidityUsd: n(a.reserve_in_usd),
    // Price-change figures are for the base token; drop them when flipped rather than mislead.
    priceChange: flipped
      ? { m5: null, h1: null, h6: null, h24: null }
      : {
          m5: n(a.price_change_percentage?.m5),
          h1: n(a.price_change_percentage?.h1),
          h6: n(a.price_change_percentage?.h6),
          h24: n(a.price_change_percentage?.h24),
        },
    volumeUsd: { h1: n(a.volume_usd?.h1), h6: n(a.volume_usd?.h6), h24: n(a.volume_usd?.h24) },
    // Buys/sells are from the base token's point of view; swap them if flipped.
    txns: {
      h1: flipped ? swap(txn(a.transactions?.h1)) : txn(a.transactions?.h1),
      h6: flipped ? swap(txn(a.transactions?.h6)) : txn(a.transactions?.h6),
      h24: flipped ? swap(txn(a.transactions?.h24)) : txn(a.transactions?.h24),
    },
    sentiment: {
      positivePct: n(a.sentiment_vote_positive_percentage),
      negativePct: n(a.sentiment_vote_negative_percentage),
      susReports: n(a.community_sus_report),
    },
    security: null,
  };
}

function swap(t: TxnWindow | null): TxnWindow | null {
  return t && { buys: t.sells, sells: t.buys, buyers: t.sellers, sellers: t.buyers };
}

async function fetchSecurity(address: string): Promise<SecurityInfo | null> {
  try {
    const res = await cg(`/onchain/networks/${NETWORK}/tokens/${address}/info`, {}, 600);
    const a = res?.data?.attributes;
    if (!a) return null;
    const lp = a.launchpad_details;
    return {
      gtScore: n(a.gt_score),
      gtVerified: !!a.gt_verified,
      holdersCount: n(a.holders?.count),
      top10Pct: n(a.holders?.distribution_percentage?.top_10),
      mintAuthority: yn(a.mint_authority),
      freezeAuthority: yn(a.freeze_authority),
      isHoneypot: yn(a.is_honeypot),
      devHoldingPct: n(a.developer_holding_percentage),
      bondingCurveComplete: lp ? !!lp.completed : null,
      categories: Array.isArray(a.categories) ? a.categories : [],
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Discovery: the council finds its own coins                           */
/* ------------------------------------------------------------------ */

const VERDICT_RANK = { BUY: 0, WATCH: 1, AVOID: 2 } as const;

export async function discover(): Promise<CouncilCall[]> {
  const max = Math.min(30, Math.max(3, parseInt(process.env.QUANTCIL_MAX_COINS ?? "12", 10) || 12));
  const common = { include: "base_token,quote_token", include_gt_community_data: true };

  // Short-term and day-long trending lists, so fresh movers and established runners both show up.
  const lists = await Promise.allSettled([
    cg(`/onchain/networks/${NETWORK}/trending_pools`, { ...common, duration: "1h", page: 1 }, 120),
    cg(`/onchain/networks/${NETWORK}/trending_pools`, { ...common, duration: "1h", page: 2 }, 120),
    cg(`/onchain/networks/${NETWORK}/trending_pools`, { ...common, duration: "24h", page: 1 }, 120),
  ]);

  const byToken = new Map<string, CoinSnapshot>();
  for (const l of lists) {
    if (l.status !== "fulfilled") continue;
    const tokens = tokenIndex(l.value.included);
    for (const pool of l.value.data ?? []) {
      const s = snapshotFromPool(pool, tokens);
      if (!s || QUOTE_ADDRESSES.has(s.address) || NON_MEME_SYMBOLS.has(s.symbol.toUpperCase())) continue;
      const prev = byToken.get(s.address);
      // Keep the deepest pool per token (first-seen order preserved by Map).
      if (!prev || (s.liquidityUsd ?? 0) > (prev.liquidityUsd ?? 0)) byToken.set(s.address, s);
    }
  }

  if (byToken.size === 0 && lists.every((l) => l.status === "rejected")) {
    throw (lists[0] as PromiseRejectedResult).reason;
  }

  const picks = [...byToken.values()].slice(0, max);
  const secs = await Promise.all(picks.map((p) => fetchSecurity(p.address)));
  picks.forEach((p, i) => (p.security = secs[i]));

  return picks
    .map(convene)
    .sort((a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] || b.conviction - a.conviction);
}

/* ------------------------------------------------------------------ */
/* Ask the council: analyze a coin a visitor brings                     */
/* ------------------------------------------------------------------ */

export async function analyzeAddress(address: string): Promise<AnalyzeResult> {
  const res = await cg(
    `/onchain/networks/${NETWORK}/tokens/${address}/pools`,
    { include: "base_token,quote_token", page: 1 },
    60
  ).catch(() => null);

  const tokens = tokenIndex(res?.included);
  const snaps = (res?.data ?? [])
    .map((p: any) => snapshotFromPool(p, tokens))
    .filter((s: CoinSnapshot | null): s is CoinSnapshot => !!s && s.address === address)
    .sort((a: CoinSnapshot, b: CoinSnapshot) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0));

  if (!snaps.length) return { kind: "not_found", query: address };

  const coin = snaps[0];
  coin.security = await fetchSecurity(address);
  return { kind: "call", call: convene(coin) };
}

export async function analyze(rawQuery: string): Promise<AnalyzeResult> {
  const q = rawQuery.trim().replace(/^\$/, "");
  if (!q) return { kind: "not_found", query: rawQuery };
  if (SOLANA_ADDRESS.test(q)) return analyzeAddress(q);

  const res = await cg(
    `/onchain/search/pools`,
    { query: q, network: NETWORK, include: "base_token,quote_token", page: 1 },
    120
  );
  const tokens = tokenIndex(res?.included);

  const byToken = new Map<string, Candidate>();
  for (const pool of res?.data ?? []) {
    const s = snapshotFromPool(pool, tokens);
    if (!s || QUOTE_ADDRESSES.has(s.address)) continue;
    const c = byToken.get(s.address) ?? {
      address: s.address, symbol: s.symbol, name: s.name, imageUrl: s.imageUrl, liquidityUsd: 0, volume24hUsd: 0,
    };
    c.liquidityUsd = (c.liquidityUsd ?? 0) + (s.liquidityUsd ?? 0);
    c.volume24hUsd = (c.volume24hUsd ?? 0) + (s.volumeUsd.h24 ?? 0);
    byToken.set(s.address, c);
  }

  const all = [...byToken.values()];
  const lower = q.toLowerCase();
  const exact = all.filter((c) => c.symbol.toLowerCase() === lower || c.name.toLowerCase() === lower);
  const pool = (exact.length ? exact : all).sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0));

  if (!pool.length) return { kind: "not_found", query: q };

  // Copycat tickers are everywhere. Only auto-pick when one coin clearly dominates liquidity.
  const [top, second] = pool;
  if (!second || (top.liquidityUsd ?? 0) >= 10 * (second.liquidityUsd ?? 0)) {
    return analyzeAddress(top.address);
  }
  return { kind: "ambiguous", query: q, candidates: pool.slice(0, 6) };
}
