import type { CouncilCall } from "@/lib/types";
import { QUANTS } from "@/lib/quants";
import { change, price, usd } from "@/lib/format";
import { SignalChip } from "./SignalChip";

export function CallDetail({ call }: { call: CouncilCall }) {
  const c = call.coin;
  const d24 = change(c.priceChange.h24);
  return (
    <div className="detail">
      <div className="detail-top">
        <p className="detail-summary">{call.summary}</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <SignalChip signal={call.verdict} big />
          <span className="mono" style={{ color: "var(--muted)", fontSize: 13 }}>
            conviction {call.conviction}/100
          </span>
        </div>
      </div>

      <div className="metrics">
        <span>Price <b>{price(c.priceUsd)}</b></span>
        <span>24h <b className={d24.cls}>{d24.text}</b></span>
        <span>Liquidity <b>{usd(c.liquidityUsd)}</b></span>
        <span>Vol 24h <b>{usd(c.volumeUsd.h24)}</b></span>
        <span>Mkt cap <b>{usd(c.marketCapUsd ?? c.fdvUsd)}</b></span>
        {c.security?.holdersCount != null && <span>Holders <b>{c.security.holdersCount.toLocaleString()}</b></span>}
      </div>

      <div className="votes">
        {call.votes.map((v) => {
          const q = QUANTS[v.quant];
          return (
            <div className="vote" key={v.quant}>
              <div className="vote-head">
                <b>
                  {q.name}
                  <small>{q.role}</small>
                </b>
                <SignalChip signal={v.signal} />
              </div>
              <div className="meter" role="img" aria-label={`Score ${v.score} out of 100`}>
                <i style={{ width: `${v.score}%` }} />
              </div>
              <ul>
                {v.reasons.length ? v.reasons.map((r, i) => <li key={i}>{r}</li>) : <li>Not enough data to say much.</li>}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="addr">
        Token {c.address} ·{" "}
        <a href={`https://www.geckoterminal.com/solana/pools/${c.poolAddress}`} target="_blank" rel="noreferrer">
          View pool on GeckoTerminal
        </a>
      </div>
    </div>
  );
}
