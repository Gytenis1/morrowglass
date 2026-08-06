import type { RecordModel } from 'pocketbase';
import './styles.css';
import baldininkaiLogoUrl from './assets/baldininkai-logo.svg';
import { pb } from './pocketbase';
import { renderComparisonTool, renderContractTool, renderRfqTool } from './buyerTools';
import { ESTIMATOR_PATH, renderPriceEstimator } from './priceEstimator';
import {
  CATEGORY_LANDINGS,
  SITE_URL,
  breadcrumbStructuredData,
  faqStructuredData,
  getAllCities,
  getEligibleCityCategoryLandings,
  getLandingCities,
  itemListStructuredData,
  manufacturerStructuredData,
  setPageMetadata,
  slugifyLithuanian,
  type CategoryLanding,
} from './seo';

type Manufacturer = RecordModel & {
  slug: string;
  legal_name: string | null;
  trading_name: string;
  source_identity: string;
  legal_entity_known: boolean;
  description_lt: string;
  scope_evidence: string;
  location: string;
  city: string;
  region: string;
  region_label: string;
  category_codes: string[];
  category_labels: string[];
  website: string;
  public_contact_url: string;
  company_code: string | null;
  public_phone: string | null;
  street_address: string | null;
  postcode: string | null;
  founded_year: number | null;
  employee_count_band: string | null;
  revenue_eur_latest: number | null;
  revenue_year: number | null;
  financial_source_url: string | null;
  revenue_availability: 'paskelbta' | 'nepaskelbta' | null;
  public_details_source_urls: string[];
  source_urls: string[];
  source_artifact_url: string;
  source_collection_date: string;
  public_contact_checked_date: string | null;
  verification_status: string;
  financial_verification_status: string | null;
  verified_at: string | null;
};

type ManufacturerReview = RecordModel & {
  manufacturer: string;
  rating: number;
  display_name: string;
  review_text: string;
  project_type?: string;
  status: string;
};

type BrowseState = {
  query: string;
  category: string;
  city: string;
  region: string;
  employeeBand: string;
  foundedPeriod: string;
  registryCheckedOnly: boolean;
};

type FilterOption = {
  value: string;
  label: string;
};

type GuideArticle = {
  slug: string;
  title: string;
  summary: string;
  readingLabel: string;
  featured?: boolean;
  buyerIntent?: boolean;
};

type PolicyPage = {
  path: string;
  title: string;
  heading: string;
  description: string;
  summary: string;
  content: string;
};


type HeaderSection = 'directory' | 'guide' | 'request' | 'policy' | 'overview';

type ProfileLandingLink = {
  kind: 'Miestas' | 'Kategorija';
  slug: string;
  label: string;
};


const PAGE_SIZE = 50;
const EMPLOYEE_BAND_OPTIONS: FilterOption[] = [
  { value: '0', label: '0 darbuotojų' },
  { value: '1-9', label: '1–9 darbuotojai' },
  { value: '10-49', label: '10–49 darbuotojai' },
  { value: '50-249', label: '50–249 darbuotojai' },
  { value: '250+', label: '250 ir daugiau darbuotojų' },
];
const FOUNDED_PERIOD_OPTIONS: FilterOption[] = [
  { value: 'iki-1999', label: 'Iki 1999 m.' },
  { value: '2000-2009', label: '2000–2009 m.' },
  { value: '2010-2019', label: '2010–2019 m.' },
  { value: 'nuo-2020', label: '2020 m. ir vėliau' },
];
const PROJECT_BRIEF_MIN_LENGTH = 40;
const PROJECT_BRIEF_MAX_LENGTH = 3000;
const REVIEW_TEXT_MIN_LENGTH = 40;
const REVIEW_TEXT_MAX_LENGTH = 2000;
const projectTypeOptions = [
  'Virtuvės baldai',
  'Spintos ar įmontuojami baldai',
  'Miegamojo ar vonios baldai',
  'Biuro ar komerciniai baldai',
  'Minkšti baldai',
  'Medžio masyvo ar kiti nestandartiniai baldai',
  'Kitas projektas',
];
const budgetBandOptions = ['Iki 3 000 €', '3 000–6 000 €', '6 000–10 000 €', '10 000–20 000 €', 'Daugiau nei 20 000 €', 'Biudžetas dar nenustatytas'];
const timelineOptions = ['Per 1–3 mėnesius', 'Per 3–6 mėnesius', 'Vėliau nei po 6 mėnesių', 'Terminas lankstus', 'Dar nežinau'];
const collator = new Intl.Collator('lt', { sensitivity: 'base' });
const root = document.querySelector<HTMLElement>('#app');
const guideArticles: GuideArticle[] = [
  {
    slug: 'trumpasis-sarasas',
    title: 'Kaip sudaryti pagrįstą trumpąjį sąrašą',
    summary: 'Atrankos seka, patikrinami kriterijai ir klausimai prieš priimant pasiūlymą.',
    readingLabel: 'Atranka ir patikra',
  },
  {
    slug: 'uzklausa-ir-pasiulymas',
    title: 'Kaip parengti užklausą ir palyginti pasiūlymus',
    summary: 'Ką aprašyti, kad gamintojai vertintų tą pačią apimtį, ir kas dažniausiai keičia kainą.',
    readingLabel: 'Užklausa ir apimtis',
  },
  {
    slug: 'terminai',
    title: 'Kaip prašyti realistiško darbų grafiko',
    summary: 'Terminą lemiantys kintamieji, etapai ir klausimai, padedantys valdyti neapibrėžtumą.',
    readingLabel: 'Terminai ir eiga',
  },
  {
    slug: 'kaip-pasirinkti-baldu-gamintoja',
    title: 'Kaip pasirinkti ir palyginti baldų gamintoją',
    summary: 'Ką paklausti, kokius įspėjamuosius ženklus pastebėti ir kaip atsargiai skaityti nepatvirtintus katalogo įrašus.',
    readingLabel: 'Atranka ir patikra',
    featured: true,
  },
  {
    slug: 'virtuves-baldu-kainos',
    title: 'Virtuvės baldų kainos: ribos ir kainą keičiantys sprendimai',
    summary: 'Dvi aiškiai atskirtos viešų šaltinių nuorodos, jų datos ir praktinis sąrašas, kas keičia individualaus projekto kainą.',
    readingLabel: 'Kaina ir apimtis',
    featured: true,
  },
  {
    slug: 'virtuves-ir-imontuojamu-baldu-projekto-eiga',
    title: 'Virtuvės ir įmontuojamų baldų projekto eiga',
    summary: 'Tipinė etapų seka nuo matavimo iki montavimo ir kontrolinis sąrašas sprendimams, kurie veikia grafiką.',
    readingLabel: 'Projekto eiga',
    featured: true,
  },
  {
    slug: 'medziagos-sutartis-avansas-garantija',
    title: 'Medžiagos, sutartis, avansas ir garantija: ką aptarti',
    summary: 'LMDP ir MDF, faneruotės, masyvo, stalviršių, furnitūros, briaunų, sutarties ir garantinio aptarnavimo klausimai.',
    readingLabel: 'Dokumentai ir atsakomybės',
    featured: true,
  },
  {
    slug: 'spintos-ir-drabuzines-kaina',
    title: 'Spintos ir drabužinės kaina: ką apibrėžti prieš lyginant pasiūlymus',
    summary: 'Apimtis, vidaus įranga ir montavimo sąlygos, kurios padeda palyginti pasiūlymus.',
    readingLabel: 'Spintos ir drabužinės',
    featured: true,
    buyerIntent: true,
  },
  {
    slug: 'mdf-faneruote-masyvas-fasadai',
    title: 'MDF, faneruotė ar masyvas fasadams: klausimai prieš pasirenkant',
    summary: 'Fasadų specifikacijos, pavyzdžiai, priežiūra ir kompromisai.',
    readingLabel: 'Fasadai ir medžiagos',
    featured: true,
    buyerIntent: true,
  },
  {
    slug: 'kvarcas-ar-akmuo-stalvirsiui',
    title: 'Kvarcas ar natūralus akmuo stalviršiui: apimtis, priežiūra ir klausimai',
    summary: 'Šablonavimo, išpjovų, sujungimų ir montavimo kontrolinis sąrašas.',
    readingLabel: 'Stalviršiai',
    featured: true,
    buyerIntent: true,
  },
  {
    slug: 'matavimas-ir-montavimas-kontrole',
    title: 'Galutinis matavimas ir montavimo diena: kontrolinis sąrašas',
    summary: 'Objekto parengtis, dokumentai ir priėmimo patikra.',
    readingLabel: 'Matavimas ir montavimas',
    featured: true,
    buyerIntent: true,
  },
  {
    slug: 'baldu-defektai-ir-garantinis-aptarnavimas',
    title: 'Baldų defektai ir garantinis aptarnavimas: kaip fiksuoti ir sekti',
    summary: 'Dokumentavimas, pranešimas ir sutartos korekcijos sekimas.',
    readingLabel: 'Defektai ir aptarnavimas',
    featured: true,
    buyerIntent: true,
  },
  {
    slug: 'mazo-buto-irengimas-pagal-uzsakyma',
    title: 'Mažo buto įrengimas pagal užsakymą: prioritetai ir užklausos sąrašas',
    summary: 'Saugojimo, judėjimo, matavimo ir montavimo prioritetai.',
    readingLabel: 'Mažas butas',
    featured: true,
    buyerIntent: true,
  },
];


const policyPages: PolicyPage[] = [
  {
    path: '/privatumas',
    title: 'Privatumo pranešimas | Baldai pagal užsakymą Lietuvoje',
    heading: 'Privatumo pranešimas',
    description: 'Kaip GG Ventures UAB tvarko Baldininkai.org katalogo užklausų, atsiliepimų ir įrašų pataisymo ar atstovavimo formų asmens duomenis.',
    summary: 'Šiame pranešime paaiškiname, kokius asmens duomenis gauname per katalogo formas, kam juos naudojame, kiek laiko saugome ir kokias teises turite.',
    content: `
      <section><h2>Kas tvarko duomenis</h2><p>Svetainės ir katalogo duomenų valdytojas yra <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>. Su privatumu susijusiais klausimais rašykite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>.</p></section>
      <section><h2>Kokius duomenis gauname</h2><p>Kai pateikiate pirkėjo projekto užklausą, gauname jūsų vardą, el. pašto adresą, projekto vietą, rūšį, biudžeto ir termino intervalą, projekto aprašymą bei pasirinktų katalogo kandidatų sąrašą. Katalogas šios užklausos automatiškai nepersiunčia gamintojams.</p><p>Kai pateikiate atsiliepimą, gauname rodomą vardą arba inicialus, įvertinimą, projekto rūšį, atsiliepimo tekstą ir neviešą kontaktinį el. paštą, reikalingą moderavimui ar patikslinimui.</p><p>Kai prašote pataisyti, papildyti, pašalinti, atstovauti ar perimti katalogo įrašą, gauname prašymo turinį, įrašo identifikaciją, jūsų nurodytus šaltinius ir, jei pateikiate, kontaktinį el. paštą bei informaciją, reikalingą atstovavimo teisei patikrinti.</p><p>Taip pat galime gauti įprastus techninius užklausų ir saugumo žurnalų duomenis, reikalingus svetainės veikimui, apsaugai ir klaidų tyrimui.</p></section>
      <section><h2>Kodėl duomenis naudojame</h2><p>Duomenis naudojame tam, kad priimtume ir administruotume jūsų prašymą, atsakytume, moderuotume atsiliepimus, tikrintume įrašų pataisymus ar atstovavimo prašymus, saugotume katalogą nuo piktnaudžiavimo ir vykdytume taikomus teisinius reikalavimus. Atsižvelgiant į situaciją, tvarkymas grindžiamas jūsų prašymu, teisėtu interesu administruoti patikimą katalogą arba teisine pareiga.</p></section>
      <section><h2>Kam duomenys gali būti atskleisti</h2><p>Duomenis gali tvarkyti svetainės prieglobos, duomenų saugojimo, saugumo ar ryšio paslaugų teikėjai tiek, kiek būtina jų paslaugoms. Duomenis taip pat galime pateikti kompetentingoms institucijoms, kai to reikalauja teisė. Pirkėjo projekto formos duomenys nėra automatiškai persiunčiami kataloge nurodytiems gamintojams.</p></section>
      <section><h2>Kiek laiko saugome</h2><p>Formų duomenis ir susijusį susirašinėjimą saugome tik tiek, kiek būtina konkrečiam prašymui išnagrinėti, katalogo patikimumui apsaugoti ir taikomiems teisiniams poreikiams įvykdyti. Konkretus laikotarpis priklauso nuo prašymo pobūdžio, ginčo ar piktnaudžiavimo rizikos ir teisinių saugojimo pareigų.</p></section>
      <section><h2>Jūsų teisės</h2><p>Taikytinais atvejais galite prašyti susipažinti su savo duomenimis, juos ištaisyti ar ištrinti, apriboti jų tvarkymą, nesutikti su tvarkymu, gauti pateiktus duomenis perkeliamu formatu arba atšaukti sutikimą, kai tvarkymas juo grindžiamas. Prašymą siųskite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>. Taip pat turite teisę pateikti skundą Valstybinei duomenų apsaugos inspekcijai.</p></section>
      <section><h2>Slapukai ir pranešimo pakeitimai</h2><p>Šiuo metu svetainė nenaudoja pasirenkamų reklamos ar analitikos slapukų. Jei tai pasikeis, prieš pradėdami tokį naudojimą atnaujinsime <a href="/slapukai" data-internal-link="true">slapukų pranešimą</a> ir, kai būtina, paprašysime pasirinkimo. Šį privatumo pranešimą galime atnaujinti pasikeitus funkcijoms ar teisiniams reikalavimams.</p></section>`,
  },
  {
    path: '/naudojimosi-salygos',
    title: 'Naudojimosi sąlygos | Baldai pagal užsakymą Lietuvoje',
    heading: 'Naudojimosi sąlygos',
    description: 'Baldininkai.org viešų šaltinių baldų gamintojų katalogo naudojimo, užklausų, atsakomybės ir būsimo susitarimo ribos.',
    summary: 'Šios sąlygos apibrėžia, ką katalogas pateikia, ko negarantuoja ir kokia atsakomybė lieka naudotojui bei pasirinktam gamintojui.',
    content: `
      <section><h2>Operatorius ir sąlygų taikymas</h2><p>Svetainę valdo <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>, kontaktinis el. paštas <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>. Naudodamiesi svetaine sutinkate laikytis šių sąlygų ir taikomos teisės.</p></section>
      <section><h2>Katalogo paskirtis</h2><p>Kataloge pateikiami iš viešų šaltinių surinkti galimi baldų gamintojų kandidatai, skirti savarankiškai paieškai ir palyginimui. Įrašas nėra rekomendacija, sertifikatas ar patvirtinimas ir negarantuoja tapatybės, informacijos tikslumo, darbų kokybės, kainos, terminų, dabartinio užimtumo, paslaugų teritorijos ar galimybės priimti konkretų projektą.</p><p>Prieš priimdami sprendimą savarankiškai patikrinkite juridinius ir kontaktinius duomenis, aktualią veiklą, pasiūlymo apimtį, sutarties šalį, mokėjimo gavėją, medžiagas, garantijas ir kitus jums svarbius faktus.</p></section>
      <section><h2>Projekto užklausos</h2><p>Pirkėjo projekto forma padeda vienoje vietoje suformuoti projekto santrauką ir išsaugoti ją katalogo peržiūrai. Katalogas pirkėjo užklausos automatiškai nepersiunčia pasirinktiems ar kitiems gamintojams. Formos pateikimas negarantuoja atsakymo, pasiūlymo, kainos ar projekto priėmimo.</p></section>
      <section><h2>Susitarimai su gamintojais</h2><p>Jei vėliau susisiekiate su gamintoju ir sudarote susitarimą, jis sudaromas tiesiogiai tarp jūsų ir gamintojo ar kitos aiškiai nurodytos sutarties šalies. Katalogas ir GG Ventures UAB nėra tokio būsimo kliento ir gamintojo susitarimo šalis, tarpininkas, garantas ar mokėjimų vykdytojas.</p></section>
      <section><h2>Atsiliepimai ir pataisymai</h2><p>Atsiliepimai skelbiami tik po moderavimo pagal <a href="/atsiliepimu-taisykles" data-internal-link="true">atsiliepimų taisykles</a>. Apie netikslų įrašą ar teisę jam atstovauti galima pranešti pagal <a href="/irasyti-pataisyma" data-internal-link="true">įrašo pataisymo ir atstovavimo tvarką</a>. Viešas pakeitimas atliekamas tik įvertinus pateiktą informaciją.</p></section>
      <section><h2>Leistinas naudojimas ir atsakomybės ribos</h2><p>Nenaudokite svetainės neteisėtai, nebandykite trikdyti jos veikimo, automatizuotai rinkti duomenų neproporcingu mastu, apsimesti kitu asmeniu ar teikti žinomai klaidingo, grasinamo ar žalingo turinio. Dedame pagrįstas pastangas palaikyti svetainę, tačiau negarantuojame nepertraukiamo veikimo ar to, kad visi viešų šaltinių duomenys visada bus aktualūs. Kiek leidžia taikoma teisė, už sprendimus, priimtus vien pagal katalogo įrašą, atsako pats naudotojas.</p></section>
      <section><h2>Pakeitimai ir kontaktas</h2><p>Sąlygas galime atnaujinti pasikeitus katalogo funkcijoms ar teisiniams reikalavimams. Klausimus siųskite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>.</p></section>`,
  },
  {
    path: '/slapukai',
    title: 'Slapukų pranešimas | Baldai pagal užsakymą Lietuvoje',
    heading: 'Slapukų pranešimas',
    description: 'Kokius būtinus techninius saugojimo sprendimus gali naudoti Baldininkai.org ir patvirtinimas, kad nėra pasirenkamų reklamos ar analitikos slapukų.',
    summary: 'Paaiškiname, kokie techniniai naršyklės duomenys gali būti reikalingi svetainei ir kokių pasirenkamų stebėjimo priemonių šiuo metu nenaudojame.',
    content: `
      <section><h2>Kas yra slapukai</h2><p>Slapukai yra nedideli duomenų failai, kuriuos svetainė ar jos naudojama paslauga gali išsaugoti naršyklėje. Panašiai gali veikti vietinė naršyklės saugykla ar kiti techniniai identifikatoriai.</p></section>
      <section><h2>Ką naudoja ši svetainė</h2><p>Svetainė gali naudoti tik būtinus techninius saugojimo ar saugumo sprendimus, reikalingus puslapiams pateikti, formų apsaugai, tinklo veikimui ir klaidų prevencijai. Tokie sprendimai nenaudojami reklamos profiliams kurti.</p><p><strong>Šiuo metu svetainė nenaudoja pasirenkamų reklamos ar analitikos slapukų.</strong> Todėl nėra pasirenkamų reklamos ar analitikos kategorijų, kurias reikėtų įjungti.</p></section>
      <section><h2>Naršyklės valdymas</h2><p>Slapukus ir kitą svetainių saugyklą galite peržiūrėti ar ištrinti savo naršyklės nustatymuose. Uždraudus būtinus techninius sprendimus, kai kurios formos ar apsaugos priemonės gali neveikti taip, kaip numatyta.</p></section>
      <section><h2>Jei naudojimas pasikeistų</h2><p>Prieš pradėdami naudoti pasirenkamus reklamos ar analitikos slapukus atnaujinsime šį pranešimą ir, kai būtina, pateiksime pasirinkimo priemonę. Duomenų valdytojas yra <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>; klausimus siųskite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>.</p></section>`,
  },
  {
    path: '/atsiliepimu-taisykles',
    title: 'Atsiliepimų ir moderavimo taisyklės | Baldai pagal užsakymą Lietuvoje',
    heading: 'Atsiliepimų ir moderavimo taisyklės',
    description: 'Baldininkai.org atsiliepimų pateikimo, interesų konfliktų, faktinių teiginių, moderavimo, pašalinimo ir pataisymo taisyklės.',
    summary: 'Atsiliepimai turi padėti pirkėjams suprasti konkrečią patirtį, todėl prieš paskelbimą juos moderuojame ir galime prašyti patikslinimų.',
    content: `
      <section><h2>Kas gali pateikti atsiliepimą</h2><p>Atsiliepimą teikite tik apie savo tikrą ir tiesioginę patirtį su konkrečiu gamintoju ar sutarties šalimi. Neteikite atsiliepimo, jei esate vertinamos įmonės savininkas, darbuotojas, samdomas atstovas, artimas konkurentas ar turite kitą neatskleistą interesų konfliktą.</p></section>
      <section><h2>Ko neleidžiame</h2><p>Neskelbiame suklastotų, už atlygį parašytų ar kelių asmenų patirtimi apsimetančių atsiliepimų. Neleidžiami grasinimai, įžeidimai, neapykantos kalba, šantažas, reklama, svetimi asmens duomenys, komercinės paslaptys ar teiginiai apie nusikaltimus ir kitus sunkius pažeidimus, kai jie nepagrįsti patikrinama informacija.</p><p>Atskirkite tai, ką tiesiogiai patyrėte, nuo prielaidų apie priežastis ar ketinimus. Faktiniai teiginiai turi būti konkretūs ir, paprašius, pagrindžiami susirašinėjimu, sutartimi, sąskaita, nuotrauka ar kitu tinkamu įrodymu.</p></section>
      <section><h2>Kaip moderuojame</h2><p>Kiekvienas atsiliepimas prieš paskelbimą peržiūrimas. Galime pataisyti akivaizdžias rašybos klaidas nekeisdami prasmės, paprašyti patikslinimo, paslėpti asmens duomenis, atmesti visą atsiliepimą arba paskelbti tik tinkamą jo dalį. Paskelbimas nėra katalogo patvirtinimas, kokybės sertifikatas ar pritarimas autoriaus nuomonei.</p></section>
      <section><h2>Pašalinimas ir pataisymas</h2><p>Autorius, gamintojas ar jo įgaliotas atstovas gali paprašyti peržiūrėti paskelbtą atsiliepimą parašydamas <a href="mailto:info@baldininkai.org">info@baldininkai.org</a> arba pateikdamas įrašo pataisymo formą. Nurodykite gamintoją, ginčijamą teiginį, prašomą veiksmą ir turimus pagrindžiančius duomenis. Vertindami galime laikinai paslėpti turinį, susisiekti su autoriumi, pataisyti aiškų netikslumą arba pašalinti taisykles pažeidžiantį atsiliepimą.</p></section>
      <section><h2>Operatorius</h2><p>Taisykles administruoja <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>. Kontaktinis el. paštas: <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>. Kontaktiniai duomenys tvarkomi pagal <a href="/privatumas" data-internal-link="true">privatumo pranešimą</a>.</p></section>`,
  },
  {
    path: '/irasyti-pataisyma',
    title: 'Įrašo pataisymo ir atstovavimo tvarka | Baldai pagal užsakymą Lietuvoje',
    heading: 'Įrašo pataisymo ir atstovavimo tvarka',
    description: 'Kaip baldų gamintojas ar jo atstovas gali prašyti pataisyti, papildyti, pašalinti, atstovauti ar perimti Baldininkai.org katalogo įrašą.',
    summary: 'Gamintojas ar jo atstovas gali pranešti apie netikslumą arba prašyti atstovauti įrašui, tačiau prieš viešą pakeitimą patikriname prašymą ir atstovavimo teisę.',
    content: `
      <section><h2>Kaip pateikti prašymą</h2><p>Atverkite atitinkamą gamintojo katalogo įrašą ir naudokite skilties „Pataisyti, atstovauti ar pranešti“ formą. Jei įrašo nerandate arba forma netinka, rašykite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>. Nurodykite įrašo pavadinimą ar nuorodą, konkretų netikslumą, teisingą informaciją ir, jei turite, viešą patvirtinantį šaltinį.</p></section>
      <section><h2>Ką galima prašyti pakeisti</h2><p>Galite prašyti pataisyti pavadinimą, veiklos aprašymą, vietą, kategoriją, svetainės ar kontaktinę nuorodą, pažymėti pasibaigusią veiklą, pašalinti klaidingai priskirtą informaciją arba pateikti kitą pagrįstą įrašo korekciją.</p></section>
      <section><h2>Kaip atstovauti arba perimti įrašą</h2><p>Gamintojas, įmonės darbuotojas ar įgaliotas atstovas gali prašyti pažymėti, kad atstovauja katalogo įrašui, ir suderinti jo viešą informaciją. Prašyme paaiškinkite savo ryšį su gamintoju ir pateikite tokį patvirtinimą, kurį galima pagrįstai patikrinti, pavyzdžiui, rašykite iš oficialaus įmonės domeno el. pašto arba pateikite kitą įgaliojimą patvirtinančią informaciją.</p></section>
      <section><h2>Patikrinimas prieš viešą pakeitimą</h2><p>Prašymo pateikimas savaime nesuteikia įrašo kontrolės ir nereiškia, kad pakeitimas bus paskelbtas. Prieš viešai keisdami duomenis tikriname prašymo pagrįstumą, šaltinius ir, kai prašoma atstovauti įrašui, pareiškėjo ryšį ar įgaliojimą. Galime paprašyti papildomos informacijos, atmesti nepatikrinamą prašymą arba palikti viešo šaltinio duomenis su aiškia pastaba.</p></section>
      <section><h2>Duomenys ir kontaktas</h2><p>Prašymo informaciją naudojame tik katalogo peržiūrai, ryšiui ir galimiems teisiniams poreikiams pagal <a href="/privatumas" data-internal-link="true">privatumo pranešimą</a>. Tvarką administruoja <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>; kontaktinis el. paštas <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>.</p></section>`,
  },
];


let manufacturers: Manufacturer[] = [];
let browseState = readBrowseState();
let isLoading = false;
let directoryLoaded = false;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('lt-LT');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textOrUnknown(value: string | null | undefined, unknown = 'Viešuose šaltiniuose nenurodyta.'): string {
  const normalizedValue = value?.trim();
  return normalizedValue || unknown;
}

function employeeBandLabel(value: string): string {
  const labels: Record<string, string> = {
    '0': 'Viešame darbuotojų skaičiaus įraše – 0 darbuotojų',
    '1-9': 'Labai maža komanda – 1–9 darbuotojai',
    '10-49': 'Nedidelė įmonė – 10–49 darbuotojai',
    '50-249': 'Didesnė įmonė – 50–249 darbuotojai',
    '250+': 'Didelė įmonė – 250 ar daugiau darbuotojų',
  };
  return labels[value] ?? `${value} darbuotojų (viešo šaltinio grupė)`;
}

function approvedReviewCountLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return `${count} patvirtintų atsiliepimų`;
  if (last === 0) return `${count} patvirtintų atsiliepimų`;
  if (last === 1) return `${count} patvirtintas atsiliepimas`;
  return `${count} patvirtinti atsiliepimai`;
}

function formatReviewDate(value: string | null | undefined): { iso: string; label: string } | null {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return {
    iso: date.toISOString(),
    label: new Intl.DateTimeFormat('lt-LT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date),
  };
}

function getRegistryCheckedDate(value: string | null | undefined): { iso: string; label: string } | null {
  const iso = value?.trim() ?? '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return {
    iso,
    label: new Intl.DateTimeFormat('lt-LT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date),
  };
}

function getSourceCollectionDate(value: string | null | undefined): { iso: string; label: string } | null {
  const rawValue = value?.trim() ?? '';
  const datePart = /^(\d{4}-\d{2}-\d{2})/.exec(rawValue)?.[1];
  if (!datePart) return null;
  const formatted = getRegistryCheckedDate(datePart);
  if (!formatted) return null;
  return { iso: rawValue, label: formatted.label };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function readBrowseState(): BrowseState {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get('q')?.trim() ?? '',
    category: params.get('kategorija') ?? '',
    city: params.get('miestas') ?? '',
    region: params.get('regionas') ?? '',
    employeeBand: params.get('dydis') ?? '',
    foundedPeriod: params.get('ikurta') ?? '',
    registryCheckedOnly: params.get('registras') === 'patikrinta',
  };
}

function syncBrowseState(mode: 'push' | 'replace'): void {
  const params = new URLSearchParams();
  if (browseState.query) params.set('q', browseState.query);
  if (browseState.category) params.set('kategorija', browseState.category);
  if (browseState.city) params.set('miestas', browseState.city);
  if (browseState.region) params.set('regionas', browseState.region);
  if (browseState.employeeBand) params.set('dydis', browseState.employeeBand);
  if (browseState.foundedPeriod) params.set('ikurta', browseState.foundedPeriod);
  if (browseState.registryCheckedOnly) params.set('registras', 'patikrinta');

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl === currentUrl) return;
  window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', nextUrl);
}

function normalizePathname(pathname = window.location.pathname): string {
  return pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
}

function isContractPath(pathname = window.location.pathname): boolean {
  return normalizePathname(pathname) === '/gidas/baldu-pirkimo-sutarties-sablonas';
}

function isGuidePath(pathname = window.location.pathname): boolean {
  const path = normalizePathname(pathname);
  return path === '/gidas' || path.startsWith('/gidas/');
}

function isLandingPath(pathname = window.location.pathname): boolean {
  return normalizePathname(pathname).startsWith('/baldai-pagal-uzsakyma/');
}

function isRequestPath(pathname = window.location.pathname): boolean {
  return normalizePathname(pathname) === '/gauti-pasiulymus';
}

function isComparisonPath(pathname = window.location.pathname): boolean {
  return normalizePathname(pathname) === '/palyginti-pasiulymus';
}

function isEstimatorPath(pathname = window.location.pathname): boolean {
  return normalizePathname(pathname) === ESTIMATOR_PATH;
}

function getPolicyPage(pathname = window.location.pathname): PolicyPage | undefined {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return policyPages.find((page) => page.path === normalizedPath);
}

function isPolicyPath(pathname = window.location.pathname): boolean {
  return Boolean(getPolicyPage(pathname));
}

function isOpenDataPath(pathname = window.location.pathname): boolean {
  return normalizePathname(pathname) === '/atviri-duomenys';
}

function isMarketOverviewPath(pathname = window.location.pathname): boolean {
  return normalizePathname(pathname) === '/baldu-rinkos-apzvalga';
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
    asStringArray(record.category_codes).forEach((code, index) => {
      const label = asStringArray(record.category_labels)[index];
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
  categories: FilterOption[] = [],
  cities: FilterOption[] = [],
  regions: FilterOption[] = [],
  includeDirectoryFilters = true,
): void {
  const hasValue = (options: FilterOption[], value: string) => options.some((option) => option.value === value);
  let changed = false;

  if (includeDirectoryFilters && browseState.category && !hasValue(categories, browseState.category)) {
    browseState.category = '';
    changed = true;
  }
  if (includeDirectoryFilters && browseState.city && !hasValue(cities, browseState.city)) {
    browseState.city = '';
    changed = true;
  }
  if (includeDirectoryFilters && browseState.region && !hasValue(regions, browseState.region)) {
    browseState.region = '';
    changed = true;
  }
  if (browseState.employeeBand && !hasValue(EMPLOYEE_BAND_OPTIONS, browseState.employeeBand)) {
    browseState.employeeBand = '';
    changed = true;
  }
  if (browseState.foundedPeriod && !hasValue(FOUNDED_PERIOD_OPTIONS, browseState.foundedPeriod)) {
    browseState.foundedPeriod = '';
    changed = true;
  }

  if (changed) syncBrowseState('replace');
}

function recordMatchesFoundedPeriod(year: number | null | undefined, period: string): boolean {
  if (!period) return true;
  if (!Number.isInteger(year)) return false;
  if (period === 'iki-1999') return Number(year) <= 1999;
  if (period === '2000-2009') return Number(year) >= 2000 && Number(year) <= 2009;
  if (period === '2010-2019') return Number(year) >= 2010 && Number(year) <= 2019;
  if (period === 'nuo-2020') return Number(year) >= 2020;
  return false;
}

function isRegistryChecked(record: Manufacturer): boolean {
  return normalize(record.financial_verification_status ?? '') === 'patikrinta';
}

function getFilteredManufacturers(records: Manufacturer[], includeDirectoryFilters = true): Manufacturer[] {
  const query = normalize(browseState.query);

  return records.filter((record) => {
    const matchesQuery =
      !query ||
      [
        record.trading_name,
        record.legal_name ?? '',
        record.source_identity,
        record.description_lt,
        ...asStringArray(record.category_labels),
        ...asStringArray(record.category_codes),
      ].some((value) => normalize(value ?? '').includes(query));

    const matchesCategory =
      !includeDirectoryFilters || !browseState.category || asStringArray(record.category_codes).includes(browseState.category);
    const matchesCity = !includeDirectoryFilters || !browseState.city || record.city === browseState.city;
    const matchesRegion = !includeDirectoryFilters || !browseState.region || record.region === browseState.region;
    const matchesEmployeeBand = !browseState.employeeBand || record.employee_count_band?.trim() === browseState.employeeBand;
    const matchesFoundedPeriod = recordMatchesFoundedPeriod(record.founded_year, browseState.foundedPeriod);
    const matchesRegistryStatus = !browseState.registryCheckedOnly || isRegistryChecked(record);

    return matchesQuery && matchesCategory && matchesCity && matchesRegion && matchesEmployeeBand && matchesFoundedPeriod && matchesRegistryStatus;
  });
}

function hasAdvancedFilters(): boolean {
  return Boolean(browseState.employeeBand || browseState.foundedPeriod || browseState.registryCheckedOnly);
}

function resetBrowseState(): void {
  browseState = {
    query: '',
    category: '',
    city: '',
    region: '',
    employeeBand: '',
    foundedPeriod: '',
    registryCheckedOnly: false,
  };
}

function formatManufacturerCount(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return `${count} gamintojų kandidatų`;
  if (last === 1) return `${count} gamintojas kandidatas`;
  if (last >= 2 && last <= 9) return `${count} gamintojai kandidatai`;
  return `${count} gamintojų kandidatų`;
}

function getActiveBrowseFilterLabels(): string[] {
  const findLabel = (options: FilterOption[], value: string): string =>
    options.find((option) => option.value === value)?.label ?? value;
  const labels: string[] = [];
  if (browseState.query) labels.push(`Paieška: „${browseState.query}“`);
  if (browseState.category) labels.push(`Kategorija: ${findLabel(getCategoryOptions(manufacturers), browseState.category)}`);
  if (browseState.city) labels.push(`Miestas: ${findLabel(getOptions(manufacturers, 'city', 'city'), browseState.city)}`);
  if (browseState.region) labels.push(`Regiono grupė: ${findLabel(getOptions(manufacturers, 'region', 'region_label'), browseState.region)}`);
  if (browseState.employeeBand) labels.push(`Įmonės dydis: ${findLabel(EMPLOYEE_BAND_OPTIONS, browseState.employeeBand)}`);
  if (browseState.foundedPeriod) labels.push(`Įkurta: ${findLabel(FOUNDED_PERIOD_OPTIONS, browseState.foundedPeriod)}`);
  if (browseState.registryCheckedOnly) labels.push('Registro duomenys patikrinti');
  return labels;
}

function distinctLegalName(record: Manufacturer): string {
  const legal = record.legal_name?.trim() ?? '';
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

function renderHeader(active: HeaderSection): string {
  const activeLabel: Record<HeaderSection, string> = {
    directory: 'Katalogas',
    request: 'Projekto užklausa',
    guide: 'Pirkėjo gidas',
    policy: 'Informacija',
    overview: 'Rinkos apžvalga',
  };
  return `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" data-internal-link="true" aria-label="Baldai pagal užsakymą Lietuvoje – pradžia">
          <span class="brand-mark" aria-hidden="true">
            <img src="${baldininkaiLogoUrl}" alt="" width="44" height="44" />
          </span>
          <span>Baldai pagal užsakymą <strong>Lietuvoje</strong></span>
        </a>
        <button class="navigation-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Atverti pagrindinį meniu. Dabartinis skyrius: ${activeLabel[active]}">
          <span class="navigation-toggle-label">Meniu</span>
          <span class="navigation-current">${activeLabel[active]}</span>
          <span class="navigation-toggle-icon" aria-hidden="true"></span>
        </button>
        <nav class="primary-navigation" id="primary-navigation" aria-label="Pagrindinė navigacija">
          <a href="/" data-internal-link="true"${active === 'directory' ? ' aria-current="page"' : ''}>Katalogas</a>
          <a href="/baldu-rinkos-apzvalga"${active === 'overview' ? ' aria-current="page"' : ''}>Rinkos apžvalga</a>
          <a href="/gauti-pasiulymus" data-internal-link="true"${active === 'request' ? ' aria-current="page"' : ''}>Projekto užklausa</a>
          <a href="/gidas" data-internal-link="true"${active === 'guide' ? ' aria-current="page"' : ''}>Pirkėjo gidas</a>
          <a href="/gidas#pirkejo-irankiai">Pirkėjo įrankiai</a>
        </nav>
      </div>
    </header>
  `;
}

function renderFooter(): string {
  return `
    <footer>
      <div class="footer-inner">
        <div class="footer-summary">
          <p>Viešų šaltinių katalogas savarankiškai gamintojų paieškai. Įrašai nepatvirtinti ir nėra kokybės ar prieinamumo garantija.</p>
          <p>Valdytojas: GG Ventures UAB, įmonės kodas 305442420 · <a href="mailto:info@baldininkai.org">info@baldininkai.org</a></p>
        </div>
        <nav aria-label="Poraštės navigacija">
          <a href="/baldai-pagal-uzsakyma/miestai/">Visi miestai</a>
          <a href="/baldu-rinkos-apzvalga">Rinkos apžvalga</a>
          <a href="/gauti-pasiulymus" data-internal-link="true">Projekto užklausa</a>
          <a href="/gidas" data-internal-link="true">Pirkėjo gidas</a>
          <a href="/baldu-kainos-skaiciuokle" data-internal-link="true">Kainos skaičiuoklė</a>
          <a href="/gidas/baldu-pirkimo-sutarties-sablonas" data-internal-link="true">Sutarties šablonas</a>
          <a href="/palyginti-pasiulymus" data-internal-link="true">Pasiūlymų palyginimas</a>
          <a href="/atviri-duomenys">Atviri duomenys</a>
          <a href="/privatumas" data-internal-link="true">Privatumas</a>
          <a href="/naudojimosi-salygos" data-internal-link="true">Naudojimosi sąlygos</a>
          <a href="/slapukai" data-internal-link="true">Slapukai</a>
          <a href="/atsiliepimu-taisykles" data-internal-link="true">Atsiliepimų taisyklės</a>
          <a href="/irasyti-pataisyma" data-internal-link="true">Įrašo pataisymas</a>
        </nav>
      </div>
    </footer>
  `;
}

function getContextualGuide(record: Manufacturer): { slug: string; label: string } {
  const codes = new Set(asStringArray(record.category_codes));
  if (codes.has('W')) return { slug: 'spintos-ir-drabuzines-kaina', label: 'Spintų ir drabužinių kainos bei apimties klausimai' };
  if (codes.has('K')) return { slug: 'kvarcas-ar-akmuo-stalvirsiui', label: 'Stalviršio medžiagos ir apimties klausimai' };
  if (codes.has('OC') || codes.has('HR')) return { slug: 'matavimas-ir-montavimas-kontrole', label: 'Matavimo ir montavimo kontrolinis sąrašas' };
  if (codes.has('SW')) return { slug: 'mdf-faneruote-masyvas-fasadai', label: 'Medžiagų ir apdailos klausimai' };
  return { slug: 'matavimas-ir-montavimas-kontrole', label: 'Matavimo ir montavimo kontrolinis sąrašas' };
}

function getProfileLandingLinks(record: Manufacturer): ProfileLandingLink[] {
  const links: ProfileLandingLink[] = [];
  const city = record.city?.trim();
  const eligibleCity = city
    ? getLandingCities(manufacturers).find((entry) => entry.city === city)
    : undefined;

  if (eligibleCity) {
    links.push({
      kind: 'Miestas',
      slug: eligibleCity.slug,
      label: `Baldų gamintojų kandidatai: ${eligibleCity.city}`,
    });
  }

  const categoryCodes = new Set(asStringArray(record.category_codes));
  CATEGORY_LANDINGS.forEach((category) => {
    if (categoryCodes.has(category.code)) {
      links.push({ kind: 'Kategorija', slug: category.slug, label: category.title });
    }
  });

  return links;
}

function createProfileLandingSection(record: Manufacturer): HTMLElement | null {
  const links = getProfileLandingLinks(record);
  if (!links.length) return null;

  const section = document.createElement('section');
  section.className = 'profile-landings';
  section.setAttribute('aria-labelledby', 'profile-landings-title');
  section.innerHTML = `
    <div class="section-heading">
      <h2 id="profile-landings-title">Toliau naršykite pagal šį įrašą</h2>
      <p>Kategorijų nuorodos atitinka šiame įraše užfiksuotas šaltinių žymas. Miesto puslapis rodomas tik tada, kai kataloge jam yra pakankamai įrašų.</p>
    </div>
    <nav aria-label="Susiję katalogo puslapiai">
      <ul class="profile-landing-links">
        ${links.map((link) => `
          <li>
            <span class="profile-landing-kind">${link.kind}</span>
            <a href="/baldai-pagal-uzsakyma/${link.slug}" data-internal-link="true">${escapeHtml(link.label)} <span aria-hidden="true">→</span></a>
          </li>
        `).join('')}
      </ul>
    </nav>
  `;
  return section;
}

function renderLandingDirectory(): string {
  const cities = getLandingCities(manufacturers);
  return `
    <section class="landing-directory" aria-labelledby="landing-directory-title">
      <div class="section-heading">
        <p class="kicker">Parengti paieškos puslapiai</p>
        <h2 id="landing-directory-title">Naršykite pagal baldų rūšį arba miestą</h2>
        <p>Šiuose puslapiuose rodomi tik versijuotame šaltinių rinkinyje atitinkamą žymą ar miestą turintys nepatvirtinti kandidatai. <a href="/baldai-pagal-uzsakyma/miestai/">Atverkite visų katalogo vietovių rodyklę</a>.</p>
      </div>
      <div class="landing-link-groups">
        <div>
          <h3>Pagal baldų rūšį</h3>
          <ul>
            ${CATEGORY_LANDINGS.map((category) => `<li><a href="/baldai-pagal-uzsakyma/${category.slug}" data-internal-link="true">${escapeHtml(category.title)}</a></li>`).join('')}
          </ul>
        </div>
        ${cities.length ? `
          <div>
            <h3>Pagal šaltinyje nurodytą miestą</h3>
            <ul>
              ${cities.map((city) => `<li><a href="/baldai-pagal-uzsakyma/${city.slug}" data-internal-link="true">Baldų gamintojų kandidatai: ${escapeHtml(city.city)} (${city.count})</a></li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </section>
  `;
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

function createRegistryToggle(id: string): HTMLDivElement {
  const field = document.createElement('div');
  field.className = 'filter-toggle';
  const input = document.createElement('input');
  input.id = id;
  input.name = id;
  input.type = 'checkbox';
  input.checked = browseState.registryCheckedOnly;
  const label = document.createElement('label');
  label.htmlFor = id;
  const title = document.createElement('strong');
  title.textContent = 'Tik patikrinti registro duomenys';
  const hint = document.createElement('span');
  hint.textContent = 'Tai duomenų būsenos žyma, ne kokybės ar prieinamumo garantija.';
  label.append(title, hint);
  field.append(input, label);
  return field;
}

function createAdvancedFilterFields(prefix: string): {
  fields: HTMLDivElement;
  employeeBandSelect: HTMLSelectElement;
  foundedPeriodSelect: HTMLSelectElement;
  registryToggle: HTMLInputElement;
} {
  const fields = document.createElement('div');
  fields.className = 'filter-grid filter-grid--advanced';
  const employeeField = createSelect(
    `${prefix}-size-filter`,
    'Įmonės dydis',
    'Visi darbuotojų skaičiai',
    EMPLOYEE_BAND_OPTIONS,
    browseState.employeeBand,
  );
  const foundedField = createSelect(
    `${prefix}-founded-filter`,
    'Įkūrimo laikotarpis',
    'Visi įkūrimo metai',
    FOUNDED_PERIOD_OPTIONS,
    browseState.foundedPeriod,
  );
  const registryField = createRegistryToggle(`${prefix}-registry-filter`);
  fields.append(employeeField, foundedField, registryField);
  return {
    fields,
    employeeBandSelect: employeeField.querySelector('select') as HTMLSelectElement,
    foundedPeriodSelect: foundedField.querySelector('select') as HTMLSelectElement,
    registryToggle: registryField.querySelector('input') as HTMLInputElement,
  };
}

function createRegistryCardStatus(record: Manufacturer): HTMLElement | null {
  if (!isRegistryChecked(record)) return null;
  const status = document.createElement('p');
  status.className = 'registry-card-status';
  const marker = document.createElement('span');
  marker.className = 'registry-check-mark';
  marker.setAttribute('aria-hidden', 'true');
  const label = document.createElement('strong');
  label.textContent = 'Registro duomenys patikrinti';
  status.append(marker, label);
  const checkedDate = getRegistryCheckedDate(record.verified_at);
  if (checkedDate) {
    const separator = document.createTextNode(' · ');
    const time = document.createElement('time');
    time.dateTime = checkedDate.iso;
    time.textContent = checkedDate.label;
    status.append(separator, time);
  }
  return status;
}

function createManufacturerCard(record: Manufacturer): HTMLElement {
  const article = document.createElement('article');
  article.className = 'manufacturer-card';

  const headingGroup = document.createElement('div');
  headingGroup.className = 'card-heading';

  const heading = document.createElement('h3');
  heading.textContent = textOrUnknown(record.trading_name, 'Pavadinimas nenurodytas');

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
  city.textContent = textOrUnknown(record.city, 'Miestas nenurodytas');
  const separator = document.createElement('span');
  separator.setAttribute('aria-hidden', 'true');
  separator.textContent = ' · ';
  const region = document.createElement('span');
  region.textContent = `Regiono grupė: ${textOrUnknown(record.region_label, 'nenurodyta')}`;
  location.append(city, separator, region);

  const description = document.createElement('p');
  description.className = record.description_lt?.trim() ? 'description' : 'description description--fallback';
  description.textContent = textOrUnknown(record.description_lt, 'Trumpas aprašymas šaltiniuose nepateiktas.');

  const categories = document.createElement('ul');
  categories.className = 'category-list';
  categories.setAttribute('aria-label', 'Gaminamų baldų kategorijos');
  const categoryLabels = asStringArray(record.category_labels);
  (categoryLabels.length ? categoryLabels : ['Kategorijos šaltiniuose nenurodytos']).forEach((label) => {
    const item = document.createElement('li');
    item.textContent = label;
    categories.append(item);
  });

  const link = document.createElement('a');
  link.className = 'profile-link';
  link.href = `/gamintojas/${encodeURIComponent(record.slug)}${window.location.search}`;
  link.dataset.internalLink = 'true';
  link.textContent = 'Peržiūrėti katalogo įrašą';
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = ' →';
  link.append(arrow);

  article.append(headingGroup);
  const registryStatus = createRegistryCardStatus(record);
  if (registryStatus) article.append(registryStatus);
  article.append(location, description, categories, link);
  return article;
}

function renderShell(): void {
  if (!root) return;
  root.innerHTML = `
    ${renderHeader('directory')}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="kicker">Viešas paieškos katalogas</p>
          <h1 id="page-title">Raskite baldų gamintojus pagal poreikį ir vietą</h1>
          <p class="lead">Pradėkite nuo baldų rūšies ir miesto. Rezultatus galėsite tikslinti pagal pavadinimą, įmonės duomenis ir kitus katalogo kriterijus.</p>
          <div class="intro-actions">
            <a class="primary-button primary-button--light" href="/baldu-kainos-skaiciuokle" data-internal-link="true">Apskaičiuoti preliminarią kainą</a>
            <a class="intro-secondary-link" href="/gauti-pasiulymus" data-internal-link="true">Jau turite projekto aprašymą? Pateikti užklausą →</a>
            <a class="intro-guide-link" href="/gidas" data-internal-link="true">Kaip atrinkti ir palyginti gamintojus →</a>
          </div>
        </div>
        <div class="home-search-panel" aria-labelledby="home-search-title">
          <div class="home-search-heading">
            <h2 id="home-search-title">Ko ieškote?</h2>
            <p>Pasirinkite poreikį ir vietą — katalogas atsinaujins iškart.</p>
          </div>
          <div id="home-filter-controls"></div>
          <aside id="apie-kataloga">
            <details class="directory-note">
              <summary>Ką svarbu žinoti apie katalogą</summary>
              <p>Tai iš viešų šaltinių sudarytas, nepatvirtintų kandidatų katalogas. Įrašai nėra kokybės, užimtumo ar meistrystės garantija, todėl informaciją ir pasiūlymus įvertinkite savarankiškai.</p>
            </details>
          </aside>
        </div>
      </section>
      <section class="browse-section" id="gamintojai" aria-labelledby="browse-results-title">
        <h2 class="visually-hidden" id="browse-results-title">Gamintojų katalogo rezultatai</h2>
        <div id="browse-content"></div>
      </section>
      ${renderLandingDirectory()}
    </main>
    ${renderFooter()}
  `;
}

function renderLoading(): void {
  const container = document.querySelector<HTMLElement>('#browse-content');
  if (!container) return;
  container.innerHTML = `
    <div class="loading-state" role="status" aria-live="polite">
      <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <div>
        <h2>Kraunamas gamintojų katalogas</h2>
        <p>Gaunami naujausi viešo šaltinio įrašai…</p>
      </div>
    </div>
  `;
}

function renderDirectoryError(): void {
  if (!root) return;
  setPageMetadata({
    title: 'Katalogas nepasiekiamas | Baldai pagal užsakymą Lietuvoje',
    description: 'Gamintojų katalogo duomenų šiuo metu nepavyko gauti.',
    path: window.location.pathname,
    robots: 'noindex, follow',
  });
  root.innerHTML = `
    ${renderHeader('directory')}
    <main class="profile-main">
      <section class="message-state message-state--error" role="alert">
        <p class="state-label">Duomenų gauti nepavyko</p>
        <h1>Katalogas šiuo metu nepasiekiamas</h1>
        <p>Patikrinkite interneto ryšį ir bandykite dar kartą. Pirkėjo gidas veikia nepriklausomai nuo katalogo duomenų.</p>
        <div class="state-actions">
          <button class="primary-button" id="retry-button" type="button">Bandyti dar kartą</button>
          <a href="/gidas" data-internal-link="true">Atverti pirkėjo gidą</a>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;
  document.querySelector<HTMLButtonElement>('#retry-button')?.addEventListener('click', () => void loadDirectory());
}

function renderBrowse(): void {
  const controlsHost = document.querySelector<HTMLElement>('#home-filter-controls');
  const container = document.querySelector<HTMLElement>('#browse-content');
  if (!controlsHost || !container) return;

  const categoryOptions = getCategoryOptions(manufacturers);
  const cityOptions = getOptions(manufacturers, 'city', 'city');
  const regionOptions = getOptions(manufacturers, 'region', 'region_label');
  validateBrowseState(categoryOptions, cityOptions, regionOptions);

  controlsHost.replaceChildren();
  container.replaceChildren();

  const controls = document.createElement('div');
  controls.className = 'browse-controls';

  const form = document.createElement('form');
  form.className = 'filter-form';
  form.setAttribute('role', 'search');
  form.setAttribute('aria-label', 'Gamintojų katalogo paieška');

  const searchField = document.createElement('div');
  searchField.className = 'filter-field filter-field--search';
  const searchLabel = document.createElement('label');
  searchLabel.htmlFor = 'directory-search';
  searchLabel.textContent = 'Poreikis arba pavadinimas';
  const searchInput = document.createElement('input');
  searchInput.id = 'directory-search';
  searchInput.name = 'paieska';
  searchInput.type = 'search';
  searchInput.autocomplete = 'off';
  searchInput.placeholder = 'Pvz., virtuvės baldai arba įmonės pavadinimas';
  searchInput.value = browseState.query;
  searchField.append(searchLabel, searchInput);

  const fields = document.createElement('div');
  fields.className = 'filter-grid filter-grid--primary';
  fields.append(
    searchField,
    createSelect('category-filter', 'Baldų kategorija', 'Visos kategorijos', categoryOptions, browseState.category),
    createSelect('city-filter', 'Miestas', 'Visi miestai', cityOptions, browseState.city),
  );

  const advancedControls = createAdvancedFilterFields('directory');
  const advancedDetails = document.createElement('details');
  advancedDetails.className = 'advanced-filters';
  advancedDetails.open = Boolean(browseState.region || hasAdvancedFilters());
  const advancedSummary = document.createElement('summary');
  const advancedSummaryLabel = document.createElement('span');
  advancedSummaryLabel.textContent = 'Daugiau filtrų';
  const advancedSummaryStatus = document.createElement('span');
  advancedSummaryStatus.className = 'advanced-filter-status';
  advancedSummary.append(advancedSummaryLabel, advancedSummaryStatus);
  const advancedFields = document.createElement('div');
  advancedFields.className = 'filter-grid filter-grid--advanced';
  advancedFields.append(
    createSelect('region-filter', 'Šaltinio regiono grupė', 'Visos regiono grupės', regionOptions, browseState.region),
    ...Array.from(advancedControls.fields.children),
  );
  advancedDetails.append(advancedSummary, advancedFields);

  const filterActions = document.createElement('div');
  filterActions.className = 'filter-actions';
  const showResultsButton = document.createElement('button');
  showResultsButton.className = 'primary-button home-search-submit';
  showResultsButton.type = 'submit';
  showResultsButton.textContent = 'Rodyti gamintojus';
  const clearButton = document.createElement('button');
  clearButton.className = 'text-button';
  clearButton.id = 'clear-filters';
  clearButton.type = 'button';
  clearButton.textContent = 'Išvalyti filtrus';
  filterActions.append(showResultsButton, clearButton);

  form.append(fields, advancedDetails, filterActions);
  controls.append(form);

  const results = document.createElement('div');
  results.className = 'results-area';
  results.id = 'results-area';

  controlsHost.append(controls);
  container.append(results);

  const updateAdvancedSummary = (): void => {
    const count = [browseState.region, browseState.employeeBand, browseState.foundedPeriod]
      .filter(Boolean).length + (browseState.registryCheckedOnly ? 1 : 0);
    advancedSummaryStatus.textContent = count ? `${count} pasirinkta` : 'Nebūtina';
  };
  updateAdvancedSummary();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const resultCount = document.querySelector<HTMLElement>('.result-count');
    document.querySelector<HTMLElement>('#gamintojai')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    resultCount?.focus({ preventScroll: true });
  });

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
    updateAdvancedSummary();
    renderResults();
  });
  advancedControls.employeeBandSelect.addEventListener('change', () => {
    browseState.employeeBand = advancedControls.employeeBandSelect.value;
    syncBrowseState('push');
    updateAdvancedSummary();
    renderResults();
  });
  advancedControls.foundedPeriodSelect.addEventListener('change', () => {
    browseState.foundedPeriod = advancedControls.foundedPeriodSelect.value;
    syncBrowseState('push');
    updateAdvancedSummary();
    renderResults();
  });
  advancedControls.registryToggle.addEventListener('change', () => {
    browseState.registryCheckedOnly = advancedControls.registryToggle.checked;
    syncBrowseState('push');
    updateAdvancedSummary();
    renderResults();
  });
  clearButton.addEventListener('click', () => {
    resetBrowseState();
    syncBrowseState('push');
    renderBrowse();
    document.querySelector<HTMLInputElement>('#directory-search')?.focus();
  });

  renderResults();
}

function renderResults(): void {
  const results = document.querySelector<HTMLElement>('#results-area');
  if (!results) return;

  if (window.location.pathname === '/') setHomeMetadata();
  const filtered = getFilteredManufacturers(manufacturers);
  const hasFilters = Boolean(
    browseState.query || browseState.category || browseState.city || browseState.region || hasAdvancedFilters(),
  );

  results.replaceChildren();

  const resultHeader = document.createElement('div');
  resultHeader.className = 'result-header';
  const count = document.createElement('p');
  count.className = 'result-count';
  count.tabIndex = -1;
  count.setAttribute('role', 'status');
  count.setAttribute('aria-live', 'polite');
  count.textContent = hasFilters
    ? `Rodoma įrašų: ${filtered.length}. Iš viso kataloge: ${manufacturers.length}.`
    : `Kataloge – ${formatManufacturerCount(manufacturers.length)}.`;
  resultHeader.append(count);

  if (hasFilters) {
    const active = document.createElement('ul');
    active.className = 'active-filters';
    active.setAttribute('aria-label', 'Aktyvūs paieškos kriterijai');
    getActiveBrowseFilterLabels().forEach((label) => {
      const item = document.createElement('li');
      item.textContent = label;
      active.append(item);
    });
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
      resetBrowseState();
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

function createFactRow(term: string, detail: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  dd.textContent = detail;
  wrapper.append(dt, dd);
  return wrapper;
}

function createOptionalFactRow(
  term: string,
  value: string | null | undefined,
  unknown = 'Viešuose šaltiniuose nenurodyta.',
): HTMLDivElement {
  const normalizedValue = value?.trim() ?? '';
  const row = createFactRow(term, normalizedValue || unknown);
  if (!normalizedValue) row.querySelector('dd')?.classList.add('unknown-value');
  return row;
}

function getPublishedTurnover(record: Manufacturer): { amount: number; year: number; sourceUrl: string } | null {
  const amount = record.revenue_eur_latest;
  const year = record.revenue_year;
  const sourceValue = record.financial_source_url?.trim();
  let sourceUrl = '';

  if (sourceValue) {
    try {
      const url = new URL(sourceValue);
      if (url.protocol === 'https:' || url.protocol === 'http:') sourceUrl = url.href;
    } catch {
      sourceUrl = '';
    }
  }

  if (
    record.revenue_availability !== 'paskelbta'
    || !Number.isFinite(amount)
    || Number(amount) <= 0
    || !Number.isInteger(year)
    || record.financial_verification_status !== 'patikrinta'
    || !getRegistryCheckedDate(record.verified_at)
    || !sourceUrl
  ) return null;

  return { amount: Number(amount), year: Number(year), sourceUrl };
}

function createTurnoverFactRow(amount: number, year: number, sourceUrl: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = `Apyvarta (${year} m.)`;
  const dd = document.createElement('dd');
  const value = document.createElement('strong');
  value.textContent = new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
  const explanation = document.createElement('p');
  explanation.className = 'fact-explanation';
  explanation.textContent = 'Tai viešame įmonės įraše paskelbta apyvarta už nurodytus finansinius metus. Ji nepatvirtina gamintojo kokybės, dabartinio užimtumo ar galimybės priimti jūsų projektą.';
  const sourceLink = document.createElement('a');
  sourceLink.href = sourceUrl;
  sourceLink.target = '_blank';
  sourceLink.rel = 'noopener noreferrer';
  sourceLink.textContent = 'Atverti apyvartos šaltinį';
  dd.append(value, explanation, sourceLink);
  wrapper.append(dt, dd);
  return wrapper;
}

function createEmployeeSizeFactRow(record: Manufacturer, employeeCountBand: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = 'Įmonės dydžio signalas';
  const dd = document.createElement('dd');
  const label = document.createElement('strong');
  label.textContent = employeeBandLabel(employeeCountBand);
  const explanation = document.createElement('p');
  explanation.className = 'fact-explanation';
  explanation.textContent = 'Tai viešame įmonės įraše nurodyta darbuotojų skaičiaus grupė. Ji neparodo darbų kokybės, dabartinio užimtumo ar galimybės priimti jūsų projektą.';
  dd.append(label, explanation);

  const sources = asStringArray(record.public_details_source_urls).filter((url) => url.includes('rekvizitai.vz.lt'));
  if (sources.length) {
    const sourceList = document.createElement('ul');
    sourceList.className = 'fact-source-list';
    sources.forEach((url, index) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = sources.length === 1 ? 'Atverti viešą darbuotojų skaičiaus šaltinį' : `Atverti viešą šaltinį ${index + 1}`;
      item.append(link);
      sourceList.append(item);
    });
    dd.append(sourceList);
  }

  wrapper.append(dt, dd);
  return wrapper;
}

function createUrlFactRow(term: string, value: string | null | undefined): HTMLDivElement {
  const wrapper = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  const url = value?.trim();
  if (url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = url;
    dd.append(link);
  } else {
    dd.textContent = 'Viešuose šaltiniuose nenurodyta.';
    dd.className = 'unknown-value';
  }
  wrapper.append(dt, dd);
  return wrapper;
}

function createTelephoneFactRow(term: string, value: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  const link = document.createElement('a');
  link.href = `tel:${value.replace(/[^+\d]/g, '').replace(/(?!^)\+/g, '')}`;
  link.textContent = value;
  dd.append(link);
  wrapper.append(dt, dd);
  return wrapper;
}

function createPublicDetailsSection(record: Manufacturer): HTMLElement | null {
  const rows: HTMLDivElement[] = [];
  const companyCode = record.company_code?.trim();
  const publicPhone = record.public_phone?.trim();
  const streetAddress = record.street_address?.trim();
  const postcode = record.postcode?.trim();
  const employeeCountBand = record.employee_count_band?.trim();
  const turnover = getPublishedTurnover(record);

  if (companyCode) rows.push(createFactRow('Įmonės kodas', companyCode));
  if (streetAddress) rows.push(createFactRow('Registracijos adresas', streetAddress));
  if (postcode) rows.push(createFactRow('Pašto kodas', postcode));
  if (Number.isInteger(record.founded_year) && Number(record.founded_year) > 0) rows.push(createFactRow('Įkurta', String(record.founded_year)));
  if (turnover) rows.push(createTurnoverFactRow(turnover.amount, turnover.year, turnover.sourceUrl));
  if (employeeCountBand) rows.push(createEmployeeSizeFactRow(record, employeeCountBand));
  if (publicPhone) rows.push(createTelephoneFactRow('Viešas telefono numeris', publicPhone));
  if (!rows.length) return null;

  const section = document.createElement('section');
  section.className = 'profile-details profile-public-details';
  section.setAttribute('aria-labelledby', 'profile-public-details-title');
  section.innerHTML = `
    <div class="section-heading">
      <p class="kicker">Viešuose šaltiniuose patikrinti faktai</p>
      <h2 id="profile-public-details-title">Vieši įmonės duomenys</h2>
      <p>Rodomi tik tie įmonės duomenys, kuriems katalogo rinkinyje yra nurodytas viešas šaltinis. Darbuotojų skaičiaus grupė yra orientacinis viešo įrašo signalas, o ne gamintojo kokybės ar prieinamumo įvertinimas.</p>
    </div>
  `;
  const facts = document.createElement('dl');
  facts.className = 'profile-facts';
  facts.append(...rows);
  section.append(facts);
  return section;
}

function createRegistryVerificationSection(record: Manufacturer): HTMLElement | null {
  if (!isRegistryChecked(record)) return null;
  const section = document.createElement('section');
  section.className = 'profile-registry-status';
  section.setAttribute('aria-labelledby', 'profile-registry-status-title');
  const marker = document.createElement('span');
  marker.className = 'registry-check-mark registry-check-mark--large';
  marker.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('div');
  const heading = document.createElement('h2');
  heading.id = 'profile-registry-status-title';
  heading.textContent = 'Registro duomenys patikrinti';
  const checkedDate = getRegistryCheckedDate(record.verified_at);
  const detail = document.createElement('p');
  if (checkedDate) {
    detail.append('Paskutinė registro duomenų patikra: ');
    const time = document.createElement('time');
    time.dateTime = checkedDate.iso;
    time.textContent = checkedDate.label;
    detail.append(time, '. ');
  } else {
    detail.append('Paskutinės patikros data viešame įraše nenurodyta. ');
  }
  detail.append('Ši žyma nurodo tik registro duomenų peržiūros būseną; ji nepatvirtina darbų kokybės, užimtumo ar paslaugų prieinamumo.');
  copy.append(heading, detail);
  section.append(marker, copy);
  return section;
}

function createProfileOverview(record: Manufacturer): HTMLElement {
  const section = document.createElement('section');
  section.className = 'profile-overview';
  section.setAttribute('aria-labelledby', 'profile-overview-title');

  const heading = document.createElement('div');
  heading.className = 'profile-overview-heading';
  heading.innerHTML = `
    <h2 id="profile-overview-title">Ką apie šį profilį galima įvertinti dabar</h2>
    <p>Santrauka rodo, kurie duomenys pateikti katalogo įraše. Ji nėra kokybės, veiklos ar tapatybės patvirtinimas.</p>
  `;

  const location = record.city?.trim() || record.location?.trim() || '';
  const region = record.region_label?.trim() || '';
  const website = record.website?.trim() || '';
  const contactUrl = record.public_contact_url?.trim() || '';
  const phone = record.public_phone?.trim() || '';
  const contactKinds: string[] = [];
  if (phone) contactKinds.push('telefono numeris');
  if (website) contactKinds.push('svetainė');
  if (contactUrl && contactUrl !== website) contactKinds.push('kontaktų puslapis');

  const coverageChecks = [
    record.legal_name?.trim(),
    record.description_lt?.trim(),
    record.scope_evidence?.trim(),
    location,
    region,
    asStringArray(record.category_labels).length > 0,
    website,
    contactUrl,
    record.company_code?.trim(),
    phone,
    record.street_address?.trim(),
    record.postcode?.trim(),
    Number.isInteger(record.founded_year) && Number(record.founded_year) > 0,
    record.employee_count_band?.trim(),
  ];
  const completedFields = coverageChecks.filter(Boolean).length;
  const collectionDate = getSourceCollectionDate(record.source_collection_date);

  const summary = document.createElement('dl');
  summary.className = 'profile-overview-list';

  const appendSummaryItem = (
    term: string,
    value: string,
    detail: string,
    state: 'present' | 'partial' | 'missing',
    time?: { iso: string; label: string } | null,
  ): void => {
    const item = document.createElement('div');
    item.dataset.state = state;
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    const marker = document.createElement('span');
    marker.className = 'profile-overview-marker';
    marker.setAttribute('aria-hidden', 'true');
    const strong = document.createElement('strong');
    if (time) {
      strong.append(value);
      const timeElement = document.createElement('time');
      timeElement.dateTime = time.iso;
      timeElement.textContent = time.label;
      strong.append(timeElement);
    } else {
      strong.textContent = value;
    }
    const explanation = document.createElement('span');
    explanation.textContent = detail;
    dd.append(marker, strong, explanation);
    item.append(dt, dd);
    summary.append(item);
  };

  appendSummaryItem(
    'Vieta',
    location || (region ? 'Nurodyta tik regiono grupė' : 'Nenurodyta'),
    location
      ? (region ? `Šaltinio regiono grupė: ${region}.` : 'Tai šaltinyje nurodyta vieta, ne aptarnavimo teritorija.')
      : (region || 'Viešuose šaltiniuose vieta nepateikta.'),
    location ? 'present' : (region ? 'partial' : 'missing'),
  );
  appendSummaryItem(
    'Vieši kontaktai',
    contactKinds.length ? `${contactKinds.length} ${contactKinds.length === 1 ? 'kontakto būdas' : 'kontakto būdai'}` : 'Nenurodyta',
    contactKinds.length ? `Kataloge pateikta: ${contactKinds.join(', ')}.` : 'Telefono, svetainės ar atskiros kontaktų nuorodos katalogo laukuose nėra.',
    contactKinds.length ? 'present' : 'missing',
  );
  appendSummaryItem(
    'Duomenų apimtis',
    `${completedFields} iš ${coverageChecks.length} pagrindinių laukų`,
    'Tai katalogo laukų užpildymo, o ne informacijos patikimumo rodiklis.',
    completedFields === coverageChecks.length ? 'present' : (completedFields > 0 ? 'partial' : 'missing'),
  );
  appendSummaryItem(
    'Šaltinių data',
    collectionDate ? 'Surinkta ' : 'Nenurodyta',
    collectionDate ? 'Data rodo šaltinių rinkimo laiką, ne dabartinės veiklos patvirtinimą.' : 'Šaltinių surinkimo data katalogo įraše nepateikta.',
    collectionDate ? 'present' : 'missing',
    collectionDate,
  );

  section.append(heading, summary);
  return section;
}

function createSourceSection(record: Manufacturer): HTMLElement {
  const section = document.createElement('section');
  section.className = 'provenance-section';
  section.setAttribute('aria-labelledby', 'provenance-title');

  const heading = document.createElement('h2');
  heading.id = 'provenance-title';
  heading.textContent = 'Šaltiniai ir duomenų kilmė';

  const copy = document.createElement('p');
  copy.textContent = 'Įrašas sudarytas iš viešai prieinamų šaltinių. Katalogas šių duomenų netvirtino su gamintoju ir negarantuoja jų tikslumo, aktualumo, kokybės ar paslaugų prieinamumo.';

  const sourceUrls = Array.from(
    new Set([
      ...asStringArray(record.source_urls),
      textOrUnknown(record.source_artifact_url, ''),
      ...asStringArray(record.public_details_source_urls),
    ].filter(Boolean)),
  );
  const list = document.createElement('ul');
  list.className = 'source-list';

  if (sourceUrls.length) {
    sourceUrls.forEach((url, index) => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = index === 0 ? 'Viešas šaltinis' : `Papildomas šaltinis ${index + 1}`;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = url;
      item.append(label, link);
      list.append(item);
    });
  } else {
    const item = document.createElement('li');
    item.className = 'unknown-value';
    item.textContent = 'Šaltinio nuoroda viešame įraše nenurodyta.';
    list.append(item);
  }

  const date = document.createElement('p');
  date.className = 'collection-date';
  date.textContent = 'Šaltinių informacija surinkta: ';
  const collectionDate = getSourceCollectionDate(record.source_collection_date);
  if (collectionDate) {
    const time = document.createElement('time');
    time.dateTime = collectionDate.iso;
    time.textContent = collectionDate.label;
    date.append(time);
  } else {
    const unknown = document.createElement('span');
    unknown.className = 'unknown-value';
    unknown.textContent = 'data katalogo įraše nenurodyta';
    date.append(unknown);
  }

  section.append(heading, copy, list, date);
  return section;
}

function createReviewSection(record: Manufacturer): HTMLElement {
  const section = document.createElement('section');
  section.className = 'profile-reviews';
  section.setAttribute('aria-labelledby', 'profile-reviews-title');

  const heading = document.createElement('div');
  heading.className = 'section-heading';
  heading.innerHTML = `
    <p class="kicker">Pirkėjų patirtys</p>
    <h2 id="profile-reviews-title">Atsiliepimai apie šį gamintoją</h2>
    <p>Skelbiami tik moderavimo metu patvirtinti atsiliepimai. Jie yra asmeninės autorių patirtys, o ne katalogo patvirtinimas, kokybės sertifikatas ar rekomendacija.</p>
  `;

  const reviewContent = document.createElement('div');
  reviewContent.className = 'review-content';
  const reviewStatus = document.createElement('p');
  reviewStatus.className = 'review-loading';
  reviewStatus.setAttribute('role', 'status');
  reviewStatus.setAttribute('aria-live', 'polite');
  reviewStatus.textContent = 'Kraunami patvirtinti atsiliepimai…';
  reviewContent.append(reviewStatus);

  const formSection = document.createElement('div');
  formSection.className = 'review-form-section';
  const formHeading = document.createElement('div');
  formHeading.className = 'review-form-heading';
  const formTitle = document.createElement('h3');
  formTitle.id = 'review-form-title';
  formTitle.textContent = 'Pasidalykite naudinga patirtimi';
  const formIntro = document.createElement('p');
  formIntro.textContent = 'Atsiliepimas pirmiausia pateks moderavimui ir nebus paskelbtas iš karto. Rašykite apie konkretų projektą, susitarimų aiškumą, eigą ir rezultatą.';
  formHeading.append(formTitle, formIntro);

  const form = document.createElement('form');
  form.className = 'review-form';
  form.setAttribute('aria-labelledby', 'review-form-title');

  const ratingField = document.createElement('div');
  ratingField.className = 'form-field';
  const ratingLabel = document.createElement('label');
  ratingLabel.htmlFor = 'review-rating';
  ratingLabel.textContent = 'Įvertinimas nuo 1 iki 5 *';
  const ratingWrap = document.createElement('div');
  ratingWrap.className = 'select-wrap';
  const rating = document.createElement('select');
  rating.id = 'review-rating';
  rating.name = 'rating';
  rating.required = true;
  const ratingPlaceholder = document.createElement('option');
  ratingPlaceholder.value = '';
  ratingPlaceholder.textContent = 'Pasirinkite įvertinimą';
  ratingPlaceholder.disabled = true;
  ratingPlaceholder.selected = true;
  rating.append(ratingPlaceholder);
  [
    [5, '5 – labai gerai'],
    [4, '4 – gerai'],
    [3, '3 – vidutiniškai'],
    [2, '2 – prastai'],
    [1, '1 – labai prastai'],
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = String(label);
    rating.append(option);
  });
  ratingWrap.append(rating);
  ratingField.append(ratingLabel, ratingWrap);

  const nameField = document.createElement('div');
  nameField.className = 'form-field';
  const nameLabel = document.createElement('label');
  nameLabel.htmlFor = 'review-display-name';
  nameLabel.textContent = 'Rodomas vardas arba inicialai *';
  const displayName = document.createElement('input');
  displayName.id = 'review-display-name';
  displayName.name = 'display_name';
  displayName.type = 'text';
  displayName.autocomplete = 'name';
  displayName.minLength = 2;
  displayName.maxLength = 80;
  displayName.required = true;
  nameField.append(nameLabel, displayName);

  const projectField = document.createElement('div');
  projectField.className = 'form-field form-field--wide';
  const projectLabel = document.createElement('label');
  projectLabel.htmlFor = 'review-project-type';
  projectLabel.textContent = 'Projekto rūšis (nebūtina)';
  const projectWrap = document.createElement('div');
  projectWrap.className = 'select-wrap';
  const projectType = document.createElement('select');
  projectType.id = 'review-project-type';
  projectType.name = 'project_type';
  const projectPlaceholder = document.createElement('option');
  projectPlaceholder.value = '';
  projectPlaceholder.textContent = 'Nenurodyti';
  projectType.append(projectPlaceholder);
  projectTypeOptions.forEach((label) => {
    const option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    projectType.append(option);
  });
  projectWrap.append(projectType);
  projectField.append(projectLabel, projectWrap);

  const commentField = document.createElement('div');
  commentField.className = 'form-field form-field--wide';
  const commentLabel = document.createElement('label');
  commentLabel.htmlFor = 'review-text';
  commentLabel.textContent = 'Naudingas komentaras *';
  const commentHint = document.createElement('p');
  commentHint.className = 'field-hint';
  commentHint.id = 'review-text-hint';
  commentHint.textContent = `Bent ${REVIEW_TEXT_MIN_LENGTH} ženklų. Nevartokite įžeidimų ir neskelbkite kitų žmonių asmens duomenų.`;
  const comment = document.createElement('textarea');
  comment.id = 'review-text';
  comment.name = 'review_text';
  comment.rows = 6;
  comment.minLength = REVIEW_TEXT_MIN_LENGTH;
  comment.maxLength = REVIEW_TEXT_MAX_LENGTH;
  comment.required = true;
  comment.setAttribute('aria-describedby', 'review-text-hint');
  commentField.append(commentLabel, commentHint, comment);

  const emailField = document.createElement('div');
  emailField.className = 'form-field form-field--wide';
  const emailLabel = document.createElement('label');
  emailLabel.htmlFor = 'review-contact-email';
  emailLabel.textContent = 'Kontaktinis el. paštas *';
  const emailHint = document.createElement('p');
  emailHint.className = 'field-hint';
  emailHint.id = 'review-email-hint';
  emailHint.textContent = 'Naudojamas tik moderavimui ar patikslinimui; viešai nerodomas.';
  const email = document.createElement('input');
  email.id = 'review-contact-email';
  email.name = 'contact_email';
  email.type = 'email';
  email.inputMode = 'email';
  email.autocomplete = 'email';
  email.maxLength = 254;
  email.required = true;
  email.placeholder = 'vardas@pavyzdys.lt';
  email.setAttribute('aria-describedby', 'review-email-hint');
  emailField.append(emailLabel, emailHint, email);

  const honeypotField = document.createElement('div');
  honeypotField.className = 'honeypot-field';
  honeypotField.setAttribute('aria-hidden', 'true');
  const honeypotLabel = document.createElement('label');
  honeypotLabel.htmlFor = 'review-website';
  honeypotLabel.textContent = 'Interneto svetainė';
  const honeypot = document.createElement('input');
  honeypot.id = 'review-website';
  honeypot.name = 'honeypot';
  honeypot.type = 'text';
  honeypot.autocomplete = 'off';
  honeypot.tabIndex = -1;
  honeypot.maxLength = 200;
  honeypotField.append(honeypotLabel, honeypot);

  const actions = document.createElement('div');
  actions.className = 'review-submit form-field--wide';
  const submit = document.createElement('button');
  submit.className = 'primary-button';
  submit.type = 'submit';
  submit.textContent = 'Pateikti moderavimui';
  const formStatus = document.createElement('p');
  formStatus.className = 'form-status';
  formStatus.setAttribute('role', 'status');
  formStatus.setAttribute('aria-live', 'polite');
  formStatus.tabIndex = -1;
  actions.append(submit, formStatus);
  const privacyNote = document.createElement('p');
  privacyNote.className = 'form-privacy-note form-field--wide';
  privacyNote.innerHTML = 'Kontaktinį el. paštą naudosime tik atsiliepimui moderuoti ar patikslinti. Skaitykite <a href="/privatumas" data-internal-link="true">privatumo pranešimą</a> ir <a href="/atsiliepimu-taisykles" data-internal-link="true">atsiliepimų taisykles</a>.';

  form.append(ratingField, nameField, projectField, commentField, emailField, honeypotField, privacyNote, actions);
  formSection.append(formHeading, form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = 'Pateikiama…';
    formStatus.className = 'form-status';
    formStatus.setAttribute('role', 'status');
    formStatus.textContent = 'Atsiliepimas siunčiamas moderavimui.';

    try {
      await pb.collection('manufacturer_reviews').create({
        manufacturer: record.id,
        rating: Number(rating.value),
        display_name: displayName.value.trim(),
        review_text: comment.value.trim(),
        project_type: projectType.value,
        contact_email: email.value.trim(),
        honeypot: honeypot.value,
        status: 'pending',
      });
      form.reset();
      formStatus.className = 'form-status form-status--success';
      formStatus.textContent = 'Ačiū. Atsiliepimas gautas ir bus paskelbtas tik tuo atveju, jei po moderavimo bus patvirtintas.';
      formStatus.focus();
    } catch (error) {
      console.error('Nepavyko pateikti atsiliepimo moderavimui.', error);
      formStatus.className = 'form-status form-status--error';
      formStatus.setAttribute('role', 'alert');
      formStatus.textContent = 'Atsiliepimo pateikti nepavyko. Patikrinkite laukus ir interneto ryšį, tada bandykite dar kartą.';
      formStatus.focus();
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.textContent = 'Pateikti moderavimui';
    }
  });

  void (async () => {
    try {
      const reviews = await pb.collection('manufacturer_reviews').getFullList<ManufacturerReview>({
        filter: pb.filter('manufacturer = {:manufacturer} && status = "approved"', { manufacturer: record.id }),
        sort: '-created',
      });
      reviewContent.replaceChildren();
      if (!reviews.length) {
        const empty = document.createElement('p');
        empty.className = 'review-empty';
        empty.textContent = 'Patvirtintų atsiliepimų dar nėra. Suvestinė bus rodoma tik tada, kai bus bent vienas patvirtintas atsiliepimas.';
        reviewContent.append(empty);
        return;
      }

      const average = reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length;
      const summary = document.createElement('div');
      summary.className = 'review-summary';
      const score = document.createElement('strong');
      score.textContent = `${average.toLocaleString('lt-LT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} iš 5`;
      const count = document.createElement('span');
      count.textContent = approvedReviewCountLabel(reviews.length);
      const caveat = document.createElement('p');
      caveat.textContent = 'Suvestinė apskaičiuota tik iš šiame kataloge patvirtintų atsiliepimų.';
      summary.append(score, count, caveat);

      const list = document.createElement('ol');
      list.className = 'review-list';
      reviews.forEach((review) => {
        const item = document.createElement('li');
        const itemHeader = document.createElement('div');
        itemHeader.className = 'review-item-header';
        const reviewer = document.createElement('strong');
        reviewer.textContent = textOrUnknown(review.display_name, 'Vardas nenurodytas');
        const ratingText = document.createElement('span');
        ratingText.className = 'review-rating';
        ratingText.textContent = `Įvertinimas: ${Number(review.rating)} iš 5`;
        itemHeader.append(reviewer, ratingText);

        const meta = document.createElement('p');
        meta.className = 'review-meta';
        const project = review.project_type?.trim();
        if (project) meta.append(project);
        const date = formatReviewDate(review.created);
        if (date) {
          if (project) meta.append(' · ');
          const time = document.createElement('time');
          time.dateTime = date.iso;
          time.textContent = date.label;
          meta.append(time);
        }

        const text = document.createElement('p');
        text.className = 'review-text';
        text.textContent = review.review_text;
        item.append(itemHeader);
        if (meta.textContent) item.append(meta);
        item.append(text);
        list.append(item);
      });
      reviewContent.append(summary, list);
    } catch (error) {
      console.error('Nepavyko įkelti patvirtintų atsiliepimų.', error);
      reviewContent.replaceChildren();
      const failure = document.createElement('p');
      failure.className = 'review-error';
      failure.setAttribute('role', 'alert');
      failure.textContent = 'Patvirtintų atsiliepimų šiuo metu įkelti nepavyko. Bandykite atnaujinti puslapį vėliau.';
      reviewContent.append(failure);
    }
  })();

  section.append(heading, reviewContent, formSection);
  return section;
}

function createCorrectionSection(record: Manufacturer): HTMLElement {
  const section = document.createElement('section');
  section.className = 'correction-section';
  section.id = 'pataisyti-profili';
  section.setAttribute('aria-labelledby', 'correction-title');
  section.innerHTML = `
    <div class="section-heading correction-heading">
      <p class="kicker">Gamintojams ir jų atstovams</p>
      <h2 id="correction-title">Papildykite arba pataisykite savo profilį</h2>
      <p>Jei atstovaujate šiai įmonei, padėkite pirkėjams rasti tikslesnę informaciją. Nurodykite savo ryšį su įmone ir ką reikia papildyti ar pataisyti. Kiekvieną prašymą peržiūrime prieš viešą pakeitimą.</p>
      <p class="correction-boundary">Ši forma nėra baldų projekto užklausa ir nėra siunčiama kataloge nurodytai įmonei.</p>
    </div>
    <form class="correction-form" aria-labelledby="correction-title" novalidate>
      <p class="form-record-context">Katalogo įrašas: ${escapeHtml(textOrUnknown(record.trading_name, 'Pavadinimas nenurodytas'))}</p>
      <input type="hidden" name="manufacturer_slug" value="${escapeHtml(record.slug)}" />

      <div class="form-field form-field--wide">
        <label for="claim-company-name">Įmonės pavadinimas *</label>
        <input id="claim-company-name" name="company_name" type="text" autocomplete="organization" maxlength="240" value="${escapeHtml(record.trading_name)}" required aria-describedby="claim-company-name-error" />
        <p class="field-error" id="claim-company-name-error"></p>
      </div>

      <div class="form-field">
        <label for="claimant-name">Jūsų vardas ir pavardė *</label>
        <input id="claimant-name" name="claimant_name" type="text" autocomplete="name" minlength="2" maxlength="120" required aria-describedby="claimant-name-error" />
        <p class="field-error" id="claimant-name-error"></p>
      </div>

      <div class="form-field">
        <label for="claimant-role">Pareigos arba ryšys su įmone *</label>
        <input id="claimant-role" name="role" type="text" autocomplete="organization-title" minlength="2" maxlength="160" placeholder="Pvz., savininkas, vadovė, darbuotojas" required aria-describedby="claimant-role-error" />
        <p class="field-error" id="claimant-role-error"></p>
      </div>

      <div class="form-field">
        <label for="claimant-email">Darbinis el. paštas *</label>
        <input id="claimant-email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="vardas@imone.lt" required aria-describedby="claimant-email-hint claimant-email-error" />
        <p class="field-hint" id="claimant-email-hint">Naudosime tik prašymui patikrinti ir dėl jo susisiekti.</p>
        <p class="field-error" id="claimant-email-error"></p>
      </div>

      <div class="form-field">
        <label for="claimant-phone">Telefono numeris (nebūtina)</label>
        <input id="claimant-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" aria-describedby="claimant-phone-error" />
        <p class="field-error" id="claimant-phone-error"></p>
      </div>

      <div class="form-field form-field--wide">
        <label for="claim-message">Ką norite patvirtinti ar pataisyti? *</label>
        <p class="field-hint" id="claim-message-hint">Trumpai aprašykite savo ryšį su įmone ir konkrečius keitimus. Jei galite, pridėkite viešą informaciją, kuri padėtų juos patikrinti.</p>
        <textarea id="claim-message" name="message" rows="7" minlength="10" maxlength="5000" required aria-describedby="claim-message-hint claim-message-error"></textarea>
        <p class="field-error" id="claim-message-error"></p>
      </div>

      <div class="honeypot-field" aria-hidden="true">
        <label for="claim-website">Interneto svetainė</label>
        <input id="claim-website" name="honeypot" type="text" autocomplete="off" tabindex="-1" maxlength="200" />
      </div>

      <div class="consent-field form-field--wide">
        <input id="claim-consent" name="consent" type="checkbox" required aria-describedby="claim-consent-error" />
        <label for="claim-consent">Patvirtinu, kad pateikta informacija yra teisinga, ir sutinku, kad mano kontaktiniai duomenys būtų naudojami šiam prašymui patikrinti. Kaip tvarkome duomenis, paaiškinta <a href="/privatumas" data-internal-link="true">privatumo pranešime</a>. *</label>
        <p class="field-error" id="claim-consent-error"></p>
      </div>

      <div class="form-actions">
        <button class="primary-button" type="submit">Pateikti įrašo peržiūrai</button>
        <p class="form-status" role="status" aria-live="polite" tabindex="-1"></p>
      </div>
    </form>
  `;

  const form = section.querySelector<HTMLFormElement>('form');
  const companyName = section.querySelector<HTMLInputElement>('#claim-company-name');
  const claimantName = section.querySelector<HTMLInputElement>('#claimant-name');
  const role = section.querySelector<HTMLInputElement>('#claimant-role');
  const email = section.querySelector<HTMLInputElement>('#claimant-email');
  const phone = section.querySelector<HTMLInputElement>('#claimant-phone');
  const message = section.querySelector<HTMLTextAreaElement>('#claim-message');
  const consent = section.querySelector<HTMLInputElement>('#claim-consent');
  const honeypot = section.querySelector<HTMLInputElement>('#claim-website');
  const submit = section.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = section.querySelector<HTMLElement>('.form-status');

  if (!form || !companyName || !claimantName || !role || !email || !phone || !message || !consent || !honeypot || !submit || !status) {
    return section;
  }

  const controls = [companyName, claimantName, role, email, phone, message, consent];
  const errorFor = (control: HTMLInputElement | HTMLTextAreaElement): HTMLElement | null => {
    const describedBy = control.getAttribute('aria-describedby')?.split(' ') ?? [];
    const errorId = describedBy.find((id) => id.endsWith('-error'));
    return errorId ? section.querySelector<HTMLElement>(`#${errorId}`) : null;
  };
  const validateControl = (control: HTMLInputElement | HTMLTextAreaElement): boolean => {
    let errorMessage = '';
    if (control === companyName && companyName.value.trim().length < 2) {
      errorMessage = 'Įrašykite įmonės pavadinimą.';
    } else if (control === claimantName && claimantName.value.trim().length < 2) {
      errorMessage = 'Įrašykite savo vardą ir pavardę.';
    } else if (control === role && role.value.trim().length < 2) {
      errorMessage = 'Nurodykite savo pareigas arba ryšį su įmone.';
    } else if (control === email && !email.value.trim()) {
      errorMessage = 'Įrašykite el. pašto adresą.';
    } else if (control === email && email.validity.typeMismatch) {
      errorMessage = 'Įrašykite galiojantį el. pašto adresą.';
    } else if (control === phone && phone.value.trim() && !/^[0-9+().\-\s]+$/.test(phone.value.trim())) {
      errorMessage = 'Telefono numeriui naudokite tik skaitmenis ir įprastus numerio ženklus.';
    } else if (control === message && message.value.trim().length < 10) {
      errorMessage = 'Aprašykite prašymą bent 10 ženklų.';
    } else if (control === consent && !consent.checked) {
      errorMessage = 'Norėdami pateikti prašymą, patvirtinkite šį sutikimą.';
    }

    const error = errorFor(control);
    if (error) error.textContent = errorMessage;
    if (errorMessage) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
    return !errorMessage;
  };

  controls.forEach((control) => {
    control.addEventListener(control === consent ? 'change' : 'blur', () => validateControl(control));
    if (control !== consent) {
      control.addEventListener('input', () => {
        if (control.hasAttribute('aria-invalid')) validateControl(control);
      });
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    let valid = true;
    controls.forEach((control) => {
      if (!validateControl(control)) valid = false;
    });
    if (!valid) {
      status.className = 'form-status form-status--error';
      status.setAttribute('role', 'alert');
      status.textContent = 'Patikrinkite pažymėtus laukus ir bandykite dar kartą.';
      controls.find((control) => control.getAttribute('aria-invalid') === 'true')?.focus();
      return;
    }

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Pateikiama…';
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.textContent = 'Prašymas siunčiamas į katalogo peržiūros eilę.';

    try {
      await pb.collection('manufacturer_claims').create({
        manufacturer_slug: record.slug,
        company_name: companyName.value.trim(),
        claimant_name: claimantName.value.trim(),
        role: role.value.trim(),
        email: email.value.trim().toLocaleLowerCase('lt-LT'),
        phone: phone.value.trim(),
        message: message.value.trim(),
        consent: consent.checked,
        honeypot: honeypot.value,
      });
      form.reset();
      companyName.value = record.trading_name;
      controls.forEach((control) => {
        control.removeAttribute('aria-invalid');
        const fieldError = errorFor(control);
        if (fieldError) fieldError.textContent = '';
      });
      status.className = 'form-status form-status--success';
      status.setAttribute('role', 'status');
      status.textContent = 'Ačiū. Prašymas gautas ir bus patikrintas prieš atliekant bet kokį viešą pakeitimą.';
      status.focus();
    } catch (error) {
      console.error('Nepavyko pateikti gamintojo atstovavimo ar pataisos prašymo.', error);
      status.className = 'form-status form-status--error';
      status.setAttribute('role', 'alert');
      status.textContent = 'Prašymo pateikti nepavyko. Patikrinkite interneto ryšį ir laukus, tada bandykite dar kartą.';
      status.focus();
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      form.removeAttribute('aria-busy');
      submit.textContent = 'Pateikti įrašo peržiūrai';
    }
  });

  return section;
}

function renderFaq(items: { question: string; answer: string }[]): string {
  return `
    <section class="landing-faq" aria-labelledby="landing-faq-title">
      <div class="section-heading">
        <h2 id="landing-faq-title">Dažniausi klausimai</h2>
      </div>
      <dl>
        ${items.map((item) => `<div><dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd></div>`).join('')}
      </dl>
    </section>
  `;
}

function initializeLandingFilters(records: Manufacturer[], updateMetadata: () => void): void {
  const controlsHost = document.querySelector<HTMLElement>('#landing-filter-controls');
  const list = document.querySelector<HTMLElement>('#landing-manufacturer-list');
  if (!controlsHost || !list) return;

  validateBrowseState([], [], [], false);
  controlsHost.replaceChildren();

  const form = document.createElement('form');
  form.className = 'filter-form landing-filter-form';
  form.setAttribute('role', 'search');
  form.addEventListener('submit', (event) => event.preventDefault());

  const searchField = document.createElement('div');
  searchField.className = 'filter-field filter-field--search';
  const searchLabel = document.createElement('label');
  searchLabel.htmlFor = 'landing-search';
  searchLabel.textContent = 'Ieškoti šiame sąraše';
  const searchInput = document.createElement('input');
  searchInput.id = 'landing-search';
  searchInput.name = 'paieska';
  searchInput.type = 'search';
  searchInput.autocomplete = 'off';
  searchInput.placeholder = 'Pavadinimas, aprašymas ar kategorija';
  searchInput.value = browseState.query;
  searchField.append(searchLabel, searchInput);

  const advancedControls = createAdvancedFilterFields('landing');
  const fields = document.createElement('div');
  fields.className = 'filter-grid filter-grid--landing';
  fields.append(searchField, ...Array.from(advancedControls.fields.children));

  const actions = document.createElement('div');
  actions.className = 'filter-actions';
  const resultCount = document.createElement('p');
  resultCount.className = 'landing-filter-count';
  resultCount.setAttribute('role', 'status');
  resultCount.setAttribute('aria-live', 'polite');
  const clearButton = document.createElement('button');
  clearButton.className = 'text-button';
  clearButton.type = 'button';
  clearButton.textContent = 'Išvalyti šio sąrašo filtrus';
  actions.append(resultCount, clearButton);
  form.append(fields, actions);
  controlsHost.append(form);

  const clearFilters = (): void => {
    resetBrowseState();
    syncBrowseState('push');
    searchInput.value = '';
    advancedControls.employeeBandSelect.value = '';
    advancedControls.foundedPeriodSelect.value = '';
    advancedControls.registryToggle.checked = false;
    renderCards();
    searchInput.focus();
  };

  const renderCards = (): void => {
    updateMetadata();
    const filtered = getFilteredManufacturers(records, false);
    const hasFilters = Boolean(browseState.query || hasAdvancedFilters());
    resultCount.textContent = hasFilters
      ? `Rodoma įrašų: ${filtered.length}. Iš viso šiame sąraše: ${records.length}.`
      : `Šiame sąraše – ${formatManufacturerCount(records.length)}.`;
    list.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'message-state landing-empty-state';
      const heading = document.createElement('h3');
      heading.textContent = 'Pagal šiuos kriterijus įrašų nerasta';
      const copy = document.createElement('p');
      copy.textContent = 'Pasirinkite platesnį įmonės dydį ar įkūrimo laikotarpį, pakeiskite paiešką arba išvalykite filtrus.';
      const button = document.createElement('button');
      button.className = 'primary-button';
      button.type = 'button';
      button.textContent = 'Išvalyti šio sąrašo filtrus';
      button.addEventListener('click', clearFilters);
      empty.append(heading, copy, button);
      list.append(empty);
      return;
    }
    filtered.forEach((record) => list.append(createManufacturerCard(record)));
  };

  searchInput.addEventListener('input', () => {
    browseState.query = searchInput.value.trimStart();
    syncBrowseState('replace');
    renderCards();
  });
  advancedControls.employeeBandSelect.addEventListener('change', () => {
    browseState.employeeBand = advancedControls.employeeBandSelect.value;
    syncBrowseState('push');
    renderCards();
  });
  advancedControls.foundedPeriodSelect.addEventListener('change', () => {
    browseState.foundedPeriod = advancedControls.foundedPeriodSelect.value;
    syncBrowseState('push');
    renderCards();
  });
  advancedControls.registryToggle.addEventListener('change', () => {
    browseState.registryCheckedOnly = advancedControls.registryToggle.checked;
    syncBrowseState('push');
    renderCards();
  });
  clearButton.addEventListener('click', clearFilters);
  renderCards();
}

function renderCitiesIndexPage(): void {
  if (!root || root.querySelector('.city-index-main')) return;
  const cities = getAllCities(manufacturers);
  const groups = new Map<string, typeof cities>();
  cities.forEach((city) => {
    const letter = city.city[0].toLocaleUpperCase('lt-LT');
    groups.set(letter, [...(groups.get(letter) ?? []), city]);
  });
  const cityHref = (city: (typeof cities)[number]): string => {
    if (city.count >= 2) return `/baldai-pagal-uzsakyma/${city.slug}/`;
    const record = manufacturers.find((candidate) => candidate.city === city.city);
    return record ? `/gamintojas/${record.slug}/` : '/';
  };
  setPageMetadata({
    title: 'Baldų gamintojai pagal miestą ir vietovę | Katalogo rodyklė',
    description: `Visų ${cities.length} katalogo vietovių rodyklė su gamintojų kandidatų skaičiumi ir veikiančiomis nuorodomis.`,
    path: '/baldai-pagal-uzsakyma/miestai',
    structuredData: [
      breadcrumbStructuredData([
        { name: 'Gamintojų katalogas', path: '/' },
        { name: 'Miestai ir vietovės', path: '/baldai-pagal-uzsakyma/miestai' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        numberOfItems: cities.length,
        itemListElement: cities.map((city, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: city.city,
          url: `${SITE_URL}${cityHref(city)}`,
        })),
      },
    ],
  });
  const directory = [...groups].map(([letter, entries], groupIndex) => `
    <section class="city-index-group" aria-labelledby="city-index-letter-${groupIndex}">
      <h2 id="city-index-letter-${groupIndex}">${escapeHtml(letter)}</h2>
      <ul>${entries.map((city) => {
        const singleRecord = city.count === 1 ? manufacturers.find((record) => record.city === city.city) : undefined;
        const destination = city.count >= 2 ? 'Atverti vietovės kandidatų sąrašą' : `Atverti vienintelį įrašą: ${singleRecord?.trading_name ?? ''}`;
        return `<li class="city-index-item" data-city-count="${city.count}"><a href="${cityHref(city)}"><span><strong>${escapeHtml(city.city)}</strong><small>${escapeHtml(destination)}</small></span><span class="city-index-count">${city.count}</span></a></li>`;
      }).join('')}</ul>
    </section>
  `).join('');
  root.innerHTML = `
    ${renderHeader('directory')}
    <main class="city-index-main">
      <a class="back-link" href="/" data-internal-link="true">← Grįžti į gamintojų katalogą</a>
      <header class="city-index-hero">
        <div><p class="kicker">Vietovių rodyklė</p><h1>Gamintojų kandidatai pagal vietovę</h1></div>
        <div class="city-index-intro"><p>Rodyklėje pateikiamos visos ${cities.length} vietovės, kurios šiuo metu nurodytos viešų šaltinių katalogo įrašuose.</p><p>Bent du įrašus turinti vietovė veda į kandidatų puslapį, o vieną – tiesiai į vienintelį profilį. Vietovė negarantuoja paslaugų teritorijos.</p></div>
      </header>
      <section class="city-index-directory" aria-label="Visos katalogo vietovės">${directory}</section>
      <aside class="city-index-disclaimer"><h2>Kaip skaityti šią rodyklę</h2><p>Įrašai sudaryti iš viešų šaltinių, nėra patvirtinti, reitinguojami ar rekomenduojami. Juridinius ir kontaktinius duomenis, aktualią veiklą bei aptarnavimo adresą patikrinkite savarankiškai.</p></aside>
    </main>
    ${renderFooter()}
  `;
}

function renderLandingPage(slug: string, citySlug?: string): void {
  if (!root) return;
  const landingCities = getLandingCities(manufacturers);
  const combinations = getEligibleCityCategoryLandings(manufacturers);
  const combination = citySlug
    ? combinations.find((entry) => entry.category.slug === slug && entry.citySlug === citySlug)
    : undefined;
  const category = combination?.category ?? (!citySlug ? CATEGORY_LANDINGS.find((entry) => entry.slug === slug) : undefined);
  const cityLanding = combination
    ? landingCities.find((entry) => entry.city === combination.city)
    : (!citySlug ? landingCities.find((entry) => entry.slug === slug) : undefined);

  if ((!category && !cityLanding) || (citySlug && !combination)) {
    renderNotFound('Paieškos puslapis nerastas', 'Tokio kategorijos ar miesto puslapio nėra. Grįžkite į katalogą ir naudokite paiešką arba filtrus.');
    return;
  }

  const records = manufacturers.filter((record) => {
    const matchesCategory = category ? asStringArray(record.category_codes).includes(category.code) : true;
    const matchesCity = cityLanding ? record.city === cityLanding.city : true;
    return matchesCategory && matchesCity;
  });
  const hasStaticLanding = Boolean(
    root.querySelector('.landing-guidance')
    && root.querySelector('#landing-filter-controls')
    && root.querySelector('#landing-manufacturer-list'),
  );
  if (!hasStaticLanding) {
    window.location.reload();
    return;
  }

  const updateIndexing = (): void => {
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (robots) robots.content = window.location.search ? 'noindex, follow' : 'index, follow';
  };
  initializeLandingFilters(records, updateIndexing);
}

function renderRequestPage(): void {
  if (!root) return;
  renderRfqTool({
    root,
    renderHeader,
    renderFooter,
    manufacturers,
  });
}


function renderPolicyPage(page: PolicyPage): void {
  if (!root) return;
  setPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    structuredData: [
      breadcrumbStructuredData([
        { name: 'Gamintojų katalogas', path: '/' },
        { name: page.heading, path: page.path },
      ]),
    ],
  });

  root.innerHTML = `
    ${renderHeader('policy')}
    <main class="policy-main">
      <a class="back-link" href="/" data-internal-link="true">← Grįžti į gamintojų katalogą</a>
      <article class="policy-document">
        <header class="policy-header">
          <p class="kicker">Svetainės informacija</p>
          <h1>${escapeHtml(page.heading)}</h1>
          <p class="lead">${escapeHtml(page.summary)}</p>
        </header>
        <dl class="policy-operator" aria-label="Svetainės valdytojo duomenys">
          <div><dt>Valdytojas</dt><dd>GG Ventures UAB</dd></div>
          <div><dt>Įmonės kodas</dt><dd>305442420</dd></div>
          <div><dt>Kontaktas</dt><dd><a href="mailto:info@baldininkai.org">info@baldininkai.org</a></dd></div>
        </dl>
        <div class="policy-copy">${page.content}</div>
      </article>
    </main>
    ${renderFooter()}
  `;
}

function renderNotFound(title: string, description: string): void {
  if (!root) return;
  setPageMetadata({
    title: `${title} | Baldai pagal užsakymą Lietuvoje`,
    description,
    path: window.location.pathname,
    robots: 'noindex, follow',
  });
  root.innerHTML = `
    ${renderHeader('directory')}
    <main class="profile-main">
      <section class="message-state profile-state not-found-state">
        <p class="state-label">Puslapis nerastas</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <div class="state-actions">
          <a class="primary-button" href="/" data-internal-link="true">Ieškoti kataloge</a>
          <a href="/gidas" data-internal-link="true">Skaityti pirkėjo gidą</a>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;
}

function renderProfile(record: Manufacturer | undefined): void {
  if (!root) return;
  root.innerHTML = `
    ${renderHeader('directory')}
    <main class="profile-main" id="profile-main"></main>
    ${renderFooter()}
  `;

  const main = document.querySelector<HTMLElement>('#profile-main');
  if (!main) return;

  const back = document.createElement('a');
  back.className = 'back-link';
  back.href = `/${window.location.search}`;
  back.dataset.internalLink = 'true';
  back.textContent = '← Grįžti į gamintojų katalogą';

  if (!record) {
    setPageMetadata({
      title: 'Gamintojas nerastas | Baldai pagal užsakymą Lietuvoje',
      description: 'Gamintojo įrašas šiame viešų šaltinių kataloge nerastas.',
      path: window.location.pathname,
      robots: 'noindex, follow',
    });
    const state = document.createElement('section');
    state.className = 'message-state profile-state not-found-state';
    state.innerHTML = `
      <p class="state-label">Įrašas nerastas</p>
      <h1>Tokio gamintojo kataloge nėra</h1>
      <p>Nuorodoje gali būti klaida arba įrašas galėjo pasikeisti. Grįžkite į katalogą ir ieškokite pagal pavadinimą, miestą ar kategoriją.</p>
      <div class="state-actions">
        <a class="primary-button" href="/" data-internal-link="true">Ieškoti kataloge</a>
        <a href="/gidas" data-internal-link="true">Skaityti pirkėjo gidą</a>
      </div>
    `;
    main.append(back, state);
    return;
  }

  const displayName = textOrUnknown(record.trading_name, 'Gamintojo pavadinimas nenurodytas');
  const profilePath = `/gamintojas/${record.slug}`;
  setPageMetadata({
    title: `${displayName} | Baldų gamintojo įrašas`,
    description: `${displayName}: viešais šaltiniais paremtas, nepatvirtintas gamintojo kandidato įrašas su vieta, kategorijomis ir šaltinių nuorodomis.`,
    path: profilePath,
    robots: window.location.search ? 'noindex, follow' : 'index, follow',
    type: 'profile',
    structuredData: [
      breadcrumbStructuredData([
        { name: 'Gamintojų katalogas', path: '/' },
        { name: displayName, path: profilePath },
      ]),
      manufacturerStructuredData(record),
    ],
  });

  const article = document.createElement('article');
  article.className = 'profile-sheet';

  const hero = document.createElement('header');
  hero.className = 'profile-hero';
  const headingGroup = document.createElement('div');
  headingGroup.className = 'profile-heading-group';
  const status = document.createElement('p');
  status.className = 'record-status';
  status.textContent = 'Nepatvirtintas viešų šaltinių įrašas';
  const heading = document.createElement('h1');
  heading.textContent = displayName;
  const identity = document.createElement('p');
  identity.className = 'profile-identity';
  identity.textContent = textOrUnknown(record.source_identity, 'Šaltinyje pateikta tapatybė nenurodyta.');
  headingGroup.append(status, heading, identity);

  const profileActions = document.createElement('div');
  profileActions.className = 'profile-actions';
  const requestLink = document.createElement('a');
  requestLink.className = 'primary-button';
  requestLink.href = `/gauti-pasiulymus?gamintojas=${encodeURIComponent(record.slug)}`;
  requestLink.dataset.internalLink = 'true';
  requestLink.textContent = 'Įtraukti į projekto užklausą';
  const claimLink = document.createElement('a');
  claimLink.className = 'secondary-button profile-claim-link';
  claimLink.href = '#pataisyti-profili';
  claimLink.textContent = 'Atstovaujate įmonei? Papildyti profilį';
  const guideLink = document.createElement('a');
  guideLink.className = 'profile-guide-link';
  guideLink.href = '/gidas';
  guideLink.dataset.internalLink = 'true';
  guideLink.textContent = 'Prieš kreipdamiesi peržiūrėkite pirkėjo gidą →';
  const contextualGuide = getContextualGuide(record);
  const contextualGuideLink = document.createElement('a');
  contextualGuideLink.className = 'profile-guide-link';
  contextualGuideLink.href = `/gidas/${contextualGuide.slug}`;
  contextualGuideLink.dataset.internalLink = 'true';
  contextualGuideLink.textContent = `${contextualGuide.label} →`;
  profileActions.append(requestLink, claimLink, guideLink, contextualGuideLink);
  hero.append(headingGroup, profileActions);

  const note = document.createElement('div');
  note.className = 'profile-note';
  note.innerHTML = `
    <strong>Duomenys nėra garantija.</strong>
    <span>Šis įrašas padeda pradėti savarankišką paiešką. Jis nepatvirtina gamintojo tapatybės, kokybės, užimtumo, kainos, terminų ar tinkamumo jūsų projektui.</span>
  `;

  const details = document.createElement('section');
  details.className = 'profile-details';
  details.setAttribute('aria-labelledby', 'profile-details-title');
  const detailsHeading = document.createElement('div');
  detailsHeading.className = 'section-heading';
  detailsHeading.innerHTML = `
    <p class="kicker">Viešame įraše pateikta informacija</p>
    <h2 id="profile-details-title">Tapatybė, vieta ir veiklos kryptys</h2>
  `;

  const facts = document.createElement('dl');
  facts.className = 'profile-facts';
  const categoryLabels = asStringArray(record.category_labels);
  facts.append(
    createFactRow('Viešas / prekinis pavadinimas', displayName),
    createOptionalFactRow('Juridinis pavadinimas', record.legal_name, 'Viešame šaltinyje juridinis pavadinimas nenurodytas.'),
    createOptionalFactRow('Šaltinyje pateikta tapatybė', record.source_identity),
    createOptionalFactRow('Vietovė šaltinyje', record.location),
    createOptionalFactRow('Miestas ar vietovė', record.city),
    createOptionalFactRow('Šaltinio regiono grupė', record.region_label),
    createOptionalFactRow('Kategorijos', categoryLabels.join(', '), 'Kategorijos viešuose šaltiniuose nenurodytos.'),
    createOptionalFactRow('Aprašymas', record.description_lt, 'Trumpas aprašymas šaltiniuose nepateiktas.'),
    createOptionalFactRow('Šaltinyje aprašyta veiklos apimtis', record.scope_evidence, 'Papildomas veiklos apimties aprašymas šaltinyje nepateiktas.'),
    createUrlFactRow('Svetainė', record.website),
    createUrlFactRow('Viešai nurodytas kontaktinis adresas', record.public_contact_url),
  );
  details.append(detailsHeading, facts);

  const registryVerification = createRegistryVerificationSection(record);
  const publicDetails = createPublicDetailsSection(record);
  const profileLandings = createProfileLandingSection(record);
  article.append(hero, createProfileOverview(record));
  if (registryVerification) article.append(registryVerification);
  article.append(note, details);
  if (publicDetails) article.append(publicDetails);
  if (profileLandings) article.append(profileLandings);
  article.append(createReviewSection(record), createSourceSection(record), createCorrectionSection(record));
  main.append(back, article);
}

function renderGuideHub(): void {
  if (!root) return;
  const guideFaq = [
    {
      question: 'Ar katalogo įrašas yra gamintojo rekomendacija?',
      answer: 'Ne. Katalogas pateikia viešuose šaltiniuose rastus nepatvirtintus kandidatus ir palieka tapatybės, apimties bei pasiūlymo patikrą pirkėjui.',
    },
    {
      question: 'Ar galima lyginti tik galutinę pasiūlymo kainą?',
      answer: 'Ne. Kainą reikia lyginti kartu su medžiagomis, furnitūra, matavimu, projektavimu, pristatymu, montavimu, terminais ir aiškiai nurodytomis išimtimis.',
    },
    {
      question: 'Kaip patikrinti siūlomą gamybos terminą?',
      answer: 'Paprašykite grafiko etapais ir raštu patvirtinkite, nuo kokio įvykio terminas skaičiuojamas, kokios jo prielaidos ir kas nutinka pasikeitus apimčiai.',
    },
  ];
  setPageMetadata({
    title: 'Pirkėjo gidas | Baldai pagal užsakymą Lietuvoje',
    description: 'Lietuviški pirkėjo gidai apie baldų gamintojo pasirinkimą, realistiškas kainų nuorodas, projekto etapus, medžiagas, sutartį, avansą ir garantiją.',
    path: '/gidas',
    structuredData: [
      breadcrumbStructuredData([
        { name: 'Gamintojų katalogas', path: '/' },
        { name: 'Pirkėjo gidas', path: '/gidas' },
      ]),
      faqStructuredData(guideFaq),
    ],
  });
  const renderGuideLinks = (articles: GuideArticle[]) => `
    <ul class="guide-route-list">
      ${articles.map((article) => `
        <li>
          <div>
            <p>${article.readingLabel}</p>
            <h3><a href="/gidas/${article.slug}/">${article.title}</a></h3>
            <p>${article.summary}</p>
          </div>
          <span class="route-arrow" aria-hidden="true">→</span>
        </li>
      `).join('')}
    </ul>
  `;
  root.innerHTML = `
    ${renderHeader('guide')}
    <main>
      <section class="guide-intro" aria-labelledby="guide-title">
        <div>
          <p class="kicker">Pirkėjo gidas</p>
          <h1 id="guide-title">Sprendimą grįskite palyginama informacija, ne vien pažadu</h1>
        </div>
        <p>Katalogas padeda rasti viešuose šaltiniuose matomus kandidatus. Gidas padeda išversti techninius terminus į palyginamus klausimus apie medžiagas, kainos apimtį, projekto eigą ir pirkimo dokumentus.</p>
      </section>
      <section class="guide-start" aria-labelledby="guide-start-title">
        <div class="guide-hub-heading">
          <h2 id="guide-start-title">Pradėkite nuo sprendimo, kurį turite priimti</h2>
          <p>Nereikia išmanyti baldų gamybos. Pasirinkite artimiausią klausimą ir pasižymėkite, ką paprašysite įrašyti į pasiūlymą.</p>
        </div>
        <ul class="guide-start-links">
          <li><a href="/gidas/medziagos-sutartis-avansas-garantija/">Suprasti LMDP, MDF, medieną, stalviršius, furnitūrą ir briaunas <span aria-hidden="true">→</span></a></li>
          <li><a href="/gidas/virtuves-baldu-kainos/">Patikrinti, ką iš tiesų apima vieši kainų orientyrai <span aria-hidden="true">→</span></a></li>
          <li><a href="/gidas/kaip-pasirinkti-baldu-gamintoja/">Palyginti tiekėjus pagal tą pačią apimtį ir dokumentus <span aria-hidden="true">→</span></a></li>
          <li><a href="https://vvtat.lrv.lt/lt/veiklos-sritys-54/ne-maisto-produktai-55/vartotoju-teises-ir-garantijos-714/" target="_blank" rel="noopener noreferrer">Atverti oficialią VVTAT informaciją apie vartotojų teises ir garantijas <span aria-hidden="true">↗</span></a></li>
        </ul>
      </section>
      <section class="buyer-tools-hub" id="pirkejo-irankiai" aria-labelledby="buyer-tools-title">
        <div class="guide-hub-heading">
          <p class="kicker">Pirkėjo įrankiai</p>
          <h2 id="buyer-tools-title">Įvertinkite, parenkite, palyginkite ir užfiksuokite</h2>
          <p>Keturi atskiri įrankiai padeda išlaikyti vienodą projekto informaciją nuo pirmojo biudžeto orientyro iki pasiūlymų ir sutarties peržiūros.</p>
        </div>
        <ul class="buyer-tool-links">
          <li><a href="/baldu-kainos-skaiciuokle" data-internal-link="true"><strong>Apskaičiuoti preliminarų kainos intervalą</strong><span>Žema, tipinė ir aukšta riba pagal projekto apimtį bei pasirinktus sprendinius.</span></a></li>
          <li><a href="/gauti-pasiulymus" data-internal-link="true"><strong>Pateikti saugią projekto pasiūlymo užklausą</strong><span>Operatoriaus peržiūra ir jokių automatinių kontaktų su gamintojais.</span></a></li>
          <li><a href="/palyginti-pasiulymus" data-internal-link="true"><strong>Palyginti 2–5 pasiūlymus</strong><span>Aiški formulė, jūsų svoriai, įrodymai ir matomos spragos.</span></a></li>
          <li><a href="/gidas/baldu-pirkimo-sutarties-sablonas" data-internal-link="true"><strong>Redaguoti sutarties struktūros šabloną</strong><span>Naršyklėje pildomas ir spausdinamas informacinis B2C ruošinys.</span></a></li>
        </ul>
      </section>
      <section class="guide-hub" aria-labelledby="featured-guides-title">
        <div class="guide-hub-heading">
          <h2 id="featured-guides-title">Keturi išsamūs gidai svarbiausiems sprendimams</h2>
          <p>Pradėkite nuo klausimo, kurį turite dabar: kandidato patikra, kaina, projekto eiga arba susitarimo detalės.</p>
        </div>
        ${renderGuideLinks(guideArticles.filter((article) => article.featured && !article.buyerIntent))}
      </section>
      <section class="guide-hub" aria-labelledby="buyer-intent-guides-title">
        <div class="guide-hub-heading">
          <h2 id="buyer-intent-guides-title">Pirkėjo klausimai prieš užsakant</h2>
          <p>Rinkitės temą pagal sprendinį, medžiagą, objekto parengtį arba aptarnavimo situaciją.</p>
        </div>
        ${renderGuideLinks(guideArticles.filter((article) => article.buyerIntent))}
      </section>
      <section class="guide-hub guide-hub--secondary" aria-labelledby="concise-guides-title">
        <div class="guide-hub-heading">
          <h2 id="concise-guides-title">Trumpi praktiniai straipsniai</h2>
          <p>Anksčiau publikuoti gidai lieka pasiekiami tais pačiais adresais.</p>
        </div>
        ${renderGuideLinks(guideArticles.filter((article) => !article.featured))}
      </section>
      <section class="guide-principles" aria-labelledby="principles-title">
        <div>
          <h2 id="principles-title">Trumpa atrankos seka</h2>
          <p>Ši seka nesuteikia kokybės garantijos, bet palieka aiškų pagrindą, kodėl kandidatas pateko į jūsų sąrašą.</p>
        </div>
        <ol>
          <li><strong>Apibrėžkite poreikį.</strong><span>Patalpa, matmenys, funkcija, norimos medžiagos, montavimo vieta ir sprendimo ribos.</span></li>
          <li><strong>Rinkite kandidatus.</strong><span>Naudokite katalogą kaip pradžios tašką, o ne patvirtintą rekomendacijų sąrašą.</span></li>
          <li><strong>Patikrinkite tapatybę ir apimtį.</strong><span>Sutikrinkite juridinį pavadinimą, viešą kontaktą ir ar gamintojas imasi tokio projekto.</span></li>
          <li><strong>Siųskite vienodą užklausą.</strong><span>Skirtingai aprašyti projektai sukuria nepalyginamus atsakymus.</span></li>
          <li><strong>Lyginkite visą apimtį.</strong><span>Kaina, medžiagos, furnitūra, matavimas, pristatymas, montavimas, terminų prielaidos ir išimtys.</span></li>
        </ol>
      </section>
      <section class="uncertainty-note" aria-labelledby="uncertainty-title">
        <h2 id="uncertainty-title">Ko šis gidas nežada</h2>
        <p>Nėra vienos universalios kainos, fiksuoto termino ar visiems projektams tinkamo gamintojo. Galutinis pasiūlymas priklauso nuo konkrečios apimties ir tuo metu patvirtintų sąlygų.</p>
      </section>
      ${renderFaq(guideFaq)}
    </main>
    ${renderFooter()}
  `;
}

function renderGuideArticleShell(article: GuideArticle, content: string): void {
  if (!root) return;
  const path = `/gidas/${article.slug}`;
  setPageMetadata({
    title: `${article.title} | Pirkėjo gidas`,
    description: article.summary,
    path,
    type: 'article',
    structuredData: [breadcrumbStructuredData([
      { name: 'Gamintojų katalogas', path: '/' },
      { name: 'Pirkėjo gidas', path: '/gidas' },
      { name: article.title, path },
    ])],
  });
  root.innerHTML = `
    ${renderHeader('guide')}
    <main class="article-main">
      <a class="back-link" href="/gidas" data-internal-link="true">← Grįžti į pirkėjo gidą</a>
      <article class="guide-article">
        <header class="article-header">
          <p class="kicker">${article.readingLabel}</p>
          <h1>${article.title}</h1>
          <p>${article.summary}</p>
        </header>
        <div class="guide-copy">${content}</div>
        <nav class="article-next" aria-label="Kiti gido straipsniai">
          <a href="/gidas" data-internal-link="true">Visas pirkėjo gidas</a>
          <a href="/" data-internal-link="true">Atverti gamintojų katalogą →</a>
        </nav>
      </article>
    </main>
    ${renderFooter()}
  `;
}

function renderShortlistGuide(): void {
  const article = guideArticles[0];
  renderGuideArticleShell(article, `
    <section>
      <h2>Pradėkite nuo atrankos pagrindo</h2>
      <p>Pagrįstas trumpasis sąrašas nėra populiarumo lentelė. Tai kandidatų rinkinys, kuriame prie kiekvieno pasirinkimo galite parodyti, kokį jūsų poreikį jis galėtų atitikti ir ką dar būtina patikrinti.</p>
      <div class="checklist-block">
        <h3>Prieš ieškodami užrašykite</h3>
        <ul>
          <li>kokiai patalpai ir funkcijai reikia baldų;</li>
          <li>apytikslius matmenis, vietos nuotraukas ir žinomus apribojimus;</li>
          <li>kurios medžiagos ar sprendimai pageidaujami, o kurie netinka;</li>
          <li>ar reikia matavimo, projektavimo, pristatymo ir montavimo;</li>
          <li>iki kada sprendimas reikalingas ir kuri data yra lanksti.</li>
        </ul>
      </div>
    </section>
    <section>
      <h2>Kiekvienam kandidatui taikykite tuos pačius kriterijus</h2>
      <p>Katalogo kategorija ar aprašymas yra viešo šaltinio signalas, ne patvirtinimas. Žymėkite atskirai: „rasta šaltinyje“, „patvirtino gamintojas“ ir „dar neaišku“.</p>
      <div class="comparison-table-wrap" tabindex="0" aria-label="Kandidato patikros lentelė, galima slinkti horizontaliai">
        <table>
          <thead><tr><th>Kriterijus</th><th>Ką užfiksuoti</th><th>Ko nepriimti kaip garantijos</th></tr></thead>
          <tbody>
            <tr><td>Tapatybė</td><td>Viešas pavadinimas, juridinis pavadinimas, naudotas kontaktinis adresas</td><td>Vien pavadinimo sutapimo</td></tr>
            <tr><td>Atitiktis projektui</td><td>Ar gamintojas patvirtino, kad imasi tokio tipo ir apimties darbo</td><td>Bendros kategorijos žymos</td></tr>
            <tr><td>Įrodymai</td><td>Vieši panašios apimties darbų pavyzdžiai ir jų kontekstas</td><td>Neaiškios kilmės nuotraukų</td></tr>
            <tr><td>Procesas</td><td>Kas matuoja, projektuoja, tvirtina brėžinius, pristato ir montuoja</td><td>Žodžio „pilnas“ be išvardytos apimties</td></tr>
            <tr><td>Neapibrėžtumas</td><td>Kokios sąlygos dar gali pakeisti kainą ar grafiką</td><td>Datos ar sumos be prielaidų</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <section>
      <h2>Klausimai prieš priimant pasiūlymą</h2>
      <ul class="question-list">
        <li>Kas tiksliai įtraukta į pasiūlymą, o kas neįtraukta?</li>
        <li>Kokios medžiagos, furnitūra, paviršiai ir jų variantai įvardyti raštu?</li>
        <li>Kas atsako už galutinius matmenis ir kada jie tvirtinami?</li>
        <li>Ar gausite brėžinius ar vizualizacijas patvirtinimui prieš gamybą?</li>
        <li>Kokie etapai, mokėjimo momentai ir priėmimo kriterijai?</li>
        <li>Kaip registruojami pakeitimai ir kaip jie gali paveikti kainą bei terminą?</li>
        <li>Kas vyksta nustačius trūkumą pristatymo ar montavimo metu?</li>
      </ul>
      <p class="inline-warning"><strong>Neužpildykite spragų patys.</strong> Jei pasiūlyme nėra medžiagos, darbų etapo ar datos prielaidos, pažymėkite tai kaip neaiškumą ir paprašykite papildyti raštu.</p>
    </section>
  `);
}

function renderRequestGuide(): void {
  const article = guideArticles[1];
  renderGuideArticleShell(article, `
    <section>
      <h2>Vienoda užklausa sukuria palyginamus atsakymus</h2>
      <p>Gamintojui reikia ne ilgo pasakojimo, o aiškios projekto santraukos ir priedų. Jei skirtingiems kandidatams siunčiate skirtingą informaciją, jų kainų ir terminų negalėsite sąžiningai lyginti.</p>
      <div class="checklist-block">
        <h3>Į užklausą įtraukite</h3>
        <ul>
          <li>patalpą, baldų paskirtį ir montavimo adresą ar vietovę;</li>
          <li>matmenis su aiškia pastaba, ar jie preliminarūs;</li>
          <li>nuotraukas, planą, angų, komunikacijų ir kitų kliūčių vietas;</li>
          <li>norimas medžiagas, spalvas, furnitūros funkcijas ir prioritetus;</li>
          <li>ar reikia matavimo, projektavimo, pristatymo, užnešimo, montavimo ir senų baldų išvežimo;</li>
          <li>pageidaujamą laikotarpį ir datą, iki kurios reikia gauti pasiūlymą;</li>
          <li>prašymą aiškiai išvardyti prielaidas, išimtis ir galimus papildomus darbus.</li>
        </ul>
      </div>
    </section>
    <section>
      <h2>Kainą lyginkite tik kartu su apimtimi</h2>
      <p>Universalių kainų juostų nėra: projektai skiriasi matmenimis, medžiagomis, furnitūra, konstrukcija, apdaila, logistika ir montavimo sąlygomis. Mažesnė suma gali reikšti kitokią komplektaciją, o ne geresnę kainą už tą patį darbą.</p>
      <h3>Dažniausi kainos veiksniai</h3>
      <ul>
        <li>baldų kiekis, matmenys ir nestandartinių mazgų sudėtingumas;</li>
        <li>plokštės, medžio masyvas, metalas, stiklas, akmuo ar kiti paviršiai;</li>
        <li>furnitūros klasė ir funkcijos;</li>
        <li>dažymas, frezavimas, faneravimas ir kiti apdailos darbai;</li>
        <li>matavimo, projektavimo ir pakeitimų apimtis;</li>
        <li>pristatymo atstumas, užnešimo sąlygos ir montavimo sudėtingumas;</li>
        <li>objekto parengtis ir darbų derinimas su kitais rangovais.</li>
      </ul>
    </section>
    <section>
      <h2>Pasiūlymų palyginimo kontrolinis sąrašas</h2>
      <div class="comparison-table-wrap" tabindex="0" aria-label="Pasiūlymų palyginimo lentelė, galima slinkti horizontaliai">
        <table>
          <thead><tr><th>Sritis</th><th>Patikrinkite</th></tr></thead>
          <tbody>
            <tr><td>Gaminiai</td><td>Kiekiai, matmenys, konstrukcija, vidaus įranga ir nurodyti priedai</td></tr>
            <tr><td>Medžiagos</td><td>Tikslūs pavadinimai ar aiškiai aprašyti lygiaverčiai variantai</td></tr>
            <tr><td>Paslaugos</td><td>Matavimas, projektavimas, pristatymas, užnešimas, montavimas</td></tr>
            <tr><td>Kaina</td><td>Mokesčiai, pristatymas, montavimas, galimi papildomi darbai ir pasiūlymo galiojimas</td></tr>
            <tr><td>Grafikas</td><td>Etapai, prielaidos, priklausomybės ir data, nuo kurios terminas skaičiuojamas</td></tr>
            <tr><td>Priėmimas</td><td>Kas ir kada patikrinama, kaip fiksuojami neatitikimai</td></tr>
          </tbody>
        </table>
      </div>
      <p class="inline-warning"><strong>Prašykite patikslintos versijos.</strong> Žodinis paaiškinimas padeda suprasti, bet galutiniam palyginimui naudokite vieną rašytinę pasiūlymo versiją su visais pakeitimais.</p>
    </section>
  `);
}

function renderScheduleGuide(): void {
  const article = guideArticles[2];
  renderGuideArticleShell(article, `
    <section>
      <h2>Vienas skaičius neparodo, nuo ko priklauso terminas</h2>
      <p>Realistiškas grafikas susideda iš etapų ir aiškių prielaidų. Viešas katalogo įrašas nieko nepasako apie dabartinę gamintojo apkrovą ar medžiagų prieinamumą, todėl šiuos dalykus reikia patvirtinti konkrečiam projektui.</p>
      <h3>Terminą gali keisti</h3>
      <ul>
        <li>objekto parengtis galutiniam matavimui;</li>
        <li>brėžinių, medžiagų ir spalvų derinimo trukmė;</li>
        <li>pasirinktų medžiagų ir furnitūros prieinamumas;</li>
        <li>gamybos eilė pasiūlymo patvirtinimo metu;</li>
        <li>subrangovų darbai, paviršių apdaila ar nestandartiniai komponentai;</li>
        <li>pristatymo, užnešimo ir montavimo sąlygos;</li>
        <li>užsakovo ar kitų rangovų inicijuoti pakeitimai.</li>
      </ul>
    </section>
    <section>
      <h2>Prašykite grafiko etapais</h2>
      <div class="checklist-block">
        <h3>Ką turi atsakyti realistiškas grafikas</h3>
        <ul>
          <li>kada atliekamas galutinis matavimas ir ko tam reikia objekte;</li>
          <li>iki kada pateikiami ir patvirtinami brėžiniai bei medžiagos;</li>
          <li>nuo kokio įvykio prasideda gamybos laiko skaičiavimas;</li>
          <li>kada numatomas pristatymo ir montavimo langas;</li>
          <li>kurios datos yra preliminarios, o kurios patvirtintos;</li>
          <li>kokios priklausomybės gali sustabdyti ar perkelti etapą;</li>
          <li>kaip pakeitimai perskaičiuoja kainą ir grafiką.</li>
        </ul>
      </div>
    </section>
    <section>
      <h2>Klausimai, kurie sumažina neapibrėžtumą</h2>
      <ul class="question-list">
        <li>Ar siūloma data paremta dabartine gamybos eile, ar tai tik preliminarus vertinimas?</li>
        <li>Ar visos pasiūlyme nurodytos medžiagos ir furnitūra šiuo metu prieinamos?</li>
        <li>Kuriuos sprendimus turime patvirtinti, kad grafikas galėtų prasidėti?</li>
        <li>Kiek laiko numatyta mūsų pastaboms ir pataisymams?</li>
        <li>Kas turi būti baigta objekte iki matavimo, pristatymo ir montavimo?</li>
        <li>Kada gausime atnaujintą grafiką, jei pasikeis medžiaga, apimtis ar objekto parengtis?</li>
      </ul>
      <p class="inline-warning"><strong>Derinkite intervalą ir patvirtinimo momentą.</strong> Ankstyvoje stadijoje tiksli diena gali būti nepagrįsta. Svarbiau žinoti, kada ir kokiomis sąlygomis preliminarus laikotarpis taps patvirtintu grafiku.</p>
    </section>
  `);
}

function renderGuideNotFound(): void {
  if (!root) return;
  setPageMetadata({
    title: 'Gido straipsnis nerastas | Pirkėjo gidas',
    description: 'Prašomas pirkėjo gido straipsnis nerastas.',
    path: window.location.pathname,
    robots: 'noindex, follow',
  });
  root.innerHTML = `
    ${renderHeader('guide')}
    <main class="article-main">
      <a class="back-link" href="/gidas" data-internal-link="true">← Grįžti į pirkėjo gidą</a>
      <section class="message-state profile-state">
        <p class="state-label">Straipsnis nerastas</p>
        <h1>Tokio gido puslapio nėra</h1>
        <p>Grįžkite į gido pradžią ir pasirinkite vieną iš praktinių temų.</p>
        <a class="primary-button" href="/gidas" data-internal-link="true">Atverti pirkėjo gidą</a>
      </section>
    </main>
    ${renderFooter()}
  `;
}

function renderGuideRoute(): void {
  const path = normalizePathname();
  if (path === '/gidas') {
    renderGuideHub();
    return;
  }

  const articleSlug = decodeURIComponent(path.split('/').filter(Boolean)[1] ?? '');
  const article = guideArticles.find((item) => item.slug === articleSlug);
  if (article?.featured) {
    if (root?.querySelector('.guide-article')) return;
    window.location.replace(`${path}/`);
    return;
  }
  if (articleSlug === 'trumpasis-sarasas') {
    renderShortlistGuide();
    return;
  }
  if (articleSlug === 'uzklausa-ir-pasiulymas') {
    renderRequestGuide();
    return;
  }
  if (articleSlug === 'terminai') {
    renderScheduleGuide();
    return;
  }
  renderGuideNotFound();
}

function setHomeMetadata(): void {
  const hasFilters = Boolean(window.location.search);
  setPageMetadata({
    title: 'Baldai pagal užsakymą Lietuvoje | Gamintojų katalogas',
    description: 'Viešais šaltiniais paremtas nepatvirtintų Lietuvos nestandartinių baldų gamintojų kandidatų katalogas su paieška pagal kategoriją ir vietą.',
    path: '/',
    robots: hasFilters ? 'noindex, follow' : 'index, follow',
  });
}

function route(): void {
  if (isOpenDataPath() || isMarketOverviewPath()) return;

  const policyPage = getPolicyPage();
  if (policyPage) {
    renderPolicyPage(policyPage);
    return;
  }

  // Buyer tools use canonical standalone routes. Match them before the broader
  // guide namespace so the contract tool can never fall through as an article.
  if (isEstimatorPath()) {
    if (!root) return;
    renderPriceEstimator({ root, renderHeader, renderFooter });
    return;
  }

  if (isContractPath()) {
    if (!root) return;
    renderContractTool({ root, renderHeader, renderFooter });
    return;
  }

  if (isComparisonPath()) {
    if (!root) return;
    renderComparisonTool({ root, renderHeader, renderFooter });
    return;
  }

  if (isRequestPath()) {
    renderRequestPage();
    return;
  }

  if (isGuidePath()) {
    renderGuideRoute();
    return;
  }

  if (window.location.pathname.startsWith('/gamintojas/')) {
    const slug = decodeURIComponent(window.location.pathname.split('/').filter(Boolean)[1] ?? '');
    renderProfile(manufacturers.find((record) => record.slug === slug));
    return;
  }

  if (isLandingPath()) {
    if (normalizePathname() === '/baldai-pagal-uzsakyma/miestai') {
      renderCitiesIndexPage();
      return;
    }
    const segments = normalizePathname().split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
    const categoryOrCitySlug = segments[1] ?? '';
    const combinationCitySlug = segments.length === 4 && segments[2] === 'miestas' ? segments[3] : undefined;
    if (segments.length !== 2 && !combinationCitySlug) {
      renderNotFound('Paieškos puslapis nerastas', 'Tokio kategorijos ar miesto puslapio nėra. Grįžkite į katalogą ir naudokite paiešką arba filtrus.');
      return;
    }
    renderLandingPage(categoryOrCitySlug, combinationCitySlug);
    return;
  }

  if (window.location.pathname !== '/') {
    renderNotFound('Tokio puslapio nėra', 'Patikrinkite adresą arba grįžkite į gamintojų katalogą.');
    return;
  }

  setHomeMetadata();
  renderShell();
  renderBrowse();
}

async function loadDirectory(): Promise<void> {
  if (isLoading) return;
  isLoading = true;

  if (window.location.pathname === '/') {
    if (!root?.hasChildNodes()) {
      renderShell();
      renderLoading();
    }
  } else if (window.location.pathname.startsWith('/gamintojas/')) {
    if (root && !root.hasChildNodes()) {
      root.innerHTML = `
        ${renderHeader('directory')}
        <main class="profile-main">
          <div class="loading-state" role="status" aria-live="polite">
            <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <div><h1>Kraunamas gamintojo įrašas</h1><p>Gaunami viešo šaltinio duomenys…</p></div>
          </div>
        </main>
        ${renderFooter()}
      `;
    }
  } else if (isRequestPath()) {
    if (root && !root.hasChildNodes()) {
      root.innerHTML = `
        ${renderHeader('request')}
        <main class="request-main">
          <div class="loading-state" role="status" aria-live="polite">
            <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <div><h1>Ruošiama projekto užklausa</h1><p>Gaunamas gamintojų kandidatų sąrašas…</p></div>
          </div>
        </main>
        ${renderFooter()}
      `;
    }
  }

  try {
    manufacturers = await fetchAllManufacturers();
    directoryLoaded = true;
    browseState = readBrowseState();
    route();
  } catch (error) {
    console.error('Nepavyko gauti gamintojų katalogo.', error);
    renderDirectoryError();
  } finally {
    isLoading = false;
  }
}

function navigateToCurrentRoute(): void {
  browseState = readBrowseState();
  if (isGuidePath() || isPolicyPath() || isOpenDataPath() || isMarketOverviewPath() || isComparisonPath() || isEstimatorPath()) {
    route();
    return;
  }
  if (directoryLoaded) {
    route();
    return;
  }
  void loadDirectory();
}

function setPrimaryNavigationOpen(header: HTMLElement, open: boolean, returnFocus = false): void {
  const toggle = header.querySelector<HTMLButtonElement>('.navigation-toggle');
  if (!toggle) return;
  if (open) header.dataset.menuOpen = 'true';
  else delete header.dataset.menuOpen;
  toggle.setAttribute('aria-expanded', String(open));
  const current = toggle.querySelector<HTMLElement>('.navigation-current')?.textContent?.trim() ?? '';
  toggle.setAttribute(
    'aria-label',
    `${open ? 'Užverti' : 'Atverti'} pagrindinį meniu. Dabartinis skyrius: ${current}`,
  );
  if (returnFocus) toggle.focus();
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const toggle = target.closest<HTMLButtonElement>('.navigation-toggle');
  if (toggle) {
    const header = toggle.closest<HTMLElement>('.site-header');
    if (!header) return;
    setPrimaryNavigationOpen(header, toggle.getAttribute('aria-expanded') !== 'true');
    return;
  }

  const openHeader = document.querySelector<HTMLElement>('.site-header[data-menu-open="true"]');
  if (openHeader && !openHeader.contains(target)) setPrimaryNavigationOpen(openHeader, false);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openHeader = document.querySelector<HTMLElement>('.site-header[data-menu-open="true"]');
  if (!openHeader) return;
  event.preventDefault();
  setPrimaryNavigationOpen(openHeader, false, true);
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>('a[data-internal-link="true"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const url = new URL(link.href, window.location.origin);
  if (url.origin !== window.location.origin || url.pathname.startsWith('/baldai-pagal-uzsakyma/')) return;
  event.preventDefault();
  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  navigateToCurrentRoute();
  window.scrollTo({ top: 0, behavior: 'auto' });
});

window.addEventListener('popstate', navigateToCurrentRoute);

if (isGuidePath() || isPolicyPath() || isOpenDataPath() || isMarketOverviewPath() || isComparisonPath() || isEstimatorPath()) {
  route();
} else {
  void loadDirectory();
}
