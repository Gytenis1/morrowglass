import type { RecordModel } from 'pocketbase';
import './styles.css';
import { pb } from './pocketbase';

type Manufacturer = RecordModel & {
  slug: string;
  legal_name: string;
  trading_name: string;
  source_identity: string;
  description_lt: string;
  location: string;
  city: string;
  region: string;
  region_label: string;
  category_codes: string[];
  category_labels: string[];
  website: string;
};

type BrowseState = {
  query: string;
  category: string;
  city: string;
  region: string;
};

type FilterOption = {
  value: string;
  label: string;
};

const PAGE_SIZE = 50;
const collator = new Intl.Collator('lt', { sensitivity: 'base' });
const root = document.querySelector<HTMLElement>('#app');

let manufacturers: Manufacturer[] = [];
let browseState = readBrowseState();
let isLoading = false;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('lt-LT');
}

function readBrowseState(): BrowseState {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get('q')?.trim() ?? '',
    category: params.get('kategorija') ?? '',
    city: params.get('miestas') ?? '',
    region: params.get('regionas') ?? '',
  };
}

function syncBrowseState(mode: 'push' | 'replace'): void {
  const params = new URLSearchParams();
  if (browseState.query) params.set('q', browseState.query);
  if (browseState.category) params.set('kategorija', browseState.category);
  if (browseState.city) params.set('miestas', browseState.city);
  if (browseState.region) params.set('regionas', browseState.region);

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl === currentUrl) return;
  window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', nextUrl);
}

async function fetchAllManufacturers(): Promise<Manufacturer[]> {
  const records: Manufacturer[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await pb.collection<Manufacturer>('manufacturers').getList(page, PAGE_SIZE, {
      sort: 'trading_name',
      requestKey: `manufacturers-page-${page}`,
    });
    records.push(...response.items);
    totalPages = response.totalPages;
    page += 1;
  } while (page <= totalPages);

  return records.sort((a, b) => collator.compare(a.trading_name, b.trading_name));
}

function getCategoryOptions(records: Manufacturer[]): FilterOption[] {
  const categories = new Map<string, string>();
  records.forEach((record) => {
    record.category_codes.forEach((code, index) => {
      const label = record.category_labels[index];
      if (code && label) categories.set(code, label);
    });
  });

  return Array.from(categories, ([value, label]) => ({ value, label })).sort((a, b) =>
    collator.compare(a.label, b.label),
  );
}

function getOptions(records: Manufacturer[], valueKey: 'city' | 'region', labelKey: 'city' | 'region_label'): FilterOption[] {
  const options = new Map<string, string>();
  records.forEach((record) => {
    const value = record[valueKey]?.trim();
    const label = record[labelKey]?.trim();
    if (value && label) options.set(value, label);
  });

  return Array.from(options, ([value, label]) => ({ value, label })).sort((a, b) =>
    collator.compare(a.label, b.label),
  );
}

function validateBrowseState(
  categories: FilterOption[],
  cities: FilterOption[],
  regions: FilterOption[],
): void {
  const hasValue = (options: FilterOption[], value: string) => options.some((option) => option.value === value);
  let changed = false;

  if (browseState.category && !hasValue(categories, browseState.category)) {
    browseState.category = '';
    changed = true;
  }
  if (browseState.city && !hasValue(cities, browseState.city)) {
    browseState.city = '';
    changed = true;
  }
  if (browseState.region && !hasValue(regions, browseState.region)) {
    browseState.region = '';
    changed = true;
  }

  if (changed) syncBrowseState('replace');
}

function getFilteredManufacturers(records: Manufacturer[]): Manufacturer[] {
  const query = normalize(browseState.query);

  return records.filter((record) => {
    const matchesQuery =
      !query ||
      [
        record.trading_name,
        record.legal_name,
        record.source_identity,
        record.description_lt,
        ...record.category_labels,
        ...record.category_codes,
      ].some((value) => normalize(value ?? '').includes(query));

    const matchesCategory =
      !browseState.category || record.category_codes.includes(browseState.category);
    const matchesCity = !browseState.city || record.city === browseState.city;
    const matchesRegion = !browseState.region || record.region === browseState.region;

    return matchesQuery && matchesCategory && matchesCity && matchesRegion;
  });
}

function formatManufacturerCount(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return `${count} gamintojų kandidatų`;
  if (last === 1) return `${count} gamintojas kandidatas`;
  if (last >= 2 && last <= 9) return `${count} gamintojai kandidatai`;
  return `${count} gamintojų kandidatų`;
}

function distinctLegalName(record: Manufacturer): string {
  const legal = record.legal_name.trim();
  if (!legal) return '';

  const simplify = (value: string) =>
    normalize(value)
      .replace(/\b(uab|ab|mb|všį|iį|įi|kib|tūb)\b/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();

  const simplifiedLegal = simplify(legal);
  const simplifiedTrading = simplify(record.trading_name);
  if (
    !simplifiedLegal ||
    simplifiedLegal === simplifiedTrading ||
    simplifiedLegal.includes(simplifiedTrading) ||
    simplifiedTrading.includes(simplifiedLegal)
  ) {
    return '';
  }
  return legal;
}

function createSelect(
  id: string,
  label: string,
  allLabel: string,
  options: FilterOption[],
  selectedValue: string,
): HTMLDivElement {
  const field = document.createElement('div');
  field.className = 'filter-field';

  const labelElement = document.createElement('label');
  labelElement.htmlFor = id;
  labelElement.textContent = label;

  const selectWrap = document.createElement('div');
  selectWrap.className = 'select-wrap';

  const select = document.createElement('select');
  select.id = id;
  select.name = id;

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = allLabel;
  select.append(allOption);

  options.forEach((option) => {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    element.selected = option.value === selectedValue;
    select.append(element);
  });

  selectWrap.append(select);
  field.append(labelElement, selectWrap);
  return field;
}

function createManufacturerCard(record: Manufacturer): HTMLElement {
  const article = document.createElement('article');
  article.className = 'manufacturer-card';

  const headingGroup = document.createElement('div');
  headingGroup.className = 'card-heading';

  const heading = document.createElement('h2');
  heading.textContent = record.trading_name;

  const legalName = distinctLegalName(record);
  if (legalName) {
    const legal = document.createElement('p');
    legal.className = 'legal-name';
    legal.textContent = legalName;
    headingGroup.append(heading, legal);
  } else {
    headingGroup.append(heading);
  }

  const location = document.createElement('p');
  location.className = 'location-line';
  const city = document.createElement('strong');
  city.textContent = record.city;
  const separator = document.createElement('span');
  separator.setAttribute('aria-hidden', 'true');
  separator.textContent = ' · ';
  const region = document.createElement('span');
  region.textContent = `Regiono grupė: ${record.region_label}`;
  location.append(city, separator, region);

  const description = document.createElement('p');
  description.className = record.description_lt.trim() ? 'description' : 'description description--fallback';
  description.textContent = record.description_lt.trim() || 'Trumpas aprašymas šaltiniuose nepateiktas.';

  const categories = document.createElement('ul');
  categories.className = 'category-list';
  categories.setAttribute('aria-label', 'Gaminamų baldų kategorijos');
  record.category_labels.forEach((label) => {
    const item = document.createElement('li');
    item.textContent = label;
    categories.append(item);
  });

  const link = document.createElement('a');
  link.className = 'profile-link';
  link.href = `/gamintojas/${encodeURIComponent(record.slug)}`;
  link.dataset.internalLink = 'true';
  link.textContent = 'Peržiūrėti katalogo įrašą';
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = ' →';
  link.append(arrow);

  article.append(headingGroup, location, description, categories, link);
  return article;
}

function renderShell(): void {
  if (!root) return;
  root.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" data-internal-link="true" aria-label="Baldai pagal užsakymą Lietuvoje – pradžia">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>Baldai pagal užsakymą <strong>Lietuvoje</strong></span>
        </a>
        <nav aria-label="Pagrindinė navigacija">
          <a href="#gamintojai">Gamintojų katalogas</a>
          <a href="#apie-kataloga">Apie katalogą</a>
        </nav>
      </div>
    </header>
    <main>
      <section class="intro" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="kicker">Viešas paieškos katalogas</p>
          <h1 id="page-title">Raskite baldų gamintojus pagal poreikį ir vietą</h1>
          <p class="lead">Ieškokite Lietuvos nestandartinių baldų gamintojų kandidatų pagal kategoriją, miestą ir šaltiniuose nurodytą regiono grupę.</p>
        </div>
        <aside class="directory-note" id="apie-kataloga" aria-labelledby="directory-note-title">
          <h2 id="directory-note-title">Ką svarbu žinoti</h2>
          <p>Tai iš viešų šaltinių sudarytas, nepatvirtintų kandidatų katalogas. Įrašai nėra kokybės, užimtumo ar meistrystės garantija, todėl informaciją ir pasiūlymus įvertinkite savarankiškai.</p>
        </aside>
      </section>
      <section class="browse-section" id="gamintojai" aria-labelledby="browse-title">
        <div id="browse-content"></div>
      </section>
    </main>
    <footer>
      <p>Viešų šaltinių katalogas savarankiškai gamintojų paieškai.</p>
    </footer>
  `;
}

function renderLoading(): void {
  const container = document.querySelector<HTMLElement>('#browse-content');
  if (!container) return;
  container.innerHTML = `
    <div class="loading-state" role="status" aria-live="polite">
      <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <div>
        <h2 id="browse-title">Kraunamas gamintojų katalogas</h2>
        <p>Gaunami naujausi viešo šaltinio įrašai…</p>
      </div>
    </div>
  `;
}

function renderError(): void {
  const container = document.querySelector<HTMLElement>('#browse-content');
  if (!container) return;
  container.innerHTML = `
    <div class="message-state message-state--error" role="alert">
      <p class="state-label">Duomenų gauti nepavyko</p>
      <h2 id="browse-title">Katalogas šiuo metu nepasiekiamas</h2>
      <p>Patikrinkite interneto ryšį ir bandykite dar kartą.</p>
      <button class="primary-button" id="retry-button" type="button">Bandyti dar kartą</button>
    </div>
  `;
  document.querySelector<HTMLButtonElement>('#retry-button')?.addEventListener('click', () => void loadDirectory());
}

function renderBrowse(): void {
  const container = document.querySelector<HTMLElement>('#browse-content');
  if (!container) return;

  const categoryOptions = getCategoryOptions(manufacturers);
  const cityOptions = getOptions(manufacturers, 'city', 'city');
  const regionOptions = getOptions(manufacturers, 'region', 'region_label');
  validateBrowseState(categoryOptions, cityOptions, regionOptions);

  container.replaceChildren();

  const controls = document.createElement('div');
  controls.className = 'browse-controls';

  const controlsHeading = document.createElement('div');
  controlsHeading.className = 'controls-heading';
  controlsHeading.innerHTML = `
    <div>
      <p class="kicker">Paieška ir filtrai</p>
      <h2 id="browse-title">Gamintojų katalogas</h2>
    </div>
    <p>Filtrai taikomi kartu: rodomi tik visus pasirinktus kriterijus atitinkantys įrašai.</p>
  `;

  const form = document.createElement('form');
  form.className = 'filter-form';
  form.setAttribute('role', 'search');
  form.addEventListener('submit', (event) => event.preventDefault());

  const searchField = document.createElement('div');
  searchField.className = 'filter-field filter-field--search';
  const searchLabel = document.createElement('label');
  searchLabel.htmlFor = 'directory-search';
  searchLabel.textContent = 'Ieškoti kataloge';
  const searchInput = document.createElement('input');
  searchInput.id = 'directory-search';
  searchInput.name = 'paieska';
  searchInput.type = 'search';
  searchInput.autocomplete = 'off';
  searchInput.placeholder = 'Pavadinimas, aprašymas ar kategorija';
  searchInput.value = browseState.query;
  searchField.append(searchLabel, searchInput);

  const fields = document.createElement('div');
  fields.className = 'filter-grid';
  fields.append(
    searchField,
    createSelect('category-filter', 'Baldų kategorija', 'Visos kategorijos', categoryOptions, browseState.category),
    createSelect('city-filter', 'Miestas', 'Visi miestai', cityOptions, browseState.city),
    createSelect('region-filter', 'Šaltinio regiono grupė', 'Visos regiono grupės', regionOptions, browseState.region),
  );

  const filterActions = document.createElement('div');
  filterActions.className = 'filter-actions';
  const activeHint = document.createElement('p');
  activeHint.textContent = 'Paieška atnaujinama iškart vedant tekstą.';
  const clearButton = document.createElement('button');
  clearButton.className = 'text-button';
  clearButton.id = 'clear-filters';
  clearButton.type = 'button';
  clearButton.textContent = 'Išvalyti paiešką ir filtrus';
  filterActions.append(activeHint, clearButton);

  form.append(fields, filterActions);
  controls.append(controlsHeading, form);

  const results = document.createElement('div');
  results.className = 'results-area';
  results.id = 'results-area';

  container.append(controls, results);

  searchInput.addEventListener('input', () => {
    browseState.query = searchInput.value.trimStart();
    syncBrowseState('replace');
    renderResults();
  });

  document.querySelector<HTMLSelectElement>('#category-filter')?.addEventListener('change', (event) => {
    browseState.category = (event.currentTarget as HTMLSelectElement).value;
    syncBrowseState('push');
    renderResults();
  });
  document.querySelector<HTMLSelectElement>('#city-filter')?.addEventListener('change', (event) => {
    browseState.city = (event.currentTarget as HTMLSelectElement).value;
    syncBrowseState('push');
    renderResults();
  });
  document.querySelector<HTMLSelectElement>('#region-filter')?.addEventListener('change', (event) => {
    browseState.region = (event.currentTarget as HTMLSelectElement).value;
    syncBrowseState('push');
    renderResults();
  });
  clearButton.addEventListener('click', () => {
    browseState = { query: '', category: '', city: '', region: '' };
    syncBrowseState('push');
    renderBrowse();
    document.querySelector<HTMLInputElement>('#directory-search')?.focus();
  });

  renderResults();
}

function renderResults(): void {
  const results = document.querySelector<HTMLElement>('#results-area');
  if (!results) return;

  const filtered = getFilteredManufacturers(manufacturers);
  const hasFilters = Boolean(
    browseState.query || browseState.category || browseState.city || browseState.region,
  );

  results.replaceChildren();

  const resultHeader = document.createElement('div');
  resultHeader.className = 'result-header';
  const count = document.createElement('p');
  count.className = 'result-count';
  count.setAttribute('role', 'status');
  count.setAttribute('aria-live', 'polite');
  count.textContent = hasFilters
    ? `Rodoma įrašų: ${filtered.length}. Iš viso kataloge: ${manufacturers.length}.`
    : `Kataloge – ${formatManufacturerCount(manufacturers.length)}.`;
  resultHeader.append(count);

  if (hasFilters) {
    const active = document.createElement('p');
    active.className = 'active-filters';
    active.textContent = 'Aktyvi atranka pagal pasirinktus kriterijus';
    resultHeader.append(active);
  }

  results.append(resultHeader);

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'message-state';
    const label = document.createElement('p');
    label.className = 'state-label';
    label.textContent = 'Rezultatų nėra';
    const heading = document.createElement('h3');
    heading.textContent = 'Pagal šiuos kriterijus įrašų nerasta';
    const copy = document.createElement('p');
    copy.textContent = 'Pakeiskite paieškos žodį, pasirinkite platesnę vietovę arba išvalykite filtrus.';
    const button = document.createElement('button');
    button.className = 'primary-button';
    button.type = 'button';
    button.textContent = 'Išvalyti visus kriterijus';
    button.addEventListener('click', () => {
      browseState = { query: '', category: '', city: '', region: '' };
      syncBrowseState('push');
      renderBrowse();
    });
    empty.append(label, heading, copy, button);
    results.append(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'manufacturer-list';
  filtered.forEach((record) => list.append(createManufacturerCard(record)));
  results.append(list);
}

function renderProfile(record: Manufacturer | undefined): void {
  if (!root) return;
  root.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" data-internal-link="true" aria-label="Baldai pagal užsakymą Lietuvoje – pradžia">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>Baldai pagal užsakymą <strong>Lietuvoje</strong></span>
        </a>
      </div>
    </header>
    <main class="profile-main" id="profile-main"></main>
    <footer><p>Viešų šaltinių katalogas savarankiškai gamintojų paieškai.</p></footer>
  `;

  const main = document.querySelector<HTMLElement>('#profile-main');
  if (!main) return;

  const back = document.createElement('a');
  back.className = 'back-link';
  back.href = `/${window.location.search}`;
  back.dataset.internalLink = 'true';
  back.textContent = '← Grįžti į gamintojų katalogą';

  if (!record) {
    const state = document.createElement('section');
    state.className = 'message-state profile-state';
    state.innerHTML = `
      <p class="state-label">Įrašas nerastas</p>
      <h1>Tokio gamintojo kataloge nėra</h1>
      <p>Patikrinkite nuorodą arba grįžkite į katalogą ir pasirinkite kitą įrašą.</p>
    `;
    main.append(back, state);
    return;
  }

  document.title = `${record.trading_name} | Baldai pagal užsakymą Lietuvoje`;

  const section = document.createElement('section');
  section.className = 'profile-sheet';

  const kicker = document.createElement('p');
  kicker.className = 'kicker';
  kicker.textContent = 'Nepatvirtintas katalogo įrašas';

  const heading = document.createElement('h1');
  heading.textContent = record.trading_name;

  const legalName = distinctLegalName(record);
  const legal = document.createElement('p');
  legal.className = 'profile-legal';
  legal.textContent = legalName ? `Juridinis pavadinimas: ${legalName}` : '';
  legal.hidden = !legalName;

  const note = document.createElement('p');
  note.className = 'profile-note';
  note.textContent = 'Šiame puslapyje rodoma tik viešuose katalogo šaltiniuose esanti santrauka. Prieš susisiekdami informaciją patikrinkite savarankiškai.';

  const facts = document.createElement('dl');
  facts.className = 'profile-facts';
  const factRows: Array<[string, string]> = [
    ['Miestas', record.city],
    ['Šaltinio regiono grupė', record.region_label],
    ['Kategorijos', record.category_labels.join(', ')],
    ['Aprašymas', record.description_lt.trim() || 'Trumpas aprašymas šaltiniuose nepateiktas.'],
  ];
  factRows.forEach(([term, detail]) => {
    const wrapper = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = detail;
    wrapper.append(dt, dd);
    facts.append(wrapper);
  });

  section.append(kicker, heading, legal, note, facts);

  if (record.website) {
    const website = document.createElement('a');
    website.className = 'primary-button profile-website';
    website.href = record.website;
    website.target = '_blank';
    website.rel = 'noopener noreferrer';
    website.textContent = 'Atverti gamintojo svetainę';
    section.append(website);
  }

  main.append(back, section);
}

function route(): void {
  if (window.location.pathname.startsWith('/gamintojas/')) {
    const slug = decodeURIComponent(window.location.pathname.split('/').filter(Boolean)[1] ?? '');
    renderProfile(manufacturers.find((record) => record.slug === slug));
    return;
  }

  document.title = 'Baldai pagal užsakymą Lietuvoje | Gamintojų katalogas';
  renderShell();
  renderBrowse();
}

async function loadDirectory(): Promise<void> {
  if (isLoading) return;
  isLoading = true;
  renderShell();
  renderLoading();

  try {
    manufacturers = await fetchAllManufacturers();
    browseState = readBrowseState();
    route();
  } catch (error) {
    console.error('Nepavyko gauti gamintojų katalogo.', error);
    renderError();
  } finally {
    isLoading = false;
  }
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>('a[data-internal-link="true"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const url = new URL(link.href, window.location.origin);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  browseState = readBrowseState();
  route();
  window.scrollTo({ top: 0, behavior: 'auto' });
});

window.addEventListener('popstate', () => {
  browseState = readBrowseState();
  route();
});

void loadDirectory();
