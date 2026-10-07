export type Signal = "BUY" | "WATCH" | "AVOID";

export type QuantId = "momo" | "flow" | "risk" | "fade";

export interface TxnWindow {
  buys: number;
  sells: number;
  buyers: number;
  sellers: number;
}

/** Everything the quants look at for one coin, normalised from CoinGecko. */
export interface CoinSnapshot {
  address: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  poolAddress: string;
  poolName: string;
  poolCreatedAt: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  priceChange: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  volumeUsd: { h1: number | null; h6: number | null; h24: number | null };
  txns: { h1: TxnWindow | null; h6: TxnWindow | null; h24: TxnWindow | null };
  sentiment: { positivePct: number | null; negativePct: number | null; susReports: number | null };
  security: SecurityInfo | null;
}

export interface SecurityInfo {
  gtScore: number | null;
  gtVerified: boolean;
  holdersCount: number | null;
  top10Pct: number | null;
  mintAuthority: "yes" | "no" | "unknown";
  freezeAuthority: "yes" | "no" | "unknown";
  isHoneypot: "yes" | "no" | "unknown";
  devHoldingPct: number | null;
  /** null = not a launchpad token; false = still on the bonding curve */
  bondingCurveComplete: boolean | null;
  categories: string[];
}

export interface QuantVote {
  quant: QuantId;
  signal: Signal;
  score: number; // 0–100
  reasons: string[];
}

export interface CouncilCall {
  coin: CoinSnapshot;
  votes: QuantVote[];
  verdict: Signal;
  conviction: number; // 0–100, average quant score
  buyCount: number;
  vetoed: boolean;
  summary: string;
  analyzedAt: string;
}

export interface Candidate {
  address: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
}

export type AnalyzeResult =
  | { kind: "call"; call: CouncilCall }
  | { kind: "ambiguous"; query: string; candidates: Candidate[] }
  | { kind: "not_found"; query: string };
