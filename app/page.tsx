import { discover } from "@/lib/council";
import { cg } from "@/lib/coingecko";
import { QUANTS, QUANT_ORDER } from "@/lib/quants";
import { change, price } from "@/lib/format";
import type { CouncilCall } from "@/lib/types";
import { CallsBoard } from "@/components/CallsBoard";
import { AskCouncil } from "@/components/AskCouncil";
import { SignalChip } from "@/components/SignalChip";

// Re-run discovery at most every 2 minutes (ISR).
export const revalidate = 120;

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

  // Each quant's favourite coin right now: their highest-scoring vote.
  const topPicks = Object.fromEntries(
    QUANT_ORDER.map((q) => {
      const best = [...calls]
        .map((c) => ({ c, v: c.votes.find((v) => v.quant === q)! }))
        .sort((a, b) => b.v.score - a.v.score)[0];
      return [q, best];
    })
  );

  const solCh = change(sol?.ch);

  return (
    <>
      <header className="nav">
        <div className="wrap">
          <a href="#top" className="brand">
            <span className="mark" aria-hidden="true"><span /><span /><span /><span /></span>
            THE QUANTCIL
          </a>
          <nav aria-label="Main">
            <a href="#calls">Today&apos;s calls</a>
            <a href="#ask">Ask the council</a>
            <a href="#members">The quants</a>
            <a href="#method">Method</a>
          </nav>
          <a href="#ask" className="btn btn-primary">Ask about a coin</a>
        </div>
      </header>

      <main id="top">
        <div className="wrap">
          <section className="hero">
            <div className="hero-copy">
              <div className="kicker">Solana meme coins, scored live</div>
              <h1>Four quants.<br />One council.<br />Today&apos;s calls.</h1>
              <p>
                The Quantcil scans Solana&apos;s trending pools, screens out rugs, and lets four models vote on what&apos;s
                left. Bring your own coin and they&apos;ll vote on that too.
              </p>
              <div className="actions">
                <a href="#calls" className="btn btn-primary">See today&apos;s calls</a>
                <a href="#ask" className="btn btn-ghost">Ask about a coin</a>
              </div>
            </div>
            <aside className="status" aria-label="Council status">
              <div className="status-row"><span>Updated</span><span>{updated} ET</span></div>
              <div className="status-row">
                <span>SOL</span>
                <span>{price(sol?.usd)} <span className={solCh.cls}>{solCh.text}</span></span>
              </div>
              <div className="status-row"><span>Coins scanned</span><span>{calls.length}</span></div>
              <div className="status-row"><span>Passed rug screen</span><span>{passed}</span></div>
              <hr />
              <div className="status-row">
                <span>Council calls</span>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {count("BUY")} buy / {count("WATCH")} watch / {count("AVOID")} avoid
                </span>
              </div>
            </aside>
          </section>
        </div>

        <div className="risk-strip">
          <div className="wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5B544" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
              <path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5" /><path d="M12 18h.01" />
            </svg>
            <span>
              These calls come from automated models, not people, and are not financial advice. Meme coins can go to zero
              in minutes. Never trade more than you can afford to lose.
            </span>
          </div>
        </div>

        <div className="wrap">
          <section id="calls" className="block">
            {loadError ? (
              <div className="notice error" role="alert">
                The council couldn&apos;t load market data: {loadError}. Check that COINGECKO_API_KEY is set, then refresh.
              </div>
            ) : (
              <CallsBoard calls={calls} />
            )}
          </section>

          <section id="ask" className="block">
            <AskCouncil />
          </section>

          <section id="members" className="block">
            <div className="section-head">
              <div>
                <div className="kicker">The quants</div>
                <h2 className="title">Four lenses on every coin</h2>
              </div>
              <p className="lede" style={{ maxWidth: 420 }}>
                Each quant runs one model and votes independently. They&apos;re built to disagree.
              </p>
            </div>
            <div className="quants">
              {QUANT_ORDER.map((id) => {
                const q = QUANTS[id];
                const pick = topPicks[id];
                return (
                  <article className="quant" key={id}>
                    <div className="quant-head">
                      <div className="avatar" aria-hidden="true">{q.initials}</div>
                      <div>
                        <h3>{q.name}</h3>
                        <div className="role">{q.role}</div>
                      </div>
                    </div>
                    <p>{q.thesis}</p>
                    <div className="tags">{q.tags.map((t) => <span key={t}>{t}</span>)}</div>
                    <div className="quant-foot">
                      <div>
                        <small>Highest score today</small>
                        <strong>{pick ? `$${pick.c.coin.symbol}` : "—"}</strong>
                      </div>
                      {pick && <SignalChip signal={pick.v.signal} big />}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="method" className="block">
            <div className="kicker">Method</div>
            <h2 className="title" style={{ marginBottom: 32 }}>How a call gets made</h2>
            <div className="steps">
              <div className="step">
                <div className="n">1</div>
                <h3>Scan</h3>
                <p>Pull Solana&apos;s trending pools over the last hour and day, skipping stablecoins and big non-meme tokens.</p>
              </div>
              <div className="step">
                <div className="n">2</div>
                <h3>Rug screen</h3>
                <p>Mint and freeze authority, liquidity, top-holder share, dev wallet size, bonding-curve status. Fail one and it&apos;s out.</p>
              </div>
              <div className="step">
                <div className="n">3</div>
                <h3>Four votes</h3>
                <p>Momentum, order flow, risk and contrarian models each score the coin 0–100 and vote Buy, Watch or Avoid.</p>
              </div>
              <div className="step">
                <div className="n">4</div>
                <h3>Council call</h3>
                <p>Three Buy votes make a council Buy. A risk Avoid vetoes. Anything split is published as Watch.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer>
        <div className="wrap">
          <p>
            The Quantcil publishes automated opinions for entertainment and education only. Nothing here is financial,
            investment or tax advice, or a recommendation to buy or sell any asset. Meme coins are extremely volatile and
            frequently lose all value. Market data from CoinGecko and GeckoTerminal. Do your own research.
          </p>
        </div>
      </footer>
    </>
  );
}
