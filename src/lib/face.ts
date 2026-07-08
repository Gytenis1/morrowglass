import { hashString, mulberry32 } from './hash';

// Face "analysis" is entirely faked client-side: no image is ever inspected.
// Traits are playful, non-identifying descriptors deterministically derived
// from birth data only. Never derived from — and never referencing — race,
// ethnicity, religion, politics, or sexual orientation.
const TRAIT_POOL = [
  'expressive brow line → decisive archetype',
  'high cheekbone contour → creative visionary',
  'symmetric smile lines → natural diplomat',
  'wide-set eyes → big-picture thinker',
  'strong jawline → steady under pressure',
  'soft rounded features → warm connector',
  'arched eyebrows → quick wit',
  'deep-set eyes → introspective depth',
  'gentle dimples → instinctive charm',
  'angular cheekbones → bold risk-taker',
];

export function generateFaceTraits(seedInput: string): string[] {
  const rng = mulberry32(hashString(`${seedInput}|face-traits`));
  const pool = [...TRAIT_POOL];
  const count = 2 + Math.floor(rng() * 2); // 2 or 3 traits
  const picked: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const idx = Math.floor(rng() * pool.length);
    const [trait] = pool.splice(idx, 1);
    picked.push(trait);
  }
  return picked;
}
