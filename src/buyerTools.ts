import { apiBaseUrl } from './pocketbase';
import { breadcrumbStructuredData, setPageMetadata } from './seo';

type HeaderSection = 'directory' | 'guide' | 'request' | 'policy';

type ManufacturerChoice = {
  id: string;
  slug: string;
  trading_name: string;
  city?: string;
  category_codes?: string[];
  category_labels?: string[];
};

type ToolContext = {
  root: HTMLElement;
  renderHeader: (active: HeaderSection) => string;
  renderFooter: () => string;
  manufacturers?: ManufacturerChoice[];
};

const CONTRACT_PATH = '/gidas/baldu-pirkimo-sutarties-sablonas';
const COMPARISON_PATH = '/palyginti-pasiulymus';
const RFQ_PATH = '/gauti-pasiulymus';
const ESTIMATOR_PATH = '/baldu-kainos-skaiciuokle';
const CONTRACT_STORAGE_KEY = 'baldininkai_contract_template_v1';
const COMPARISON_STORAGE_KEY = 'baldininkai_offer_comparison_v1';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toolNavigation(active: 'contract' | 'comparison' | 'rfq'): string {
  return `
    <nav class="tool-navigation" aria-label="Pirkėjo įrankiai">
      <strong>Pirkėjo įrankiai</strong>
      <div>
        <a href="${ESTIMATOR_PATH}" data-internal-link="true">Kainos skaičiuoklė</a>
        <a href="${RFQ_PATH}" data-internal-link="true"${active === 'rfq' ? ' aria-current="page"' : ''}>Projekto užklausa</a>
        <a href="${COMPARISON_PATH}" data-internal-link="true"${active === 'comparison' ? ' aria-current="page"' : ''}>Pasiūlymų palyginimas</a>
        <a href="${CONTRACT_PATH}" data-internal-link="true"${active === 'contract' ? ' aria-current="page"' : ''}>Sutarties šablonas</a>
      </div>
    </nav>
  `;
}

const contractWarning = 'Svarbu prieš naudojant: tai informacinis redaguojamas šablonas, o ne teisinė konsultacija ar teisinis vertinimas. Jis negarantuoja, kad tinka jūsų situacijai, atitinka visus reikalavimus ar bus vykdytinas. Prieš pasirašydami peržiūrėkite visą tekstą ir, kai tinkama, pasitarkite su kvalifikuotu teisininku.';
const comparisonWarning = 'Svarbu: pasiūlymų palyginimo įrankis yra informacinio pobūdžio ir nėra teisinė konsultacija ar teisinis vertinimas.';

const contractSections = [
  {
    id: 'parties',
    title: 'Šalys ir kontaktiniai duomenys',
    value: `Sutarties numeris: [įrašykite]\nSudarymo data ir vieta: [įrašykite]\n\nPardavėjas: [pavadinimas, juridinio asmens kodas, PVM mokėtojo kodas, adresas, atstovas ir jo pagrindas]\nPardavėjo kontaktas sutarties vykdymui: [vardas, el. paštas, telefonas]\n\nPirkėjas: [vardas, pavardė, adresas]\nPirkėjo kontaktas: [el. paštas, telefonas]\n\nPapildomos pastabos apie šalis ar jų atstovavimą: [įrašykite]`,
  },
  {
    id: 'goods',
    title: 'Prekės ir specifikacija',
    value: `Užsakomi baldai ir jų paskirtis: [įrašykite]\nPatalpa arba objektas: [įrašykite]\nKiekiai, matmenys ir komplektacija: [įrašykite]\nFunkcijos, integruojama įranga ir kiti reikalavimai: [įrašykite]\nKas aiškiai neįtraukta: [įrašykite]\nNuoroda į specifikacijos priedą: [priedo numeris ar pavadinimas]`,
  },
  {
    id: 'price',
    title: 'Kaina ir PVM',
    value: `Bendra kaina su PVM: [suma ir valiuta]\nPVM bei kitų mokesčių paaiškinimas: [įrašykite]\nAr į kainą įtrauktas matavimas, projektavimas, pristatymas, užnešimas ir montavimas: [įrašykite]\nGalimi papildomi darbai ir jų kainos nustatymo tvarka: [įrašykite]\nPasiūlymo ar kainos galiojimo prielaidos: [įrašykite]`,
  },
  {
    id: 'payment',
    title: 'Avansas ir mokėjimo etapai',
    value: `Avanso suma arba procentas: [įrašykite]\nAvanso mokėjimo terminas: [įrašykite]\nNuo kokio įvykio pradedami skaičiuoti darbų terminai: [įrašykite]\nTarpiniai mokėjimai ir juos pagrindžiantys etapai ar dokumentai: [įrašykite]\nGalutinis mokėjimas ir jo sąlygos: [įrašykite]\nSąskaitų pateikimo bei apmokėjimo terminai: [įrašykite]`,
  },
  {
    id: 'design',
    title: 'Matavimas, projektas, brėžiniai ir medžiagos',
    value: `Kas atlieka galutinį matavimą ir kada objektas turi būti parengtas: [įrašykite]\nKas atsako už pateiktus matmenis: [įrašykite]\nProjektavimo, vizualizacijų ir gamybinių brėžinių apimtis: [įrašykite]\nBrėžinių ir pakeitimų tvirtinimo tvarka: [įrašykite]\nMedžiagos, dekorai, furnitūra, stalviršiai ir jų identifikacija: [įrašykite]\nPirkėjo pateikiamos įrangos modeliai, matmenys ir terminai: [įrašykite]`,
  },
  {
    id: 'delivery',
    title: 'Pristatymas ir montavimas',
    value: `Pristatymo vieta: [įrašykite]\nPlanuojamas pristatymo laikotarpis arba data ir jos prielaidos: [įrašykite]\nMontavimo apimtis, etapai ir pabaigos kriterijai: [įrašykite]\nUžnešimo, parkavimo, lifto, darbo laiko ar kiti prieigos apribojimai: [įrašykite]\nObjekto parengtis ir kitų rangovų priklausomybės: [įrašykite]\nPakuočių, atliekų ar senų baldų išvežimas: [įrašykite]`,
  },
  {
    id: 'acceptance',
    title: 'Priėmimas, trūkumai ir garantija',
    value: `Kaip ir kada tikrinamos prekės bei montavimo darbai: [įrašykite]\nPriėmimo dokumentas ir pastabų fiksavimo būdas: [įrašykite]\nMatomi trūkumai, neužbaigti darbai ir jų taisymo terminai: [įrašykite]\nKaip pranešama apie vėliau pastebėtus trūkumus: [įrašykite]\nGarantijos apimtis, trukmė, išimtys ir kontaktas: [įrašykite]\nPriežiūros bei naudojimo informacija, kurią turi pateikti pardavėjas: [įrašykite]`,
  },
  {
    id: 'delay',
    title: 'Vėlavimas, atšaukimas ir nenugalima jėga',
    value: `Kaip šalys praneša apie numatomą vėlavimą: [įrašykite]\nKaip keičiami terminai pasikeitus apimčiai ar objekto parengčiai: [įrašykite]\nSutarties nutraukimo ar užsakymo atšaukimo situacijos ir atsiskaitymo tvarka: [įrašykite]\nKaip pagrindžiamos iki nutraukimo patirtos išlaidos: [įrašykite]\nNenugalimos jėgos aplinkybių pranešimo ir tolesnių veiksmų tvarka: [įrašykite]`,
  },
  {
    id: 'disputes',
    title: 'Ginčai, pranešimai, kontaktas ir privatumas',
    value: `Šalių adresai ir el. paštai oficialiems pranešimams: [įrašykite]\nPretenzijų pateikimo ir atsakymo tvarka: [įrašykite]\nGinčų sprendimo seka ir aktualūs kontaktai: [peržiūrėkite bei įrašykite]\nKontaktiniai asmenys sutarties vykdymui: [įrašykite]\nKokie asmens duomenys reikalingi sutarčiai ir kaip apie jų tvarkymą informuojama: [įrašykite]`,
  },
  {
    id: 'appendices',
    title: 'Priedai',
    value: `Priedas Nr. 1 – prekių specifikacija, kiekiai ir kainos: [aprašykite]\nPriedas Nr. 2 – matavimo, projektavimo, gamybos, pristatymo ir montavimo grafikas: [aprašykite]\nBrėžiniai, vizualizacijos ar patvirtinti pakeitimai: [sąrašas ir versijos]\nMedžiagų bei furnitūros specifikacijos: [sąrašas]\nKiti priedai: [įrašykite]\n\nŠalių parašų vietos ir data: [įrašykite]`,
  },
] as const;

type ContractState = Record<(typeof contractSections)[number]['id'], string>;

function defaultContractState(): ContractState {
  return Object.fromEntries(contractSections.map((section) => [section.id, section.value])) as ContractState;
}

function readContractState(): ContractState {
  const fallback = defaultContractState();
  try {
    const stored = localStorage.getItem(CONTRACT_STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<ContractState>;
    contractSections.forEach((section) => {
      if (typeof parsed[section.id] === 'string') fallback[section.id] = parsed[section.id] as string;
    });
  } catch {
    return fallback;
  }
  return fallback;
}

export function renderContractTool({ root, renderHeader, renderFooter }: ToolContext): void {
  setPageMetadata({
    title: 'Baldų pirkimo sutarties šablonas | Pirkėjo įrankiai',
    description: 'Naršyklėje redaguojamas ir spausdinamas B2C baldų pirkimo sutarties struktūros šablonas su aiškiu teisinės konsultacijos ribojimu.',
    path: CONTRACT_PATH,
    type: 'article',
    structuredData: [breadcrumbStructuredData([
      { name: 'Gamintojų katalogas', path: '/' },
      { name: 'Pirkėjo gidas', path: '/gidas' },
      { name: 'Baldų pirkimo sutarties šablonas', path: CONTRACT_PATH },
    ])],
  });

  const state = readContractState();
  root.innerHTML = `
    ${renderHeader('guide')}
    <main class="buyer-tool-main contract-tool-main">
      ${toolNavigation('contract')}
      <aside class="legal-template-warning" role="note" aria-label="Svarbus perspėjimas">
        <strong>Perskaitykite prieš pildydami</strong>
        <p>${escapeHtml(contractWarning)}</p>
      </aside>
      <article class="contract-document" aria-labelledby="contract-title">
        <header class="contract-heading">
          <div>
            <p class="kicker">Redaguojamas dokumento ruošinys</p>
            <h1 id="contract-title">Baldų pirkimo sutarties struktūros šablonas</h1>
            <p>Užpildykite tik tai, ką galite patikrinti. Neaiškias sąlygas pažymėkite ir aptarkite prieš pasirašydami.</p>
          </div>
          <dl class="template-version">
            <div><dt>Šaltinis / versija</dt><dd>Pirkimo-pardavimo sutartis – B2C struktūros šablonas</dd></div>
            <div><dt>Atnaujinta</dt><dd><time datetime="2026-07-29">2026-07-29</time></dd></div>
          </dl>
        </header>
        <div class="contract-actions" aria-label="Šablono veiksmai">
          <button class="primary-button" id="print-contract" type="button">Spausdinti arba išsaugoti PDF</button>
          <button class="secondary-button" id="reset-contract" type="button">Atkurti pradinį ruošinį</button>
          <p id="contract-save-status" role="status" aria-live="polite">Pakeitimai saugomi tik šioje naršyklėje.</p>
        </div>
        <div class="contract-sections">
          ${contractSections.map((section, index) => `
            <section class="contract-section" aria-labelledby="contract-section-${section.id}">
              <div class="contract-section-heading">
                <span aria-hidden="true">${index + 1}</span>
                <div>
                  <h2 id="contract-section-${section.id}">${escapeHtml(section.title)}</h2>
                  <p>Redaguokite tekstą pagal konkretų pasiūlymą ir susitarimą.</p>
                </div>
              </div>
              <label class="visually-hidden" for="contract-${section.id}">${escapeHtml(section.title)}</label>
              <textarea id="contract-${section.id}" data-contract-section="${section.id}" rows="7">${escapeHtml(state[section.id])}</textarea>
            </section>
          `).join('')}
        </div>
        <footer class="contract-print-footer">
          <p><strong>${escapeHtml(contractWarning)}</strong></p>
          <p>Pirkimo-pardavimo sutartis – B2C struktūros šablonas · atnaujinta 2026-07-29</p>
        </footer>
      </article>
    </main>
    ${renderFooter()}
  `;

  const textareas = Array.from(root.querySelectorAll<HTMLTextAreaElement>('[data-contract-section]'));
  const status = root.querySelector<HTMLElement>('#contract-save-status');
  let saveTimer = 0;
  const resize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  };
  const save = () => {
    const next = defaultContractState();
    textareas.forEach((textarea) => {
      const id = textarea.dataset.contractSection as keyof ContractState;
      next[id] = textarea.value;
    });
    try {
      localStorage.setItem(CONTRACT_STORAGE_KEY, JSON.stringify(next));
      if (status) status.textContent = 'Išsaugota tik šioje naršyklėje.';
    } catch {
      if (status) status.textContent = 'Naršyklė neleido išsaugoti pakeitimų. Prieš užverdami puslapį išsisaugokite PDF.';
    }
  };

  textareas.forEach((textarea) => {
    resize(textarea);
    textarea.addEventListener('input', () => {
      resize(textarea);
      if (status) status.textContent = 'Saugoma…';
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(save, 250);
    });
  });
  root.querySelector<HTMLButtonElement>('#print-contract')?.addEventListener('click', () => {
    textareas.forEach(resize);
    save();
    window.print();
  });
  root.querySelector<HTMLButtonElement>('#reset-contract')?.addEventListener('click', () => {
    const confirmed = window.confirm('Atkurti pradinį ruošinį? Visi šioje naršyklėje įrašyti pakeitimai bus pašalinti.');
    if (!confirmed) return;
    try { localStorage.removeItem(CONTRACT_STORAGE_KEY); } catch { /* no-op */ }
    const defaults = defaultContractState();
    textareas.forEach((textarea) => {
      const id = textarea.dataset.contractSection as keyof ContractState;
      textarea.value = defaults[id];
      resize(textarea);
    });
    if (status) status.textContent = 'Pradinis ruošinys atkurtas.';
  });
}

type CriterionId = 'priceScope' | 'payment' | 'design' | 'materials' | 'timeframe' | 'warranty' | 'includedExcluded';

type Criterion = {
  id: CriterionId;
  label: string;
  evidenceLabel: string;
  placeholder: string;
};

const criteria: Criterion[] = [
  { id: 'priceScope', label: 'Kaina, PVM ir apimties aiškumas', evidenceLabel: 'PVM ir apimties paaiškinimas', placeholder: 'Kas įtraukta į bendrą sumą, ar PVM aiškus, kokios išimtys?' },
  { id: 'payment', label: 'Avansas ir mokėjimo grafikas', evidenceLabel: 'Avansas ir mokėjimo etapai', placeholder: 'Avanso suma, tarpiniai mokėjimai, dokumentai ir terminai' },
  { id: 'design', label: 'Matavimas, projektavimas ir brėžiniai', evidenceLabel: 'Matavimas / projektas / brėžiniai', placeholder: 'Kas įtraukta, kas matuoja, kada ir kaip tvirtinami brėžiniai?' },
  { id: 'materials', label: 'Medžiagos ir furnitūra', evidenceLabel: 'Medžiagos ir furnitūra', placeholder: 'Pavadinimai, kodai, gamintojai, lygiaverčiai variantai' },
  { id: 'timeframe', label: 'Pristatymo ir montavimo terminas', evidenceLabel: 'Pristatymo / montavimo laikotarpis', placeholder: 'Datos, intervalai, etapai ir prielaidos' },
  { id: 'warranty', label: 'Garantija ir trūkumų taisymas', evidenceLabel: 'Garantija', placeholder: 'Trukmė, apimtis, išimtys, pranešimo ir taisymo tvarka' },
  { id: 'includedExcluded', label: 'Įtraukti ir neįtraukti darbai', evidenceLabel: 'Įtraukti / neįtraukti darbai', placeholder: 'Pristatymas, užnešimas, montavimas, išvežimas, apdaila ir kita' },
];

const ratingLabels = [
  'Trūksta arba neįvertinta',
  'Nepalyginama arba neaišku',
  'Iš dalies atitinka prioritetą',
  'Aiškiai atitinka prioritetą',
] as const;

type OfferState = {
  id: string;
  provider: string;
  totalInclVat: string;
  notes: string;
  evidence: Record<CriterionId, string>;
  ratings: Record<CriterionId, number>;
};

type ComparisonState = {
  weights: Record<CriterionId, number>;
  offers: OfferState[];
};

function createOffer(index: number): OfferState {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    provider: '',
    totalInclVat: '',
    notes: '',
    evidence: Object.fromEntries(criteria.map((criterion) => [criterion.id, ''])) as Record<CriterionId, string>,
    ratings: Object.fromEntries(criteria.map((criterion) => [criterion.id, 0])) as Record<CriterionId, number>,
  };
}

function defaultComparisonState(): ComparisonState {
  return {
    weights: {
      priceScope: 5,
      payment: 3,
      design: 4,
      materials: 5,
      timeframe: 4,
      warranty: 4,
      includedExcluded: 5,
    },
    offers: [createOffer(0), createOffer(1)],
  };
}

function readComparisonState(): ComparisonState {
  const fallback = defaultComparisonState();
  try {
    const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<ComparisonState>;
    criteria.forEach((criterion) => {
      const weight = Number(parsed.weights?.[criterion.id]);
      if (Number.isInteger(weight) && weight >= 0 && weight <= 5) fallback.weights[criterion.id] = weight;
    });
    if (Array.isArray(parsed.offers) && parsed.offers.length >= 2 && parsed.offers.length <= 5) {
      fallback.offers = parsed.offers.map((raw, index) => {
        const clean = createOffer(index);
        clean.id = typeof raw.id === 'string' ? raw.id : clean.id;
        clean.provider = typeof raw.provider === 'string' ? raw.provider.slice(0, 160) : '';
        clean.totalInclVat = typeof raw.totalInclVat === 'string' ? raw.totalInclVat.slice(0, 40) : '';
        clean.notes = typeof raw.notes === 'string' ? raw.notes.slice(0, 3000) : '';
        criteria.forEach((criterion) => {
          const evidence = raw.evidence?.[criterion.id];
          const rating = Number(raw.ratings?.[criterion.id]);
          clean.evidence[criterion.id] = typeof evidence === 'string' ? evidence.slice(0, 3000) : '';
          clean.ratings[criterion.id] = Number.isInteger(rating) && rating >= 0 && rating <= 3 ? rating : 0;
        });
        return clean;
      });
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function ratingOptions(selected: number): string {
  return ratingLabels.map((label, value) => `<option value="${value}"${selected === value ? ' selected' : ''}>${value} – ${escapeHtml(label)}</option>`).join('');
}

function offerEditor(offer: OfferState, index: number, canRemove: boolean): string {
  return `
    <fieldset class="offer-editor" data-offer-id="${escapeHtml(offer.id)}">
      <legend>Pasiūlymas ${index + 1}</legend>
      <div class="offer-editor-heading">
        <p>Įveskite tik tai, kas parašyta pasiūlyme arba ką patvirtinote atskirai.</p>
        <button class="text-button remove-offer" type="button"${canRemove ? '' : ' disabled'}>Pašalinti pasiūlymą</button>
      </div>
      <div class="offer-primary-fields">
        <div class="form-field">
          <label for="provider-${offer.id}">Tiekėjas</label>
          <input id="provider-${offer.id}" data-field="provider" type="text" maxlength="160" value="${escapeHtml(offer.provider)}" placeholder="Pasiūlyme nurodytas pavadinimas">
        </div>
        <div class="form-field">
          <label for="total-${offer.id}">Bendra suma su PVM, €</label>
          <input id="total-${offer.id}" data-field="totalInclVat" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeHtml(offer.totalInclVat)}" placeholder="0,00">
        </div>
      </div>
      <div class="offer-criteria">
        ${criteria.map((criterion) => `
          <section class="offer-criterion" data-criterion="${criterion.id}">
            <div class="form-field">
              <label for="evidence-${offer.id}-${criterion.id}">${escapeHtml(criterion.evidenceLabel)}</label>
              <textarea id="evidence-${offer.id}-${criterion.id}" data-evidence="${criterion.id}" rows="3" maxlength="3000" placeholder="${escapeHtml(criterion.placeholder)}">${escapeHtml(offer.evidence[criterion.id])}</textarea>
            </div>
            <div class="form-field criterion-rating">
              <label for="rating-${offer.id}-${criterion.id}">Jūsų vertinimas pagal įrodymą</label>
              <div class="select-wrap">
                <select id="rating-${offer.id}-${criterion.id}" data-rating="${criterion.id}">
                  ${ratingOptions(offer.ratings[criterion.id])}
                </select>
              </div>
            </div>
          </section>
        `).join('')}
      </div>
      <div class="form-field">
        <label for="notes-${offer.id}">Pastabos</label>
        <textarea id="notes-${offer.id}" data-field="notes" rows="3" maxlength="3000" placeholder="Klausimai, versijos data, ką dar reikia patikslinti">${escapeHtml(offer.notes)}</textarea>
      </div>
    </fieldset>
  `;
}

function captureComparisonState(root: HTMLElement): ComparisonState {
  const weights = Object.fromEntries(criteria.map((criterion) => {
    const input = root.querySelector<HTMLInputElement>(`[data-weight="${criterion.id}"]`);
    return [criterion.id, Math.min(5, Math.max(0, Number(input?.value) || 0))];
  })) as Record<CriterionId, number>;
  const offers = Array.from(root.querySelectorAll<HTMLElement>('[data-offer-id]')).map((editor, index) => {
    const offer = createOffer(index);
    offer.id = editor.dataset.offerId ?? offer.id;
    offer.provider = editor.querySelector<HTMLInputElement>('[data-field="provider"]')?.value.trim() ?? '';
    offer.totalInclVat = editor.querySelector<HTMLInputElement>('[data-field="totalInclVat"]')?.value ?? '';
    offer.notes = editor.querySelector<HTMLTextAreaElement>('[data-field="notes"]')?.value.trim() ?? '';
    criteria.forEach((criterion) => {
      offer.evidence[criterion.id] = editor.querySelector<HTMLTextAreaElement>(`[data-evidence="${criterion.id}"]`)?.value.trim() ?? '';
      offer.ratings[criterion.id] = Number(editor.querySelector<HTMLSelectElement>(`[data-rating="${criterion.id}"]`)?.value) || 0;
    });
    return offer;
  });
  return { weights, offers };
}

function saveComparisonState(state: ComparisonState, status?: HTMLElement | null): void {
  try {
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(state));
    if (status) status.textContent = 'Palyginimo duomenys išsaugoti tik šioje naršyklėje.';
  } catch {
    if (status) status.textContent = 'Naršyklė neleido išsaugoti. Duomenys liks tik iki puslapio uždarymo.';
  }
}

function renderComparisonResults(root: HTMLElement, state: ComparisonState): void {
  const results = root.querySelector<HTMLElement>('#comparison-results');
  if (!results) return;
  const activeWeight = criteria.reduce((sum, criterion) => sum + state.weights[criterion.id], 0);
  if (activeWeight === 0) {
    results.innerHTML = '<div class="form-status form-status--error" role="alert">Bent vienam kriterijui nustatykite didesnį nei 0 svorį.</div>';
    results.focus();
    return;
  }

  const scored = state.offers.map((offer, index) => {
    const numerator = criteria.reduce((sum, criterion) => sum + offer.ratings[criterion.id] * state.weights[criterion.id], 0);
    const denominator = activeWeight * 3;
    const score = denominator ? (numerator / denominator) * 100 : 0;
    const issues: { type: 'missing' | 'nonComparable'; label: string }[] = [];
    if (!offer.provider) issues.push({ type: 'missing', label: 'trūksta tiekėjo pavadinimo' });
    if (!offer.totalInclVat || Number(offer.totalInclVat) < 0) issues.push({ type: 'missing', label: 'trūksta bendros sumos su PVM' });
    criteria.forEach((criterion) => {
      if (!offer.evidence[criterion.id]) issues.push({ type: 'missing', label: `trūksta: ${criterion.evidenceLabel.toLocaleLowerCase('lt-LT')}` });
      if (offer.ratings[criterion.id] === 1) issues.push({ type: 'nonComparable', label: `nepalyginama: ${criterion.label.toLocaleLowerCase('lt-LT')}` });
    });
    return { offer, index, numerator, denominator, score, issues };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const scoreCounts = new Map<string, number>();
  scored.forEach((item) => {
    const key = item.score.toFixed(6);
    scoreCounts.set(key, (scoreCounts.get(key) ?? 0) + 1);
  });
  const money = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' });

  results.innerHTML = `
    <div class="comparison-results-heading">
      <div>
        <p class="kicker">Palyginimo suvestinė</p>
        <h2>Rezultatai pagal jūsų įvestus įrodymus ir svorius</h2>
      </div>
      <p><strong>Formulė:</strong> (Σ vertinimas 0–3 × svoris 0–5) / (Σ 3 × aktyvus svoris) × 100. Suma eurais automatiškai nevertinama kaip geresnė ar blogesnė, nes skirtinga apimtis gali būti nepalyginama.</p>
    </div>
    <p class="comparison-caution"><strong>Tai nėra automatinis laimėtojo paskelbimas.</strong> Vienodi balai paliekami vienodi, o spragos ir nepalyginami laukai rodomi atskirai. Patikrinkite šaltinį prieš priimdami sprendimą.</p>
    <div class="comparison-result-list">
      ${scored.map((item) => {
        const name = item.offer.provider || `Pasiūlymas ${item.index + 1}`;
        const tie = (scoreCounts.get(item.score.toFixed(6)) ?? 0) > 1;
        const amount = item.offer.totalInclVat && Number.isFinite(Number(item.offer.totalInclVat))
          ? money.format(Number(item.offer.totalInclVat))
          : 'Suma nepateikta';
        const missing = item.issues.filter((issue) => issue.type === 'missing');
        const nonComparable = item.issues.filter((issue) => issue.type === 'nonComparable');
        return `
          <article class="comparison-result" aria-labelledby="result-${item.offer.id}">
            <header>
              <div>
                <h3 id="result-${item.offer.id}">${escapeHtml(name)}</h3>
                <p>${escapeHtml(amount)} · skaičiavimas ${item.numerator} / ${item.denominator}</p>
              </div>
              <div class="comparison-score"><strong>${item.score.toFixed(1)}%</strong>${tie ? '<span>Vienodas rezultatas</span>' : '<span>Svertinis rezultatas</span>'}</div>
            </header>
            ${missing.length || nonComparable.length ? `
              <div class="comparison-issues">
                ${missing.length ? `<p><strong>Trūksta:</strong> ${escapeHtml(missing.map((issue) => issue.label.replace(/^trūksta:?\s*/i, '')).join('; '))}.</p>` : ''}
                ${nonComparable.length ? `<p><strong>Nepalyginama:</strong> ${escapeHtml(nonComparable.map((issue) => issue.label.replace(/^nepalyginama:?\s*/i, '')).join('; '))}.</p>` : ''}
              </div>
            ` : '<p class="comparison-complete">Visiems vertinamiems laukams įvedėte įrodymą; vis tiek patikrinkite pasiūlymo versiją ir apimtį.</p>'}
            <dl class="comparison-evidence-list">
              ${criteria.map((criterion) => `
                <div class="${!item.offer.evidence[criterion.id] ? 'is-missing' : item.offer.ratings[criterion.id] === 1 ? 'is-non-comparable' : ''}">
                  <dt>${escapeHtml(criterion.label)} <span>Svoris ${state.weights[criterion.id]} · vertinimas ${item.offer.ratings[criterion.id]}</span></dt>
                  <dd>${escapeHtml(item.offer.evidence[criterion.id] || 'Duomenų nepateikta.')}</dd>
                </div>
              `).join('')}
              <div><dt>Pastabos</dt><dd>${escapeHtml(item.offer.notes || 'Pastabų nepateikta.')}</dd></div>
            </dl>
          </article>
        `;
      }).join('')}
    </div>
  `;
  results.focus();
}

export function renderComparisonTool({ root, renderHeader, renderFooter }: ToolContext): void {
  setPageMetadata({
    title: 'Palyginti baldų pasiūlymus | Pirkėjo įrankiai',
    description: 'Deterministinis 2–5 baldų pasiūlymų palyginimas pagal pirkėjo svorius, aiškią formulę, įrodymus, trūkstamus ir nepalyginamus laukus.',
    path: COMPARISON_PATH,
    structuredData: [breadcrumbStructuredData([
      { name: 'Gamintojų katalogas', path: '/' },
      { name: 'Pirkėjo įrankiai', path: '/gidas' },
      { name: 'Pasiūlymų palyginimas', path: COMPARISON_PATH },
    ])],
  });

  let state = readComparisonState();
  const render = () => {
    root.innerHTML = `
      ${renderHeader('guide')}
      <main class="buyer-tool-main comparison-tool-main">
        ${toolNavigation('comparison')}
        <aside class="legal-template-warning" role="note" aria-label="Svarbus perspėjimas">
          <strong>Informacinis įrankis</strong>
          <p>${escapeHtml(comparisonWarning)}</p>
        </aside>
        <section class="tool-intro" aria-labelledby="comparison-title">
          <div>
            <p class="kicker">Naršyklėje veikiantis palyginimas</p>
            <h1 id="comparison-title">Palyginkite pasiūlymus nepaslėpdami spragų</h1>
            <p class="lead">Įrašykite 2–5 pasiūlymų faktus, įvertinkite jų aiškumą pagal savo prioritetus ir matykite tikslų skaičiavimą. Įrankis nerenka duomenų iš kitų svetainių, nieko nekontaktuoja ir nesiunčia jūsų įrašų.</p>
          </div>
          <aside class="local-only-note">
            <strong>Tik jūsų naršyklėje</strong>
            <p>Įvesti duomenys saugomi vietinėje naršyklės saugykloje. Nerašykite asmens kodų, mokėjimo duomenų ar kitos jautrios informacijos.</p>
          </aside>
        </section>

        <section class="comparison-method" aria-labelledby="weights-title">
          <div class="section-heading">
            <h2 id="weights-title">1. Nustatykite savo prioritetų svorius</h2>
            <p>0 reiškia, kad kriterijus į rezultatą neįtraukiamas, 5 – kad jis jums labai svarbus. Svoriai nekeičia įvestų faktų.</p>
          </div>
          <div class="weight-grid">
            ${criteria.map((criterion) => `
              <label class="weight-control" for="weight-${criterion.id}">
                <span>${escapeHtml(criterion.label)}</span>
                <input id="weight-${criterion.id}" data-weight="${criterion.id}" type="number" min="0" max="5" step="1" value="${state.weights[criterion.id]}" inputmode="numeric">
              </label>
            `).join('')}
          </div>
          <details class="formula-details">
            <summary>Kaip skaičiuojamas rezultatas</summary>
            <p>Kiekvienam kriterijui jūs pasirenkate vertinimą nuo 0 iki 3 pagal įrašytą įrodymą. Rezultatas = (Σ vertinimas × svoris) / (Σ didžiausias vertinimas 3 × aktyvus svoris) × 100. Trūkstamas laukas vertinamas 0, o „nepalyginama arba neaišku“ – 1. Bendra kaina rodoma atskirai ir nėra automatiškai laikoma geresne vien todėl, kad mažesnė.</p>
          </details>
        </section>

        <section class="comparison-offers" aria-labelledby="offers-title">
          <div class="comparison-section-heading">
            <div class="section-heading">
              <h2 id="offers-title">2. Suveskite pasiūlymų įrodymus</h2>
              <p>Kopijuokite tik tai, kas nurodyta pasiūlyme ar patvirtinta raštu. Jei lauko nėra, palikite jį tuščią ir pasirinkite vertinimą 0.</p>
            </div>
            <button class="secondary-button" id="add-offer" type="button"${state.offers.length >= 5 ? ' disabled' : ''}>Pridėti pasiūlymą</button>
          </div>
          <div class="offer-editor-list">
            ${state.offers.map((offer, index) => offerEditor(offer, index, state.offers.length > 2)).join('')}
          </div>
          <div class="comparison-actions">
            <button class="primary-button" id="calculate-comparison" type="button">Apskaičiuoti ir parodyti įrodymus</button>
            <button class="secondary-button" id="reset-comparison" type="button">Išvalyti palyginimą</button>
            <p id="comparison-save-status" role="status" aria-live="polite">Palyginimo duomenys saugomi tik šioje naršyklėje.</p>
          </div>
        </section>
        <section class="comparison-results" id="comparison-results" tabindex="-1" aria-live="polite"></section>
      </main>
      ${renderFooter()}
    `;

    const saveStatus = root.querySelector<HTMLElement>('#comparison-save-status');
    let saveTimer = 0;
    const captureAndSave = () => {
      state = captureComparisonState(root);
      saveComparisonState(state, saveStatus);
    };
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select').forEach((field) => {
      field.addEventListener('input', () => {
        if (saveStatus) saveStatus.textContent = 'Saugoma…';
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(captureAndSave, 220);
      });
      field.addEventListener('change', captureAndSave);
    });
    root.querySelector<HTMLButtonElement>('#add-offer')?.addEventListener('click', () => {
      state = captureComparisonState(root);
      if (state.offers.length >= 5) return;
      state.offers.push(createOffer(state.offers.length));
      saveComparisonState(state);
      render();
    });
    root.querySelectorAll<HTMLButtonElement>('.remove-offer').forEach((button) => {
      button.addEventListener('click', () => {
        state = captureComparisonState(root);
        if (state.offers.length <= 2) return;
        const editor = button.closest<HTMLElement>('[data-offer-id]');
        state.offers = state.offers.filter((offer) => offer.id !== editor?.dataset.offerId);
        saveComparisonState(state);
        render();
      });
    });
    root.querySelector<HTMLButtonElement>('#calculate-comparison')?.addEventListener('click', () => {
      state = captureComparisonState(root);
      saveComparisonState(state, saveStatus);
      renderComparisonResults(root, state);
    });
    root.querySelector<HTMLButtonElement>('#reset-comparison')?.addEventListener('click', () => {
      const confirmed = window.confirm('Išvalyti visus šioje naršyklėje išsaugotus pasiūlymus ir svorius?');
      if (!confirmed) return;
      try { localStorage.removeItem(COMPARISON_STORAGE_KEY); } catch { /* no-op */ }
      state = defaultComparisonState();
      render();
    });
  };
  render();
}

const categoryOptions = [
  { value: 'Virtuvės baldai', lt: 'Virtuvės baldai', en: 'Custom kitchen furniture' },
  { value: 'Spintos ar įmontuojami baldai', lt: 'Spintos ar įmontuojami baldai', en: 'Wardrobes or fitted furniture' },
  { value: 'Miegamojo ar vonios baldai', lt: 'Miegamojo ar vonios baldai', en: 'Bedroom or bathroom furniture' },
  { value: 'Biuro ar komerciniai baldai', lt: 'Biuro ar komerciniai baldai', en: 'Office or commercial furniture' },
  { value: 'HoReCa ar prekybos baldai', lt: 'HoReCa ar prekybos baldai', en: 'HoReCa or retail furniture' },
  { value: 'Minkšti baldai', lt: 'Minkšti baldai', en: 'Upholstered furniture' },
  { value: 'Medžio masyvo ar kiti nestandartiniai baldai', lt: 'Medžio masyvo ar kiti nestandartiniai baldai', en: 'Solid-wood or other custom furniture' },
  { value: 'Kitas baldų projektas', lt: 'Kitas baldų projektas', en: 'Other furniture project' },
] as const;

const projectStageOptions = [
  { value: 'Idėja ir poreikių formavimas', lt: 'Idėja ir poreikių formavimas', en: 'Early idea and requirements' },
  { value: 'Yra preliminarūs matmenys', lt: 'Yra preliminarūs matmenys', en: 'Preliminary dimensions available' },
  { value: 'Yra patalpos planas ar projektas', lt: 'Yra patalpos planas ar projektas', en: 'Room plan or design available' },
  { value: 'Parinktos pagrindinės medžiagos', lt: 'Parinktos pagrindinės medžiagos', en: 'Main materials selected' },
  { value: 'Objektas parengtas galutiniam matavimui', lt: 'Objektas parengtas galutiniam matavimui', en: 'Site ready for final measurement' },
  { value: 'Reikia pakeisti ar papildyti esamą projektą', lt: 'Reikia pakeisti ar papildyti esamą projektą', en: 'Existing design needs changes or additions' },
] as const;

const englishCategoryLabels = new Map([
  ['K', 'Custom kitchen furniture'],
  ['W', 'Wardrobes and fitted furniture'],
  ['BB', 'Bedroom and bathroom furniture'],
  ['OC', 'Office and commercial furniture'],
  ['HR', 'HoReCa and retail furniture'],
  ['O', 'Other custom furniture'],
  ['SW', 'Woodwork and solid-wood furniture'],
  ['MM', 'Other furniture'],
  ['U', 'Custom upholstered furniture'],
]);

type RfqLocale = 'lt' | 'en';

type RfqToolContext = ToolContext & {
  locale?: RfqLocale;
  path?: string;
  makerQueryParam?: string;
};

function getRfqCopy(locale: RfqLocale) {
  if (locale === 'en') {
    return {
      locale,
      title: 'Request furniture quotes in Lithuania | Baldininkai.org',
      description: 'Prepare a structured furniture-project quote request for review. Catalogue candidates are unverified, makers are not contacted automatically and an introduction is not guaranteed.',
      breadcrumbRoot: 'English sourcing hub',
      breadcrumbPage: 'Quote request',
      toolLabel: 'English sourcing',
      toolLinks: [
        { path: '/en/', label: 'Sourcing hub' },
        { path: '/en/quote-request/', label: 'Quote request', current: true },
        { path: '/en/sourcing-guide/', label: 'Sourcing guide' },
        { path: '/en/lithuanian-furniture-makers-data/', label: 'Data overview' },
      ],
      kicker: 'Structured project request',
      heading: 'Prepare one comparable furniture quote request',
      lead: 'Describe the project for an operator review. Catalogue entries are unverified public-source candidates, submission does not guarantee an introduction, and makers are not contacted automatically.',
      expectationTitle: 'Important process boundary',
      expectationBody: 'Submitting this form creates a private quote-request review record. It does not send your details or project to any maker.',
      expectationLimit: 'A separate review and decision is required before any possible contact. Submission does not guarantee that a request will be sent, that a maker will reply, or that an offer will be accepted.',
      processTitle: 'What happens after submission',
      processIntro: 'Maker contact can happen only after review and a separate decision.',
      process: [
        ['You submit a project summary.', 'The form creates a private quote-request record for operator review.'],
        ['The project description and candidate fit are reviewed.', 'The review checks whether the information is sufficient and which catalogue candidates might fit the stated scope.'],
        ['Any request is sent only after a separate decision.', 'Selected makers are not contacted automatically when you submit this form.'],
        ['A response window starts only after an actual request is sent.', 'No response period starts from this form submission, and the number of replies is not guaranteed.'],
        ['Any received answers can then be compared.', 'Only answers actually received can be returned and normalised for comparison.'],
      ],
      formTitle: 'Project and contact details',
      formIntro: 'Fields marked with an asterisk are required. Do not submit identity numbers, banking details or other sensitive information that is not needed for this request.',
      successLabel: 'Request received',
      referenceLabel: 'Request reference:',
      successBody: 'Your request has been sent for operator review. Makers were not contacted automatically; any possible outreach requires a separate decision.',
      fields: {
        fullName: 'Full name *',
        email: 'Email *',
        emailPlaceholder: 'name@example.com',
        phone: 'Phone (optional)',
        category: 'Project category *',
        categoryPlaceholder: 'Select a category',
        municipality: 'Municipality *',
        municipalityPlaceholder: 'For example, Vilnius city municipality',
        serviceRegion: 'Project location / service region *',
        serviceRegionPlaceholder: 'City, district or locality',
        projectStage: 'Project stage *',
        projectStagePlaceholder: 'Select the current stage',
        projectScope: 'Project scope *',
        projectScopeHint: 'At least 10 characters. List the furniture, functions, required services and clear exclusions.',
        dimensions: 'Dimensions and number of rooms *',
        dimensionsHint: 'State which dimensions are preliminary and which have been checked.',
        materials: 'Material and hardware requirements *',
        materialsHint: 'If undecided, state your priorities and what should not be left entirely to the supplier.',
        budgetMin: 'Minimum budget, € *',
        budgetMax: 'Maximum budget, € *',
        completionDate: 'Desired completion date *',
        completionDateHint: 'This is a preference, not an automatically confirmed deadline.',
        access: 'Installation and access constraints *',
        accessPlaceholder: 'Floor, lift, parking, working hours and site readiness; if unknown, state that clearly.',
      },
      shortlistLegend: 'Preferred shortlist (optional, up to 8)',
      shortlistHint: 'This is only a preference for review. Catalogue entries are unverified public-source candidates, and no selected maker is contacted automatically.',
      selectedMaker: (name: string) => `Selected maker context: ${name}. This catalogue candidate will be included as a preference for review, not contacted automatically.`,
      invalidMaker: 'The maker named in the link was not found in the current catalogue. You can choose another candidate.',
      searchLabel: 'Search catalogue candidates',
      searchPlaceholder: 'Name, city or category',
      noCandidates: 'No catalogue candidates match this search.',
      noLocation: 'Location and categories are not published in this catalogue entry',
      selectionNone: 'No candidates selected',
      selectionOne: '1 of 8 candidates selected',
      selectionMany: (count: number) => `${count} of 8 candidates selected`,
      fileTitle: 'This form does not upload files.',
      fileBody: 'Plans, photographs and drawings cannot be attached here. If they are needed, the operator will explain how and when to provide them during review; they will not be passed to makers automatically.',
      privacy: 'We will use your contact and project information to administer this quote request. It is not forwarded to makers automatically. Read the',
      privacyLink: 'privacy notice (Lithuanian)',
      submit: 'Submit quote request for review',
      submitting: 'Submitting…',
      submittedButton: 'Quote request submitted',
      submittingStatus: 'Creating a quote-request record for operator review. Makers are not being contacted.',
      submittedStatus: (reference: string) => `Quote request ${reference} was received for operator review. Makers were not contacted automatically.`,
      errorStatus: 'The quote request could not be submitted. Your entries remain in the form. Check the marked fields and your internet connection, then try again.',
      reviewTitle: 'Before you submit',
      reviewItems: [
        'Separate essential requirements from preferences.',
        'Mark which dimensions are preliminary.',
        'Consider VAT, materials, delivery and installation within the budget range.',
        'Do not expect automatic contact with selected catalogue candidates.',
      ],
      reviewLinks: [
        { path: '/en/', label: 'English sourcing hub →' },
        { path: '/en/sourcing-guide/', label: 'Sourcing guide →' },
      ],
      errors: {
        minimum: (label: string, min: number) => `${label}: enter at least ${min} character${min === 1 ? '' : 's'}.`,
        labels: {
          full_name: 'Full name', category: 'Project category', municipality: 'Municipality', service_region: 'Project location', project_stage: 'Project stage', project_scope: 'Project scope', dimensions_room_count: 'Dimensions and room count', materials_requirements: 'Material requirements', installation_access_constraints: 'Installation and access constraints',
        },
        email: 'Enter a valid email address.',
        phone: 'Use only digits and standard phone punctuation.',
        budgetMin: 'Enter a non-negative minimum budget.',
        budgetMax: 'Enter a non-negative maximum budget.',
        budgetOrder: 'The maximum budget cannot be lower than the minimum budget.',
        date: 'Enter the desired completion date.',
        shortlist: 'Select no more than 8 catalogue candidates.',
        summary: 'Check the form:',
        invalidField: 'Check this field and correct its value.',
        apiField: 'The submitted value was rejected. Check this field and try again.',
        apiSummary: 'The server asked you to correct:',
        submitFailed: 'The quote request could not be submitted.',
        missingReference: 'The server did not return a quote-request reference.',
        console: 'Could not submit the quote request.',
      },
    } as const;
  }

  return {
    locale,
    title: 'Pateikite saugią baldų projekto užklausą | Baldai pagal užsakymą Lietuvoje',
    description: 'Struktūruota baldų projekto pasiūlymo užklausa operatoriaus peržiūrai, be automatinio siuntimo gamintojams ir su atskiru patvirtinimu prieš išsiuntimą.',
    breadcrumbRoot: 'Gamintojų katalogas',
    breadcrumbPage: 'Projekto užklausa',
    toolLabel: 'Pirkėjo įrankiai',
    toolLinks: [
      { path: ESTIMATOR_PATH, label: 'Kainos skaičiuoklė' },
      { path: RFQ_PATH, label: 'Projekto užklausa', current: true },
      { path: COMPARISON_PATH, label: 'Pasiūlymų palyginimas' },
      { path: CONTRACT_PATH, label: 'Sutarties šablonas' },
    ],
    kicker: 'Saugi projekto užklausa',
    heading: 'Parenkite vienodą baldų projekto pasiūlymo užklausą',
    lead: 'Pateikite pakankamai tikslią projekto santrauką operatoriaus peržiūrai. Gamintojų kontaktai čia nesiunčiami ir nė vienas tiekėjas nekontaktuojamas automatiškai.',
    expectationTitle: 'Svarbi proceso riba',
    expectationBody: 'Formos pateikimas tik sukuria pasiūlymo užklausos peržiūros įrašą. Siuntimui gamintojams būtinas atskiras operatoriaus patvirtinimas.',
    expectationLimit: 'Pateikimas negarantuoja, kad pasiūlymo užklausa bus išsiųsta, kad gamintojas atsakys ar kad pasiūlymas bus priimtas.',
    processTitle: 'Kaip vyksta užklausa',
    processIntro: 'Kontaktas su tiekėjais atsiranda tik po peržiūros ir atskiro sprendimo.',
    process: [
      ['Pirkėjas pateikia santrauką.', 'Forma sukuria privatų pasiūlymo užklausos įrašą operatoriaus peržiūrai.'],
      ['Operatorius patikrina projekto aprašymą ir tinkamus kandidatus.', 'Vertinama, ar informacijos pakanka ir kurie katalogo kandidatai galėtų atitikti apimtį.'],
      ['Pasiūlymo užklausa siunčiama tik po atskiro patvirtinimo.', 'Iki šio patvirtinimo pasirinkti gamintojai nekontaktuojami.'],
      ['Po išsiuntimo tiekėjai turi penkias dienas.', 'Terminas pradedamas skaičiuoti nuo faktinio pasiūlymo užklausos išsiuntimo, ne nuo šios formos pateikimo.'],
      ['Pirkėjui grąžinami palyginami pasiūlymai.', 'Grąžinami gauti ir suvienodinti atsakymai; atsakymų skaičius negarantuojamas.'],
    ],
    formTitle: 'Projekto ir kontaktiniai duomenys',
    formIntro: 'Visi žvaigždute pažymėti laukai privalomi. Nesiųskite asmens kodo, banko duomenų ar kitos šiai užklausai nereikalingos jautrios informacijos.',
    successLabel: 'Užklausa gauta',
    referenceLabel: 'Užklausos numeris:',
    successBody: 'Užklausa perduota operatoriaus peržiūrai. Gamintojai nebuvo kontaktuoti automatiškai; galimas siuntimas vyks tik po atskiro patvirtinimo.',
    fields: {
      fullName: 'Vardas ir pavardė *', email: 'El. paštas *', emailPlaceholder: 'vardas@pavyzdys.lt', phone: 'Telefonas (nebūtina)', category: 'Projekto kategorija *', categoryPlaceholder: 'Pasirinkite kategoriją', municipality: 'Savivaldybė *', municipalityPlaceholder: 'Pvz., Vilniaus miesto savivaldybė', serviceRegion: 'Paslaugos vieta / regionas *', serviceRegionPlaceholder: 'Miestas, rajonas ar vietovė', projectStage: 'Projekto etapas *', projectStagePlaceholder: 'Pasirinkite dabartinį etapą', projectScope: 'Projekto apimtis *', projectScopeHint: 'Bent 10 ženklų. Išvardykite baldus, funkcijas, reikalingas paslaugas ir aiškias ribas.', dimensions: 'Matmenys ir patalpų skaičius *', dimensionsHint: 'Pažymėkite, kurie matmenys preliminarūs, o kurie patikrinti.', materials: 'Medžiagų ir furnitūros reikalavimai *', materialsHint: 'Jei dar nežinote, įrašykite prioritetus ir ko nenorite palikti tiekėjo nuožiūrai.', budgetMin: 'Biudžetas nuo, € *', budgetMax: 'Biudžetas iki, € *', completionDate: 'Pageidaujama užbaigimo data *', completionDateHint: 'Tai pageidavimas, o ne automatiškai patvirtintas terminas.', access: 'Montavimo ir patekimo sąlygos *', accessPlaceholder: 'Aukštas, liftas, parkavimas, darbo laikas, objekto parengtis; jei apribojimų nežinote, taip ir įrašykite.',
    },
    shortlistLegend: 'Pageidaujamas trumpasis sąrašas (nebūtina, iki 8)',
    shortlistHint: 'Pasirinkimas yra tik pageidavimas operatoriui. Kontaktiniai gamintojų duomenys nesiunčiami, o kandidatai nekontaktuojami iki atskiro patvirtinimo.',
    selectedMaker: (name: string) => `Pasirinktas gamintojas: ${name}. Kandidatas įtrauktas kaip pageidavimas operatoriaus peržiūrai ir nėra kontaktuojamas automatiškai.`,
    invalidMaker: 'Nuorodoje nurodyto gamintojo kataloge nerasta. Galite pasirinkti kitą kandidatą.',
    searchLabel: 'Ieškoti kandidatų',
    searchPlaceholder: 'Pavadinimas, miestas ar kategorija',
    noCandidates: 'Pagal šią paiešką kandidatų nerasta.',
    noLocation: 'Vieta ir kategorijos viešame įraše nenurodytos',
    selectionNone: 'Kandidatų nepasirinkta',
    selectionOne: 'Pasirinktas 1 kandidatas iš 8',
    selectionMany: (count: number) => `Pasirinkta kandidatų: ${count} iš 8`,
    fileTitle: 'Failų ši forma neįkelia.',
    fileBody: 'Planų, nuotraukų ar brėžinių čia prisegti negalima. Jei jų reikės, operatorius pasiūlymo užklausos peržiūros metu nurodys, kaip ir kada juos pateikti; iki atskiro patvirtinimo jie nebus perduodami gamintojams.',
    privacy: 'Kontaktus ir projekto informaciją naudosime pasiūlymo užklausai administruoti. Užklausa automatiškai nepersiunčiama gamintojams. Skaitykite',
    privacyLink: 'privatumo pranešimą',
    submit: 'Pateikti pasiūlymo užklausą operatoriaus peržiūrai',
    submitting: 'Pateikiama…',
    submittedButton: 'Pasiūlymo užklausa pateikta',
    submittingStatus: 'Pasiūlymo užklausa kuriama operatoriaus peržiūrai. Gamintojai nekontaktuojami.',
    submittedStatus: (reference: string) => `Pasiūlymo užklausa ${reference} gauta operatoriaus peržiūrai. Gamintojai nebuvo kontaktuoti automatiškai.`,
    errorStatus: 'Pasiūlymo užklausos pateikti nepavyko. Įvesti duomenys liko formoje. Patikrinkite pažymėtus laukus ir interneto ryšį, tada bandykite dar kartą.',
    reviewTitle: 'Prieš pateikiant',
    reviewItems: ['Atskirkite būtinus reikalavimus nuo pageidavimų.', 'Pažymėkite, kurie matmenys preliminarūs.', 'Biudžetą vertinkite kartu su PVM, medžiagomis ir montavimo apimtimi.', 'Nesitikėkite automatinio kontakto su pasirinktais kandidatais.'],
    reviewLinks: [{ path: COMPARISON_PATH, label: 'Kaip vėliau palyginti pasiūlymus →' }, { path: CONTRACT_PATH, label: 'Atverti sutarties struktūros šabloną →' }],
    errors: {
      minimum: (label: string, min: number) => `${label}: įrašykite bent ${min} ženkl${min === 1 ? 'ą' : 'ų'}.`,
      labels: { full_name: 'Vardas ir pavardė', category: 'Projekto kategorija', municipality: 'Savivaldybė', service_region: 'Paslaugos vieta', project_stage: 'Projekto etapas', project_scope: 'Projekto apimtis', dimensions_room_count: 'Matmenys ir patalpų skaičius', materials_requirements: 'Medžiagų reikalavimai', installation_access_constraints: 'Montavimo ir patekimo sąlygos' },
      email: 'Nurodykite galiojantį el. pašto adresą.', phone: 'Telefono numeryje naudokite tik skaitmenis ir įprastus skyrybos ženklus.', budgetMin: 'Nurodykite neneigiamą mažiausią biudžetą.', budgetMax: 'Nurodykite neneigiamą didžiausią biudžetą.', budgetOrder: 'Didžiausias biudžetas negali būti mažesnis už mažiausią.', date: 'Nurodykite pageidaujamą užbaigimo datą.', shortlist: 'Pasirinkite ne daugiau kaip 8 gamintojų kandidatus.', summary: 'Patikrinkite formą:', invalidField: 'Patikrinkite šį lauką.', apiField: 'Patikrinkite šį lauką ir bandykite dar kartą.', apiSummary: 'Serveris paprašė pataisyti:', submitFailed: 'Pasiūlymo užklausos pateikti nepavyko.', missingReference: 'Serveris negrąžino pasiūlymo užklausos numerio.', console: 'Nepavyko pateikti pasiūlymo užklausos.',
    },
  } as const;
}

type RfqCopy = ReturnType<typeof getRfqCopy>;

function localizedOptions(items: readonly { value: string; lt: string; en: string }[], placeholder: string, locale: RfqLocale): string {
  return `<option value="">${escapeHtml(placeholder)}</option>${items.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item[locale])}</option>`).join('')}`;
}

function rfqToolNavigation(copy: RfqCopy): string {
  return `<nav class="tool-navigation" aria-label="${escapeHtml(copy.toolLabel)}"><strong>${escapeHtml(copy.toolLabel)}</strong><div>${copy.toolLinks.map((link) => `<a href="${link.path}"${'current' in link && link.current ? ' aria-current="page"' : ''}>${escapeHtml(link.label)}</a>`).join('')}</div></nav>`;
}

function fieldError(id: string): string {
  return `<p class="field-error" id="error-${id}" aria-live="polite"></p>`;
}

function setFieldError(root: HTMLElement, fieldName: string, message = ''): void {
  const field = root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${fieldName}"]`);
  const error = root.querySelector<HTMLElement>(`#error-${fieldName.replaceAll('_', '-')}`);
  if (field) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    field.setCustomValidity(message);
  }
  if (error) error.textContent = message;
}

function clearRfqErrors(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.field-error').forEach((error) => { error.textContent = ''; });
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[aria-invalid]').forEach((field) => {
    field.setAttribute('aria-invalid', 'false');
    field.setCustomValidity('');
  });
  const summary = root.querySelector<HTMLElement>('#rfq-error-summary');
  if (summary) {
    summary.hidden = true;
    summary.innerHTML = '';
  }
}

function validateRfqForm(root: HTMLElement, form: HTMLFormElement, copy: RfqCopy): boolean {
  clearRfqErrors(root);
  const errors: { field: string; message: string }[] = [];
  const requireLength = (name: keyof typeof copy.errors.labels, min: number) => {
    const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (!field || field.value.trim().length < min) errors.push({ field: name, message: copy.errors.minimum(copy.errors.labels[name], min) });
  };
  requireLength('full_name', 2);
  requireLength('category', 2);
  requireLength('municipality', 2);
  requireLength('service_region', 2);
  requireLength('project_stage', 2);
  requireLength('project_scope', 10);
  requireLength('dimensions_room_count', 1);
  requireLength('materials_requirements', 1);
  requireLength('installation_access_constraints', 1);

  const email = form.elements.namedItem('email') as HTMLInputElement | null;
  if (!email?.validity.valid) errors.push({ field: 'email', message: copy.errors.email });
  const phone = form.elements.namedItem('phone') as HTMLInputElement | null;
  if (phone?.value && !/^[0-9+().\-\s]+$/.test(phone.value.trim())) errors.push({ field: 'phone', message: copy.errors.phone });
  const budgetMinField = form.elements.namedItem('budget_min') as HTMLInputElement | null;
  const budgetMaxField = form.elements.namedItem('budget_max') as HTMLInputElement | null;
  const budgetMin = Number(budgetMinField?.value);
  const budgetMax = Number(budgetMaxField?.value);
  if (!budgetMinField?.value || !Number.isFinite(budgetMin) || budgetMin < 0) errors.push({ field: 'budget_min', message: copy.errors.budgetMin });
  if (!budgetMaxField?.value || !Number.isFinite(budgetMax) || budgetMax < 0) errors.push({ field: 'budget_max', message: copy.errors.budgetMax });
  if (budgetMinField?.value && budgetMaxField?.value && Number.isFinite(budgetMin) && Number.isFinite(budgetMax) && budgetMax < budgetMin) errors.push({ field: 'budget_max', message: copy.errors.budgetOrder });
  const date = form.elements.namedItem('desired_completion_date') as HTMLInputElement | null;
  if (!date?.value) errors.push({ field: 'desired_completion_date', message: copy.errors.date });
  const selected = root.querySelectorAll<HTMLInputElement>('[name="preferred_shortlist"]:checked');
  if (selected.length > 8) errors.push({ field: 'preferred_shortlist', message: copy.errors.shortlist });

  errors.forEach((error) => setFieldError(root, error.field, error.message));
  if (!errors.length && form.checkValidity()) return true;

  const summary = root.querySelector<HTMLElement>('#rfq-error-summary');
  if (summary) {
    summary.hidden = false;
    summary.innerHTML = `<strong>${escapeHtml(copy.errors.summary)}</strong><ul>${errors.map((error) => `<li>${escapeHtml(error.message)}</li>`).join('')}</ul>`;
    summary.focus();
  }
  if (!errors.length) form.reportValidity();
  return false;
}

function mapApiErrors(root: HTMLElement, payload: unknown, copy: RfqCopy): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return false;
  let mapped = false;
  Object.entries(data as Record<string, unknown>).forEach(([field, detail]) => {
    if (!detail || typeof detail !== 'object') return;
    const message = (detail as { message?: unknown }).message;
    if (typeof message !== 'string') return;
    setFieldError(root, field, copy.locale === 'en' ? copy.errors.apiField : message);
    mapped = true;
  });
  return mapped;
}

export function renderRfqTool({ root, renderHeader, renderFooter, manufacturers = [], locale = 'lt', path, makerQueryParam }: RfqToolContext): void {
  const copy = getRfqCopy(locale);
  const pagePath = path ?? (locale === 'en' ? '/en/quote-request' : RFQ_PATH);
  const query = new URLSearchParams(window.location.search);
  const isEstimatorPrefill = locale === 'lt' && query.get('saltinis') === 'kainos-skaiciuokle';
  const prefill = isEstimatorPrefill
    ? {
      category: query.get('category')?.trim().slice(0, 160) ?? '', municipality: query.get('municipality')?.trim().slice(0, 160) ?? '', service_region: query.get('service_region')?.trim().slice(0, 160) ?? '', project_stage: query.get('project_stage')?.trim().slice(0, 160) ?? '', project_scope: query.get('project_scope')?.trim().slice(0, 3000) ?? '', dimensions_room_count: query.get('dimensions_room_count')?.trim().slice(0, 1200) ?? '', materials_requirements: query.get('materials_requirements')?.trim().slice(0, 3000) ?? '', budget_min: query.get('budget_min')?.trim().slice(0, 20) ?? '', budget_max: query.get('budget_max')?.trim().slice(0, 20) ?? '',
    }
    : undefined;
  document.documentElement.lang = locale;
  setPageMetadata({
    title: copy.title,
    description: copy.description,
    path: pagePath,
    robots: window.location.search ? 'noindex, follow' : 'index, follow',
    structuredData: [breadcrumbStructuredData([
      { name: copy.breadcrumbRoot, path: locale === 'en' ? '/en' : '/' },
      { name: copy.breadcrumbPage, path: pagePath },
    ])],
  });

  const requestedSlug = query.get(makerQueryParam ?? (locale === 'en' ? 'maker' : 'gamintojas'))?.trim()
    ?? (locale === 'en' ? query.get('gamintojas')?.trim() : '')
    ?? '';
  const preselected = requestedSlug ? manufacturers.find((record) => record.slug === requestedSlug) : undefined;
  const invalidPreselection = Boolean(requestedSlug && !preselected);
  const ordered = preselected ? [preselected, ...manufacturers.filter((record) => record.slug !== preselected.slug)] : manufacturers;
  const choices = ordered.map((record) => {
    const categoryLabels = locale === 'en'
      ? (record.category_codes ?? []).map((code) => englishCategoryLabels.get(code)).filter((label): label is string => Boolean(label))
      : (record.category_labels ?? []);
    const details = [record.city?.trim(), categoryLabels.slice(0, 2).join(', ')].filter(Boolean).join(' · ');
    return `<label class="manufacturer-choice"><input type="checkbox" name="preferred_shortlist" value="${escapeHtml(record.slug)}"${record.slug === preselected?.slug ? ' checked' : ''}><span><strong>${escapeHtml(record.trading_name)}</strong><small>${escapeHtml(details || copy.noLocation)}</small></span></label>`;
  }).join('');

  root.innerHTML = `
    ${renderHeader('request')}
    <main class="request-main rfq-main">
      ${rfqToolNavigation(copy)}
      <section class="request-intro" aria-labelledby="request-title">
        <div><p class="kicker">${escapeHtml(copy.kicker)}</p><h1 id="request-title">${escapeHtml(copy.heading)}</h1><p class="lead">${escapeHtml(copy.lead)}</p></div>
        <aside class="request-expectation" aria-labelledby="request-expectation-title"><h2 id="request-expectation-title">${escapeHtml(copy.expectationTitle)}</h2><p>${escapeHtml(copy.expectationBody)}</p><p>${escapeHtml(copy.expectationLimit)}</p></aside>
      </section>
      <section class="rfq-process" aria-labelledby="rfq-process-title">
        <div class="section-heading"><h2 id="rfq-process-title">${escapeHtml(copy.processTitle)}</h2><p>${escapeHtml(copy.processIntro)}</p></div>
        <ol>${copy.process.map(([title, detail]) => `<li><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></li>`).join('')}</ol>
      </section>
      <div class="request-layout">
        <section class="request-form-section" aria-labelledby="request-form-title">
          <div class="section-heading"><h2 id="request-form-title">${escapeHtml(copy.formTitle)}</h2><p>${escapeHtml(copy.formIntro)}</p></div>
          ${isEstimatorPrefill ? '<div class="rfq-prefill-note" role="status"><strong>Skaičiuoklės duomenys perkelti.</strong><span>Patikrinkite apimtį, medžiagas ir biudžeto intervalą, tada užpildykite likusius laukus.</span></div>' : ''}
          <div class="form-error-summary" id="rfq-error-summary" role="alert" tabindex="-1" hidden></div>
          <div class="rfq-success" id="rfq-success" role="status" tabindex="-1" hidden><p class="state-label">${escapeHtml(copy.successLabel)}</p><h2>${escapeHtml(copy.referenceLabel)} <span id="rfq-reference"></span></h2><p>${escapeHtml(copy.successBody)}</p></div>
          <form class="buyer-request-form rfq-form" id="rfq-form" novalidate>
            <div class="form-field"><label for="full-name">${escapeHtml(copy.fields.fullName)}</label><input id="full-name" name="full_name" type="text" autocomplete="name" minlength="2" maxlength="120" required aria-describedby="error-full-name">${fieldError('full-name')}</div>
            <div class="form-field"><label for="email">${escapeHtml(copy.fields.email)}</label><input id="email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required placeholder="${escapeHtml(copy.fields.emailPlaceholder)}" aria-describedby="error-email">${fieldError('email')}</div>
            <div class="form-field"><label for="phone">${escapeHtml(copy.fields.phone)}</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" aria-describedby="error-phone">${fieldError('phone')}</div>
            <div class="form-field"><label for="category">${escapeHtml(copy.fields.category)}</label><div class="select-wrap"><select id="category" name="category" required aria-describedby="error-category">${localizedOptions(categoryOptions, copy.fields.categoryPlaceholder, locale)}</select></div>${fieldError('category')}</div>
            <div class="form-field"><label for="municipality">${escapeHtml(copy.fields.municipality)}</label><input id="municipality" name="municipality" type="text" autocomplete="address-level2" minlength="2" maxlength="160" required placeholder="${escapeHtml(copy.fields.municipalityPlaceholder)}" aria-describedby="error-municipality">${fieldError('municipality')}</div>
            <div class="form-field"><label for="service-region">${escapeHtml(copy.fields.serviceRegion)}</label><input id="service-region" name="service_region" type="text" autocomplete="address-level1" minlength="2" maxlength="160" required placeholder="${escapeHtml(copy.fields.serviceRegionPlaceholder)}" aria-describedby="error-service-region">${fieldError('service-region')}</div>
            <div class="form-field form-field--wide"><label for="project-stage">${escapeHtml(copy.fields.projectStage)}</label><div class="select-wrap"><select id="project-stage" name="project_stage" required aria-describedby="error-project-stage">${localizedOptions(projectStageOptions, copy.fields.projectStagePlaceholder, locale)}</select></div>${fieldError('project-stage')}</div>
            <div class="form-field form-field--wide"><label for="project-scope">${escapeHtml(copy.fields.projectScope)}</label><p class="field-hint" id="project-scope-hint">${escapeHtml(copy.fields.projectScopeHint)}</p><textarea id="project-scope" name="project_scope" rows="7" minlength="10" maxlength="5000" required aria-describedby="project-scope-hint error-project-scope"></textarea>${fieldError('project-scope')}</div>
            <div class="form-field form-field--wide"><label for="dimensions-room-count">${escapeHtml(copy.fields.dimensions)}</label><p class="field-hint" id="dimensions-hint">${escapeHtml(copy.fields.dimensionsHint)}</p><textarea id="dimensions-room-count" name="dimensions_room_count" rows="4" maxlength="1000" required aria-describedby="dimensions-hint error-dimensions-room-count"></textarea>${fieldError('dimensions-room-count')}</div>
            <div class="form-field form-field--wide"><label for="materials-requirements">${escapeHtml(copy.fields.materials)}</label><p class="field-hint" id="materials-hint">${escapeHtml(copy.fields.materialsHint)}</p><textarea id="materials-requirements" name="materials_requirements" rows="5" maxlength="3000" required aria-describedby="materials-hint error-materials-requirements"></textarea>${fieldError('materials-requirements')}</div>
            <div class="form-field"><label for="budget-min">${escapeHtml(copy.fields.budgetMin)}</label><input id="budget-min" name="budget_min" type="number" min="0" max="100000000" step="1" inputmode="numeric" required aria-describedby="error-budget-min">${fieldError('budget-min')}</div>
            <div class="form-field"><label for="budget-max">${escapeHtml(copy.fields.budgetMax)}</label><input id="budget-max" name="budget_max" type="number" min="0" max="100000000" step="1" inputmode="numeric" required aria-describedby="error-budget-max">${fieldError('budget-max')}</div>
            <div class="form-field"><label for="desired-completion-date">${escapeHtml(copy.fields.completionDate)}</label><input id="desired-completion-date" name="desired_completion_date" type="date" required aria-describedby="completion-date-hint error-desired-completion-date"><p class="field-hint" id="completion-date-hint">${escapeHtml(copy.fields.completionDateHint)}</p>${fieldError('desired-completion-date')}</div>
            <div class="form-field"><label for="installation-access-constraints">${escapeHtml(copy.fields.access)}</label><textarea id="installation-access-constraints" name="installation_access_constraints" rows="4" maxlength="3000" required placeholder="${escapeHtml(copy.fields.accessPlaceholder)}" aria-describedby="error-installation-access-constraints"></textarea>${fieldError('installation-access-constraints')}</div>
            <fieldset class="manufacturer-fieldset form-field--wide"><legend>${escapeHtml(copy.shortlistLegend)}</legend><p class="field-hint" id="manufacturer-choice-hint">${escapeHtml(copy.shortlistHint)}</p>${preselected ? `<p class="selection-notice" role="status"><strong>${escapeHtml(copy.selectedMaker(preselected.trading_name))}</strong></p>` : ''}${invalidPreselection ? `<p class="selection-notice" role="status">${escapeHtml(copy.invalidMaker)}</p>` : ''}<div class="manufacturer-picker"><div class="manufacturer-picker-toolbar"><div class="form-field"><label for="manufacturer-search">${escapeHtml(copy.searchLabel)}</label><input id="manufacturer-search" type="search" autocomplete="off" maxlength="120" placeholder="${escapeHtml(copy.searchPlaceholder)}"></div><p id="manufacturer-selection-count" aria-live="polite">${escapeHtml(preselected ? copy.selectionOne : copy.selectionNone)}</p></div><div class="manufacturer-choice-list" id="manufacturer-choice-list" aria-describedby="manufacturer-choice-hint">${choices}</div><p class="manufacturer-empty" id="manufacturer-empty" hidden>${escapeHtml(copy.noCandidates)}</p></div>${fieldError('preferred-shortlist')}</fieldset>
            <div class="attachment-limit form-field--wide"><strong>${escapeHtml(copy.fileTitle)}</strong><p>${escapeHtml(copy.fileBody)}</p></div>
            <p class="form-privacy-note form-field--wide">${escapeHtml(copy.privacy)} <a href="/privatumas">${escapeHtml(copy.privacyLink)}</a>.</p>
            <div class="request-submit form-field--wide"><button class="primary-button" type="submit">${escapeHtml(copy.submit)}</button><p class="form-status" id="rfq-status" role="status" aria-live="polite" tabindex="-1"></p></div>
          </form>
        </section>
        <aside class="request-guidance" aria-labelledby="request-guidance-title"><h2 id="request-guidance-title">${escapeHtml(copy.reviewTitle)}</h2><ul>${copy.reviewItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>${copy.reviewLinks.map((link) => `<a href="${link.path}">${escapeHtml(link.label)}</a>`).join('')}</aside>
      </div>
    </main>
    ${renderFooter()}
  `;

  const form = root.querySelector<HTMLFormElement>('#rfq-form');
  const search = root.querySelector<HTMLInputElement>('#manufacturer-search');
  const list = root.querySelector<HTMLElement>('#manufacturer-choice-list');
  const empty = root.querySelector<HTMLElement>('#manufacturer-empty');
  const selectionCount = root.querySelector<HTMLElement>('#manufacturer-selection-count');
  const status = root.querySelector<HTMLElement>('#rfq-status');
  const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!form || !search || !list || !empty || !selectionCount || !status || !submit) return;

  if (prefill) {
    Object.entries(prefill).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.value = value;
    });
  }

  const shortlistChoices = Array.from(list.querySelectorAll<HTMLInputElement>('[name="preferred_shortlist"]'));
  const updateSelection = (changed?: HTMLInputElement) => {
    let selected = shortlistChoices.filter((choice) => choice.checked);
    if (selected.length > 8 && changed) {
      changed.checked = false;
      selected = shortlistChoices.filter((choice) => choice.checked);
      setFieldError(root, 'preferred_shortlist', copy.errors.shortlist);
    } else setFieldError(root, 'preferred_shortlist');
    selectionCount.textContent = selected.length === 0 ? copy.selectionNone : selected.length === 1 ? copy.selectionOne : copy.selectionMany(selected.length);
  };
  shortlistChoices.forEach((choice) => choice.addEventListener('change', () => updateSelection(choice)));
  search.addEventListener('input', () => {
    const searchQuery = search.value.trim().toLocaleLowerCase(locale === 'en' ? 'en-GB' : 'lt-LT');
    let visible = 0;
    list.querySelectorAll<HTMLElement>('.manufacturer-choice').forEach((choice) => {
      const matches = !searchQuery || (choice.textContent ?? '').toLocaleLowerCase(locale === 'en' ? 'en-GB' : 'lt-LT').includes(searchQuery);
      choice.hidden = !matches;
      if (matches) visible += 1;
    });
    empty.hidden = visible > 0;
  });

  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select').forEach((field) => {
    if (field.name === 'preferred_shortlist') return;
    field.setAttribute('aria-invalid', 'false');
    field.addEventListener('input', () => setFieldError(root, field.name));
    field.addEventListener('blur', () => { if (!field.validity.valid) setFieldError(root, field.name, copy.errors.invalidField); });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateRfqForm(root, form, copy)) return;
    const formData = new FormData(form);
    const payload = {
      full_name: String(formData.get('full_name') ?? '').trim(), email: String(formData.get('email') ?? '').trim(), phone: String(formData.get('phone') ?? '').trim(), category: String(formData.get('category') ?? '').trim(), municipality: String(formData.get('municipality') ?? '').trim(), service_region: String(formData.get('service_region') ?? '').trim(), project_stage: String(formData.get('project_stage') ?? '').trim(), project_scope: String(formData.get('project_scope') ?? '').trim(), dimensions_room_count: String(formData.get('dimensions_room_count') ?? '').trim(), materials_requirements: String(formData.get('materials_requirements') ?? '').trim(), budget_min: Number(formData.get('budget_min')), budget_max: Number(formData.get('budget_max')), desired_completion_date: String(formData.get('desired_completion_date') ?? ''), installation_access_constraints: String(formData.get('installation_access_constraints') ?? '').trim(), preferred_shortlist: shortlistChoices.filter((choice) => choice.checked).map((choice) => choice.value),
    };

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = copy.submitting;
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.textContent = copy.submittingStatus;

    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/+$/, '')}/api/public/rfqs`, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => null) as { reference?: string; message?: string } | null;
      if (!response.ok) {
        const mapped = mapApiErrors(root, body, copy);
        if (mapped) {
          const summary = root.querySelector<HTMLElement>('#rfq-error-summary');
          if (summary) {
            const messages = Array.from(root.querySelectorAll<HTMLElement>('.field-error')).map((error) => error.textContent).filter(Boolean);
            summary.hidden = false;
            summary.innerHTML = `<strong>${escapeHtml(copy.errors.apiSummary)}</strong><ul>${messages.map((message) => `<li>${escapeHtml(message ?? '')}</li>`).join('')}</ul>`;
            summary.focus();
          }
        }
        throw new Error(copy.errors.submitFailed);
      }
      if (!body?.reference) throw new Error(copy.errors.missingReference);

      const success = root.querySelector<HTMLElement>('#rfq-success');
      const reference = root.querySelector<HTMLElement>('#rfq-reference');
      if (reference) reference.textContent = body.reference;
      if (success) { success.hidden = false; success.focus(); }
      status.className = 'form-status form-status--success';
      status.setAttribute('role', 'status');
      status.textContent = copy.submittedStatus(body.reference);
      submit.textContent = copy.submittedButton;
      submit.removeAttribute('aria-busy');
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select').forEach((field) => { field.disabled = true; });
      return;
    } catch (error) {
      console.error(copy.errors.console, error);
      status.className = 'form-status form-status--error';
      status.setAttribute('role', 'alert');
      status.textContent = copy.errorStatus;
      status.focus();
    } finally {
      if (!submit.disabled || submit.textContent !== copy.submittedButton) {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        submit.textContent = copy.submit;
      }
    }
  });
}
