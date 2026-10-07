"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { Pixels } from "./Pixels";
import { CHARACTERS, CLOUD, COIN, FLOWER, FLY, PALETTE, SPARKLE, UFO, artSize } from "@/lib/sprites";
import { QUANTS } from "@/lib/quants";
import type { QuantId, Signal } from "@/lib/types";
import { quip, type Mood } from "@/lib/banter";

export type Take = { symbol: string; signal: Signal; score: number; reason: string | null };
/** Each member's favourite (love) and least favourite (hate) coin right now. */
export type Takes = Record<QuantId, { love: Take | null; hate: Take | null }>;

const W = 240;
const H = 180;
const S = 2; // scene pixel size in viewBox units

/* Where each member lives. y is the top of the sprite; it stands on a platform top. */
const CAST: { id: QuantId; x: number; y: number; idle: string; walk?: boolean }[] = [
  { id: "momo", x: 88, y: 74, idle: "idle-hop" },
  { id: "flow", x: 170, y: 88, idle: "idle-bunny" },
  { id: "risk", x: 44, y: 126, idle: "idle-bob", walk: true },
  { id: "fade", x: 192, y: 132, idle: "idle-shuffle" },
];

/* Static backdrop pieces -------------------------------------------------- */

function moonRects() {
  const out: { x: number; y: number; c: string }[] = [];
  const r = 12;
  const craters = [
    { cx: -5, cy: -4, r: 2.6 },
    { cx: 4, cy: 2, r: 3.2 },
    { cx: -3, cy: 6, r: 1.8 },
    { cx: 6, cy: -6, r: 1.6 },
  ];
  for (let gy = -r; gy <= r; gy++) {
    for (let gx = -r; gx <= r; gx++) {
      const d = Math.hypot(gx, gy);
      if (d > r + 0.3) continue;
      let c = d > r - 1.2 ? "#c5d48a" : "#e3edab";
      for (const k of craters) {
        const dk = Math.hypot(gx - k.cx, gy - k.cy);
        if (dk <= k.r) c = dk > k.r - 1 ? "#8f9c62" : "#adbb78";
      }
      out.push({ x: gx, y: gy, c });
    }
  }
  return out;
}

const BUILDINGS = [
  { x: 96, w: 14, h: 58 }, { x: 112, w: 10, h: 82 }, { x: 124, w: 16, h: 64 }, { x: 142, w: 12, h: 96 },
  { x: 156, w: 18, h: 72 }, { x: 176, w: 10, h: 104 }, { x: 188, w: 16, h: 86 }, { x: 206, w: 12, h: 118 },
  { x: 220, w: 20, h: 92 }, { x: 0, w: 18, h: 40 }, { x: 20, w: 12, h: 52 },
];

function Skyline() {
  return (
    <g aria-hidden="true">
      {BUILDINGS.map((b, i) => {
        const top = H - b.h;
        const windows: ReactElement[] = [];
        for (let wy = top + 6; wy < H - 30; wy += 8) {
          for (let wx = b.x + 3; wx < b.x + b.w - 3; wx += 5) {
            const on = (wx * 7 + wy * 13 + i) % 6 === 0;
            const lime = (wx + wy) % 5 === 0;
            windows.push(
              <rect key={`${wx}-${wy}`} x={wx} y={wy} width={2} height={2} fill={on ? (lime ? "#9fd04a" : "#c99ac2") : "#7c4d75"} />
            );
          }
        }
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill="#7a4b73" />
            {i % 3 === 1 && <rect x={b.x + b.w / 2 - 1} y={top - 8} width={2} height={8} fill="#7a4b73" />}
            {windows}
          </g>
        );
      })}
    </g>
  );
}

/** A black block with a grass top. */
function Platform({ x, y, w, h, ladder }: { x: number; y: number; w: number; h: number; ladder?: boolean }) {
  const specks: ReactElement[] = [];
  for (let i = 0; i < Math.floor((w * h) / 140); i++) {
    const sx = x + 4 + ((i * 37) % (w - 8));
    const sy = y + 10 + ((i * 53) % Math.max(4, h - 14));
    specks.push(<rect key={i} x={sx - (sx % 2)} y={sy - (sy % 2)} width={4} height={2} fill={PALETTE.k} />);
  }
  const tufts: ReactElement[] = [];
  for (let tx = x + 2; tx < x + w - 2; tx += 6) {
    if ((tx * 3) % 4 === 0) tufts.push(<rect key={tx} x={tx} y={y - 2} width={2} height={2} fill={PALETTE.G} />);
    if ((tx * 5) % 7 === 0) tufts.push(<rect key={`d${tx}`} x={tx + 2} y={y - 4} width={2} height={4} fill={PALETTE.g} />);
  }
  return (
    <g aria-hidden="true">
      <rect x={x} y={y} width={w} height={h} fill={PALETTE.K} />
      <rect x={x} y={y} width={w} height={2} fill={PALETTE.G} />
      <rect x={x} y={y + 2} width={w} height={2} fill={PALETTE.g} />
      {Array.from({ length: Math.floor(w / 4) }).map((_, i) =>
        i % 2 ? <rect key={i} x={x + i * 4} y={y + 4} width={2} height={2} fill={PALETTE.g} /> : null
      )}
      {tufts}
      {specks}
      {ladder && (
        <g>
          <rect x={x + w - 14} y={y + 4} width={2} height={h - 4} fill="#8d6f96" />
          <rect x={x + w - 6} y={y + 4} width={2} height={h - 4} fill="#8d6f96" />
          {Array.from({ length: Math.floor((h - 6) / 6) }).map((_, i) => (
            <rect key={i} x={x + w - 12} y={y + 8 + i * 6} width={6} height={2} fill="#8d6f96" />
          ))}
        </g>
      )}
    </g>
  );
}

/* The scene ----------------------------------------------------------------- */

type Speech = {
  id: QuantId;
  mood: Mood;
  text: string;
  take: Take;
  left: number;
  top: number;
  width: number;
  tail: number;
  user: boolean;
};

export function PixelScene({ takes }: { takes: Takes }) {
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [jumping, setJumping] = useState<QuantId | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const memberRefs = useRef<Partial<Record<QuantId, SVGGElement | null>>>({});
  const lastMood = useRef<Partial<Record<QuantId, Mood>>>({});
  const userActed = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moon = useMemo(moonRects, []);

  const speak = useCallback(
    (id: QuantId, mood: Mood, user: boolean) => {
      const take = takes[id]?.[mood] ?? takes[id]?.[mood === "love" ? "hate" : "love"];
      const el = memberRefs.current[id];
      const wrap = wrapRef.current;
      if (!take || !el || !wrap) return;
      const usedMood: Mood = takes[id]?.[mood] ? mood : mood === "love" ? "hate" : "love";

      const w = wrap.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const center = r.left + r.width / 2 - w.left;
      const width = Math.min(300, Math.max(200, w.width * 0.42));
      const left = Math.min(w.width - width / 2 - 4, Math.max(width / 2 + 4, center));
      setSpeech({
        id,
        mood: usedMood,
        text: quip(id, usedMood, take.symbol),
        take,
        left,
        top: r.top - w.top - 8,
        width,
        tail: center - left,
        user,
      });
      lastMood.current[id] = usedMood;
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setSpeech(null), user ? 7000 : 4600);
    },
    [takes]
  );

  // Ambient banter: someone is always talking about something.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const first = setTimeout(() => speak("momo", "love", false), 1200);
    const id = setInterval(() => {
      if (Date.now() - userActed.current < 9000 || document.hidden) return;
      const who = CAST[Math.floor(Math.random() * CAST.length)].id;
      speak(who, Math.random() < 0.5 ? "love" : "hate", false);
    }, 5200);
    const hide = () => setSpeech(null);
    window.addEventListener("resize", hide);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      clearTimeout(hideTimer.current);
      window.removeEventListener("resize", hide);
    };
  }, [speak]);

  function poke(id: QuantId) {
    userActed.current = Date.now();
    // Alternate between hype and trash talk on each click.
    const next: Mood = lastMood.current[id] === "love" ? "hate" : "love";
    speak(id, next, true);
    setJumping(null);
    requestAnimationFrame(() => setJumping(id));
  }

  function onKey(e: KeyboardEvent, id: QuantId) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      poke(id);
    }
  }

  return (
    <div className="scene-wrap" ref={wrapRef}>
      <svg
        className="scene"
        viewBox={`0 0 ${W} ${H}`}
        shapeRendering="crispEdges"
        role="group"
        aria-label="The council's hangout. Select a member to hear what they think."
      >
        <Skyline />

        {/* Moon */}
        <g transform="translate(184 34)" aria-hidden="true">
          {moon.map((p, i) => (
            <rect key={i} x={p.x * S} y={p.y * S} width={S} height={S} fill={p.c} />
          ))}
        </g>

        {/* Stars & sparkles */}
        <g aria-hidden="true">
          {[
            [70, 10, 0], [150, 8, 1.2], [222, 50, 0.6], [128, 40, 2], [20, 70, 1.6], [236, 128, 0.3],
          ].map(([x, y, d], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <g className="twinkle" style={{ animationDelay: `${d}s` }}>
                <Pixels art={SPARKLE} scale={2} />
              </g>
            </g>
          ))}
          {[
            [140, 26], [96, 54], [210, 90],
          ].map(([x, y], i) => (
            <rect key={`g${i}`} x={x} y={y} width={4} height={4} fill={PALETTE.G} className="twinkle" style={{ animationDelay: `${i * 0.8}s` }} />
          ))}
        </g>

        {/* Clouds */}
        <g transform="translate(108 20)" aria-hidden="true"><g className="drift"><Pixels art={CLOUD} scale={2} /></g></g>
        <g transform="translate(170 76)" aria-hidden="true"><g className="drift slow"><Pixels art={CLOUD} scale={2} /></g></g>
        <g transform="translate(66 56)" aria-hidden="true"><g className="drift" style={{ animationDelay: "-6s" }}><Pixels art={CLOUD} scale={1} /></g></g>

        {/* UFO with tractor beam */}
        <g transform="translate(20 6)" aria-hidden="true">
          <g className="ufo">
            <g className="beam">
              {[0, 1, 2, 3, 4, 5, 6].map((r) =>
                [0, 1, 2].map((c) =>
                  (r + c) % 2 === 0 ? (
                    <rect key={`${r}-${c}`} x={12 + c * 4 + (r % 2) * 2} y={18 + r * 4} width={2} height={2} fill={r < 3 ? "#e3c9a0" : "#c9a0b6"} />
                  ) : null
                )
              )}
            </g>
            <Pixels art={UFO} scale={2} />
          </g>
        </g>

        {/* Platforms */}
        <Platform x={70} y={100} w={70} h={80} ladder />
        <Platform x={146} y={118} w={70} h={62} />
        <Platform x={36} y={150} w={74} h={30} />
        <Platform x={150} y={158} w={90} h={22} />

        {/* Flowers */}
        {[
          [74, 90], [134, 90], [150, 108], [208, 108], [40, 140], [100, 140], [156, 148], [232, 148],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} aria-hidden="true"><Pixels art={FLOWER} scale={2} /></g>
        ))}

        {/* Coins */}
        {[
          [24, 116, 0], [124, 62, 0.4], [216, 66, 0.9], [150, 96, 1.3],
        ].map(([x, y, d], i) => (
          <g key={i} transform={`translate(${x} ${y})`} aria-hidden="true">
            <g className="coin-bob" style={{ animationDelay: `${d}s` }}>
              <g className="coin-spin" style={{ animationDelay: `${d}s` }}>
                <Pixels art={COIN} scale={2} />
              </g>
            </g>
          </g>
        ))}

        {/* Flies */}
        {[
          [104, 66, 0], [200, 78, 1.1], [64, 92, 2.1],
        ].map(([x, y, d], i) => (
          <g key={i} transform={`translate(${x} ${y})`} aria-hidden="true">
            <g className="buzz" style={{ animationDelay: `${-d}s` }}><Pixels art={FLY} scale={2} /></g>
          </g>
        ))}

        {/* The council */}
        {CAST.map((m) => {
          const art = CHARACTERS[m.id];
          const { w, h } = artSize(art);
          const pw = w * S;
          const q = QUANTS[m.id];
          const love = takes[m.id]?.love;
          const hate = takes[m.id]?.hate;
          const label =
            `${q.name}, ${q.role}.` +
            (love ? ` Loves ${love.symbol} (${love.signal.toLowerCase()}, ${love.score}).` : "") +
            (hate ? ` Hates ${hate.symbol} (${hate.signal.toLowerCase()}, ${hate.score}).` : "");
          const talking = speech?.id === m.id;

          return (
            <g key={m.id} transform={`translate(${m.x} ${m.y})`}>
              <g
                className={m.walk ? `walk${talking ? " hold" : ""}` : undefined}
                role="button"
                tabIndex={0}
                aria-label={label}
                onClick={() => poke(m.id)}
                onKeyDown={(e) => onKey(e, m.id)}
                style={{ cursor: "pointer" }}
              >
                <rect x={-4} y={-6} width={pw + 8} height={h * S + 8} fill="transparent" />
                <g
                  ref={(el) => {
                    memberRefs.current[m.id] = el;
                  }}
                  className={`member${jumping === m.id ? " jump" : ""}${talking ? " talking" : ""}`}
                  onAnimationEnd={(e) => e.animationName === "bigjump" && setJumping(null)}
                >
                  <g className={m.walk ? "flip" : undefined}>
                    <g className={m.idle}>
                      <Pixels art={art} scale={S} />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          );
        })}
      </svg>

      {speech && (
        <div
          key={`${speech.id}-${speech.text}`}
          className={`speech ${speech.mood}`}
          style={{ left: speech.left, top: speech.top, width: speech.width }}
          role={speech.user ? "status" : undefined}
          aria-hidden={speech.user ? undefined : true}
        >
          <p className="speech-q">
            <b>{QUANTS[speech.id].name}:</b> {speech.text}
          </p>
          <p className="speech-r">
            <span className={`chip ${speech.take.signal}`}>{speech.take.signal}</span>{" "}
            ${speech.take.symbol} scored {speech.take.score}
            {speech.take.reason ? ` / ${speech.take.reason}` : ""}
          </p>
          <span className="speech-tail" style={{ left: `calc(50% + ${speech.tail}px)` }} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
