"use client";

import { FormEvent, useState } from "react";
import type { AnalyzeResult } from "@/lib/types";
import { usd, shortAddr } from "@/lib/format";
import { CallDetail } from "./CallDetail";
import { SignalChip } from "./SignalChip";

export function AskCouncil() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  async function run(query: string) {
    const term = query.trim();
    if (!term) {
      setError("Enter a ticker, a coin name, or a Solana token address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "The council couldn't analyze that coin.");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(q);
  }

  return (
    <div className="ask">
      <div>
        <div className="kicker">Ask the council</div>
        <h2 className="title">Got a coin in mind?</h2>
        <p className="lede" style={{ marginTop: 10 }}>
          Paste a token address for an exact match, or try a ticker. All four quants will score it on the spot.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="ask-q">Ticker, name or token address</label>
          <input
            id="ask-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. BONK or DezX…B263"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Council is voting…" : "Get the council's call"}
        </button>
      </form>

      {error && <div className="notice error" role="alert">{error}</div>}

      <div aria-live="polite">
        {result?.kind === "not_found" && (
          <div className="notice">
            No Solana pools found for &ldquo;{result.query}&rdquo;. Check the spelling, or paste the token&apos;s address.
          </div>
        )}

        {result?.kind === "ambiguous" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="notice">
              Several coins use &ldquo;{result.query}&rdquo;. Copycats are common — pick the one you mean. The real one usually
              has the most liquidity.
            </div>
            <div className="candidates">
              {result.candidates.map((c) => (
                <button key={c.address} type="button" className="candidate" onClick={() => run(c.address)}>
                  {c.imageUrl ? <img className="coin-img" src={c.imageUrl} alt="" /> : <span className="coin-img" />}
                  <span className="grow">
                    <span className="coin-sym">${c.symbol}</span> <span className="coin-name">{c.name}</span>
                    <br />
                    <span className="addr">{shortAddr(c.address)}</span>
                  </span>
                  <span className="mono" style={{ fontSize: 13, color: "var(--text-2)", textAlign: "right" }}>
                    {usd(c.liquidityUsd)} liq
                    <br />
                    {usd(c.volume24hUsd)} vol
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {result?.kind === "call" && (
          <div className="result">
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px 0" }}>
              {result.call.coin.imageUrl ? (
                <img className="coin-img" src={result.call.coin.imageUrl} alt="" />
              ) : (
                <span className="coin-img" />
              )}
              <div>
                <div className="coin-sym" style={{ fontSize: 20 }}>${result.call.coin.symbol}</div>
                <div className="coin-name">{result.call.coin.name}</div>
              </div>
              <span style={{ marginLeft: "auto" }}>
                <SignalChip signal={result.call.verdict} big />
              </span>
            </div>
            <CallDetail call={result.call} />
          </div>
        )}
      </div>
    </div>
  );
}
