import type { CouncilCall, Signal } from "@/lib/types";
import { QUANT_ORDER } from "@/lib/quants";

const CODE: Record<string, string> = { momo: "m", flow: "f", risk: "r", fade: "c" };

/** "buy (m,f)  watch (r)  avoid (c)" — who voted what, in the legend's shorthand. */
export function VoteCodes({ call }: { call: CouncilCall }) {
  const groups: Signal[] = ["BUY", "WATCH", "AVOID"];
  return (
    <span className="t-codes">
      {groups.map((g) => {
        const who = QUANT_ORDER.filter((q) => call.votes.find((v) => v.quant === q)?.signal === g).map((q) => CODE[q]);
        if (!who.length) return null;
        return (
          <span key={g}>
            <span className="lbl">{g.toLowerCase()}</span> ({who.join(",")})
          </span>
        );
      })}
    </span>
  );
}
