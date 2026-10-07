"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REFRESH_S = 120;

/** Bottom status bar. Counts down to the next council refresh, then pulls fresh calls. */
export function LiveBar({
  solPrice, solChange, volume, pools,
}: { solPrice: string; solChange: { text: string; cls: string }; volume: string; pools: number }) {
  const router = useRouter();
  const [t, setT] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setT((s) => {
        if (s + 1 >= REFRESH_S) {
          router.refresh();
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [router]);

  const pct = Math.round((t / REFRESH_S) * 100);
  return (
    <div className="livebar" role="status" aria-label="Live market status">
      <div className="lb-item">
        <span className="dot" aria-hidden="true" />
        <span className="lime">[ LIVE ]</span>
      </div>
      <div className="lb-item">
        <span className="lb-k">SOL</span> {solPrice} <span className={solChange.cls}>{solChange.text}</span>
      </div>
      <div className="lb-item">
        <span className="lb-k">VOLUME</span> {volume}
      </div>
      <div className="lb-item">
        <span className="lb-k">COINS</span> {pools}
      </div>
      <div className="lb-item lb-grow">
        <span className="lb-k">NEXT SCAN</span>
        <span className="meter" aria-label={`Next refresh in ${REFRESH_S - t} seconds`}>
          <i style={{ width: `${pct}%` }} />
        </span>
        <span className="lb-sq" aria-hidden="true"><b /><b /><b /></span>
      </div>
    </div>
  );
}
