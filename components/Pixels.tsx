import type { ReactElement } from "react";
import { PALETTE, type Art, artSize } from "@/lib/sprites";

/** Renders pixel art as SVG rects (runs of the same colour are merged). Use inside an <svg>. */
export function Pixels({ art, scale = 2, x = 0, y = 0 }: { art: Art; scale?: number; x?: number; y?: number }) {
  const rects: ReactElement[] = [];
  art.rows.forEach((row, ry) => {
    let rx = 0;
    while (rx < row.length) {
      const ch = row[rx];
      let w = 1;
      while (rx + w < row.length && row[rx + w] === ch) w++;
      if (ch !== ".") {
        rects.push(
          <rect key={`${rx}-${ry}`} x={x + rx * scale} y={y + ry * scale} width={w * scale} height={scale} fill={PALETTE[ch]} />
        );
      }
      rx += w;
    }
  });
  return <>{rects}</>;
}

/** A standalone pixel sprite as its own <svg>. */
export function Sprite({ art, size, className, label }: { art: Art; size: number; className?: string; label?: string }) {
  const { w, h } = artSize(art);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Pixels art={art} scale={1} />
    </svg>
  );
}
