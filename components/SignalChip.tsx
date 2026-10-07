import type { Signal } from "@/lib/types";

export function SignalChip({ signal, big = false }: { signal: Signal; big?: boolean }) {
  return <span className={`chip ${signal}${big ? " big" : ""}`}>{signal}</span>;
}
