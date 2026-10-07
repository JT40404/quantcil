const BASE = "https://pro-api.coingecko.com/api/v3";

export class CoinGeckoError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Server-side fetch to the CoinGecko Pro API.
 * `revalidate` (seconds) uses Next's data cache so repeat requests
 * within the window don't spend API credits.
 */
export async function cg<T = any>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate = 60
): Promise<T> {
  const key = process.env.COINGECKO_API_KEY;
  if (!key) throw new CoinGeckoError(500, "COINGECKO_API_KEY is not set");

  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: { accept: "application/json", "x-cg-pro-api-key": key },
    next: { revalidate },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CoinGeckoError(res.status, `CoinGecko ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
