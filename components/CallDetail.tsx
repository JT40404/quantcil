import type { CouncilCall } from "@/lib/types";
import { QUANTS } from "@/lib/quants";
import { change, price, usd } from "@/lib/format";
import { SignalChip } from "./SignalChip";

export function CallDetail({ call }: { call: CouncilCall }) {
  const c = call.coin;
  const d24 = change(c.priceChange.h24);
  return (
    <div className="detail">
      <p className="detail-summary">{call.summary}</p>

      <div className="metrics">
        <span>Price <b>{price(c.priceUsd)}</b></span>
        <span>24h <b className={d24.cls}>{d24.text}</b></span>
        <span>Liquidity <b>{usd(c.liquidityUsd)}</b></span>
        <span>Vol 24h <b>{usd(c.volumeUsd.h24)}</b></span>
        <span>Mkt cap <b>{usd(c.marketCapUsd ?? c.fdvUsd)}</b></span>
        {c.security?.holdersCount != null && <span>Holders <b>{c.security.holdersCount.toLocaleString()}</b></span>}
        <span>Conviction <b>{call.conviction}/100</b></span>
      </div>

      <div className="votes">
        {call.votes.map((v) => {
          const q = QUANTS[v.quant];
          return (
            <div className="vote" key={v.quant}>
              <div className="vote-head">
                <div className="vote-name">
                  {q.name}
                  <small>({q.role.charAt(0).toLowerCase()}) {q.role}</small>
                </div>
                <SignalChip signal={v.signal} />
              </div>
              <div>
                <div className="score">score {v.score}/100</div>
                <div className="score-bar" aria-hidden="true"><i style={{ width: `${v.score}%` }} /></div>
              </div>
              <ul>
                {v.reasons.length ? v.reasons.map((r, i) => <li key={i}>{r}</li>) : <li>Not enough data to say much.</li>}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="addr">
        Token {c.address} &nbsp;/&nbsp;{" "}
        <a href={`https://www.geckoterminal.com/solana/pools/${c.poolAddress}`} target="_blank" rel="noreferrer">
          View pool on GeckoTerminal &#8599;&#xFE0E;
        </a>
      </div>
    </div>
  );
}
