import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/council";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.slice(0, 64) ?? "";
  if (!q.trim()) {
    return NextResponse.json({ error: "Enter a ticker, name or Solana token address." }, { status: 400 });
  }
  try {
    const result = await analyze(q);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Analysis failed" }, { status: 502 });
  }
}
