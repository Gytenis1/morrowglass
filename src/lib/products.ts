import { pb } from '../pocketbase';
import type { ProductRecord } from '../types';

interface RawProductRecord {
  id: string;
  name?: string;
  description?: string;
  amount_cents?: number;
  currency?: string;
  product_type?: string;
  payment_link_url?: string;
  archived?: boolean;
}

export async function fetchProducts(): Promise<ProductRecord[]> {
  try {
    const records = await pb.collection('supernaut_products').getFullList<RawProductRecord>({
      sort: 'amount_cents',
    });
    return records
      .filter((r) => !r.archived)
      .map((r) => ({
        id: r.id,
        name: r.name ?? 'Reading',
        description: r.description ?? '',
        amount_cents: typeof r.amount_cents === 'number' ? r.amount_cents : 0,
        currency: r.currency ?? 'usd',
        product_type: (r.product_type === 'subscription' ? 'subscription' : 'one_time') as ProductRecord['product_type'],
        payment_link_url: r.payment_link_url ?? '',
      }))
      .filter((p) => p.payment_link_url.length > 0);
  } catch (err) {
    console.error('Failed to load products', err);
    return [];
  }
}

export async function fetchPaymentsMode(): Promise<'test' | 'live' | null> {
  try {
    const rec = await pb.collection('supernaut_payments_settings').getFirstListItem<{ mode?: string }>('');
    return rec.mode === 'test' || rec.mode === 'live' ? rec.mode : null;
  } catch (err) {
    console.error('Failed to load payments settings', err);
    return null;
  }
}

export function formatPrice(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
