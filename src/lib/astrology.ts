import { hashString, mulberry32, seededPick } from './hash';
import type { TeaserData } from '../types';

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

interface SignRange {
  sign: ZodiacSign;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

// Every tropical zodiac window spans the tail of one month into the next,
// so a single "start OR end" check (no same-month case) covers the year.
const SIGN_RANGES: SignRange[] = [
  { sign: 'Capricorn', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { sign: 'Aquarius', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { sign: 'Pisces', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
  { sign: 'Aries', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { sign: 'Taurus', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { sign: 'Gemini', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { sign: 'Cancer', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { sign: 'Leo', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { sign: 'Virgo', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { sign: 'Libra', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { sign: 'Scorpio', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { sign: 'Sagittarius', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

export function getSunSign(month: number, day: number): ZodiacSign {
  for (const range of SIGN_RANGES) {
    const startsHere = month === range.startMonth && day >= range.startDay;
    const endsHere = month === range.endMonth && day <= range.endDay;
    if (startsHere || endsHere) return range.sign;
  }
  return 'Capricorn';
}

export function parseBirthDate(dateStr: string): { month: number; day: number } | null {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { month, day };
}

function deriveSeededSign(seed: string): ZodiacSign {
  const rng = mulberry32(hashString(seed));
  return seededPick(rng, ZODIAC_SIGNS);
}

const ARCHETYPE_ADJECTIVES = [
  'Radiant', 'Magnetic', 'Luminous', 'Quietly Fierce', 'Velvet-Voiced',
  'Starlit', 'Unshakeable', 'Dreaming', 'Golden', 'Enigmatic',
];

const ARCHETYPE_NOUNS = [
  'Visionary', 'Alchemist', 'Wanderer', 'Anchor', 'Muse',
  'Strategist', 'Flamekeeper', 'Oracle', 'Architect', 'Wildcard',
];

const INSIGHT_TEMPLATES: Array<(sun: string, moon: string, rising: string) => string> = [
  (sun) => `With ${sun} energy at your core, you naturally lead with warmth and quiet confidence.`,
  (_sun, moon) => `Your ${moon} moon reveals an inner world rich with intuition and emotional depth.`,
  (_sun, _moon, rising) => `A ${rising} rising means first impressions of you often land as effortlessly magnetic.`,
  (sun, moon) => `The pairing of ${sun} and ${moon} suggests you balance ambition with feeling — rare, and memorable.`,
  (sun) => `People are drawn to your ${sun} clarity, even when you're the quietest one in the room.`,
  (_sun, _moon, rising) => `Your ${rising} rising shapes the story others tell about you before you say a word.`,
  (sun, moon) => `When ${sun} drive meets ${moon} sensitivity, you tend to think in seasons, not days.`,
  (sun) => `${sun} placements like yours often turn small rituals into quiet sources of power.`,
];

const HIDDEN_TRAIT_TEMPLATES: Array<(sun: string, moon: string, rising: string) => string> = [
  (sun) => `The private side of your ${sun} nature that only shows up with people you truly trust.`,
  (_sun, moon) => `A ${moon}-moon undercurrent most people never get to see.`,
  (_sun, _moon, rising) => `What your ${rising} rising is quietly protecting.`,
];

export function buildTeaser(birthDate: string, birthTime: string | undefined, birthPlace: string): TeaserData {
  const parsed = parseBirthDate(birthDate);
  const sunSign = parsed ? getSunSign(parsed.month, parsed.day) : deriveSeededSign(`${birthDate}|sun`);

  const seedBase = `${birthDate}|${birthTime ?? ''}|${birthPlace.trim().toLowerCase()}`;
  const moonSign = deriveSeededSign(`${seedBase}|moon`);
  const risingSign = deriveSeededSign(`${seedBase}|rising`);

  const archetypeRng = mulberry32(hashString(`${seedBase}|archetype`));
  const adjective = seededPick(archetypeRng, ARCHETYPE_ADJECTIVES);
  const noun = seededPick(archetypeRng, ARCHETYPE_NOUNS);
  const archetype = `The ${adjective} ${noun}`;

  const insightRng = mulberry32(hashString(`${seedBase}|insights`));
  const pool = [...INSIGHT_TEMPLATES];
  const count = 3 + Math.floor(insightRng() * 3); // 3-5 insights
  const insights: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const idx = Math.floor(insightRng() * pool.length);
    const [template] = pool.splice(idx, 1);
    insights.push(template(sunSign, moonSign, risingSign));
  }

  const hiddenRng = mulberry32(hashString(`${seedBase}|hidden`));
  const hiddenTemplate = seededPick(hiddenRng, HIDDEN_TRAIT_TEMPLATES);
  const hiddenTrait = hiddenTemplate(sunSign, moonSign, risingSign);

  return { sunSign, moonSign, risingSign, archetype, insights, hiddenTrait };
}
