import type { QuantId } from "./types";

export type Mood = "love" | "hate";

/**
 * What each member says about the coin they score highest (love)
 * and the one they score lowest (hate). {sym} becomes the ticker.
 * This is character comedy — the bubble's second line always shows the real score and reason.
 */
const LINES: Record<QuantId, Record<Mood, string[]>> = {
  // Gloop — hyperactive lime slime, momentum
  momo: {
    love: [
      "{sym} IS RIPPING. I'M VIBRATING. WE'RE ALL GONNA MAKE IT.",
      "Green candles are my love language and {sym} won't stop texting.",
      "{sym} to a billion. Then ten billion. Then I buy the moon.",
      "I'd eat {sym} if I could. Honestly I still might.",
      "Chart's going vertical and so am I. LFG {sym}!!",
      "Retire? On {sym} I'm retiring TWICE.",
    ],
    hate: [
      "{sym} has the momentum of a parked car.",
      "{sym}'s chart is flatter than my teeth.",
      "Watching {sym} trade is how I fall asleep at night.",
      "Even the flies got bored and left {sym}.",
      "{sym} moves like it's buffering.",
      "I've seen more energy from a puddle. Wait. I AM a puddle. And I'm still faster than {sym}.",
    ],
  },
  // Hopsy — pink bunny, order flow
  flow: {
    love: [
      "Everyone's hopping into {sym}. I hopped first, obviously.",
      "Fresh wallets piling into {sym}. Carrots for everyone!",
      "{sym} buyers outnumber sellers. That's just math, sweetie.",
      "I counted every wallet in {sym}. Twice. They're all winners.",
      "{sym} is the busiest burrow on Solana and I live there now.",
    ],
    hate: [
      "{sym}'s volume is three bots in a trench coat.",
      "Who's actually buying {sym}? Nobody. I checked. Twice.",
      "{sym} holders are leaving faster than I hop.",
      "{sym} has more sellers than a garage sale.",
      "I've seen livelier order books in a ghost town. Bye {sym}.",
    ],
  },
  // Whiskers — grumpy cat, rug risk (grudging when bullish)
  risk: {
    love: [
      "{sym} passed every check. I'm as shocked as you are.",
      "I sniffed all of {sym}. Clean. Annoyingly clean.",
      "No mint, no freeze, deep pool. {sym} may live. For now.",
      "Fine. FINE. {sym} isn't a rug. Don't make it weird.",
    ],
    hate: [
      "{sym} is a rug with a logo.",
      "I wouldn't touch {sym} with someone else's paw.",
      "{sym}'s dev is holding the bag AND the exit door.",
      "Hiss. {sym}. Absolutely not.",
      "I've coughed up hairballs with better fundamentals than {sym}.",
      "{sym} smells like a honeypot and I would know.",
    ],
  },
  // Shades — blue blob in sunglasses, contrarian
  fade: {
    love: [
      "Nobody's talking about {sym}. That's exactly why I'm in.",
      "{sym} is quiet. I like quiet. Quiet goes to the moon.",
      "You'll hear about {sym} in two weeks. I heard it today.",
      "{sym}? Too early for you. Just right for me.",
      "Sunglasses on. {sym} is so bright I can't see the haters.",
    ],
    hate: [
      "{sym}? Your barber's shilling it. I'm out.",
      "Everyone's in {sym}. That's the whole problem.",
      "{sym} already pumped. Enjoy being exit liquidity.",
      "{sym} is what happens when the timeline does research.",
      "I keep the shades on so I don't have to look at {sym}.",
    ],
  },
};

export function quip(id: QuantId, mood: Mood, symbol: string): string {
  const pool = LINES[id][mood];
  const line = pool[Math.floor(Math.random() * pool.length)];
  return line.replaceAll("{sym}", `$${symbol}`);
}
