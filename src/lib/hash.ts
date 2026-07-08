// Small deterministic string hash (FNV-1a) plus a seeded PRNG (mulberry32).
// Used to derive pseudo-random-but-repeatable astrology/face content from
// birth data only — never from any protected characteristic.

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededPick<T>(rng: () => number, items: readonly T[]): T {
  const idx = Math.floor(rng() * items.length) % items.length;
  return items[idx];
}
