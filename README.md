# The Quantcil

Four quant models score trending Solana meme coins on four things: momentum, order flow, rug risk and crowding. The site has two parts:

- **Calls board.** The council finds its own coins from Solana's trending pools and votes on each one.
- **Ask the council.** Visitors enter a ticker, name or token address and get all four votes with the reasoning behind each.

The site is built with Next.js (App Router). Data comes from the CoinGecko Pro API and its onchain (GeckoTerminal) endpoints.

## Run locally

```bash
npm install
cp .env.example .env.local   # then paste your CoinGecko Pro key
npm run dev
```

Open http://localhost:3000.

## Put it on GitHub

```bash
git init
git add .
git commit -m "The Quantcil"
git branch -M main
git remote add origin https://github.com/<you>/quantcil.git
git push -u origin main
```

`.env.local` is in `.gitignore`, so your key never gets committed.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repo. Vercel detects Next.js automatically.
2. Under **Environment Variables**, add `COINGECKO_API_KEY` with your Pro key. You can also add `QUANTCIL_MAX_COINS`.
3. Click **Deploy**. After that, every push to `main` redeploys automatically.

## How it works

| File | What it does |
| --- | --- |
| `lib/coingecko.ts` | Server-only fetch wrapper. It sends `x-cg-pro-api-key` and caches responses with Next's data cache. |
| `lib/council.ts` | `discover()` pulls trending pools (1h and 24h), dedupes tokens, and fetches security info for each. `analyze()` handles visitor lookups. |
| `lib/quants.ts` | The four scoring models and the voting rule. This is the file to tune. |
| `app/api/calls` | Returns the discovery results as JSON, in case you want them elsewhere (a Telegram bot, for example). |
| `app/api/analyze?q=` | Analyzes a single coin. Accepts a ticker, a name or a mint address. |

### Voting rule

Each quant scores a coin from 0 to 100 and votes Buy (65 or higher), Watch (45 to 64) or Avoid (below 45). The council's call is then:

- **Buy** if 3 of the 4 quants vote Buy.
- **Avoid** if the risk quant votes Avoid. This is a veto, and it overrides everything else.
- **Avoid** if any 2 quants vote Avoid.
- **Watch** for anything else.

The risk screen hard-fails a coin for any of these:

- Live mint or freeze authority
- Flagged as a honeypot
- Still on the launchpad bonding curve
- Dev wallet holds more than 15% of supply
- Top 10 wallets hold more than 60% of supply
- Less than $30K liquidity
- 5 or more community scam reports
- Missing security data

### Copycat tickers

When several tokens share a ticker, the site only auto-picks one if it has 10 times the liquidity of the next. Otherwise it shows the visitor a list to choose from.

### API credit usage (approximate)

- **Each discovery refresh** (at most every 2 minutes) costs about 3 trending-pool calls, 1 SOL price call, and one token-info call per coin. Token info is cached for 10 minutes.
- **Each new visitor lookup** costs 1 to 3 calls. Repeat lookups within a minute hit the cache.

Two ways to reduce usage:

- Lower `QUANTCIL_MAX_COINS`.
- Raise `revalidate` in `app/page.tsx`.

If you expect heavy traffic on the ask box, add a rate limiter such as Upstash Ratelimit to `app/api/analyze/route.ts`.

## Limits worth knowing

- **Order flow is approximate.** "Order flow" uses unique buyer and seller counts and turnover from pool data. It does not track individual smart-money wallets, because CoinGecko doesn't provide that.
- **Holder data is in beta.** CoinGecko marks holder data as beta, and top-10 share includes liquidity-pool and exchange wallets.
- **Not financial advice.** These are rule-based heuristics. Keep the disclaimers on the site.
