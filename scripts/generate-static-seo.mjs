#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(rootDir, 'public');
const SITE_URL = 'https://lithuanian-eta-app.supernaut.to';
const SITE_NAME = 'Baldai pagal užsakymą Lietuvoje';
const sourceDate = '2026-07-27';

const [manufacturers, landingConfig, baseHtml] = await Promise.all([
  readFile(join(rootDir, 'data/manufacturers.json'), 'utf8').then(JSON.parse),
  readFile(join(rootDir, 'data/seo-landings.json'), 'utf8').then(JSON.parse),
  readFile(join(publicDir, 'index.html'), 'utf8'),
]);

const guideArticles = [
  {
    slug: 'trumpasis-sarasas',
    title: 'Kaip sudaryti pagrįstą trumpąjį sąrašą',
    summary: 'Atrankos seka, patikrinami kriterijai ir klausimai prieš priimant pasiūlymą.',
    sections: [
      ['Pradėkite nuo savo projekto ribų', 'Užrašykite patalpą, matmenis, funkciją, norimas medžiagas, montavimo vietą ir sprendimus, kurių dar nepriėmėte. Taip kandidatus lyginsite pagal tą patį poreikį.'],
      ['Atskirkite viešą signalą nuo patvirtinto fakto', 'Katalogo įrašas yra pradžios taškas. Patikrinkite tapatybę, viešą kontaktą, ar kandidatas imasi tokio projekto, ir paprašykite aktualių darbų pavyzdžių.'],
      ['Trumpąjį sąrašą pagrįskite raštu', 'Fiksuokite, kokia informacija paskatino įtraukti kandidatą, ko dar nežinote ir kokius klausimus turite užduoti prieš lygindami pasiūlymus.'],
    ],
  },
  {
    slug: 'uzklausa-ir-pasiulymas',
    title: 'Kaip parengti užklausą ir palyginti pasiūlymus',
    summary: 'Ką aprašyti, kad gamintojai vertintų tą pačią apimtį, ir kas dažniausiai keičia kainą.',
    sections: [
      ['Vienoda užklausa sukuria palyginamus atsakymus', 'Visiems kandidatams siųskite tą pačią projekto santrauką, matmenis, nuotraukas, medžiagų prioritetus ir pageidaujamą paslaugų apimtį.'],
      ['Kainą lyginkite tik kartu su apimtimi', 'Mažesnė suma gali reikšti kitokias medžiagas, furnitūrą ar neįtrauktą pristatymą ir montavimą. Paprašykite aiškiai išvardyti prielaidas ir išimtis.'],
      ['Naudokite vieną galutinę pasiūlymo versiją', 'Po patikslinimų paprašykite atnaujinto rašytinio pasiūlymo, kuriame būtų gaminiai, medžiagos, paslaugos, kaina, grafikas ir priėmimo sąlygos.'],
    ],
  },
  {
    slug: 'terminai',
    title: 'Kaip prašyti realistiško darbų grafiko',
    summary: 'Terminą lemiantys kintamieji, etapai ir klausimai, padedantys valdyti neapibrėžtumą.',
    sections: [
      ['Vienas skaičius neparodo termino prielaidų', 'Grafiką gali keisti objekto parengtis, matavimas, sprendimų derinimas, medžiagų prieinamumas, gamybos eilė, logistika ir projekto pakeitimai.'],
      ['Prašykite grafiko etapais', 'Atskirai aptarkite galutinį matavimą, brėžinių ir medžiagų tvirtinimą, gamybos pradžią, pristatymo langą ir montavimą.'],
      ['Patvirtinkite, kada terminas tampa įsipareigojimu', 'Raštu išsiaiškinkite, nuo kokio įvykio skaičiuojamas laikas, kurios datos preliminarios ir kaip pasikeitimai perskaičiuoja grafiką.'],
    ],
  },
];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeXml(value = '') {
  return escapeHtml(value);
}

function safeJson(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function canonicalPath(path) {
  if (path === '/') return path;
  return `${path.replace(/\/+$/, '')}/`;
}

function canonicalUrl(path) {
  return `${SITE_URL}${canonicalPath(path)}`;
}

function publicUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function slugifyLithuanian(value) {
  const replacements = { ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z' };
  return value.toLocaleLowerCase('lt-LT')
    .replace(/[ąčęėįšųūž]/g, (character) => replacements[character] ?? character)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatCount(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return `${count} gamintojų kandidatų`;
  if (last === 1) return `${count} gamintojas kandidatas`;
  if (last >= 2 && last <= 9) return `${count} gamintojai kandidatai`;
  return `${count} gamintojų kandidatų`;
}

function siteStructuredData() {
  return [
    { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
    { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: 'lt-LT', publisher: { '@id': `${SITE_URL}/#organization` } },
  ];
}

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: canonicalUrl(item.path) })),
  };
}

function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
  };
}

function manufacturerSchema(record) {
  const description = record.description_lt?.trim() || record.scope_evidence?.trim();
  const hasLocalBusinessFacts = Boolean(record.legal_entity_known && record.city?.trim() && (record.website?.trim() || record.public_contact_url?.trim()));
  const profileUrl = canonicalUrl(`/gamintojas/${record.slug}`);
  const data = {
    '@context': 'https://schema.org',
    '@type': hasLocalBusinessFacts ? 'LocalBusiness' : 'Organization',
    '@id': `${profileUrl}#entity`,
    name: record.trading_name,
    url: profileUrl,
  };
  if (record.legal_name?.trim()) data.legalName = record.legal_name.trim();
  if (description) data.description = description;
  if (publicUrl(record.website)) data.sameAs = [publicUrl(record.website)];
  if (record.city?.trim()) data.address = { '@type': 'PostalAddress', addressLocality: record.city.trim(), addressCountry: 'LT' };
  return data;
}

function injectPage({ title, description, path, body, type = 'website', robots = 'index, follow', structuredData = [] }) {
  const canonical = canonicalUrl(path);
  let html = baseHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace('<div id="app"></div>', `<div id="app">${body}</div>`);
  const head = `
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:locale" content="lt_LT" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
${[...siteStructuredData(), ...structuredData].map((data) => `    <script type="application/ld+json" data-seo-structured-data>${safeJson(data)}</script>`).join('\n')}`;
  return html.replace('</head>', `${head}\n  </head>`);
}

function header(active = 'directory') {
  return `<header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Baldai pagal užsakymą Lietuvoje – pradžia"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span>Baldai pagal užsakymą <strong>Lietuvoje</strong></span></a><nav aria-label="Pagrindinė navigacija"><a href="/"${active === 'directory' ? ' aria-current="page"' : ''}>Gamintojų katalogas</a><a href="/gidas"${active === 'guide' ? ' aria-current="page"' : ''}>Pirkėjo gidas</a></nav></div></header>`;
}

function footer() {
  return '<footer><p>Viešų šaltinių katalogas savarankiškai gamintojų paieškai. Įrašai nepatvirtinti ir nėra kokybės ar prieinamumo garantija.</p></footer>';
}

function manufacturerCard(record) {
  const description = record.description_lt?.trim() || 'Trumpas aprašymas šaltiniuose nepateiktas.';
  return `<article class="manufacturer-card"><div class="card-heading"><h3>${escapeHtml(record.trading_name)}</h3>${record.legal_name ? `<p class="legal-name">${escapeHtml(record.legal_name)}</p>` : ''}</div><p class="location-line"><strong>${escapeHtml(record.city || record.location)}</strong> <span aria-hidden="true"> · </span><span>Regiono grupė: ${escapeHtml(record.region_label)}</span></p><p class="description${record.description_lt?.trim() ? '' : ' description--fallback'}">${escapeHtml(description)}</p><ul class="category-list" aria-label="Gaminamų baldų kategorijos">${record.category_labels.map((label) => `<li>${escapeHtml(label)}</li>`).join('')}</ul><a class="profile-link" href="/gamintojas/${record.slug}">Peržiūrėti katalogo įrašą <span aria-hidden="true">→</span></a></article>`;
}

function faqHtml(items) {
  return `<section class="landing-faq" aria-labelledby="landing-faq-title"><div class="section-heading"><h2 id="landing-faq-title">Dažniausi klausimai</h2></div><dl>${items.map((item) => `<div><dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd></div>`).join('')}</dl></section>`;
}

const cityCounts = new Map();
for (const record of manufacturers) cityCounts.set(record.city, (cityCounts.get(record.city) ?? 0) + 1);
const eligibleCities = Array.from(cityCounts, ([city, count]) => ({ city, count, slug: slugifyLithuanian(city) }))
  .filter((entry) => entry.count >= landingConfig.cityThreshold)
  .sort((a, b) => a.city.localeCompare(b.city, 'lt'));

const categoryBySlug = new Map(landingConfig.categories.map((category) => [category.slug, category]));
const cityBySlug = new Map(eligibleCities.map((city) => [city.slug, city]));
for (const slug of categoryBySlug.keys()) {
  if (cityBySlug.has(slug)) throw new Error(`Category/city route collision: ${slug}`);
}

function profileLandingSection(record) {
  const links = [];
  const city = record.city?.trim();
  const eligibleCity = city ? eligibleCities.find((entry) => entry.city === city) : undefined;
  if (eligibleCity) {
    links.push({ kind: 'Miestas', slug: eligibleCity.slug, label: `Baldų gamintojų kandidatai: ${eligibleCity.city}` });
  }

  const categoryCodes = new Set(record.category_codes ?? []);
  for (const category of landingConfig.categories) {
    if (categoryCodes.has(category.code)) {
      links.push({ kind: 'Kategorija', slug: category.slug, label: category.title });
    }
  }

  if (!links.length) return '';
  return `<section class="profile-landings" aria-labelledby="profile-landings-title"><div class="section-heading"><h2 id="profile-landings-title">Toliau naršykite pagal šį įrašą</h2><p>Kategorijų nuorodos atitinka šiame įraše užfiksuotas šaltinių žymas. Miesto puslapis rodomas tik tada, kai kataloge jam yra pakankamai įrašų.</p></div><nav aria-label="Susiję katalogo puslapiai"><ul class="profile-landing-links">${links.map((link) => `<li><span class="profile-landing-kind">${link.kind}</span><a href="/baldai-pagal-uzsakyma/${link.slug}" data-internal-link="true">${escapeHtml(link.label)} <span aria-hidden="true">→</span></a></li>`).join('')}</ul></nav></section>`;
}

async function writeRoute(path, html) {
  const output = path === '/' ? join(publicDir, 'index.html') : join(publicDir, path.replace(/^\//, ''), 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

const homeBody = `${header()}<main><section class="intro" aria-labelledby="page-title"><div class="intro-copy"><p class="kicker">Viešas paieškos katalogas</p><h1 id="page-title">Raskite baldų gamintojus pagal poreikį ir vietą</h1><p class="lead">Ieškokite Lietuvos nestandartinių baldų gamintojų kandidatų pagal kategoriją, miestą ir šaltiniuose nurodytą regiono grupę.</p><a class="intro-guide-link" href="/gidas">Kaip atrinkti ir palyginti gamintojus →</a></div><aside class="directory-note"><h2>Ką svarbu žinoti</h2><p>Tai iš viešų šaltinių sudarytas, nepatvirtintų kandidatų katalogas. Įrašai nėra kokybės, užimtumo ar meistrystės garantija.</p></aside></section><section class="browse-section"><div class="section-heading"><p class="kicker">Versijuotas šaltinių rinkinys</p><h2>${formatCount(manufacturers.length)}</h2><p>Visi įrašai pateikiami kaip savarankiškos paieškos kandidatai.</p></div><div class="manufacturer-list">${manufacturers.map(manufacturerCard).join('')}</div></section><section class="landing-directory"><div class="section-heading"><h2>Naršykite pagal baldų rūšį arba miestą</h2></div><div class="landing-link-groups"><div><h3>Pagal baldų rūšį</h3><ul>${landingConfig.categories.map((category) => `<li><a href="/baldai-pagal-uzsakyma/${category.slug}">${escapeHtml(category.title)}</a></li>`).join('')}</ul></div><div><h3>Pagal šaltinyje nurodytą miestą</h3><ul>${eligibleCities.map((city) => `<li><a href="/baldai-pagal-uzsakyma/${city.slug}">${escapeHtml(city.city)} (${city.count})</a></li>`).join('')}</ul></div></div></section></main>${footer()}`;
await writeRoute('/', injectPage({
  title: 'Baldai pagal užsakymą Lietuvoje | Gamintojų katalogas',
  description: 'Viešais šaltiniais paremtas nepatvirtintų Lietuvos nestandartinių baldų gamintojų kandidatų katalogas su paieška pagal kategoriją ir vietą.',
  path: '/',
  body: homeBody,
}));

for (const record of manufacturers) {
  const path = `/gamintojas/${record.slug}`;
  const sources = [...new Set([...(record.source_urls ?? []), record.source_artifact_url].map(publicUrl).filter(Boolean))];
  const facts = [
    ['Viešas / prekinis pavadinimas', record.trading_name],
    ['Juridinis pavadinimas', record.legal_name || 'Viešame šaltinyje juridinis pavadinimas nenurodytas.'],
    ['Šaltinyje pateikta tapatybė', record.source_identity],
    ['Vietovė šaltinyje', record.location],
    ['Miestas ar vietovė', record.city],
    ['Šaltinio regiono grupė', record.region_label],
    ['Kategorijos', record.category_labels.join(', ')],
    ['Aprašymas', record.description_lt?.trim() || 'Trumpas aprašymas šaltiniuose nepateiktas.'],
    ['Šaltinyje aprašyta veiklos apimtis', record.scope_evidence?.trim() || 'Papildomas veiklos apimties aprašymas šaltinyje nepateiktas.'],
  ];
  const linkFacts = [
    ['Svetainė', publicUrl(record.website)],
    ['Viešai nurodytas kontaktinis adresas', publicUrl(record.public_contact_url)],
  ].filter(([, value]) => value);
  const body = `${header()}<main class="profile-main"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><article class="profile-sheet"><header class="profile-hero"><div class="profile-heading-group"><p class="record-status">Nepatvirtintas viešų šaltinių įrašas</p><h1>${escapeHtml(record.trading_name)}</h1><p class="profile-identity">${escapeHtml(record.source_identity)}</p></div><a class="profile-guide-link" href="/gidas">Prieš kreipdamiesi peržiūrėkite pirkėjo gidą →</a></header><div class="profile-note"><strong>Duomenys nėra garantija.</strong><span>Šis įrašas nepatvirtina gamintojo tapatybės, kokybės, užimtumo, kainos, terminų ar tinkamumo jūsų projektui.</span></div><section class="profile-details"><div class="section-heading"><h2>Tapatybė, vieta ir veiklos kryptys</h2></div><dl class="profile-facts">${facts.map(([term, detail]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(detail)}</dd></div>`).join('')}${linkFacts.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd><a href="${escapeHtml(value)}" rel="noopener noreferrer">${escapeHtml(value)}</a></dd></div>`).join('')}</dl></section>${profileLandingSection(record)}<section class="provenance-section"><h2>Šaltiniai ir duomenų kilmė</h2><p>Įrašas sudarytas iš viešai prieinamų šaltinių. Katalogas šių duomenų netvirtino su gamintoju.</p><ul class="source-list">${sources.map((source, index) => `<li><span>${index === 0 ? 'Viešas šaltinis' : `Papildomas šaltinis ${index + 1}`}</span><a href="${escapeHtml(source)}" rel="noopener noreferrer">${escapeHtml(source)}</a></li>`).join('')}</ul><p class="collection-date">Šaltinių surinkimo data: <time datetime="${record.source_collection_date}">${record.source_collection_date}</time></p></section></article></main>${footer()}`;
  await writeRoute(path, injectPage({
    title: `${record.trading_name} | Baldų gamintojo įrašas`,
    description: `${record.trading_name}: viešais šaltiniais paremtas, nepatvirtintas gamintojo kandidato įrašas su vieta, kategorijomis ir šaltinių nuorodomis.`,
    path,
    type: 'profile',
    body,
    structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: record.trading_name, path }]), manufacturerSchema(record)],
  }));
}

function categoryFaq(category) {
  return [
    { question: `Ar šiame puslapyje pateikti ${category.title.toLocaleLowerCase('lt-LT')} gamintojai yra rekomenduojami?`, answer: 'Ne. Tai viešais šaltiniais paremtas nepatvirtintų kandidatų sąrašas, skirtas savarankiškai atrankai.' },
    { question: 'Ar kategorijos žyma patvirtina, kad gamintojas priims mano užsakymą?', answer: 'Ne. Kategorija rodo tik šaltinių rinkinyje užfiksuotą veiklos kryptį. Dabartinę pasiūlą, užimtumą ir projekto tinkamumą reikia patvirtinti tiesiogiai.' },
    { question: 'Kaip palyginti pasirinktus kandidatus?', answer: 'Siųskite vienodą projekto aprašymą ir raštu palyginkite medžiagas, furnitūrą, paslaugų apimtį, kainos sudėtį, terminų prielaidas bei priėmimo sąlygas.' },
  ];
}

function cityFaq(city) {
  return [
    { question: `Kodėl kandidatai pateikti ${city} puslapyje?`, answer: `Jų šaltinio įraše kaip bazės miestas ar vietovė nurodytas ${city}. Tai nėra teiginys apie aptarnavimo teritoriją.` },
    { question: `Ar visi šiame sąraše esantys gamintojai aptarnauja visą ${city} miestą ar aplinkinį regioną?`, answer: 'Katalogas to netvirtina. Pristatymo, matavimo ir montavimo teritoriją reikia patikrinti tiesiogiai su kiekvienu kandidatu.' },
    { question: 'Ar sąrašo vieta reiškia kokybės ar prieinamumo patvirtinimą?', answer: 'Ne. Įrašai nepatvirtinti, o jų eiliškumas nėra reitingas ar rekomendacija.' },
  ];
}

async function writeLanding({ slug, title, intro, buyerNote, records, related, faq, kind }) {
  const path = `/baldai-pagal-uzsakyma/${slug}`;
  const description = kind === 'category'
    ? `${title}: ${records.length} viešais šaltiniais paremti nepatvirtinti Lietuvos gamintojų kandidatai, miestai ir atrankos gairės.`
    : `${title.replace('Baldų gamintojų kandidatai: ', '')}: ${records.length} viešuose šaltiniuose šiame mieste registruoti baldų gamintojų kandidatai. Sąrašas nėra paslaugų teritorijos ar kokybės garantija.`;
  const body = `${header()}<main class="landing-main"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><section class="landing-hero"><div><p class="kicker">${kind === 'category' ? 'Baldų kategorija' : 'Šaltinyje nurodytas miestas'}</p><h1>${escapeHtml(title)}</h1><p class="lead">${escapeHtml(intro)}</p></div><aside class="landing-summary"><strong>${formatCount(records.length)}</strong><p>${escapeHtml(buyerNote)}</p></aside></section><section class="landing-related"><div class="section-heading"><h2>${kind === 'category' ? 'Susiję miestų puslapiai' : 'Šaltiniuose nurodytos veiklos kryptys'}</h2></div><ul class="landing-related-links">${related.map((item) => `<li><a href="/baldai-pagal-uzsakyma/${item.slug}">${escapeHtml(item.label)} <span>(${item.count})</span></a></li>`).join('')}</ul></section><section class="landing-results"><div class="section-heading"><h2>Kandidatai iš versijuoto šaltinių rinkinio</h2><p>Įrašai pateikiami abėcėlės tvarka. Prieš priimdami sprendimą patikrinkite tapatybę, pasiūlymo apimtį, kainą ir terminus.</p></div><div class="manufacturer-list">${records.map(manufacturerCard).join('')}</div></section>${faqHtml(faq)}<section class="landing-guide-callout"><div><h2>Atranką tęskite vienoda užklausa</h2><p>Pirkėjo gide rasite klausimus trumpajam sąrašui, pasiūlymų apimčiai ir realistiškam grafikui palyginti.</p></div><a class="primary-button" href="/gidas">Atverti pirkėjo gidą</a></section></main>${footer()}`;
  const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', numberOfItems: records.length, itemListElement: records.map((record, index) => ({ '@type': 'ListItem', position: index + 1, url: canonicalUrl(`/gamintojas/${record.slug}`), name: record.trading_name })) };
  await writeRoute(path, injectPage({ title: `${title} | Gamintojų katalogas`, description, path, body, structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: title, path }]), faqSchema(faq), itemList] }));
}

for (const category of landingConfig.categories) {
  const records = manufacturers.filter((record) => record.category_codes.includes(category.code)).sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'lt'));
  const related = eligibleCities.map((city) => ({ ...city, label: city.city, count: records.filter((record) => record.city === city.city).length })).filter((city) => city.count > 0).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'lt'));
  await writeLanding({ slug: category.slug, title: category.title, intro: category.intro, buyerNote: category.buyer_note, records, related, faq: categoryFaq(category), kind: 'category' });
}

for (const city of eligibleCities) {
  const records = manufacturers.filter((record) => record.city === city.city).sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'lt'));
  const related = landingConfig.categories.map((category) => ({ slug: category.slug, label: category.title, count: records.filter((record) => record.category_codes.includes(category.code)).length })).filter((category) => category.count > 0);
  await writeLanding({ slug: city.slug, title: `Baldų gamintojų kandidatai: ${city.city}`, intro: `Čia pateikiami ${records.length} nepatvirtinti baldų gamintojų kandidatai, kurių viešo šaltinio įraše kaip bazės miestas ar vietovė nurodytas ${city.city}.`, buyerNote: 'Šis sąrašas nepatvirtina, kad kandidatai aptarnauja visą miestą ar aplinkinį regioną. Matavimo, pristatymo ir montavimo vietas patikrinkite tiesiogiai.', records, related, faq: cityFaq(city.city), kind: 'city' });
}

const guideFaq = [
  { question: 'Ar katalogo įrašas yra gamintojo rekomendacija?', answer: 'Ne. Katalogas pateikia viešuose šaltiniuose rastus nepatvirtintus kandidatus ir palieka tapatybės, apimties bei pasiūlymo patikrą pirkėjui.' },
  { question: 'Ar galima lyginti tik galutinę pasiūlymo kainą?', answer: 'Ne. Kainą reikia lyginti kartu su medžiagomis, furnitūra, matavimu, projektavimu, pristatymu, montavimu, terminais ir aiškiai nurodytomis išimtimis.' },
  { question: 'Kaip patikrinti siūlomą gamybos terminą?', answer: 'Paprašykite grafiko etapais ir raštu patvirtinkite, nuo kokio įvykio terminas skaičiuojamas, kokios jo prielaidos ir kas nutinka pasikeitus apimčiai.' },
];
const guideHubBody = `${header('guide')}<main><section class="guide-intro"><div><p class="kicker">Pirkėjo gidas</p><h1>Sprendimą grįskite palyginama informacija, ne vien pažadu</h1></div><p>Katalogas padeda rasti viešuose šaltiniuose matomus kandidatus. Gidas padeda susiaurinti pasirinkimą, pateikti vienodą užklausą ir aiškiai aptarti apimtį, kainą bei laiką.</p></section><section class="guide-hub"><div class="guide-hub-heading"><h2>Trys žingsniai nuo sąrašo iki palyginamo pasiūlymo</h2></div><ol class="guide-route-list">${guideArticles.map((article, index) => `<li><span class="route-number">${index + 1}</span><div><h3><a href="/gidas/${article.slug}">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.summary)}</p></div></li>`).join('')}</ol></section>${faqHtml(guideFaq)}</main>${footer()}`;
await writeRoute('/gidas', injectPage({ title: 'Pirkėjo gidas | Baldai pagal užsakymą Lietuvoje', description: 'Praktinis lietuviškas gidas: kaip atrinkti baldų gamintojus, parengti užklausą, palyginti pasiūlymų apimtį ir susitarti dėl realistiško grafiko.', path: '/gidas', body: guideHubBody, structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo gidas', path: '/gidas' }]), faqSchema(guideFaq)] }));

for (const article of guideArticles) {
  const path = `/gidas/${article.slug}`;
  const body = `${header('guide')}<main class="article-main"><a class="back-link" href="/gidas">← Grįžti į pirkėjo gidą</a><article class="guide-article"><header class="article-header"><p class="kicker">Pirkėjo gidas</p><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.summary)}</p></header><div class="guide-copy">${article.sections.map(([heading, copy]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(copy)}</p></section>`).join('')}</div></article></main>${footer()}`;
  await writeRoute(path, injectPage({ title: `${article.title} | Pirkėjo gidas`, description: article.summary, path, type: 'article', body, structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo gidas', path: '/gidas' }, { name: article.title, path }])] }));
}

const sitemapPaths = [
  '/',
  '/gidas',
  ...guideArticles.map((article) => `/gidas/${article.slug}`),
  ...manufacturers.map((record) => `/gamintojas/${record.slug}`),
  ...landingConfig.categories.map((category) => `/baldai-pagal-uzsakyma/${category.slug}`),
  ...eligibleCities.map((city) => `/baldai-pagal-uzsakyma/${city.slug}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map((path) => `  <url><loc>${escapeXml(canonicalUrl(path))}</loc>${path.startsWith('/gamintojas/') || path.startsWith('/baldai-pagal-uzsakyma/') ? `<lastmod>${sourceDate}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
await writeFile(join(publicDir, 'sitemap.xml'), sitemap);
await writeFile(join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`Generated ${manufacturers.length} profile routes, ${landingConfig.categories.length} category routes, ${eligibleCities.length} city routes, ${guideArticles.length + 1} guide routes, sitemap.xml and robots.txt.`);
