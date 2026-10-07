import type { QuantId } from "./types";

/** Pixel palette. One character per pixel in the sprite rows below; "." is transparent. */
export const PALETTE: Record<string, string> = {
  K: "#140c16", // outline / platform black
  k: "#2b1c2e", // stone speckle
  G: "#b6f23b", // lime
  g: "#7fbf2a", // dark lime
  W: "#fbf6fb", // white
  w: "#d7d0da", // light grey
  P: "#f5a8dc", // pink
  p: "#d37dba", // dark pink
  B: "#6fcaf2", // blue
  b: "#3e8fc6", // dark blue
  S: "#8d8a90", // grey
  s: "#5f5c63", // dark grey
  R: "#ff7a3d", // orange eyes
  Y: "#f6c945", // coin
  y: "#c9962a", // coin shade
  M: "#8a64b4", // purple mouth / ufo dome
  m: "#5c3f82", // dark purple
};

export interface Art {
  rows: string[];
}

/* The four council members ------------------------------------------- */

// Momentum — a lime blob that can't sit still.
const BLOB: Art = {
  rows: [
    "....KKKKKKKK....",
    "...KGGGGGGGGK...",
    "..KGGGgGGGGGGK..",
    "..KGKKKGGKKKGK..",
    "..KGKRKGGKRKGK..",
    ".KGGGGGGGGGGGGK.",
    ".KGKKKKKKKKKKGK.",
    ".KGKWKWKWKWKKGK.",
    "KGGKKKKKKKKKKGGK",
    "KGgGGGGGGGGGGgGK",
    "KGgGGgGGGGgGGgGK",
    ".KGgK.KGGK.KgGK.",
    "..KK...KK...KK..",
  ],
};

// Order flow — a pink bunny that hops toward the buyers.
const BUNNY: Art = {
  rows: [
    "..KK......KK..",
    ".KPK......KPK.",
    ".KPK......KPK.",
    ".KPpK....KpPK.",
    ".KPPKKKKKKPPK.",
    "KPPPPPPPPPPPPK",
    "KPPKKPPPPKKPPK",
    "KPPKKPPPPKKPPK",
    "KPPPPPKKPPPPPK",
    "KPPWWWWWWWWPPK",
    "KPWWWWWWWWWWPK",
    "KPWWWWWWWWWWPK",
    ".KPWWWWWWWWPK.",
    "..KPPKKKKPPK..",
    "...KK....KK...",
  ],
};

// Rug risk — a grey cat on patrol.
const CAT: Art = {
  rows: [
    ".KK........KK.",
    "KSSK......KSSK",
    "KSsSKKKKKKSsSK",
    "KSSSSSSSSSSSSK",
    "KSSKKSSSSKKSSK",
    "KSSKWSSSSKWSSK",
    "KSSSSSKKSSSSSK",
    "KSSwwwwwwwwSSK",
    "KSwwwwwwwwwwSK",
    "KSwwwwwwwwwwSK",
    ".KSSSKKKKSSSK.",
    "..KKK....KKK..",
  ],
};

// Contrarian — a blue blob too cool for the crowd.
const COOL: Art = {
  rows: [
    "....KKKKKKKK....",
    "..KKBBBBBBBBKK..",
    ".KBBBBBBBBBBBBK.",
    "KKKKKKKKKKKKKKKK",
    "KBKKKKKBBKKKKKBK",
    "KBBKKKBBBBKKKBBK",
    "KBBBBBBBBBBBBBBK",
    "KBBMMMMMMMMMMBBK",
    "KBBMWKWKWKWKMBBK",
    "KBBMMMMMMMMMMBBK",
    "KbBBBBBBBBBBBBbK",
    ".KbbBBBBBBBBbbK.",
    "..KKKK....KKKK..",
  ],
};

export const CHARACTERS: Record<QuantId, Art> = {
  momo: BLOB,
  flow: BUNNY,
  risk: CAT,
  fade: COOL,
};

/* Props ---------------------------------------------------------------- */

export const COIN: Art = {
  rows: [
    "..KKKK..",
    ".KYYYYK.",
    "KYYyyYYK",
    "KYyYYYYK",
    "KYyYYYYK",
    "KYyYYYYK",
    "KYYyyYYK",
    ".KYYYYK.",
    "..KKKK..",
  ],
};

export const UFO: Art = {
  rows: [
    "......KKKKKK......",
    ".....KMMMMMMK.....",
    "....KMmWWmmMMK....",
    "..KKKKKKKKKKKKKK..",
    ".KwwwwwwwwwwwwwwK.",
    "KGGKGGKGGKGGKGGKGK",
    ".KwwwwwwwwwwwwwwK.",
    "...KKKKKKKKKKKK...",
  ],
};

export const CLOUD: Art = {
  rows: [
    ".....WWWW.....",
    "...WWWWWWWW...",
    ".WWWWWWWWWWWW.",
    "WWWwwWWWWwwWWW",
  ],
};

export const FLY: Art = {
  rows: [
    "W.W",
    ".K.",
    "KKK",
  ],
};

export const FLOWER: Art = {
  rows: [
    ".W.",
    "WYW",
    ".W.",
    ".g.",
    ".g.",
  ],
};

export const SPARKLE: Art = {
  rows: [
    ".W.",
    "WWW",
    ".W.",
  ],
};

export function artSize(art: Art) {
  return { w: art.rows[0].length, h: art.rows.length };
}
