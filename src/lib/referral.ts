import { hashString } from './hash';

export function generateReferralCode(email: string): string {
  const normalized = email.trim().toLowerCase();
  const h = hashString(normalized);
  const code = h.toString(36).toUpperCase().padStart(6, '0');
  return code.slice(0, 7);
}

export function getReferralFromUrl(): string | undefined {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    return ref && ref.trim().length > 0 ? ref.trim() : undefined;
  } catch {
    return undefined;
  }
}

export function buildReferralUrl(referralCode: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?ref=${encodeURIComponent(referralCode)}`;
}
