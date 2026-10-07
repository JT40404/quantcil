import { NextResponse } from "next/server";
import { discover } from "@/lib/council";

// Cached for 2 minutes at the edge; CoinGecko calls are also cached underneath.
export const revalidate = 120;

export async function GET() {
  try {
    const calls = await discover();
    return NextResponse.json({ calls, updatedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Discovery failed" }, { status: 502 });
  }
}
