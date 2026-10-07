import { discover } from "@/lib/council";
import { cg } from "@/lib/coingecko";
import { QUANT_ORDER } from "@/lib/quants";
import { change, price, usd } from "@/lib/format";
import type { CouncilCall, QuantId } from "@/lib/types";
import { PixelScene, type Take, type Takes } from "@/components/PixelScene";
import { QuantCard } from "@/components/QuantCard";
import { LiveBar } from "@/components/LiveBar";
import { CallsBoard } from "@/components/CallsBoard";
import { AskCouncil } from "@/components/AskCouncil";

// Re-run discovery at most every 2 minutes (ISR).
export const revalidate = 120;

const PIPELINE = [
  { k: "Scan", d: "Trending Solana pools, last hour and day" },
  { k: "Screen", d: "Mint, freeze, liquidity, holders, dev bags" },
  { k: "Score", d: "Each quant scores 0–100" },
  { k: "Vote", d: "Buy, watch or avoid" },
  { k: "Call", d: "3 buys = buy. Risk can veto." },
];

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

  const vetoed = calls.filter((c) => c.vetoed).length;
  const buys = calls.filter((c) => c.verdict === "BUY").length;
  const volume = calls.reduce((a, c) => a + (c.coin.volumeUsd.h24 ?? 0), 0);

  // Each quant's favourite coin right now: their highest-scoring vote.
  const best = Object.fromEntries(
    QUANT_ORDER.map((q) => {
      const top = [...calls].sort(
        (a, b) => b.votes.find((v) => v.quant === q)!.score - a.votes.find((v) => v.quant === q)!.score
      )[0];
      return [q, top];
    })
  ) as Record<QuantId, CouncilCall | undefined>;

  // What each member loves (their top score) and hates (their bottom score) right now.
  const take = (c: CouncilCall | undefined, q: QuantId): Take | null => {
    const v = c?.votes.find((x) => x.quant === q);
    return c && v ? { symbol: c.coin.symbol, signal: v.signal, score: v.score, reason: v.reasons[0] ?? null } : null;
  };
  const takes = Object.fromEntries(
    QUANT_ORDER.map((q) => {
      const sorted = [...calls].sort(
        (a, b) => a.votes.find((v) => v.quant === q)!.score - b.votes.find((v) => v.quant === q)!.score
      );
      const hate = sorted[0];
      const love = sorted[sorted.length - 1];
      return [q, { love: take(love, q), hate: sorted.length > 1 ? take(hate, q) : null }];
    })
  ) as Takes;

  return (
    <>
      <header className="topbar">
        <a href="#top" className="brand">
          <span className="logo" aria-hidden="true"><i /><i /><i /><i /></span>
          The Quantcil
        </a>
        <nav aria-label="Main" className="topnav">
          <a href="#calls" className="active">Today&apos;s calls</a>
          <a href="#ask">Ask the council</a>
          <a href="#quants">The quants</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">
              Solana meme coins<br />scored live<span className="cursor" aria-hidden="true">_</span>
            </p>
            <h1 className="headline">
              Four quants.<br />
              <span className="lime">One council.</span><br />
              Today&apos;s calls.
            </h1>
            <p className="lede">
              The Quantcil scans Solana&apos;s trending pools, screens out rugs, and lets four models vote on what&apos;s
              left. Bring your own coin and they&apos;ll vote on that too.
            </p>
            <div className="hero-actions">
              <a href="#ask" className="btn">Ask about a coin <span aria-hidden="true">&gt;</span></a>
              <dl className="stats">
                <div><dt>Coins scanned</dt><dd>{calls.length.toLocaleString()}</dd></div>
                <div><dt>Rugs vetoed</dt><dd>{vetoed.toLocaleString()}</dd></div>
                <div><dt>Buy calls</dt><dd>{buys.toLocaleString()}</dd></div>
              </dl>
            </div>
          </div>
          <div className="hero-art">
            <PixelScene takes={takes} />
            <ol className="pipeline" aria-label="How a call gets made">
              {PIPELINE.map((p, i) => (
                <li key={p.k} title={p.d} style={{ animationDelay: `${i * 1.2}s` }}>
                  {p.k}
                  <span aria-hidden="true">&gt;</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="quants" className="strip" aria-label="The quants">
          {QUANT_ORDER.map((id, i) => (
            <QuantCard key={id} id={id} index={i} pick={best[id]} />
          ))}
        </section>

        <p className="warning">
          <b>(!)</b> Automated opinions, not financial advice. Meme coins can go to zero in minutes. Never trade more than you
          can afford to lose.
        </p>

        <section id="calls" className="panel">
          {loadError ? (
            <>
              <h2 className="h">Today&apos;s calls</h2>
              <div className="notice error" role="alert">
                Couldn&apos;t load market data: {loadError}. Check that COINGECKO_API_KEY is set, then refresh.
              </div>
            </>
          ) : (
            <CallsBoard calls={calls} />
          )}
        </section>

        <section id="ask" className="panel">
          <AskCouncil />
        </section>

        <footer className="foot">
          <p>
            The Quantcil publishes automated opinions for entertainment and education only. Nothing here is financial,
            investment or tax advice, or a recommendation to buy or sell any asset. Meme coins are extremely volatile and
            often lose all value. Data from CoinGecko and GeckoTerminal.
          </p>
          <p>&copy; {new Date().getFullYear()} The Quantcil</p>
        </footer>
      </main>

      <LiveBar
        solPrice={price(sol?.usd)}
        solChange={change(sol?.ch)}
        volume={usd(volume)}
        pools={calls.length}
      />
    </>
  );
}
