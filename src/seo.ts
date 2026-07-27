import landingConfig from '../data/seo-landings.json';

export const SITE_URL = 'https://lithuanian-eta-app.supernaut.to';
export const SITE_NAME = 'Baldai pagal užsakymą Lietuvoje';
export const CITY_LANDING_THRESHOLD = landingConfig.cityThreshold;

export type CategoryLanding = {
  code: string;
  slug: string;
  title: string;
  intro: string;
  buyer_note: string;
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
  source_collection_date?: string;
};

export const CATEGORY_LANDINGS = landingConfig.categories as CategoryLanding[];

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

export function getEligibleCities(records: SeoManufacturer[]): { city: string; slug: string; count: number }[] {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const city = record.city?.trim();
    if (city) counts.set(city, (counts.get(city) ?? 0) + 1);
  });

  return Array.from(counts, ([city, count]) => ({ city, slug: slugifyLithuanian(city), count }))
    .filter((entry) => entry.count >= CITY_LANDING_THRESHOLD)
    .sort((a, b) => a.city.localeCompare(b.city, 'lt'));
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
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function manufacturerStructuredData(record: SeoManufacturer): Record<string, unknown> {
  const name = record.trading_name.trim();
  const description = record.description_lt?.trim() || record.scope_evidence?.trim();
  const hasLocalBusinessFacts = Boolean(
    record.legal_entity_known && record.city?.trim() && (record.website?.trim() || record.public_contact_url?.trim()),
  );
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': hasLocalBusinessFacts ? 'LocalBusiness' : 'Organization',
    '@id': `${SITE_URL}/gamintojas/${record.slug}#entity`,
    name,
    url: `${SITE_URL}/gamintojas/${record.slug}`,
  };
  if (record.legal_name?.trim()) data.legalName = record.legal_name.trim();
  if (description) data.description = description;
  if (record.website?.trim()) data.sameAs = [record.website.trim()];
  if (record.city?.trim()) {
    data.address = {
      '@type': 'PostalAddress',
      addressLocality: record.city.trim(),
      addressCountry: 'LT',
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

export function setPageMetadata(metadata: PageMetadata): void {
  document.title = metadata.title;
  setNamedMeta('description', metadata.description);
  setNamedMeta('robots', metadata.robots ?? 'index, follow');
  setPropertyMeta('og:locale', 'lt_LT');
  setPropertyMeta('og:site_name', SITE_NAME);
  setPropertyMeta('og:type', metadata.type ?? 'website');
  setPropertyMeta('og:title', metadata.title);
  setPropertyMeta('og:description', metadata.description);
  setPropertyMeta('og:url', `${SITE_URL}${metadata.path}`);
  setNamedMeta('twitter:card', 'summary');
  setNamedMeta('twitter:title', metadata.title);
  setNamedMeta('twitter:description', metadata.description);

  const canonical = ensureMeta('link[rel="canonical"]', () => {
    const link = document.createElement('link');
    link.rel = 'canonical';
    return link;
  }) as HTMLLinkElement;
  canonical.href = `${SITE_URL}${metadata.path}`;

  document.head.querySelectorAll('script[data-seo-structured-data]').forEach((script) => script.remove());
  [...siteStructuredData(), ...(metadata.structuredData ?? [])].forEach((data) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seoStructuredData = 'true';
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    document.head.append(script);
  });
}
