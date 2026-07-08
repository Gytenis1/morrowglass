export interface BirthData {
  date: string;
  time?: string;
  place: string;
  email: string;
}

export interface FaceConsentState {
  consented: boolean;
  recordId?: string;
  revokedAt?: string;
}

export interface TeaserData {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  archetype: string;
  insights: string[];
  hiddenTrait: string;
}

export type Step = 'landing' | 'birth' | 'selfie' | 'results';

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  amount_cents: number;
  currency: string;
  product_type: 'one_time' | 'subscription';
  payment_link_url: string;
}

export interface AppState {
  step: Step;
  birth?: BirthData;
  faceConsent: FaceConsentState;
  faceTraits: string[];
  teaser?: TeaserData;
  readingId?: string;
  referralCode?: string;
  referredBy?: string;
  products: ProductRecord[];
  productsLoaded: boolean;
  paymentsMode: 'test' | 'live' | null;
}

export function createInitialState(): AppState {
  return {
    step: 'landing',
    faceConsent: { consented: false },
    faceTraits: [],
    products: [],
    productsLoaded: false,
    paymentsMode: null,
  };
}
