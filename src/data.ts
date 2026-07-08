import { pb } from './pocketbase';
import { CONSENT_TEXT_VERSION } from './content';
import type { BirthData, TeaserData } from './types';

export interface CreateReadingInput {
  birth: BirthData;
  teaser: TeaserData;
  faceTraits: string[];
  referralCode: string;
  referredBy?: string;
}

export async function persistReading(input: CreateReadingInput): Promise<string | undefined> {
  try {
    const record = await pb.collection('readings').create({
      email: input.birth.email,
      birth_date: input.birth.date,
      birth_time: input.birth.time ?? '',
      birth_place: input.birth.place,
      sun_sign: input.teaser.sunSign,
      moon_sign: input.teaser.moonSign,
      rising_sign: input.teaser.risingSign,
      teaser_json: input.teaser,
      face_traits_json: input.faceTraits,
      referral_code: input.referralCode,
      referred_by: input.referredBy ?? '',
    });
    return record.id;
  } catch (err) {
    console.error('Failed to save reading', err);
    return undefined;
  }
}

export async function persistFaceConsent(readingId: string | undefined, email: string): Promise<string | undefined> {
  try {
    const record = await pb.collection('face_consents').create({
      reading_id: readingId ?? '',
      email,
      consented: true,
      consent_text_version: CONSENT_TEXT_VERSION,
      consented_at: new Date().toISOString(),
    });
    return record.id;
  } catch (err) {
    console.error('Failed to save face consent', err);
    return undefined;
  }
}

export async function revokeFaceConsent(recordId: string): Promise<boolean> {
  try {
    await pb.collection('face_consents').update(recordId, {
      revoked_at: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Failed to revoke face consent', err);
    return false;
  }
}
