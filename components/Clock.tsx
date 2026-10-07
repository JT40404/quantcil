"use client";

import { useEffect, useState } from "react";

/** Live New York clock — US markets and most crypto news run on ET. */
export function Clock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/New_York",
      });
    setNow(fmt());
    const id = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="clock mono" suppressHydrationWarning>{now ? `${now} ET` : "\u00a0"}</span>;
}
