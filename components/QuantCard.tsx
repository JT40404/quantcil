import { CHARACTERS } from "@/lib/sprites";
import { QUANTS } from "@/lib/quants";
import type { CouncilCall, QuantId } from "@/lib/types";
import { Sprite } from "./Pixels";
import { SignalChip } from "./SignalChip";

const SEGMENTS = 8;

function Bar({ label, value }: { label: string; value: number }) {
  const on = Math.round((Math.max(0, Math.min(100, value)) / 100) * SEGMENTS);
  return (
    <div className="bar-row">
      <span>{label}</span>
      <span className="segs" role="img" aria-label={`${label} ${Math.round(value)} out of 100`}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <i key={i} className={i < on ? (i >= SEGMENTS - 2 ? "on hi" : "on") : ""} />
        ))}
      </span>
    </div>
  );
}

function liqScore(liq: number | null) {
  if (!liq || liq <= 0) return 0;
  return ((Math.log10(liq) - 4) / 3) * 100; // $10K → 0, $10M → 100
}

export function QuantCard({ id, index, pick }: { id: QuantId; index: number; pick?: CouncilCall }) {
  const q = QUANTS[id];
  const score = (k: QuantId) => pick?.votes.find((v) => v.quant === k)?.score ?? 0;
  const mine = pick?.votes.find((v) => v.quant === id);
  return (
    <article className="qcard">
      <header className="qcard-top">
        <span>QNT_00{index + 1}</span>
        <span className="blink" aria-hidden="true" />
      </header>
      <div className="qcard-body">
        <Sprite art={CHARACTERS[id]} size={72} className="qcard-sprite" />
        <div className="bars">
          <Bar label="Risk" value={score("risk")} />
          <Bar label="Momentum" value={score("momo")} />
          <Bar label="Liquidity" value={liqScore(pick?.coin.liquidityUsd ?? null)} />
          <Bar label="Conviction" value={pick?.conviction ?? 0} />
        </div>
      </div>
      <div className="qcard-foot">
        <div>
          <div className="qname">{q.name}</div>
          <div className="qrole">{q.role}</div>
        </div>
        <div className="qpick">
          <span>{pick ? `$${pick.coin.symbol}` : "—"}</span>
          {mine && <SignalChip signal={mine.signal} />}
        </div>
      </div>
      <p className="qthesis">{q.thesis}</p>
    </article>
  );
}
