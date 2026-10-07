"use client";

import { Fragment, useState } from "react";
import type { CouncilCall, Signal } from "@/lib/types";
import { QUANT_ORDER } from "@/lib/quants";
import { change, price, usd } from "@/lib/format";
import { SignalChip } from "./SignalChip";
import { CallDetail } from "./CallDetail";

type Filter = "ALL" | Signal;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "BUY", label: "Buy" },
  { key: "WATCH", label: "Watch" },
  { key: "AVOID", label: "Avoid" },
];

export function CallsBoard({ calls }: { calls: CouncilCall[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const shown = filter === "ALL" ? calls : calls.filter((c) => c.verdict === filter);

  return (
    <>
      <div className="section-head">
        <div>
          <div className="kicker">Calls board</div>
          <h2 className="title">What the council found</h2>
        </div>
        <div className="filters" role="group" aria-label="Filter by verdict">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="filter"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== "ALL" && ` (${calls.filter((c) => c.verdict === f.key).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="board">
        {shown.length === 0 ? (
          <div className="empty">No {filter.toLowerCase()} calls right now. Try another filter.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Coin</th>
                <th scope="col">Price</th>
                <th scope="col">1h</th>
                <th scope="col">24h</th>
                <th scope="col">Liquidity</th>
                <th scope="col">Momentum</th>
                <th scope="col">Flow</th>
                <th scope="col">Risk</th>
                <th scope="col">Contrarian</th>
                <th scope="col">Council</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((call) => {
                const c = call.coin;
                const isOpen = open === c.address;
                const h1 = change(c.priceChange.h1);
                const h24 = change(c.priceChange.h24);
                return (
                  <Fragment key={c.address}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          className="coin-btn"
                          aria-expanded={isOpen}
                          onClick={() => setOpen(isOpen ? null : c.address)}
                        >
                          {c.imageUrl ? <img src={c.imageUrl} alt="" /> : <span className="coin-img" />}
                          <span>
                            <span className="coin-sym">${c.symbol}</span>
                            <br />
                            <span className="coin-name">{isOpen ? "Hide reasoning" : "See reasoning"}</span>
                          </span>
                        </button>
                      </td>
                      <td className="num">{price(c.priceUsd)}</td>
                      <td className={`num ${h1.cls}`}>{h1.text}</td>
                      <td className={`num ${h24.cls}`}>{h24.text}</td>
                      <td className="num">{usd(c.liquidityUsd)}</td>
                      {QUANT_ORDER.map((q) => (
                        <td key={q}>
                          <SignalChip signal={call.votes.find((v) => v.quant === q)!.signal} />
                        </td>
                      ))}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <SignalChip signal={call.verdict} big />
                          <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                            {call.vetoed ? "vetoed" : `${call.buyCount}/4 buy`}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="detail-row">
                        <td colSpan={10}>
                          <CallDetail call={call} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="footnote">
        Coins come from Solana&apos;s trending pools on GeckoTerminal, refreshed every couple of minutes. A coin needs 3 of 4
        buy votes to be a council Buy, and any Avoid from the risk screen vetoes it.
      </p>
    </>
  );
}
