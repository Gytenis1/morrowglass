import landingConfig from '../data/seo-landings.json';

export const SITE_URL = 'https://www.baldininkai.org';
export const SITE_NAME = 'Baldai pagal užsakymą Lietuvoje';
export const CITY_LANDING_THRESHOLD = landingConfig.cityThreshold;
export const CITY_CATEGORY_LANDING_THRESHOLD = landingConfig.cityCategoryThreshold;

export type CategoryLanding = {
  code: string;
  slug: string;
  title: string;
  intro: string;
  buyer_note: string;
};

export type CityCategoryLanding = {
  category: CategoryLanding;
  city: string;
  citySlug: string;
  count: number;
  path: string;
};

export type SeoManufacturer = {
  slug: string;
  trading_name: string;
  legal_name?: string | null;
  source_identity?: string;
  legal_entity_known?: boolean;
  description_lt?: string;
  scope_evidence?: string;
  location?: string;
  city?: string;
  category_codes?: string[];
  category_labels?: string[];
  website?: string;
  public_contact_url?: string;
  company_code?: string | null;
  public_phone?: string | null;
  street_address?: string | null;
  postcode?: string | null;
  founded_year?: number | null;
  employee_count_band?: string | null;
  public_details_source_urls?: string[];
  source_collection_date?: string;
  public_contact_checked_date?: string | null;
  verified_at?: string | null;
};

export const CATEGORY_LANDINGS = landingConfig.categories as CategoryLanding[];

function canonicalPath(path: string): string {
  if (path === '/') return path;
  return `${path.replace(/\/+$/, '')}/`;
}

function canonicalUrl(path: string): string {
  return `${SITE_URL}${canonicalPath(path)}`;
}

function publicHttpUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function validIsoDate(value: unknown): string {
  if (typeof value !== 'string') return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value.trim() : '';
}

export type PageMetadata = {
  title: string;
  description: string;
  path: string;
  robots?: 'index, follow' | 'noindex, follow' | 'noindex, nofollow';
  type?: 'website' | 'article' | 'profile';
  structuredData?: Record<string, unknown>[];
};

export function slugifyLithuanian(value: string): string {
  const replacements: Record<string, string> = {
    ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z',
  };
  return value
    .toLocaleLowerCase('lt-LT')
    .replace(/[ąčęėįšųūž]/g, (character) => replacements[character] ?? character)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCityCounts(records: SeoManufacturer[]): Map<string, number> {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const city = record.city?.trim();
    if (city) counts.set(city, (counts.get(city) ?? 0) + 1);
  });
  return counts;
}

export function getEligibleCityCategoryLandings(records: SeoManufacturer[]): CityCategoryLanding[] {
  const combinations: CityCategoryLanding[] = [];

  CATEGORY_LANDINGS.forEach((category) => {
    const cityCounts = new Map<string, number>();
    records.forEach((record) => {
      const city = record.city?.trim();
      if (city && (record.category_codes ?? []).includes(category.code)) {
        cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
      }
    });

    cityCounts.forEach((count, city) => {
      if (count < CITY_CATEGORY_LANDING_THRESHOLD) return;
      const citySlug = slugifyLithuanian(city);
      combinations.push({
        category,
        city,
        citySlug,
        count,
        path: `/baldai-pagal-uzsakyma/${category.slug}/miestas/${citySlug}`,
      });
    });
  });

  return combinations.sort((a, b) => a.category.title.localeCompare(b.category.title, 'lt') || a.city.localeCompare(b.city, 'lt'));
}

export function getAllCities(records: SeoManufacturer[]): { city: string; slug: string; count: number }[] {
  return Array.from(getCityCounts(records), ([city, count]) => ({ city, slug: slugifyLithuanian(city), count }))
    .sort((a, b) => a.city.localeCompare(b.city, 'lt'));
}

export function getEligibleCities(records: SeoManufacturer[]): { city: string; slug: string; count: number }[] {
  return getAllCities(records).filter((entry) => entry.count >= CITY_LANDING_THRESHOLD);
}

export function getLandingCities(records: SeoManufacturer[]): { city: string; slug: string; count: number }[] {
  return getEligibleCities(records);
}

function ensureMeta(selector: string, create: () => HTMLMetaElement | HTMLLinkElement): HTMLMetaElement | HTMLLinkElement {
  const existing = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (existing) return existing;
  const element = create();
  document.head.append(element);
  return element;
}

function setNamedMeta(name: string, content: string): void {
  const element = ensureMeta(`meta[name="${name}"]`, () => {
    const meta = document.createElement('meta');
    meta.name = name;
    return meta;
  }) as HTMLMetaElement;
  element.content = content;
}

function setPropertyMeta(property: string, content: string): void {
  const element = ensureMeta(`meta[property="${property}"]`, () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', property);
    return meta;
  }) as HTMLMetaElement;
  element.content = content;
}

export function siteStructuredData(): Record<string, unknown>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: 'lt-LT',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export function breadcrumbStructuredData(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function manufacturerStructuredData(record: SeoManufacturer): Record<string, unknown> {
  const name = record.trading_name.trim();
  const description = record.description_lt?.trim() || record.scope_evidence?.trim();
  const hasLocalBusinessFacts = Boolean(
    record.legal_entity_known && record.city?.trim() && (record.website?.trim() || record.public_contact_url?.trim()),
  );
  const profileUrl = canonicalUrl(`/gamintojas/${record.slug}`);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': hasLocalBusinessFacts ? 'LocalBusiness' : 'Organization',
    '@id': `${profileUrl}#entity`,
    name,
    url: profileUrl,
  };
  if (record.legal_name?.trim()) data.legalName = record.legal_name.trim();
  if (description) data.description = description;
  const websiteUrl = publicHttpUrl(record.website);
  if (websiteUrl) data.sameAs = [websiteUrl];
  if (record.public_phone?.trim()) data.telephone = record.public_phone.trim();
  const dateModified = validIsoDate(record.verified_at)
    || validIsoDate(record.public_contact_checked_date)
    || validIsoDate(record.source_collection_date);
  if (dateModified) data.dateModified = dateModified;
  const address: Record<string, string> = { '@type': 'PostalAddress' };
  if (record.street_address?.trim()) address.streetAddress = record.street_address.trim();
  if (record.city?.trim()) address.addressLocality = record.city.trim();
  if (record.postcode?.trim()) address.postalCode = record.postcode.trim();
  if (address.streetAddress || address.addressLocality || address.postalCode) {
    address.addressCountry = 'LT';
    data.address = address;
  }
  if (Number.isInteger(record.founded_year)) data.foundingDate = String(record.founded_year);
  if (record.company_code?.trim()) {
    data.identifier = {
      '@type': 'PropertyValue',
      propertyID: 'Lithuanian company code',
      value: record.company_code.trim(),
    };
  }
  return data;
}

export function faqStructuredData(items: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function itemListStructuredData(
  records: Pick<SeoManufacturer, 'slug' | 'trading_name'>[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: records.length,
    itemListElement: records.map((record, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: canonicalUrl(`/gamintojas/${record.slug}`),
      name: record.trading_name,
    })),
  };
}

export function setPageMetadata(metadata: PageMetadata): void {
  const pageUrl = canonicalUrl(metadata.path);
  document.title = metadata.title;
  setNamedMeta('description', metadata.description);
  setNamedMeta('robots', metadata.robots ?? 'index, follow');
  setPropertyMeta('og:locale', 'lt_LT');
  setPropertyMeta('og:site_name', SITE_NAME);
  setPropertyMeta('og:type', metadata.type ?? 'website');
  setPropertyMeta('og:title', metadata.title);
  setPropertyMeta('og:description', metadata.description);
  setPropertyMeta('og:url', pageUrl);
  setNamedMeta('twitter:card', 'summary');
  setNamedMeta('twitter:title', metadata.title);
  setNamedMeta('twitter:description', metadata.description);

  const canonical = ensureMeta('link[rel="canonical"]', () => {
    const link = document.createElement('link');
    link.rel = 'canonical';
    return link;
  }) as HTMLLinkElement;
  canonical.href = pageUrl;

  const alternate = ensureMeta('link[rel="alternate"][hreflang="lt"]', () => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = 'lt';
    return link;
  }) as HTMLLinkElement;
  alternate.href = pageUrl;

  document.head.querySelectorAll('script[data-seo-structured-data]').forEach((script) => script.remove());
  [...siteStructuredData(), ...(metadata.structuredData ?? [])].forEach((data) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seoStructuredData = 'true';
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    document.head.append(script);
  });
}
