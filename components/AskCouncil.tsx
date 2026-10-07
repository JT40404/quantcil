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
    <>
      <h2 className="h">Ask the council</h2>
      <p className="main-text" style={{ marginBottom: 28 }}>
        Bring a coin. Paste its token address for an exact match, or try a ticker. All four quants vote on the spot.
      </p>

      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="ask-q">Ticker, name or token address</label>
          <input
            id="ask-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button className="submit" type="submit" disabled={loading}>
          {loading ? "voting…" : "ask"}
        </button>
      </form>

      {error && <div className="notice error" role="alert">{error}</div>}

      <div aria-live="polite">
        {result?.kind === "not_found" && (
          <div className="notice">
            No Solana pools found for &ldquo;{result.query}&rdquo;. Check the spelling, or paste the token address.
          </div>
        )}

        {result?.kind === "ambiguous" && (
          <>
            <div className="notice">
              Several coins use &ldquo;{result.query}&rdquo;. Copycats are common. Pick the one you mean — the real one usually
              has the most liquidity.
            </div>
            <ul className="cands">
              {result.candidates.map((c) => (
                <li key={c.address}>
                  <button type="button" className="cand" onClick={() => run(c.address)}>
                    {c.imageUrl ? <img className="thumb" src={c.imageUrl} alt="" /> : <span className="thumb" />}
                    <span>
                      <span className="t-title">{c.symbol}</span>
                      <span className="t-name">{c.name} / {shortAddr(c.address)}</span>
                    </span>
                    <span className="t-nums">
                      {usd(c.liquidityUsd)} liq
                      <br />
                      {usd(c.volume24hUsd)} vol
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {result?.kind === "call" && (
          <div className="result">
            <div className="result-head">
              {result.call.coin.imageUrl ? (
                <img className="thumb" src={result.call.coin.imageUrl} alt="" />
              ) : (
                <span className="thumb" />
              )}
              <span>
                <span className="t-title">{result.call.coin.symbol}</span>
                <span className="t-name">{result.call.coin.name}</span>
              </span>
              <span style={{ marginLeft: "auto" }}>
                <SignalChip signal={result.call.verdict} big />
              </span>
            </div>
            <CallDetail call={result.call} />
          </div>
        )}
      </div>
    </>
  );
}
