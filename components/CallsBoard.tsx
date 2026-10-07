"use client";

import { useState } from "react";
import type { CouncilCall, Signal } from "@/lib/types";
import { change, price, usd } from "@/lib/format";
import { SignalChip } from "./SignalChip";
import { CallDetail } from "./CallDetail";
import { VoteCodes } from "./VoteCodes";

type Filter = "ALL" | Signal;
const FILTERS: Filter[] = ["ALL", "BUY", "WATCH", "AVOID"];

export function CallsBoard({ calls }: { calls: CouncilCall[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const shown = filter === "ALL" ? calls : calls.filter((c) => c.verdict === filter);

  return (
    <>
      <div className="calls-head">
        <h2 className="h" style={{ marginBottom: 0 }}>Today&apos;s calls</h2>
        <div className="filters" role="group" aria-label="Filter by verdict">
          {FILTERS.map((f) => (
            <button key={f} type="button" className="filter" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "ALL" ? "all" : `${f.toLowerCase()} (${calls.filter((c) => c.verdict === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="empty">No {filter.toLowerCase()} calls right now. Try another filter.</div>
      ) : (
        <ul className="tracks">
          {shown.map((call) => {
            const c = call.coin;
            const isOpen = open === c.address;
            const d24 = change(c.priceChange.h24);
            return (
              <li key={c.address} className="track" data-open={isOpen}>
                <button
                  type="button"
                  className="track-btn"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : c.address)}
                >
                  {c.imageUrl ? <img className="thumb" src={c.imageUrl} alt="" /> : <span className="thumb" />}
                  <span>
                    <span className="t-title">{c.symbol}</span>
                    <span className="t-name">{c.name}</span>
                  </span>
                  <VoteCodes call={call} />
                  <SignalChip signal={call.verdict} big />
                  <span className="t-nums">
                    <b>{price(c.priceUsd)}</b> <span className={d24.cls}>{d24.text}</span>
                    <br />
                    {usd(c.liquidityUsd)} liq
                  </span>
                </button>
                {isOpen && <CallDetail call={call} />}
              </li>
            );
          })}
        </ul>
      )}
      <p className="footnote">
        Pulled from Solana&apos;s trending pools and refreshed every couple of minutes. Three buy votes make a council buy.
        An avoid from the risk screen vetoes it. Tap a coin for the reasoning.
      </p>
    </>
  );
}
