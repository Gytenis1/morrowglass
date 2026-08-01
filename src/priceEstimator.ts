import { SITE_URL, breadcrumbStructuredData, setPageMetadata } from './seo';

type HeaderSection = 'directory' | 'guide' | 'request' | 'policy';

type EstimatorContext = {
  root: HTMLElement;
  renderHeader: (active: HeaderSection) => string;
  renderFooter: () => string;
};

type FurnitureType = {
  value: string;
  label: string;
  requestCategory: string;
  measureLabel: string;
  measureShort: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  included: string;
};

type Tier = {
  value: string;
  label: string;
  detail: string;
  factors: [number, number, number];
};

type Worktop = {
  value: string;
  label: string;
  detail: string;
  factors: [number, number, number];
};

type Estimate = {
  low: number;
  typical: number;
  high: number;
};

export const ESTIMATOR_PATH = '/baldu-kainos-skaiciuokle';

const PRICE_ANCHORS: [number, number, number] = [300, 548, 800];

const furnitureTypes: FurnitureType[] = [
  {
    value: 'kitchen',
    label: 'Virtuvė',
    requestCategory: 'Virtuvės baldai',
    measureLabel: 'Preliminarus baldų ilgis metrais',
    measureShort: 'bėginiai metrai',
    min: 1,
    max: 20,
    step: 0.5,
    initial: 4,
    included: 'virtuvės korpusų, fasadų ir bazinės furnitūros gamybos apimtis',
  },
  {
    value: 'wardrobe',
    label: 'Spinta ar įmontuojami baldai',
    requestCategory: 'Spintos ar įmontuojami baldai',
    measureLabel: 'Preliminarus baldų plotis metrais',
    measureShort: 'pločio metrai',
    min: 1,
    max: 15,
    step: 0.5,
    initial: 3,
    included: 'korpusų, durų ir bazinio vidaus suplanavimo gamybos apimtis',
  },
  {
    value: 'bed-bath',
    label: 'Miegamojo ar vonios baldai',
    requestCategory: 'Miegamojo ar vonios baldai',
    measureLabel: 'Preliminarus atskirų baldų ar modulių skaičius',
    measureShort: 'moduliai',
    min: 1,
    max: 30,
    step: 1,
    initial: 3,
    included: 'nurodyto baldų ar modulių kiekio korpusų ir fasadų gamybos apimtis',
  },
  {
    value: 'office',
    label: 'Biuro ar komerciniai baldai',
    requestCategory: 'Biuro ar komerciniai baldai',
    measureLabel: 'Preliminarus darbo vietų ar baldų modulių skaičius',
    measureShort: 'moduliai',
    min: 1,
    max: 50,
    step: 1,
    initial: 6,
    included: 'nurodyto darbo vietų ar baldų modulių kiekio gamybos apimtis',
  },
  {
    value: 'other',
    label: 'Kitas nestandartinis projektas',
    requestCategory: 'Kitas baldų projektas',
    measureLabel: 'Preliminarus atskirų baldų ar modulių skaičius',
    measureShort: 'moduliai',
    min: 1,
    max: 30,
    step: 1,
    initial: 3,
    included: 'nurodyto nestandartinių baldų ar modulių kiekio gamybos apimtis',
  },
];

const tiers: Tier[] = [
  {
    value: 'practical',
    label: 'Praktiškas',
    detail: 'LMDP korpusai ir paprastesni lygūs fasadai',
    factors: [0.9, 0.95, 1],
  },
  {
    value: 'balanced',
    label: 'Subalansuotas',
    detail: 'LMDP korpusai ir MDF ar panašaus sudėtingumo fasadai',
    factors: [1, 1, 1],
  },
  {
    value: 'detailed',
    label: 'Sudėtingesnė apdaila',
    detail: 'Dažytas ar frezuotas MDF, daugiau matomų apdailos detalių',
    factors: [1.05, 1.15, 1.3],
  },
  {
    value: 'natural',
    label: 'Natūrali mediena',
    detail: 'Faneruoti ar medžio masyvo fasadai ir jų apdaila',
    factors: [1.1, 1.3, 1.55],
  },
];

const worktops: Worktop[] = [
  {
    value: 'none',
    label: 'Netaikoma arba atskira sąmata',
    detail: 'Stalviršio pasirinkimas baldų intervalo nekeičia',
    factors: [1, 1, 1],
  },
  {
    value: 'laminate',
    label: 'Laminuotas stalviršis',
    detail: 'Pažymimas projekto apimtyje; atskiro tarifo skaičiuoklė neprideda',
    factors: [1, 1, 1.04],
  },
  {
    value: 'compact-wood',
    label: 'Kompaktinis laminatas arba medis',
    detail: 'Didesnė apimties nežinomybė parodoma platesne viršutine riba',
    factors: [1, 1.04, 1.1],
  },
  {
    value: 'quartz',
    label: 'Kompozicinis kvarcas',
    detail: 'Šablonavimas, išpjovos, sujungimai ir montavimas turi būti įkainoti atskirai',
    factors: [1, 1.05, 1.15],
  },
  {
    value: 'stone',
    label: 'Natūralus akmuo',
    detail: 'Konkreti plokštė ir montavimo apimtis turi būti įkainoti atskirai',
    factors: [1, 1.08, 1.2],
  },
];

const cities = ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Alytus', 'Marijampolė', 'Kitas miestas ar rajonas'];

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function option(value: string, label: string, selected = false): string {
  return `<option value="${escapeHtml(value)}"${selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}

function roundCurrency(value: number): number {
  return Math.max(100, Math.round(value / 50) * 50);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateEstimate(size: number, tier: Tier, worktop: Worktop): Estimate {
  const values = PRICE_ANCHORS.map((anchor, index) => roundCurrency(anchor * size * tier.factors[index] * worktop.factors[index])) as [number, number, number];
  return { low: values[0], typical: values[1], high: Math.max(values[2], values[1]) };
}

function buildRequestUrl(type: FurnitureType, size: number, tier: Tier, worktop: Worktop, city: string, estimate: Estimate): string {
  const params = new URLSearchParams({
    saltinis: 'kainos-skaiciuokle',
    category: type.requestCategory,
    municipality: city,
    service_region: city,
    project_stage: 'Yra preliminarūs matmenys',
    project_scope: `${type.label}. Preliminari apimtis: ${size.toLocaleString('lt-LT')} ${type.measureShort}. Skaičiuoklės orientyras: ${formatCurrency(estimate.low)}–${formatCurrency(estimate.high)}, tipinė modelio reikšmė ${formatCurrency(estimate.typical)}. Tai nėra pasiūlymas.`,
    dimensions_room_count: `${size.toLocaleString('lt-LT')} ${type.measureShort}; galutinius matmenis reikia patikrinti objekte.`,
    materials_requirements: `${tier.label}: ${tier.detail}. Stalviršis: ${worktop.label}. ${worktop.detail}.`,
    budget_min: String(estimate.low),
    budget_max: String(estimate.high),
  });
  return `/gauti-pasiulymus?${params.toString()}`;
}

export function renderPriceEstimator({ root, renderHeader, renderFooter }: EstimatorContext): void {
  setPageMetadata({
    title: 'Baldų kainos skaičiuoklė | Orientacinė sąmata Lietuvoje',
    description: 'Orientacinė nestandartinių baldų kainos skaičiuoklė pagal baldų tipą, apimtį, fasadų lygį, stalviršį ir miestą, paremta Baldininkai.org gidais.',
    path: ESTIMATOR_PATH,
    structuredData: [
      breadcrumbStructuredData([
        { name: 'Gamintojų katalogas', path: '/' },
        { name: 'Pirkėjo gidas', path: '/gidas' },
        { name: 'Baldų kainos skaičiuoklė', path: ESTIMATOR_PATH },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Baldų kainos skaičiuoklė',
        url: `${SITE_URL}${ESTIMATOR_PATH}/`,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Any',
        inLanguage: 'lt-LT',
        description: 'Orientacinis nestandartinių baldų kainos intervalo skaičiavimas pagal projekto apimtį ir pasirinktus sprendinius.',
      },
    ],
  });

  root.innerHTML = `
    ${renderHeader('guide')}
    <main class="buyer-tool-main estimator-main">
      <nav class="tool-navigation" aria-label="Pirkėjo įrankiai">
        <strong>Pirkėjo įrankiai</strong>
        <div>
          <a href="${ESTIMATOR_PATH}" data-internal-link="true" aria-current="page">Kainos skaičiuoklė</a>
          <a href="/gauti-pasiulymus" data-internal-link="true">Projekto užklausa</a>
          <a href="/palyginti-pasiulymus" data-internal-link="true">Pasiūlymų palyginimas</a>
          <a href="/gidas/baldu-pirkimo-sutarties-sablonas" data-internal-link="true">Sutarties šablonas</a>
        </div>
      </nav>

      <section class="estimator-intro" aria-labelledby="estimator-title">
        <div>
          <p class="kicker">Orientacinis biudžeto intervalas</p>
          <h1 id="estimator-title">Patikrinkite kainos ribas prieš siųsdami užklausą</h1>
          <p class="lead">Pasirinkite projekto apimtį ir sprendinius. Skaičiuoklė parodys žemą, tipinę ir aukštą modelio ribą bei perkels duomenis į pasiūlymo užklausą.</p>
        </div>
        <aside class="estimator-intro-note" role="note">
          <strong>Ne kainoraštis</strong>
          <p>Rezultatas yra orientacinis įvertis, ne pasiūlymas. Galutinę kainą galima nustatyti tik pagal brėžinius, tikslias medžiagas, paslaugų apimtį ir objekto sąlygas.</p>
        </aside>
      </section>

      <div class="estimator-layout">
        <form class="estimator-form" id="price-estimator-form">
          <fieldset>
            <legend>Projektas</legend>
            <div class="estimator-field">
              <label for="estimator-type">Baldų tipas</label>
              <div class="select-wrap"><select id="estimator-type" name="type">${furnitureTypes.map((type, index) => option(type.value, type.label, index === 0)).join('')}</select></div>
            </div>
            <div class="estimator-field">
              <label for="estimator-size" id="estimator-size-label">${furnitureTypes[0].measureLabel}</label>
              <div class="estimator-number-row">
                <input id="estimator-size" name="size" type="number" inputmode="decimal" min="${furnitureTypes[0].min}" max="${furnitureTypes[0].max}" step="${furnitureTypes[0].step}" value="${furnitureTypes[0].initial}" aria-describedby="estimator-size-hint">
                <span id="estimator-size-unit">${furnitureTypes[0].measureShort}</span>
              </div>
              <p class="field-hint" id="estimator-size-hint">Naudokite preliminarų dydį. Galutiniai matmenys turi būti patikrinti objekte.</p>
            </div>
            <div class="estimator-field">
              <label for="estimator-city">Miestas ar rajonas</label>
              <input id="estimator-city" name="city" type="text" list="estimator-city-options" value="Vilnius" autocomplete="address-level2" maxlength="120">
              <datalist id="estimator-city-options">${cities.map((city) => option(city, city)).join('')}</datalist>
              <p class="field-hint">Įrašykite tikslų miestą ar rajoną. Logistikos kaina neskaičiuojama, nes gidai nepateikia vienodo tarifo.</p>
            </div>
          </fieldset>

          <fieldset>
            <legend>Medžiagos ir stalviršis</legend>
            <div class="estimator-field">
              <label for="estimator-tier">Korpuso ir fasadų lygis</label>
              <div class="select-wrap"><select id="estimator-tier" name="tier">${tiers.map((tier, index) => option(tier.value, tier.label, index === 1)).join('')}</select></div>
              <p class="field-hint" id="estimator-tier-detail">${tiers[1].detail}</p>
            </div>
            <div class="estimator-field">
              <label for="estimator-worktop">Stalviršio pasirinkimas</label>
              <div class="select-wrap"><select id="estimator-worktop" name="worktop">${worktops.map((worktop) => option(worktop.value, worktop.label)).join('')}</select></div>
              <p class="field-hint" id="estimator-worktop-detail">${worktops[0].detail}</p>
            </div>
          </fieldset>
        </form>

        <section class="estimate-result" aria-labelledby="estimate-result-title" aria-live="polite">
          <header>
            <p>Orientacinė baldų gamybos dalis</p>
            <h2 id="estimate-result-title">Preliminarus intervalas</h2>
          </header>
          <dl class="estimate-range">
            <div>
              <dt>Žema riba</dt>
              <dd id="estimate-low">–</dd>
            </div>
            <div class="estimate-range-typical">
              <dt>Tipinė reikšmė</dt>
              <dd id="estimate-typical">–</dd>
            </div>
            <div>
              <dt>Aukšta riba</dt>
              <dd id="estimate-high">–</dd>
            </div>
          </dl>
          <p class="estimate-summary" id="estimate-summary"></p>
          <div class="estimate-scope">
            <div>
              <h3>Modelyje įtraukta</h3>
              <ul id="estimate-included"></ul>
            </div>
            <div>
              <h3>Neįtraukta arba tikslinama atskirai</h3>
              <ul>
                <li>galutinis matavimas, projektavimas ir brėžinių korekcijos;</li>
                <li>stalviršio konkreti plokštė, šablonavimas, išpjovos ir montavimas;</li>
                <li>buitinė technika, plautuvė, maišytuvas, apšvietimas ir komunikacijų darbai;</li>
                <li>senų baldų išmontavimas, pristatymas, užnešimas, montavimas ir nestandartinė logistika.</li>
              </ul>
            </div>
          </div>
          <a class="primary-button estimate-cta" id="estimate-rfq-link" href="/gauti-pasiulymus" data-internal-link="true">Perkelti į pasiūlymo užklausą</a>
          <p class="estimate-cta-note">Užklausos formoje dar galėsite viską pataisyti prieš pateikdami operatoriaus peržiūrai.</p>
        </section>
      </div>

      <section class="estimator-method" aria-labelledby="estimator-method-title">
        <div>
          <h2 id="estimator-method-title">Kaip sudaromas intervalas</h2>
          <p>Vienintelis skaitinis atskaitos taškas yra gide <a href="/gidas/virtuves-baldu-kainos/">/gidas/virtuves-baldu-kainos</a> paskelbtas 300–800 €/m intervalas ir 548 €/m vidurkis. Skaičiuoklė jį naudoja kaip bendrą modelio atskaitą, o ne kaip pažadėtą konkretaus projekto €/m kainą.</p>
          <p>Apimties ir neapibrėžtumo korekcijos remiasi tik svetainės gidų išvardytais kainą keičiančiais veiksniais: <a href="/gidas/spintos-ir-drabuzines-kaina/">/gidas/spintos-ir-drabuzines-kaina</a>, <a href="/gidas/mdf-faneruote-masyvas-fasadai/">/gidas/mdf-faneruote-masyvas-fasadai</a> ir <a href="/gidas/kvarcas-ar-akmuo-stalvirsiui/">/gidas/kvarcas-ar-akmuo-stalvirsiui</a>. Šie gidai nepateikia atskirų universalių tarifų, todėl modulis nėra rinkos €/modulis kaina, o medžiagų ir stalviršio pasirinkimai tik koreguoja modelio intervalą.</p>
        </div>
        <aside role="note">
          <strong>Orientacinis įvertis, ne pasiūlymas</strong>
          <p>Rezultatas neįpareigoja katalogo ar gamintojo, nepatvirtina PVM, paslaugų komplektacijos ar galutinės kainos. Palyginkite bent kelis vienodos apimties rašytinius pasiūlymus.</p>
        </aside>
      </section>
    </main>
    ${renderFooter()}
  `;

  const form = root.querySelector<HTMLFormElement>('#price-estimator-form');
  const typeField = root.querySelector<HTMLSelectElement>('#estimator-type');
  const sizeField = root.querySelector<HTMLInputElement>('#estimator-size');
  const sizeLabel = root.querySelector<HTMLElement>('#estimator-size-label');
  const sizeUnit = root.querySelector<HTMLElement>('#estimator-size-unit');
  const tierField = root.querySelector<HTMLSelectElement>('#estimator-tier');
  const tierDetail = root.querySelector<HTMLElement>('#estimator-tier-detail');
  const worktopField = root.querySelector<HTMLSelectElement>('#estimator-worktop');
  const worktopDetail = root.querySelector<HTMLElement>('#estimator-worktop-detail');
  const cityField = root.querySelector<HTMLInputElement>('#estimator-city');
  const low = root.querySelector<HTMLElement>('#estimate-low');
  const typical = root.querySelector<HTMLElement>('#estimate-typical');
  const high = root.querySelector<HTMLElement>('#estimate-high');
  const summary = root.querySelector<HTMLElement>('#estimate-summary');
  const included = root.querySelector<HTMLElement>('#estimate-included');
  const requestLink = root.querySelector<HTMLAnchorElement>('#estimate-rfq-link');
  if (!form || !typeField || !sizeField || !sizeLabel || !sizeUnit || !tierField || !tierDetail || !worktopField || !worktopDetail || !cityField || !low || !typical || !high || !summary || !included || !requestLink) return;

  const update = (typeChanged = false) => {
    const type = furnitureTypes.find((item) => item.value === typeField.value) ?? furnitureTypes[0];
    const tier = tiers.find((item) => item.value === tierField.value) ?? tiers[1];
    const worktop = worktops.find((item) => item.value === worktopField.value) ?? worktops[0];
    if (typeChanged) sizeField.value = String(type.initial);
    sizeField.min = String(type.min);
    sizeField.max = String(type.max);
    sizeField.step = String(type.step);
    sizeLabel.textContent = type.measureLabel;
    sizeUnit.textContent = type.measureShort;
    tierDetail.textContent = tier.detail;
    worktopDetail.textContent = worktop.detail;

    const parsedSize = Number(sizeField.value);
    const size = Number.isFinite(parsedSize) ? Math.min(type.max, Math.max(type.min, parsedSize)) : type.initial;
    const estimate = calculateEstimate(size, tier, worktop);
    low.textContent = formatCurrency(estimate.low);
    typical.textContent = formatCurrency(estimate.typical);
    high.textContent = formatCurrency(estimate.high);
    const city = cityField.value.trim() || 'Miestas nenurodytas';
    summary.textContent = `${type.label}: ${size.toLocaleString('lt-LT')} ${type.measureShort}, medžiagų lygis – ${tier.label.toLocaleLowerCase('lt-LT')}, stalviršis – ${worktop.label.toLocaleLowerCase('lt-LT')}, ${city}.`;
    included.innerHTML = `
      <li>${escapeHtml(type.included)};</li>
      <li>${escapeHtml(tier.detail.toLocaleLowerCase('lt-LT'))};</li>
      <li>pasirinkto stalviršio poveikis intervalo neapibrėžtumui, bet ne atskiras jo kainos tarifas.</li>
    `;
    requestLink.href = buildRequestUrl(type, size, tier, worktop, city, estimate);
  };

  typeField.addEventListener('change', () => update(true));
  sizeField.addEventListener('blur', () => {
    const type = furnitureTypes.find((item) => item.value === typeField.value) ?? furnitureTypes[0];
    const parsed = Number(sizeField.value);
    const clamped = Number.isFinite(parsed) ? Math.min(type.max, Math.max(type.min, parsed)) : type.initial;
    const stepped = Math.round((clamped - type.min) / type.step) * type.step + type.min;
    sizeField.value = String(Number(stepped.toFixed(type.step < 1 ? 1 : 0)));
    update();
  });
  form.addEventListener('input', () => update());
  form.addEventListener('change', () => update());
  update();
}
