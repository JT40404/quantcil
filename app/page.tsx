import { discover } from "@/lib/council";
import { cg } from "@/lib/coingecko";
import { QUANTS, QUANT_ORDER } from "@/lib/quants";
import { change, price } from "@/lib/format";
import type { CouncilCall } from "@/lib/types";
import { Nav } from "@/components/Nav";
import { Clock } from "@/components/Clock";
import { AsciiTape } from "@/components/AsciiTape";
import { CallsBoard } from "@/components/CallsBoard";
import { AskCouncil } from "@/components/AskCouncil";
import { SignalChip } from "@/components/SignalChip";

// Re-run discovery at most every 2 minutes (ISR).
export const revalidate = 120;

const CODES: Record<string, string> = { momo: "m", flow: "f", risk: "r", fade: "c" };

async function solPrice() {
  try {
    const r = await cg<any>("/simple/price", { ids: "solana", vs_currencies: "usd", include_24hr_change: true }, 60);
    return { usd: r?.solana?.usd as number, ch: r?.solana?.usd_24h_change as number };
  } catch {
    return null;
  }
}

export default async function Home() {
  let calls: CouncilCall[] = [];
  let loadError: string | null = null;
  try {
    calls = await discover();
  } catch (e: any) {
    loadError = e?.message ?? "Couldn't reach CoinGecko.";
  }
  const sol = await solPrice();
  const updated = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

  const count = (s: string) => calls.filter((c) => c.verdict === s).length;
  const passed = calls.filter((c) => !c.vetoed).length;
  const solCh = change(sol?.ch);

  // Each quant's favourite coin right now: their highest-scoring vote.
  const topPicks = Object.fromEntries(
    QUANT_ORDER.map((q) => {
      const best = [...calls]
        .map((c) => ({ c, v: c.votes.find((v) => v.quant === q)! }))
        .sort((a, b) => b.v.score - a.v.score)[0];
      return [q, best];
    })
  );

  return (
    <>
      <Nav />

      <main id="top">
        {/* Intro row */}
        <div className="grid">
          <section className="cell span-2">
            <h1 className="h xl">Four quants.<br />One council.</h1>
            <p className="main-text">
              The Quantcil scans Solana&apos;s trending meme coins, screens out rugs, and lets four models vote on
              what&apos;s left. Every call shows its reasoning. Bring your own coin and they&apos;ll vote on that too.
            </p>
          </section>

          <section className="cell" aria-labelledby="members-h">
            <h2 id="members-h" className="h">Members</h2>
            <ul className="legend">
              {QUANT_ORDER.map((id) => (
                <li key={id}>
                  <b>({CODES[id]})</b> - {QUANTS[id].role}
                </li>
              ))}
              <li><b>(v)</b> - risk holds the veto</li>
            </ul>
          </section>

          <section className="cell tape-cell" aria-label="Decorative price tape">
            <AsciiTape bias={sol?.ch ?? 0} />
          </section>
        </div>

        {/* Warning */}
        <div className="grid">
          <div className="cell span-4">
            <p className="warning" style={{ margin: 0 }}>
              <b>(!)</b>
              <span>
                Automated opinions, not financial advice. Meme coins can go to zero in minutes. Never trade more than you
                can afford to lose.
              </span>
            </p>
          </div>
        </div>

        {/* Calls */}
        <div className="grid">
          <section id="calls" className="cell span-4">
            {loadError ? (
              <>
                <h2 className="h">Calls</h2>
                <div className="notice error" role="alert">
                  Couldn&apos;t load market data: {loadError}. Check that COINGECKO_API_KEY is set, then refresh.
                </div>
              </>
            ) : (
              <CallsBoard calls={calls} />
            )}
          </section>
        </div>

        {/* Ask / status / method */}
        <div className="grid">
          <section id="ask" className="cell span-2">
            <AskCouncil />
          </section>

          <section className="cell" aria-labelledby="status-h">
            <h2 id="status-h" className="h">Council status</h2>
            <div className="rows">
              <div className="row"><span>Updated</span><span>{updated} ET</span></div>
              <div className="row">
                <span>SOL</span>
                <span>{price(sol?.usd)} <span className={solCh.cls}>{solCh.text}</span></span>
              </div>
              <div className="row"><span>Scanned</span><span>{calls.length}</span></div>
              <div className="row"><span>Passed screen</span><span>{passed}</span></div>
              <div className="row"><span>Buy</span><span>{count("BUY")}</span></div>
              <div className="row"><span>Watch</span><span>{count("WATCH")}</span></div>
              <div className="row"><span>Avoid</span><span>{count("AVOID")}</span></div>
            </div>
          </section>

          <section id="method" className="cell" aria-labelledby="method-h">
            <h2 id="method-h" className="h">Method</h2>
            <ol className="steps">
              <li><sup>01</sup><div><b>Scan</b><span>Trending Solana pools, last hour and day. Stables and majors skipped.</span></div></li>
              <li><sup>02</sup><div><b>Screen</b><span>Mint and freeze authority, liquidity, top holders, dev bags, bonding curve.</span></div></li>
              <li><sup>03</sup><div><b>Vote</b><span>Each quant scores 0–100 and votes buy, watch or avoid.</span></div></li>
              <li><sup>04</sup><div><b>Call</b><span>Three buys make a buy. A risk avoid vetoes. Splits are watch.</span></div></li>
            </ol>
          </section>
        </div>

        {/* The quants */}
        <div className="grid" id="members">
          {QUANT_ORDER.map((id) => {
            const q = QUANTS[id];
            const pick = topPicks[id];
            return (
              <article className="cell" key={id}>
                <div className="initials">({CODES[id]}) {q.role}</div>
                <h3 className="h">{q.name}</h3>
                <p className="quant-thesis">{q.thesis}</p>
                <div className="pick">
                  <div>
                    <small>Highest score today</small>
                    <strong>{pick ? pick.c.coin.symbol : "—"}</strong>
                  </div>
                  {pick && <SignalChip signal={pick.v.signal} />}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="grid">
        <div className="cell foot">All rights reserved ({new Date().getFullYear()})</div>
        <div className="cell foot"><Clock /></div>
        <div className="cell span-2 foot">
          Automated opinions for entertainment and education only — not financial, investment or tax advice. Meme coins
          are extremely volatile and often lose all value. Data from CoinGecko and GeckoTerminal.
        </div>
      </footer>
    </>
  );
}
