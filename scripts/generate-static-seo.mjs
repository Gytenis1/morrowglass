#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEXNOW_KEY, INDEXNOW_KEY_FILENAME } from './indexnow-key.mjs';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(rootDir, 'public');
const SITE_URL = 'https://www.baldininkai.org';
const SITE_NAME = 'Baldai pagal užsakymą Lietuvoje';
const DATASET_LICENSE_NAME = 'Creative Commons Attribution 4.0 International';
const DATASET_LICENSE_VERSION = '4.0';
const DATASET_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
const OFFICIAL_FINANCIAL_SOURCE_NAME = 'Juridinių asmenų registro (Registrų centro) finansinių ataskaitų duomenys Lietuvos atvirų duomenų portale';
const OFFICIAL_FINANCIAL_SOURCE_URL = 'https://data.gov.lt/datasets/1484/';
const OFFICIAL_FINANCIAL_API_MODEL_PATH = 'datasets/gov/rc/jar/pelno_ataskaitos/PelnoAtaskaita';
const buildDate = new Date().toISOString().slice(0, 10);

const [manufacturers, landingConfig, baseHtml] = await Promise.all([
  readFile(join(rootDir, 'data/manufacturers.json'), 'utf8').then(JSON.parse),
  readFile(join(rootDir, 'data/seo-landings.json'), 'utf8').then(JSON.parse),
  readFile(join(publicDir, 'index.html'), 'utf8'),
]);

const profileSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const generatedRoutes = new Set();
const BARE_COUNTRY_LABELS = new Set(['lietuva', 'lithuania', 'latvija', 'latvia', 'estija', 'estonia', 'lenkija', 'poland', 'europe', 'europa']);
const currentBuildYear = Number(buildDate.slice(0, 4));
function isBareCountry(value) {
  return typeof value === 'string' && BARE_COUNTRY_LABELS.has(value.trim().toLocaleLowerCase('lt-LT'));
}
function publishedLocality(record) {
  const city = record.city?.trim();
  return city && !isBareCountry(city) ? city : null;
}
function publishedLocation(value) {
  return typeof value === 'string' && value.trim() && !isBareCountry(value) ? value.trim() : null;
}
function publishedFoundingYear(value) {
  return Number.isInteger(value) && value >= 1900 && value <= currentBuildYear ? value : null;
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function validateManufacturers(records) {
  if (!Array.isArray(records)) throw new Error('data/manufacturers.json must contain an array.');
  for (const [index, record] of records.entries()) {
    const descriptor = `manufacturer record ${index + 1}`;
    if (!record || typeof record !== 'object') throw new Error(`${descriptor} must be an object.`);
    if (typeof record.slug !== 'string' || record.slug.trim() !== record.slug || !profileSlugPattern.test(record.slug)) {
      throw new Error(`${descriptor} has an invalid or unpublishable profile slug: ${String(record.slug)}.`);
    }
    if (typeof record.trading_name !== 'string' || !record.trading_name.trim()) throw new Error(`${descriptor} (${record.slug}) has no publishable trading name.`);
    // A country-only city remains valid source data but has no publishable locality.
    if (typeof record.city !== 'string') throw new Error(`${descriptor} (${record.slug}) has an invalid city value.`);
    if (!Array.isArray(record.category_codes) || !record.category_codes.length || !Array.isArray(record.category_labels) || record.category_codes.length !== record.category_labels.length) {
      throw new Error(`${descriptor} (${record.slug}) has invalid category route inputs.`);
    }
  }
  assertUnique(records.map((record) => record.slug), 'manufacturer profile slug');
}

function assertUniqueRoutePaths(paths, label) {
  for (const path of paths) {
    if (typeof path !== 'string' || !path.startsWith('/')) throw new Error(`Invalid ${label} route: ${String(path)}`);
  }
  assertUnique(paths, `${label} route`);
}

validateManufacturers(manufacturers);
await rm(join(publicDir, 'savininkams'), { recursive: true, force: true });
await rm(join(publicDir, 'en', 'furniture-makers'), { recursive: true, force: true });
await rm(join(publicDir, 'en', 'quote-request'), { recursive: true, force: true });

const logoAssetUrl = baseHtml.match(/<link rel="icon" type="image\/svg\+xml" href="([^"]+)" \/>/)?.[1];

if (!logoAssetUrl) {
  throw new Error('Could not resolve the built Baldininkai logo asset URL.');
}


const policyPages = [
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


const guideArticles = [
  {
    slug: 'kaip-pasirinkti-baldu-gamintoja',
    title: 'Kaip pasirinkti ir palyginti baldų gamintoją',
    summary: 'Ką paklausti, kokius įspėjamuosius ženklus pastebėti ir kaip atsargiai skaityti nepatvirtintus katalogo įrašus.',
    metaDescription: 'Praktinis gidas, kaip palyginti nestandartinių baldų gamintojus: klausimai kandidatams, įspėjamieji ženklai ir katalogo viešų šaltinių įrašų ribos.',
    hubLabel: 'Atranka ir patikra',
    featured: true,
    content: `<section><h2>Katalogo įrašas yra kandidatas, ne rekomendacija</h2><p>Katalogas sujungia viešuose šaltiniuose rastą informaciją, tačiau įrašai nėra patvirtinti su gamintojais. Pavadinimas, vieta, veiklos kryptis ar svetainės nuoroda nepatvirtina tapatybės, darbų kokybės, užimtumo, kainos ar tinkamumo jūsų projektui.</p><p>Įrašą naudokite kaip paieškos pradžią: atverkite nurodytus šaltinius, patikrinkite, kas teikia pasiūlymą ir kam būtų mokama, o aktualią projekto informaciją gaukite tiesiogiai bei raštu.</p></section>
<section><h2>Ką paklausti prieš įtraukiant į trumpąjį sąrašą</h2><div class="checklist-block"><h3>Klausimai tam pačiam palyginimui</h3><ul><li>Ar šiuo metu priimate tokio tipo, dydžio ir vietos projektus?</li><li>Koks tikslus pasiūlymą teikiančio asmens ar įmonės pavadinimas ir rekvizitai?</li><li>Ar galite parodyti panašios paskirties darbų pavyzdžių ir paaiškinti, kas juose buvo jūsų apimtis?</li><li>Kas atliks matavimą, projektavimą, gamybą, pristatymą ir montavimą?</li><li>Kokios medžiagos ir furnitūra siūlomos: gamintojas, kolekcija, kodas, spalva ir esminės savybės?</li><li>Kas aiškiai įtraukta į kainą, o kas bus skaičiuojama atskirai?</li><li>Nuo kokio įvykio skaičiuojamas grafikas ir kas nutinka pakeitus sprendinius?</li><li>Kokie dokumentai bus pateikti prieš avansą ir kaip fiksuojamas darbų priėmimas?</li></ul></div></section>
<section><h2>Įspėjamieji ženklai: kada sustoti ir tikslinti</h2><p>Vienas požymis savaime neįrodo problemos, tačiau jis yra priežastis neskubėti ir paprašyti aiškaus atsakymo.</p><ul><li>Vengiama pateikti rašytinę apimtį, medžiagų specifikaciją ar galutinę pasiūlymo versiją.</li><li>Pasiūlyme, sutartyje, sąskaitoje ir mokėjimo gavėjo duomenyse nesutampa pavadinimai, o skirtumas nepaaiškinamas.</li><li>Prašoma skubiai mokėti avansą dar nepatvirtinus brėžinių, apimties, kainos ir šalių duomenų.</li><li>Rodomi darbų vaizdai, bet nepaaiškinama, ar kandidatas juos iš tiesų projektavo, gamino ar tik montavo.</li><li>Žadama tiksli kaina ar data nematant patalpos, neturint matmenų ir neaptarus medžiagų.</li><li>Neįvardijama, kaip bus tvirtinami pakeitimai, papildomi darbai ir jų kaina.</li></ul><p class="inline-warning"><strong>Praktinė taisyklė:</strong> neaiškumą spręskite prieš mokėjimą, ne montavimo dieną. Jei atsakymo negalite užrašyti vienu sakiniu, pasiūlymai dar nėra palyginami.</p></section>
<section><h2>Palyginkite ne pažadus, o tą pačią apimtį</h2><div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Baldų gamintojų pasiūlymų palyginimo lentelė"><table><thead><tr><th>Kriterijus</th><th>Ką užfiksuoti</th><th>Ko nepalikti numanoma</th></tr></thead><tbody><tr><td>Tapatybė</td><td>Pasiūlymą teikiantis ir mokėjimą gaunantis asmuo ar įmonė</td><td>Kad prekinis pavadinimas automatiškai sutampa su sutarties šalimi</td></tr><tr><td>Gaminys</td><td>Brėžiniai, matmenys, komplektacija ir funkcijos</td><td>Kad visi kandidatai suprato vienodą projektą</td></tr><tr><td>Medžiagos</td><td>Plokščių, fasadų, stalviršio ir furnitūros identifikacija</td><td>Kad bendrinis žodis reiškia vienodą kokybę ar kainą</td></tr><tr><td>Paslaugos</td><td>Matavimas, projektavimas, pristatymas, užnešimas, montavimas</td><td>Kad mažesnė suma apima tuos pačius darbus</td></tr><tr><td>Grafikas</td><td>Etapai, datos prielaidos ir jūsų sprendimų terminai</td><td>Kad preliminari data jau yra galutinis įsipareigojimas</td></tr></tbody></table></div></section>
<section><h2>Tęskite nuo realaus projekto</h2><p>Peržiūrėkite <a href="/baldai-pagal-uzsakyma/virtuves-baldai">virtuvės baldų kandidatų kategoriją</a> arba, pavyzdžiui, <a href="/baldai-pagal-uzsakyma/vilnius">Vilniaus miesto kandidatų puslapį</a>. Pasirinktiems kandidatams parenkite vienodą aprašą <a href="/gauti-pasiulymus">projekto užklausos formoje</a>.</p></section>`,
    faq: [
      { question: 'Ar katalogo įrašas reiškia, kad gamintojas patikrintas?', answer: 'Ne. Įrašai yra iš viešų šaltinių surinkti, su gamintojais nepatvirtinti kandidatai. Tapatybę, aktualią veiklą, pasiūlymą ir tinkamumą projektui reikia tikrinti savarankiškai.' },
      { question: 'Kiek pasiūlymų verta lyginti?', answer: 'Svarbiau ne kandidatų skaičius, o vienoda užklausa ir pakankamai aiškūs atsakymai. Lyginkite tik tas pasiūlymų versijas, kuriose apimtis, medžiagos, paslaugos ir išimtys aprašytos palyginamai.' },
      { question: 'Ar darbų nuotraukos patvirtina kokybę?', answer: 'Vien nuotraukos nepatvirtina autorystės, medžiagų, konstrukcijos ar ilgalaikio rezultato. Paklauskite, kokia buvo kandidato darbų apimtis, ir paprašykite aktualių panašaus projekto pavyzdžių.' },
    ],
  },
  {
    slug: 'virtuves-baldu-kainos',
    title: 'Virtuvės baldų kainos: ribos ir kainą keičiantys sprendimai',
    summary: 'Dvi aiškiai atskirtos viešų šaltinių nuorodos, jų datos ir praktinis sąrašas, kas keičia individualaus projekto kainą.',
    metaDescription: 'Viešų šaltinių virtuvės baldų kainų nuorodos su datomis ir paaiškinimu: ką reiškia €/m, kas keičia kainą ir ko gali nebūti pirminiame pasiūlyme.',
    hubLabel: 'Kaina ir apimtis',
    featured: true,
    content: `<section><h2>Kainos orientyras nėra jūsų projekto sąmata</h2><p>Individualių baldų kainą lemia ne vien ilgis. Tą patį išorinį matmenį gali sudaryti skirtingas spintelių kiekis, furnitūra, fasadai, stalviršis, apšvietimas, buitinės technikos integracija ir montavimo sąlygos. Todėl viešas rinkos rodiklis tinka tik kontekstui, o sprendimui reikia konkrečios apimties pasiūlymo.</p><p class="inline-warning"><strong>Svarbu:</strong> toliau pateiktų šaltinių nejungiame į vidurkį, nelyginame kaip vienalaikių kainoraščių ir nedauginame iš numanomo virtuvės ilgio. €/m nėra viso projekto kaina.</p></section>
<section><h2>Datuoti viešų šaltinių orientyrai</h2><div class="source-block"><article><h3>Dinaminė platformos nuoroda</h3><p><strong>300–800 €/m, vidurkis 548 €/m</strong> už virtuvės baldų gamybą pagal užsakymą. <span class="source-citation">Šaltinis: <a href="https://paslaugos.lt/virtuves-baldai-gamyba" rel="noopener noreferrer">Paslaugos.lt, „Virtuvės baldai gamyba“</a>; puslapio žyma „Kainos 2026 m.“; peržiūrėta 2026-07-27.</span></p><p>Tai dinaminė paslaugų platformos nuoroda, kuri gali keistis. Joje pateiktas €/m rodiklis nėra konkretaus tiekėjo pasiūlymas ir nėra visos virtuvės projekto kaina.</p></article><article><h3>Istorinis 2022 m. kontekstas</h3><p><strong>800–1000 €/m</strong> nurodyta kaip tuometinė virtuvės baldų rinkos kaina. <span class="source-citation">Šaltinis: <a href="https://www.15min.lt/verslas/naujiena/kvadratinis-metras/paslaugos-lt-kaip-virtuves-baldu-gamyba-paversti-atsiperkancia-investicija-971-1635694" rel="noopener noreferrer">15min / Paslaugos.lt</a>; publikuota 2022-02-01; peržiūrėta 2026-07-27.</span></p><p>Tai istorinis 2022 m. kontekstas ir reklaminis, užsakovo kontroliuojamas turinys, o ne dabartinė rinkos citata ar jūsų projektui galiojantis pasiūlymas.</p></article></div></section>
<section><h2>Kas praktiškai keičia projekto kainą</h2><ul><li><strong>Korpuso ir fasadų medžiagos:</strong> plokščių rūšis, dekoras, dažymas, faneruotė, masyvas, briaunos ir nestandartinės detalės.</li><li><strong>Furnitūra ir vidaus įranga:</strong> lankstai, stalčiai, pakėlimo mechanizmai, kampų sprendimai, krepšiai ir jų kiekis.</li><li><strong>Stalviršis ir sienelė:</strong> medžiaga, storis, sujungimai, išpjovos, matavimas ir atskiras montavimas.</li><li><strong>Geometrija:</strong> aukštos spintos, salos, kampai, nišos, nelygios sienos, uždengimai ir priderinimas prie komunikacijų.</li><li><strong>Integruojama įranga:</strong> buitinės technikos modeliai, apšvietimas, elektros bei santechnikos taškai ir jų suderinimas.</li><li><strong>Paslaugų apimtis:</strong> matavimas, projektavimas, vizualizacijos, pristatymas, užnešimas, montavimas ir šiukšlių išvežimas.</li><li><strong>Logistika ir objektas:</strong> miestas, aukštas, privažiavimas, lifto galimybės, darbų laikas ir objekto parengtis.</li></ul></section>
<section><h2>Ko gali nebūti pirminiame pasiūlyme</h2><p>Nespręskite iš bendros sumos. Paprašykite prie pasiūlymo pažymėti „įtraukta“, „neįtraukta“ arba „bus tikslinama“ bent šioms pozicijoms:</p><div class="checklist-block"><ul><li>galutinis matavimas ir projekto korekcijos po jo;</li><li>stalviršis, sienelė, jų šablonavimas, išpjovos ir montavimas;</li><li>plautuvė, maišytuvas, buitinė technika ir apšvietimas;</li><li>santechnikos, elektros, vėdinimo ar apdailos darbai;</li><li>senų baldų išardymas ir išvežimas;</li><li>pristatymas, užnešimas, parkavimas, kelionė už miesto ribų;</li><li>montavimas, tvirtinimo medžiagos, silikonas ir baigiamieji sureguliavimai.</li></ul></div></section>
<section><h2>Kaip gauti palyginamą kainą</h2><p>Pridėkite patalpos matmenis, nuotraukas, pageidaujamą komplektaciją, medžiagų prioritetus, buitinės technikos modelius ir paslaugų ribas. Kandidatų galite ieškoti <a href="/baldai-pagal-uzsakyma/virtuves-baldai">virtuvės baldų kategorijoje</a> arba <a href="/baldai-pagal-uzsakyma/kaunas">Kauno miesto puslapyje</a>, o vienodą projekto santrauką pateikti <a href="/gauti-pasiulymus">projekto užklausos formoje</a>.</p></section>`,
    faq: [
      { question: 'Ar galima €/m rodiklį padauginti iš virtuvės ilgio?', answer: 'Ne. Šaltinių €/m rodiklis nėra viso projekto kaina ir neapibrėžia vienodos komplektacijos. Skirtingi spintelių tipai, medžiagos, furnitūra, stalviršis, paslaugos ir montavimo sąlygos gali iš esmės pakeisti pasiūlymą.' },
      { question: 'Kodėl pateikti šaltiniai nesujungiami į vieną vidurkį?', answer: 'Jie yra skirtingo laiko ir pobūdžio: vienas yra dinaminė platformos nuoroda, kitas – istorinis reklaminis 2022 m. turinys. Jų sujungimas sudarytų klaidinantį tikslumo įspūdį.' },
      { question: 'Ką paprašyti įrašyti į kainos pasiūlymą?', answer: 'Paprašykite išvardyti gaminius, medžiagas, furnitūrą, stalviršį, matavimą, projektavimą, pristatymą, užnešimą, montavimą, papildomus darbus, išimtis ir sąlygas, kurioms pasikeitus kaina būtų perskaičiuota.' },
    ],
  },
  {
    slug: 'virtuves-ir-imontuojamu-baldu-projekto-eiga',
    title: 'Virtuvės ir įmontuojamų baldų projekto eiga',
    summary: 'Tipinė etapų seka nuo matavimo iki montavimo ir kontrolinis sąrašas sprendimams, kurie veikia grafiką.',
    metaDescription: 'Virtuvės ar įmontuojamų baldų projekto kontrolinis sąrašas: tipinė eiga nuo matavimo ir brėžinių iki gamybos, pristatymo bei montavimo.',
    hubLabel: 'Projekto eiga',
    featured: true,
    content: `<section><h2>Tipinė seka, o ne fiksuotas kalendorius</h2><p>Skirtingi gamintojai etapus gali jungti ar vadinti kitaip. Svarbu, kad prieš gamybą būtų aišku, kas išmatuota, kas patvirtinta, kas dar sprendžiama ir nuo kurio įvykio skaičiuojamos sutartos datos.</p><p class="inline-warning"><strong>Fiksuotos trukmės nėra:</strong> datos priklauso nuo galutinio matavimo, jūsų sprendimų ir patvirtinimų, medžiagų prieinamumo, gamybos pajėgumo bei objekto parengties.</p></section>
<section><h2>Etapai nuo matavimo iki montavimo</h2><ol class="stage-list"><li><div><h3>Pirminis matavimas ir objekto informacija</h3><p>Užfiksuojami pagrindiniai matmenys, sienos, kampai, grindys, komunikacijos, privažiavimas ir žinomi apribojimai. Pažymėkite, ar patalpa dar keisis.</p></div></li><li><div><h3>Poreikio ir komplektacijos aprašas</h3><p>Sutarkite funkcijas, laikymo poreikį, buitinę techniką, medžiagų kryptį, vidaus įrangą ir paslaugas, kurias turi apimti pasiūlymas.</p></div></li><li><div><h3>Planavimo variantas ir pirminis pasiūlymas</h3><p>Patikrinkite, kokiomis prielaidomis remiasi išdėstymas bei kaina ir kurios pozicijos dar preliminarios.</p></div></li><li><div><h3>Galutinis matavimas parengtame objekte</h3><p>Prieš gamybą patvirtinama faktinė geometrija. Iš anksto sutarkite, kada sienos, grindys, lubos ir komunikacijos laikomos pakankamai parengtos galutiniam matavimui.</p></div></li><li><div><h3>Brėžinių, medžiagų ir įrangos patvirtinimas</h3><p>Patvirtinkite matmenis, fasadų dalijimą, atidarymus, spalvas, kodus, furnitūrą, stalviršį, rankenėles, apšvietimą ir technikos modelius.</p></div></li><li><div><h3>Galutinė apimtis, kaina ir mokėjimo etapai</h3><p>Vienoje dokumentų versijoje turi sutapti brėžiniai, specifikacija, įtraukti darbai, išimtys, pakeitimų tvarka ir mokėjimo sąlygos.</p></div></li><li><div><h3>Gamyba ir sprendinių kontrolė</h3><p>Išsiaiškinkite, kas laikoma gamybos pradžia, kaip pranešama apie medžiagų ar sprendinių pasikeitimus ir kam reikia jūsų patvirtinimo.</p></div></li><li><div><h3>Pristatymo ir objekto parengties patikra</h3><p>Prieš atvežimą patvirtinkite datą, patekimą, užnešimą, laisvą darbo zoną, veikiančias komunikacijas ir kitų meistrų darbų suderinimą.</p></div></li><li><div><h3>Montavimas, patikra ir perdavimas</h3><p>Patikrinkite komplektaciją, reguliavimą, paviršius, tarpelius ir veikimą. Neužbaigtus ar taisytinus punktus užrašykite kartu su tolimesniais veiksmais.</p></div></li></ol></section>
<section><h2>Sprendimai, kuriuos verta turėti prieš galutinį patvirtinimą</h2><div class="checklist-block"><ul><li>tikslūs įmontuojamos buitinės technikos modeliai ir montavimo schemos;</li><li>vandens, nuotekų, elektros, dujų ir vėdinimo taškų vietos;</li><li>grindų, sienų, lubų ir apdailos baigtumo būsena;</li><li>fasadų, korpusų, stalviršio, rankenėlių ir furnitūros kodai;</li><li>durų bei stalčių atidarymo trajektorijos, praėjimai ir gretimi elementai;</li><li>kas montuoja stalviršį, techniką, santechniką, apšvietimą ir apdailos detales;</li><li>kas turi būti objekte montavimo dieną ir kas priima darbus.</li></ul></div></section>
<section><h2>Grafiką valdykite pagal prielaidas</h2><p>Vietoje vienos datos paprašykite etapų: kada reikalingi jūsų sprendimai, kada galimas galutinis matavimas, kada patvirtinama gamyba, koks pristatymo langas ir kada derinamas montavimas. Jei patalpa ar komplektacija pasikeičia, paprašykite atnaujintos grafiko versijos.</p></section>
<section><h2>Raskite kandidatą ir paruoškite tą patį aprašą</h2><p>Pradėti galite nuo <a href="/baldai-pagal-uzsakyma/spintos-ir-imontuojami-baldai">spintų ir įmontuojamų baldų kategorijos</a> arba <a href="/baldai-pagal-uzsakyma/klaipeda">Klaipėdos miesto puslapio</a>. Projekto etapams svarbią informaciją surinkite <a href="/gauti-pasiulymus">projekto užklausos formoje</a>.</p></section>`,
    faq: [
      { question: 'Kada verta atlikti galutinį matavimą?', answer: 'Kai gamintojas gali patikimai įvertinti galutinę patalpos geometriją ir sutartas komunikacijas. Iš anksto suderinkite, kokie apdailos darbai turi būti užbaigti ir kas nutiks, jei po matavimo objektas pasikeis.' },
      { question: 'Nuo kada skaičiuojamas gamybos terminas?', answer: 'Tai turi būti aiškiai sutarta pasiūlyme ar sutartyje. Pradžios įvykis gali būti siejamas su galutiniu matavimu, brėžinių ir medžiagų patvirtinimu, mokėjimu ar kitomis sąlygomis, todėl jo nereikėtų numanyti.' },
      { question: 'Kas turi būti paruošta montavimo dieną?', answer: 'Patvirtinkite laisvą darbo zoną, patekimą ir užnešimą, grindų bei sienų būklę, komunikacijų vietas, elektros prieigą, kitų meistrų darbų suderinimą ir asmenį, kuris galės priimti sprendimus.' },
    ],
  },
  {
    slug: 'medziagos-sutartis-avansas-garantija',
    title: 'Medžiagos, sutartis, avansas ir garantija: ką aptarti',
    summary: 'LMDP ir MDF, faneruotės, masyvo, stalviršių, furnitūros, briaunų, sutarties ir garantinio aptarnavimo klausimai.',
    metaDescription: 'Praktiniai klausimai apie baldų medžiagų specifikaciją, sutartį, avansą ir garantiją Lietuvoje – be teisinių pažadų ar numanomų sąlygų.',
    hubLabel: 'Dokumentai ir atsakomybės',
    featured: true,
    content: `<section><h2>Specifikacija turi leisti atpažinti pasirinktą medžiagą</h2><p>Bendriniai žodžiai, tokie kaip „kokybiška plokštė“ ar „gera furnitūra“, neleidžia patikrinti, ar pasiūlymai vienodi. Paprašykite identifikatorių, pagal kuriuos sprendinį būtų galima atsekti pasiūlyme, brėžiniuose ir priėmimo metu.</p><div class="checklist-block"><ul><li>gamintojas, kolekcija, dekoras ar spalva ir produkto kodas;</li><li>storis, paviršiaus tipas, briaunos ir matomos bei vidinės pusės;</li><li>fasadų, korpusų, nugarėlių, stalviršio ir sienelės medžiagos atskirai;</li><li>lankstų, stalčių, pakėlimo mechanizmų ir vidaus įrangos modeliai ar klasė;</li><li>patvirtintas pavyzdys ir kas nutinka, jei pasirinkta medžiaga tampa neprieinama;</li><li>priežiūros reikalavimai, kuriuos svarbu žinoti prieš pasirenkant.</li></ul></div></section>
<section><h2>Medžiagų pavadinimus paverskite palyginamais klausimais</h2><p>Žemiau pateiktos grupės nėra kokybės reitingas. Tas pats medžiagos pavadinimas gali apimti skirtingus pagrindus, paviršius, storius, apdirbimą ir priežiūros sąlygas, todėl sprendimą grįskite konkrečiu pavyzdžiu bei rašytine specifikacija.</p><div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Baldų medžiagų ir komplektacijos klausimų lentelė"><table><thead><tr><th>Sprendinys</th><th>Paprastai ką reiškia</th><th>Ką būtina paklausti</th></tr></thead><tbody><tr><td>LMDP ir MDF</td><td>LMDP dažnai siūloma korpusams ir lygiems dekoratyviniams paviršiams; MDF yra kitas medienos plaušų pagrindas, dažnai pasirenkamas dažomiems ar frezuojamiems fasadams. Tai nėra savaiminis ilgaamžiškumo įvertinimas.</td><td>Koks pagrindas, storis, paviršius, dekoro ar spalvos kodas, briaunos ir kur tiksliai kiekviena plokštė naudojama?</td></tr><tr><td>Faneruotė ir medžio masyvas</td><td>Faneruotė yra plonas natūralios medienos sluoksnis ant nurodyto pagrindo; masyvo detalės gaminamos iš natūralios medienos. Abiem atvejais raštas ir atspalvis gali skirtis.</td><td>Kokia medienos rūšis, pagrindas ar konstrukcija, rašto atranka, sujungimai, apdaila, leidžiama variacija ir priežiūra?</td></tr><tr><td>Stalviršiai</td><td>Laminuota plokštė, kompaktinis laminatas, mediena, kompoziciniai paviršiai ir natūralus akmuo skiriasi ne tik medžiaga, bet ir briaunomis, sujungimais, išpjovomis, priežiūra bei montavimu.</td><td>Kas įtraukta į matavimą ar šablonavimą, išpjovas, sujungimus, sienelę, transportą ir montavimą? Kokia konkretaus paviršiaus priežiūros instrukcija?</td></tr><tr><td>Furnitūra ir briaunos</td><td>Lankstai, stalčių bėgeliai, pakėlimo mechanizmai ir plokštės briaunos yra atskiros komplektacijos dalys; bendrinis gamintojo vardas neapibrėžia modelio ar funkcijos.</td><td>Koks tikslus modelis, apkrova ar funkcija, atidarymo būdas, reguliavimas, garantijos dokumentas, briaunos medžiaga, storis ir kurios kraštinės dengiamos?</td></tr></tbody></table></div></section>
<section><h2>Techninius teiginius tikrinkite pagal konkretaus produkto dokumentus</h2><p>Gamintojų techniniai puslapiai padeda suprasti, kokių identifikatorių ir priežiūros dokumentų prašyti, tačiau jie nepakeičia jūsų pasiūlyme nurodyto produkto. Pavyzdžiui, <a href="https://www.blum.com/eu/en/products/hingesystems/overview/" rel="noopener noreferrer">„Blum“ vyrių sistemų apžvalga</a> rodo, kad furnitūra skirstoma pagal konkrečias sistemas ir pritaikymą, o <a href="https://www.caesarstone.com/care-maintenance/quartz-mineral-surfaces/" rel="noopener noreferrer">„Caesarstone“ paviršių priežiūros instrukcija</a> iliustruoja, kodėl stalviršio priežiūrą reikia tikrinti pagal pasirinktą produktą, o ne vien bendrinį medžiagos pavadinimą.</p><p>Virtuvės projekto kainos kontekstui naudokite atskirą <a href="/gidas/virtuves-baldu-kainos/">viešų kainų nuorodų gidą</a>: jame pateikti datuoti Paslaugos.lt ir istorinio 15min / Paslaugos.lt turinio šaltiniai aiškiai atskirti nuo konkretaus projekto sąmatos.</p></section>
<section><h2>Ką praktiškai sutikrinti sutartyje ir jos prieduose</h2><p>Šis sąrašas nėra teisinė konsultacija. Jo paskirtis – padėti pastebėti trūkstamą projekto informaciją prieš pasirašant ar mokant.</p><ul><li>Kas tiksliai yra sutarties šalys ir ar jų duomenys sutampa su pasiūlymu, sąskaita bei mokėjimo gavėju?</li><li>Kuris brėžinių, specifikacijos ir pasiūlymo variantas yra galutinis, kaip pažymėta jo data ar versija?</li><li>Kokie gaminiai ir darbai įtraukti, o kas aiškiai neįtraukta?</li><li>Ar kaina nurodyta su taikomais mokesčiais ir kada ji gali būti perskaičiuota?</li><li>Nuo kokio įvykio skaičiuojami etapai ir kokių jūsų sprendimų reikia iki konkrečių datų?</li><li>Kaip raštu tvirtinami pakeitimai, papildomi darbai ir jų poveikis kainai bei grafikui?</li><li>Kaip vyks pristatymas, montavimas, darbų patikra, trūkumų užrašymas ir perdavimas?</li><li>Kokia sutarta komunikacijos bei dokumentų saugojimo tvarka?</li></ul></section>
<section><h2>Prieš mokant avansą</h2><div class="checklist-block"><ul><li>patikrinkite, kam tiksliai mokate ir kokiu dokumentu mokėjimas pagrįstas;</li><li>paprašykite nurodyti avanso paskirtį ir su kokiu projekto etapu jis siejamas;</li><li>išsiaiškinkite likusių mokėjimų etapus ir kokį rezultatą patikrinsite prieš kiekvieną mokėjimą;</li><li>raštu aptarkite, kas nutinka projektui sustojus, pasikeitus apimčiai ar medžiagoms;</li><li>išsaugokite pasirašytą versiją, sąskaitas, mokėjimo patvirtinimus, brėžinius ir susirašinėjimą.</li></ul></div><p>Nenumanykite, kad visiems projektams taikoma vienoda avanso, grąžinimo ar atšaukimo tvarka. Vertinkite konkrečius dokumentus ir, jei sąlyga neaiški ar reikšminga, prieš mokėdami kreipkitės į kompetentingą teisininką ar oficialų vartotojų teisių informacijos šaltinį.</p></section>
<section><h2>Klausimai apie garantiją ir aptarnavimą</h2><ul><li>Kokia raštu nurodyta garantijos trukmė ir nuo kokio įvykio ji skaičiuojama?</li><li>Kurioms gaminio dalims, furnitūrai ir darbams taikomos skirtingos sąlygos?</li><li>Kokios naudojimo, priežiūros ar aplinkos sąlygos nurodytos kaip svarbios?</li><li>Kur ir kokia forma pranešti apie problemą, kokius vaizdus ar dokumentus pridėti?</li><li>Kas organizuoja apžiūrą, dalių užsakymą, atvykimą ir pakartotinį reguliavimą?</li><li>Kaip užrašomi montavimo metu pastebėti trūkumai ir sutarti jų taisymo veiksmai?</li></ul><p class="inline-warning"><strong>Atsargi riba:</strong> gidas nežada konkretaus teisinio rezultato ir nepakeičia aktualių teisės aktų, sutarties ar individualios konsultacijos. Ginčo atveju remkitės dokumentais ir oficialia Lietuvos vartotojų teisių informacija.</p></section>
<section><h2>Kur tikrinti vartotojo teisių informaciją</h2><p>Šis gidas nėra teisinė konsultacija. Aktualią oficialią informaciją apie vartotojų teises, garantijas ir galimus veiksmus rasite <a href="https://vvtat.lrv.lt/lt/veiklos-sritys-54/ne-maisto-produktai-55/vartotoju-teises-ir-garantijos-714/" rel="noopener noreferrer">VVTAT vartotojų teisių ir garantijų puslapyje</a> bei <a href="https://vvtat.lrv.lt/lt/DUK/" rel="noopener noreferrer">VVTAT dažniausiai užduodamuose klausimuose</a>. Oficialų paaiškinimą visada sutikrinkite su savo sutartimi ir konkrečiomis aplinkybėmis.</p></section>
<section><h2>Dokumentus susiekite su konkrečiu projektu</h2><p>Kandidatų galite ieškoti <a href="/baldai-pagal-uzsakyma/miegamojo-ir-vonios-baldai">miegamojo ir vonios baldų kategorijoje</a> arba <a href="/baldai-pagal-uzsakyma/siauliai">Šiaulių miesto puslapyje</a>. Projekto informaciją pradėkite struktūruoti <a href="/gauti-pasiulymus">projekto užklausos formoje</a>, o galutines sąlygas patvirtinkite tiesiogiai su pasirinktu kandidatu.</p></section>`,
    faq: [
      { question: 'Ar pakanka pasiūlyme įrašyti tik medžiagos rūšį?', answer: 'Dažnai ne. Palyginimui naudinga turėti gamintoją, kolekciją, dekorą ar spalvą, kodą, storį, paviršių ir informaciją, kur konkreti medžiaga naudojama.' },
      { question: 'Ką patikrinti prieš mokant avansą?', answer: 'Sutikrinkite sutarties šalį ir mokėjimo gavėją, galutinę projekto versiją, avanso paskirtį, mokėjimo etapus, pakeitimų tvarką ir dokumentą, kuriuo mokėjimas pagrįstas.' },
      { question: 'Ar šiame gide aprašytos garantijos sąlygos taikomos visiems?', answer: 'Ne. Gidas pateikia klausimus, o ne vienodas teisines sąlygas ar pažadus. Reikia skaityti konkrečią sutartį, garantijos dokumentus ir aktualią oficialią informaciją.' },
    ],
  },
  {
    slug: 'trumpasis-sarasas',
    title: 'Kaip sudaryti pagrįstą trumpąjį sąrašą',
    summary: 'Atrankos seka, patikrinami kriterijai ir klausimai prieš priimant pasiūlymą.',
    hubLabel: 'Trumpasis sąrašas',
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
    hubLabel: 'Užklausa ir pasiūlymas',
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
    hubLabel: 'Grafiko prielaidos',
    sections: [
      ['Vienas skaičius neparodo termino prielaidų', 'Grafiką gali keisti objekto parengtis, matavimas, sprendimų derinimas, medžiagų prieinamumas, gamybos eilė, logistika ir projekto pakeitimai.'],
      ['Prašykite grafiko etapais', 'Atskirai aptarkite galutinį matavimą, brėžinių ir medžiagų tvirtinimą, gamybos pradžią, pristatymo langą ir montavimą.'],
      ['Patvirtinkite, kada terminas tampa įsipareigojimu', 'Raštu išsiaiškinkite, nuo kokio įvykio skaičiuojamas laikas, kurios datos preliminarios ir kaip pasikeitimai perskaičiuoja grafiką.'],
    ],
  },
  {
    slug: 'spintos-ir-drabuzines-kaina',
    title: 'Spintos ir drabužinės kaina: ką apibrėžti prieš lyginant pasiūlymus',
    summary: 'Spintos ar drabužinės apimties, vidaus įrangos ir montavimo sąlygų klausimai, kurie padeda palyginti pasiūlymus be tariamos universalios kainos.',
    metaDescription: 'Spintos ir drabužinės pagal užsakymą kainą keičiantys sprendimai: apimtis, durys, vidaus įranga, matavimas, montavimas ir klausimų sąrašas.',
    hubLabel: 'Spintos ir drabužinės',
    featured: true,
    buyerIntent: true,
    categoryCode: 'W',
    citySlug: 'vilnius',
    content: `<section><h2>Spintos kaina prasideda nuo apimties, ne nuo vieno skaičiaus</h2><p>Spinta nišoje, prieškambario sprendinys ir atskira drabužinė gali turėti panašų plotį, tačiau skiriasi korpusais, durimis, vidaus įranga, apdaila ir montavimo darbais. Todėl universali kaina būtų klaidinanti: palyginti verta tik pasiūlymus, kuriuose vienodai aprašyta, kas bus pagaminta ir sumontuota.</p><p>Prieš prašydami kainos nusibrėžkite sienas, angas, lubų aukštį, grindjuostes, elektros taškus ir numatytą naudojimą. Preliminarus eskizas padeda pradėti pokalbį, o galutiniams sprendiniams paprastai reikia patikslinto matavimo.</p></section>
<section><h2>Kas dažniausiai keičia pasiūlymo apimtį</h2><ul><li><strong>Vieta ir geometrija:</strong> niša, kampas, šlaitinės lubos, nelygios sienos, uždengimai ir priderinimas prie esamos apdailos.</li><li><strong>Durų sprendinys:</strong> varstomos ar stumdomos durys, jų skaičius, profiliai, veidrodžiai, stiklas, frezavimas ir rankenėlės.</li><li><strong>Vidus:</strong> lentynų, stalčių, pakabų, krepšių, ištraukiamų mechanizmų bei apšvietimo kiekis ir išdėstymas.</li><li><strong>Medžiagos ir apdaila:</strong> korpuso plokštė, fasadų specifikacija, briaunos, spalvos, matomi šonai bei galinės sienelės.</li><li><strong>Paslaugos:</strong> matavimas, projektavimas, senos spintos išmontavimas, pristatymas, užnešimas, montavimas ir baigiamasis sureguliavimas.</li></ul></section>
<section><h2>Klausimai vienodai užklausai</h2><div class="checklist-block"><ul><li>Ar pasiūlyme nurodyti išoriniai matmenys ir kiekvienos sekcijos vidaus įranga?</li><li>Koks tikslus durų, profilių, plokščių, briaunų ir furnitūros pavadinimas ar kodas?</li><li>Ar įskaičiuoti uždengimai, grindjuosčių išpjovos, nelygumų kompensavimas ir tvirtinimas?</li><li>Kas matuojama prieš gamybą ir kurie brėžiniai turi būti patvirtinti raštu?</li><li>Kas įtraukta į pristatymą, užnešimą bei montavimą, o kas būtų papildomas darbas?</li><li>Kaip fiksuojami pakeitimai, jei po matavimo keičiasi niša, vidaus poreikiai ar pasirinktos medžiagos?</li></ul></div><p class="inline-warning"><strong>Palyginimo taisyklė:</strong> mažesnė bendra suma nepasako, ar durų, vidaus įrangos ir montavimo apimtis tokia pati. Paprašykite kiekvieną išimtį pažymėti raštu.</p></section>`,
    faq: [
      { question: 'Ar galima nustatyti spintos kainą vien pagal plotį?', answer: 'Ne. Plotis neapibrėžia durų tipo, vidaus įrangos, medžiagų, geometrijos, matavimo ir montavimo darbų. Palyginti galima tik aiškiai aprašytą vienodą apimtį.' },
      { question: 'Kada verta prašyti galutinio pasiūlymo?', answer: 'Kai patalpos apdaila, angos, grindys ir svarbūs komunikacijų sprendiniai yra pakankamai aiškūs galutiniam matavimui. Iki jo pasiūlyme verta atskirti prielaidas nuo patvirtintų sprendinių.' },
      { question: 'Ką nusiųsti pirmoje užklausoje?', answer: 'Pridėkite nuotraukas, apytikslius matmenis, eskizą, pageidaujamą durų tipą, vidaus poreikius, miestą ir informaciją apie prieigą montavimui. Tai nėra galutinio matavimo pakaitalas.' },
    ],
  },
  {
    slug: 'mdf-faneruote-masyvas-fasadai',
    title: 'MDF, faneruotė ar masyvas fasadams: klausimai prieš pasirenkant',
    summary: 'Dažytų ir plėvele dengtų MDF, faneruotų bei medžio masyvo fasadų specifikacijos, pavyzdžiai, priežiūra ir kompromisai.',
    metaDescription: 'MDF, faneruotės ir medžio masyvo fasadai: kaip prašyti tikslios specifikacijos, palyginti pavyzdžius, priežiūrą, apdailą ir pasiūlymo ribas.',
    hubLabel: 'Fasadai ir medžiagos',
    featured: true,
    buyerIntent: true,
    categoryCode: 'K',
    citySlug: 'kaunas',
    content: `<section><h2>Pavadinimas dar neapibrėžia fasado</h2><p>„MDF“, „faneruotė“ ar „masyvas“ nurodo skirtingas medžiagų grupes, tačiau vien žodis nepasako apie pagrindą, apdailą, kraštus, spalvą, raštą ar konkrečią gamybos technologiją. Dažytas MDF ir plėvele dengtas MDF taip pat nėra tas pats sprendinys. Prašykite pasiūlyme įrašyti medžiagą taip, kad ją galėtumėte atpažinti vėliau.</p><p>Šiame gide nėra universalaus reitingo. Tinkamas pasirinkimas priklauso nuo naudojimo, vizualaus rezultato, patalpos sąlygų, priežiūros įpročių, biudžeto ir to, ką konkrečiai gali įgyvendinti gamintojas.</p></section>
<section><h2>Kaip aptarti skirtingas grupes</h2><div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Fasadų medžiagų klausimų lentelė"><table><thead><tr><th>Medžiagos grupė</th><th>Ką patikslinti</th><th>Ką palyginti pavyzdyje</th></tr></thead><tbody><tr><td>Dažytas MDF</td><td>Pagrindo storį, dažymo sistemą, blizgumo lygį, frezavimą, matomas briaunas ir spalvos kodą</td><td>Spalvą skirtingoje šviesoje, frezuotą profilį, kampus ir valymo rekomendaciją</td></tr><tr><td>Plėvele dengtas MDF</td><td>Plėvelės tipą, raštą, paviršiaus tekstūrą, frezavimo ribas ir kraštų sprendimą</td><td>Rašto kartojimą, kampus, rankenėlių vietas ir priežiūros nurodymus</td></tr><tr><td>Faneruotė</td><td>Medienos rūšį, faneruotės pjūvį ir atranką, pagrindą, laką ar alyvą, rašto derinimą</td><td>Natūralius atspalvio bei rašto skirtumus, sujungimus ir apdailos atnaujinimo tvarką</td></tr><tr><td>Medžio masyvas</td><td>Medienos rūšį, konstrukciją, sujungimus, drėgmės sąlygų prielaidas ir apdailą</td><td>Šakotumą, spalvos variaciją, judėjimą bei gamintojo priežiūros rekomendaciją</td></tr></tbody></table></div></section>
<section><h2>Pavyzdžiai ir priežiūra yra specifikacijos dalis</h2><p>Paprašykite realaus pavyzdžio arba aiškiai identifikuoto gamintojo mėginio ir peržiūrėkite jį prie numatyto apšvietimo. Užrašykite, kuri fasado pusė, rankenėlės, frezavimas ir spalva buvo patvirtinti. Natūralioms medžiagoms aptarkite leidžiamą rašto bei atspalvio variaciją, o visoms grupėms – kokias valymo priemones ir naudojimo sąlygas rekomenduoja konkrečios medžiagos tiekėjas ar gamintojas.</p><div class="checklist-block"><h3>Ką įrašyti į pasiūlymą</h3><ul><li>fasado medžiaga, storis, apdailos pavadinimas, kolekcija ir spalvos ar dekoro kodas;</li><li>matomos ir nematomos briaunos, frezavimas, rankenėlės bei stiklo ar metalo intarpai;</li><li>patvirtinto pavyzdžio data ir ar natūralaus rašto skirtumai laikomi numatyta savybe;</li><li>priežiūros rekomendacijos ir kam pranešti, jei prieš montavimą pastebite neatitikimą.</li></ul></div></section>`,
    faq: [
      { question: 'Ar MDF visada reiškia dažytą fasadą?', answer: 'Ne. MDF yra pagrindas, o apdaila gali būti skirtinga, pavyzdžiui, dažyta ar plėvele dengta. Pasiūlyme prašykite nurodyti visą fasado specifikaciją.' },
      { question: 'Ar faneruotė ir masyvas turi atrodyti visiškai vienodai?', answer: 'Natūrali mediena gali turėti rašto ir atspalvio skirtumų. Prieš patvirtinimą aptarkite, koks pavyzdys, atranka ir rašto derinimas yra numatyti konkrečiam projektui.' },
      { question: 'Kaip palyginti fasadų pasiūlymus?', answer: 'Lyginkite ne bendrinius pavadinimus, o pagrindą, storį, apdailą, kodą, frezavimą, briaunas, furnitūrą, priežiūrą ir pavyzdžio patvirtinimą.' },
    ],
  },
  {
    slug: 'kvarcas-ar-akmuo-stalvirsiui',
    title: 'Kvarcas ar natūralus akmuo stalviršiui: apimtis, priežiūra ir klausimai',
    summary: 'Kompozicinio kvarco ir natūralaus akmens stalviršių pasirinkimą padedantis struktūruoti kontrolinis sąrašas – nuo šablonavimo iki sujungimų ir montavimo.',
    metaDescription: 'Kvarco kompozito ir natūralaus akmens stalviršiai: ką patikslinti apie šablonavimą, išpjovas, sujungimus, montavimą, priežiūrą ir kainos apimtį.',
    hubLabel: 'Stalviršiai',
    featured: true,
    buyerIntent: true,
    categoryCode: 'K',
    citySlug: 'vilnius',
    content: `<section><h2>Stalviršį lyginkite kaip paslaugų ir medžiagos komplektą</h2><p>Kompozicinis kvarcas ir natūralus akmuo yra skirtingos medžiagų grupės, todėl sprendimą verta grįsti konkrečia plokšte, jos apdaila, virtuvės geometrija ir naudojimo būdu. Be paties paviršiaus, pasiūlymo apimtį gali sudaryti galutinis šablonavimas, išpjovos, briaunos, sujungimai, transportas, užnešimas ir montavimas.</p><p>Viešas kainos skaičius neapibrėžia šios apimties. Bendram virtuvės projekto kontekstui žiūrėkite <a href="/gidas/virtuves-baldu-kainos/">datuotas Paslaugos.lt ir istorinio 15min / Paslaugos.lt nuorodas</a>, tačiau jų €/m rodiklių nenaudokite stalviršio ar savo projekto sąmatai.</p></section>
<section><h2>Prieš pasirinkdami patikrinkite visą apimtį</h2><ul><li><strong>Plokštė ir išvaizda:</strong> kolekcija, spalva, raštas, storis, paviršiaus apdaila, briaunų profilis ir matomi kraštai.</li><li><strong>Matavimas:</strong> kada galima atlikti galutinį šablonavimą, ar korpusai ir sienų apdaila jau turi būti įrengti, kas tvirtina brėžinį.</li><li><strong>Išpjovos:</strong> kaitlentė, plautuvė, maišytuvas, dozatorius, lizdai, ventiliacija, nutekėjimo grioveliai ir jų atsakomybės ribos.</li><li><strong>Sujungimai ir atramos:</strong> kur jie bus, kaip atrodys, ar reikia papildomų konstrukcinių sprendimų, bei kaip derinamos salos ir sienelės.</li><li><strong>Logistika:</strong> plokščių atnešimo kelias, aukštas, liftas, laiptai, montavimo langas ir objekto apsauga.</li></ul></section>
<section><h2>Priežiūros klausimai nėra vien formalumas</h2><p>Prašykite konkrečios pasirinkto paviršiaus priežiūros instrukcijos: ką naudoti kasdien, ko vengti, kaip elgtis su dėmėmis, kaitra, smūgiais ir chemikalais. Nelaikykite vienos medžiagos pavadinimo pažadu apie visas konkretaus tiekėjo plokštes. Pavyzdį apžiūrėkite realioje šviesoje ir iš anksto aptarkite, kaip prieš montavimą bus tikrinama spalva bei raštas.</p><div class="checklist-block"><h3>Klausimai pasiūlymui</h3><ul><li>Ar į kainą įtrauktas galutinis šablonavimas, brėžinys, išpjovos, sujungimai ir montavimas?</li><li>Koks tikslus plokštės pavadinimas, storis, apdaila ir briaunų sprendinys?</li><li>Kas nustato ir patvirtina įrangos išpjovų vietas bei montavimo instrukcijas?</li><li>Kur numatyti sujungimai ir kokios objekto sąlygos būtinos saugiam montavimui?</li><li>Kokią rašytinę priežiūros informaciją gausite konkrečiam paviršiui?</li></ul></div></section>`,
    faq: [
      { question: 'Ar viešos €/m² ribos parodo mano stalviršio kainą?', answer: 'Ne. Jos neapibrėžia konkrečios plokštės, storio, išeigos, šablonavimo, išpjovų, sujungimų, transporto ir montavimo. Naudokite jas tik kaip datuotą kontekstą, o ne kaip sąmatą.' },
      { question: 'Kada atlikti galutinį stalviršio matavimą?', answer: 'Tai suderinkite su pasirinktu tiekėju ir gamintoju. Paprastai būtina aiški korpusų, sienų, įrangos ir apdailos būklė, kad šablonavimas atitiktų realų objektą.' },
      { question: 'Ar kvarcas ir natūralus akmuo prižiūrimi vienodai?', answer: 'Nedarykite tokios prielaidos. Paprašykite pasirinktos plokštės tiekėjo ar montuotojo rašytinių priežiūros rekomendacijų ir jų laikykitės.' },
    ],
  },
  {
    slug: 'matavimas-ir-montavimas-kontrole',
    title: 'Galutinis matavimas ir montavimo diena: kontrolinis sąrašas',
    summary: 'Kokius dokumentus, sąlygas ir patikrinimus verta turėti prieš galutinį matavimą bei priimant sumontuotus baldus.',
    metaDescription: 'Baldų galutinio matavimo ir montavimo dienos kontrolinis sąrašas: objekto parengtis, brėžiniai, dokumentai, priėmimo patikra ir neatitikimų fiksavimas.',
    hubLabel: 'Matavimas ir montavimas',
    featured: true,
    buyerIntent: true,
    categoryCode: 'W',
    citySlug: 'kaunas',
    content: `<section><h2>Galutinis matavimas patvirtina realų objektą</h2><p>Bendras projekto eigos planas neatsako, ar konkreti patalpa jau paruošta matuoti. Prieš susitikimą patikrinkite, ar baigtos tos sienos, grindys, lubos, nišos ir komunikacijos, prie kurių bus derinami baldai. Jei dar numatyti plytelių, dažymo, grindjuosčių, pertvarų, elektros ar santechnikos pakeitimai, juos aiškiai aptarkite prieš tvirtinant matmenis.</p><p>Matavimo metu naudinga turėti vieną naujausią projekto versiją ir žinoti, kas priima sprendimus. Žodinis pakeitimas neturėtų likti vieninteliu įrašu: paprašykite atnaujinto brėžinio ar specifikacijos, kurioje aiškiai matosi, kas pasikeitė.</p></section>
<section><h2>Prieš galutinį matavimą paruoškite</h2><div class="checklist-block"><ul><li>adresą, kontaktą objekte ir saugų priėjimą prie visų matuojamų vietų;</li><li>naujausią planą su nišomis, įranga, durų atsidarymo kryptimis ir aukščiais;</li><li>informaciją apie grindų, sienų, lubų, plytelių, grindjuosčių bei apšvietimo galutinę būklę;</li><li>techninius buitinės įrangos, plautuvės, maišytuvo, gartraukio ar kitų integruojamų elementų modelius;</li><li>elektros, vandens, nuotekų, vėdinimo ir kitų taškų vietas, kurių po patvirtinimo neplanuojate keisti;</li><li>rašytinį sąrašą, kuriuos sprendinius reikia patvirtinti po matavimo: medžiagas, spalvas, rankenėles, išpjovas, furnitūrą ir paslaugų ribas.</li></ul></div></section>
<section><h2>Montavimo dienos priėmimo patikra</h2><p>Prieš pasirašydami priėmimo dokumentą skirkite laiko apžiūrai gerame apšvietime. Patikra nėra techninė ekspertizė, tačiau padeda konkrečiai užfiksuoti tai, ką galima matyti ir išbandyti montavimo metu.</p><ul><li>sutikrinkite gaminių kiekį, matomas spalvas, fasadus, rankenėles ir komplektaciją su patvirtinta versija;</li><li>atidarykite duris bei stalčius, patikrinkite lygius tarpus, reguliavimą, veikiančius mechanizmus ir prieigą prie įrangos;</li><li>apžiūrėkite matomus paviršius, briaunas, stiklą, stalviršį, sujungimus bei tvirtinimo vietas;</li><li>patikrinkite, ar montavimo vieta palikta saugi ir ar sutarta, kas atsako už likusius kitų rangovų darbus;</li><li>jei pastebėjote neatitikimą, nufotografuokite, aprašykite vietą ir paprašykite įrašyti į priėmimo ar darbų užbaigimo dokumentą kartu su tolimesne tvarka.</li></ul><p class="inline-warning"><strong>Neskubėkite užpildyti spragų prielaidomis:</strong> atskirkite pastebėjimą nuo jo priežasties ir susitarkite, kas bei kada pateiks atsakymą ar korekcijos planą.</p></section>`,
    faq: [
      { question: 'Ar galutiniam matavimui pakanka ankstyvo plano?', answer: 'Planą naudinga turėti, tačiau jis nepatvirtina realių apdailos, nišų ir komunikacijų matmenų. Su gamintoju sutarkite, kurios objekto sąlygos turi būti galutinės prieš matavimą.' },
      { question: 'Ką daryti, jei montuojant pastebiu neatitikimą?', answer: 'Ramiai jį aprašykite, nurodykite vietą, padarykite nuotraukas ir paprašykite rašytinai užfiksuoti tolimesnę nagrinėjimo ar korekcijos tvarką. Nepriskirkite priežasties jos nepatikrinus.' },
      { question: 'Ar priėmimo dokumentas turi būti pasirašytas iš karto?', answer: 'Dokumento reikšmę ir tvarką aptarkite su sutarties šalimi. Prieš pasirašant verta perskaityti, ką jis fiksuoja, ir įrašyti pastebimus neatitikimus ar sutartas tolesnes užduotis.' },
    ],
  },
  {
    slug: 'baldu-defektai-ir-garantinis-aptarnavimas',
    title: 'Baldų defektai ir garantinis aptarnavimas: kaip fiksuoti ir sekti',
    summary: 'Atsargus praktinis kelias, kaip dokumentuoti pastebėjimą, pranešti sutarties šaliai ir sekti sutartą korekcijos eigą.',
    metaDescription: 'Baldų defektų, neatitikimų ir garantinio aptarnavimo kontrolinis sąrašas: įrodymai, pranešimas, sutarties klausimai ir korekcijos sekimas be teisinių pažadų.',
    hubLabel: 'Defektai ir aptarnavimas',
    featured: true,
    buyerIntent: true,
    categoryCode: 'W',
    citySlug: 'vilnius',
    content: `<section><h2>Pirmiausia fiksuokite faktus, o ne išvadas</h2><p>Pastebėję pažeidimą, neveikiantį mechanizmą, neatitikimą brėžiniui ar reguliavimo poreikį, užrašykite, ką konkrečiai matote ir kada tai pastebėjote. Nufotografuokite bendrą vaizdą bei detalę, išsaugokite pasiūlymą, patvirtintus brėžinius, priėmimo dokumentus, sąskaitas ir ankstesnį susirašinėjimą. Tai padeda kitai šaliai suprasti situaciją ir išvengti skirtingų to paties fakto interpretacijų.</p><p>Šis gidas nėra teisinė konsultacija ir nenustato fiksuotų teisių ar terminų. Jūsų sutarties, garantijos, pateiktų dokumentų ir konkrečių aplinkybių turinį prireikus įvertinkite su tinkamu specialistu.</p></section>
<section><h2>Trumpas pranešimas, į kurį lengviau atsakyti</h2><div class="checklist-block"><h3>Įtraukite</h3><ul><li>užsakymo, sutarties ar pasiūlymo identifikatorių ir montavimo ar perdavimo datą, jei ją turite;</li><li>konkrečią vietą bei elementą, pavyzdžiui, „kairės aukštos spintos viršutinis fasadas“;</li><li>neutralų pastebėjimo aprašą: kas neveikia, kuo skiriasi nuo patvirtintos versijos ar kas matoma paviršiuje;</li><li>nuotraukas ar vaizdo įrašą, jei jie padeda parodyti situaciją;</li><li>prašymą patvirtinti gavimą ir nurodyti kitą vertinimo, atvykimo ar korekcijos žingsnį.</li></ul></div><p>Rašykite šaliai, su kuria sudarėte susitarimą ar kuri nurodyta dokumentuose. Išsaugokite išsiųstą versiją ir atsakymus vienoje vietoje.</p></section>
<section><h2>Stebėkite susitarimą iki užbaigimo</h2><p>Jei siūlomas reguliavimas, detalės keitimas ar apžiūra, paprašykite patvirtinti apimtį, atsakingą kontaktą ir numatomą laiką. Po atlikto darbo palyginkite rezultatą su užfiksuotu klausimu, o ne vien su bendru įspūdžiu. Jei lieka neišspręsta dalis, aiškiai nurodykite, kuri vieta dar neatitinka sutarto sprendimo.</p><ul><li>Kur dokumentuose aprašyta medžiaga, furnitūra, montavimas ir aptarnavimo tvarka?</li><li>Ar garantija ar kitas susitarimas numato registravimo kanalą, dokumentus ar sąlygas?</li><li>Ar pakeitimas, reguliavimas ir naujas pastebėjimas atskirti vienas nuo kito raštu?</li><li>Kada ir kaip patvirtinsite, kad konkretus sutartas darbas baigtas?</li></ul></section>`,
    faq: [
      { question: 'Ar kiekvienas pastebėjimas yra garantinis atvejis?', answer: 'To nereikėtų numanyti. Pateikite faktus ir peržiūrėkite savo sutartį, garantijos dokumentus bei kitos šalies atsakymą. Konkreti situacija gali priklausyti nuo aplinkybių ir susitarimo.' },
      { question: 'Kokias nuotraukas verta išsaugoti?', answer: 'Naudingas bendras vaizdas, detalė iš arti, vieta patalpoje ir prireikus palyginimas su patvirtintu brėžiniu ar specifikacija. Nuotraukos turėtų papildyti trumpą aiškų aprašą.' },
      { question: 'Kaip sekti korekcijos eigą?', answer: 'Vienoje vietoje laikykite pranešimą, atsakymą, sutartą veiksmą, datą ir rezultatą. Paprašykite raštu patvirtinti, ką konkrečiai numatoma patikrinti ar koreguoti.' },
    ],
  },
  {
    slug: 'mazo-buto-irengimas-pagal-uzsakyma',
    title: 'Mažo buto įrengimas pagal užsakymą: prioritetai ir užklausos sąrašas',
    summary: 'Kaip trumpai aprašyti mažo buto saugojimo, judėjimo, matavimo ir montavimo poreikius, kad pasiūlymas spręstų realų naudojimą.',
    metaDescription: 'Mažo buto baldai pagal užsakymą: saugojimo, judėjimo, matavimų, funkcijų ir montavimo prioritetai bei kontrolinis sąrašas užklausai.',
    hubLabel: 'Mažas butas',
    featured: true,
    buyerIntent: true,
    categoryCode: 'W',
    citySlug: 'kaunas',
    content: `<section><h2>Mažame bute pradėkite nuo judėjimo ir daiktų</h2><p>Maža patalpa nebūtinai reikalauja vieno „maksimalaus“ baldo. Pirmiausia aprašykite, kas joje gyvena, kur dedami kasdieniai daiktai, kaip atsidaro durys ir stalčiai, kur reikalingas praėjimas, sėdėjimas, miegas ar darbas. Tai padeda išvengti sprendinio, kuris užpildo tūrį, bet apsunkina naudojimą.</p><p>Suskaidykite poreikį į prioritetus: kas turi būti pasiekiama kasdien, kas gali būti laikoma aukščiau ar giliau, o ko apskritai nereikia įtraukti. Tada gamintojui lengviau pasiūlyti konstrukciją, o jums – palyginti, ar vidus ir fasadai sprendžia tą pačią užduotį.</p></section>
<section><h2>Trumpas brifas prieš pirmą pasiūlymą</h2><div class="checklist-block"><ul><li>patalpos planas, sienų ilgiai, lubų aukštis, langai, radiatoriai, durys ir jų atsidarymo kryptys;</li><li>nuotraukos, rodančios nišas, kampus, šlaitus, grindjuostes, lizdus, jungiklius ir kitus kliuvinius;</li><li>daiktų sąrašas su apytiksliais kiekiais: drabužiai, lagaminai, valymo priemonės, buitiniai prietaisai, darbo priemonės;</li><li>kas naudosis baldu ir kokiame aukštyje turi būti dažniausiai naudojamos zonos;</li><li>privalomos funkcijos, pavyzdžiui, darbo vieta, skalbyklės paslėpimas, vieta robotui siurbliui ar sulankstoma miego zona;</li><li>pastato ir montavimo sąlygos: aukštas, liftas, laiptai, parkavimas, darbų laikas bei jau baigta apdaila.</li></ul></div></section>
<section><h2>Praktiniai prioritetai projektavimui</h2><ul><li><strong>Praėjimai:</strong> prieš tvirtindami fasadus ir stalčius patikrinkite jų atsidarymo trajektorijas bei kasdienį kelią po kambarį.</li><li><strong>Pasiekiamumas:</strong> dažnai naudojamus daiktus numatykite patogioje zonoje; aukštas spintas ir gilius modulius vertinkite kartu su prieiga.</li><li><strong>Matavimo prielaidos:</strong> nepasikliaukite vien brėžiniu, jei planuojamos grindys, plytelės, pertvaros ar įranga dar keisis.</li><li><strong>Vientisa apimtis:</strong> pasiūlyme atskirkite baldus, apšvietimą, elektros pakeitimus, pristatymą ir montavimą, kad mažesnis pasiūlymas nereišktų mažiau nei tikėjotės.</li></ul><p class="inline-warning"><strong>Mažoje erdvėje svarbi seka:</strong> prieš patvirtindami galutinį sprendinį patikrinkite realią apdailą, įrangos modelius ir montavimo prieigą. Pakeitimai po gamybos pradžios gali paveikti apimtį ir grafiką.</p></section>`,
    faq: [
      { question: 'Ar verta užsakyti baldą iki galutinių matavimų?', answer: 'Ankstyvas planavimas padeda, tačiau galutiniai sprendiniai turėtų atsižvelgti į realią apdailą, nišas, įrangą ir komunikacijas. Su gamintoju išsiaiškinkite, kada atliekamas patvirtinantis matavimas.' },
      { question: 'Ką pirmiausia nurodyti mažo buto užklausoje?', answer: 'Nurodykite patalpos planą ir nuotraukas, naudotojus, daiktus, privalomas funkcijas, atsidarymo bei praėjimo ribas ir montavimo sąlygas. Bendras stiliaus įkvėpimas šios informacijos nepakeičia.' },
      { question: 'Kaip palyginti du skirtingus sprendinius?', answer: 'Pirmiausia sutikrinkite, ar abu sprendžia tuos pačius saugojimo ir judėjimo poreikius. Tada lyginkite medžiagas, vidinę įrangą, apšvietimą, matavimą, pristatymą ir montavimą.' },
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

function validIsoDate(value) {
  const iso = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? iso : '';
}

function recordVerificationDate(record) {
  return validIsoDate(record.verified_at)
    || validIsoDate(record.public_contact_checked_date)
    || validIsoDate(record.source_collection_date);
}

function contactRouteStatus(record) {
  const hasPhone = Boolean(String(record.public_phone ?? '').trim());
  const hasContactUrl = Boolean(publicUrl(record.public_contact_url));
  if (hasPhone && hasContactUrl) return 'public_phone_and_contact_url';
  if (hasPhone) return 'public_phone';
  if (hasContactUrl) return 'public_contact_url';
  if (record.no_public_contact_route === true) return 'no_public_contact_route';
  return 'not_published';
}

function publicSourceUrls(record) {
  return [...new Set([
    ...(Array.isArray(record.source_urls) ? record.source_urls : []),
    ...(Array.isArray(record.public_details_source_urls) ? record.public_details_source_urls : []),
    record.financial_source_url,
  ].map(publicUrl).filter(Boolean))];
}

function exportedFiledFinancialHistory(record) {
  return filedFinancialHistory(record).map((entry) => ({
    fiscal_period_start: entry.periodStart,
    fiscal_period_end: entry.periodEnd,
    filing_registration_date: entry.filingDate,
    ...(entry.revenue && {
      revenue_eur: entry.revenue.amount,
      revenue_evidence: {
        api_record_id: entry.revenue.apiRecordId,
        line_name: entry.revenue.lineName,
        registration_date: entry.revenue.registrationDate,
      },
    }),
    ...(entry.profitBeforeTax && {
      profit_before_tax_eur: entry.profitBeforeTax.amount,
      profit_before_tax_evidence: {
        api_record_id: entry.profitBeforeTax.apiRecordId,
        line_name: entry.profitBeforeTax.lineName,
        registration_date: entry.profitBeforeTax.registrationDate,
      },
    }),
    source: {
      data_portal_url: entry.sourceUrl,
      api_model_path: entry.apiModelPath,
      jar_entity_id: entry.jarEntityId,
    },
    ...(entry.standardNames && { standard_names: entry.standardNames }),
    ...(entry.templateNames && { template_names: entry.templateNames }),
  }));
}

function datasetFinancialFields(record) {
  const turnover = publishedTurnover(record);
  const verifiedUnpublished = record.revenue_availability === 'nepaskelbta'
    && record.financial_verification_status === 'patikrinta'
    && validIsoDate(record.verified_at)
    && publicUrl(record.financial_source_url);
  const financialHistory = exportedFiledFinancialHistory(record);
  return {
    ...(turnover && {
      revenue_eur_latest: turnover.amount,
      revenue_year: turnover.year,
      financial_source_url: turnover.sourceUrl,
      revenue_availability: 'paskelbta',
    }),
    ...(!turnover && verifiedUnpublished && {
      financial_source_url: publicUrl(record.financial_source_url),
      revenue_availability: 'nepaskelbta',
    }),
    ...(publishedFoundingYear(record.founded_year) && { founded_year: record.founded_year }),
    ...(employeeBandNames.has(record.employee_count_band) && { employee_count_band: record.employee_count_band }),
    ...(financialHistory.length && { filed_financial_history: financialHistory }),
  };
}

function datasetRecord(record) {
  return {
    slug: record.slug,
    profile_url: canonicalUrl(`/gamintojas/${record.slug}`),
    trading_name: record.trading_name?.trim() || null,
    legal_name: record.legal_name?.trim() || null,
    company_code: record.company_code?.trim() || null,
    city: publishedLocality(record),
    street_address: record.street_address?.trim() || null,
    postcode: record.postcode?.trim() || null,
    region_label: record.region_label?.trim() || null,
    website: publicUrl(record.website) || null,
    public_phone: record.public_phone?.trim() || null,
    contact_route_status: contactRouteStatus(record),
    categories: [...record.category_labels],
    public_source_urls: publicSourceUrls(record),
    verification_date: recordVerificationDate(record) || null,
    ...datasetFinancialFields(record),
  };
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join(' | ') : value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
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

function isRegistryChecked(record) {
  return String(record.financial_verification_status ?? '').trim().toLocaleLowerCase('lt-LT') === 'patikrinta';
}

function registryCheckedDate(value) {
  const iso = validIsoDate(value);
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00.000Z`);
  return {
    iso,
    label: new Intl.DateTimeFormat('lt-LT', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date),
  };
}

const employeeBandOrder = ['0', '1-9', '10-49', '50-249', '250+'];
const employeeBandNames = new Map([
  ['0', '0 darbuotojų'],
  ['1-9', '1–9 darbuotojai'],
  ['10-49', '10–49 darbuotojai'],
  ['50-249', '50–249 darbuotojai'],
  ['250+', '250 ir daugiau darbuotojų'],
]);

function employeeBandLabel(value) {
  const labels = {
    '0': 'Viešame darbuotojų skaičiaus įraše – 0 darbuotojų',
    '1-9': 'Labai maža komanda – 1–9 darbuotojai',
    '10-49': 'Nedidelė įmonė – 10–49 darbuotojai',
    '50-249': 'Didesnė įmonė – 50–249 darbuotojai',
    '250+': 'Didelė įmonė – 250 ar daugiau darbuotojų',
  };
  return labels[value] ?? `${value} darbuotojų (viešo šaltinio grupė)`;
}

function publishedTurnover(record) {
  const amount = record.revenue_eur_latest;
  const year = record.revenue_year;
  const sourceUrl = publicUrl(record.financial_source_url);
  if (record.revenue_availability !== 'paskelbta' || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(year) || !sourceUrl) return null;
  return { amount, year, sourceUrl };
}

function validUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function validFiledMetric(entry, valueKey, evidenceKey, lineName) {
  const amount = entry?.[valueKey];
  if (!Number.isFinite(amount)) return null;
  const evidence = entry?.[evidenceKey];
  const filingDate = validIsoDate(entry?.filing_registration_date);
  if (!filingDate
    || !evidence || typeof evidence !== 'object'
    || !validUuid(evidence.api_record_id)
    || evidence.line_name !== lineName
    || validIsoDate(evidence.registration_date) !== filingDate) return null;
  return {
    amount,
    apiRecordId: evidence.api_record_id.trim(),
    lineName: evidence.line_name,
    registrationDate: filingDate,
  };
}

function validTextArray(value) {
  return Array.isArray(value) && value.length && value.every((item) => typeof item === 'string' && item.trim())
    ? [...value]
    : null;
}

function validFiledFinancialEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const periodStart = validIsoDate(entry.fiscal_period_start);
  const periodEnd = validIsoDate(entry.fiscal_period_end);
  const filingDate = validIsoDate(entry.filing_registration_date);
  const sourceUrl = publicUrl(entry.source?.data_portal_url);
  if (!periodStart || !periodEnd || periodStart > periodEnd || !filingDate
    || sourceUrl !== OFFICIAL_FINANCIAL_SOURCE_URL
    || entry.source?.api_model_path !== OFFICIAL_FINANCIAL_API_MODEL_PATH
    || !validUuid(entry.source?.jar_entity_id)) return null;
  const revenue = validFiledMetric(entry, 'revenue_eur', 'revenue_evidence', 'PARDAVIMO PAJAMOS');
  const profitBeforeTax = validFiledMetric(entry, 'profit_before_tax_eur', 'profit_before_tax_evidence', 'PELNAS (NUOSTOLIAI) PRIEŠ APMOKESTINIMĄ');
  if (!revenue && !profitBeforeTax) return null;
  return {
    periodStart,
    periodEnd,
    filingDate,
    sourceUrl,
    apiModelPath: entry.source.api_model_path,
    jarEntityId: entry.source.jar_entity_id.trim(),
    standardNames: validTextArray(entry.standard_names),
    templateNames: validTextArray(entry.template_names),
    revenue,
    profitBeforeTax,
  };
}

function filedFinancialHistory(record) {
  if (!Array.isArray(record.filed_financial_history)) return [];
  return record.filed_financial_history
    .map(validFiledFinancialEntry)
    .filter(Boolean)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd)
      || b.periodStart.localeCompare(a.periodStart)
      || b.filingDate.localeCompare(a.filingDate))
    .slice(0, 4);
}

function filedFinancialHistoryBlock(history) {
  if (!history.length) return '';
  const rows = history.map((entry) => {
    const revenue = entry.revenue
      ? `<strong>${escapeHtml(formatEuro(entry.revenue.amount))}</strong>`
      : '<span data-financial-not-filed>Šiame laikotarpyje nepateikta</span>';
    const profitBeforeTax = entry.profitBeforeTax
      ? `<strong>${escapeHtml(formatEuro(entry.profitBeforeTax.amount))}</strong>`
      : '<span data-financial-not-filed>Šiame laikotarpyje nepateikta</span>';
    return `<tr data-filed-financial-period data-period-start="${entry.periodStart}" data-period-end="${entry.periodEnd}" data-filing-registration-date="${entry.filingDate}" data-source-url="${escapeHtml(entry.sourceUrl)}" data-api-model-path="${escapeHtml(entry.apiModelPath)}" data-jar-entity-id="${escapeHtml(entry.jarEntityId)}"><th scope="row"><time datetime="${entry.periodStart}">${entry.periodStart}</time> – <time datetime="${entry.periodEnd}">${entry.periodEnd}</time></th><td data-financial-revenue${entry.revenue ? ` data-api-record-id="${escapeHtml(entry.revenue.apiRecordId)}" data-amount="${entry.revenue.amount}"` : ' data-status="not-filed"'}>${revenue}</td><td data-financial-profit-before-tax${entry.profitBeforeTax ? ` data-api-record-id="${escapeHtml(entry.profitBeforeTax.apiRecordId)}" data-amount="${entry.profitBeforeTax.amount}"` : ' data-status="not-filed"'}>${profitBeforeTax}</td><td><time datetime="${entry.filingDate}">${entry.filingDate}</time></td></tr>`;
  }).join('');
  return `<div class="profile-financial-history" data-filed-financial-history data-period-count="${history.length}"><div class="section-heading"><h3>Registrui pateikta finansinė istorija</h3><p>Rodomi naujausi ${history.length === 1 ? 'finansiniai metai' : `${history.length} fiskaliniai laikotarpiai`} iš oficialiame duomenų rinkinyje esančių įrašų. Pajamos ir pelnas prieš apmokestinimą pateikiami tik tada, kai konkrečiai eilutei yra galiojantis API įrašo įrodymas.</p></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Registrui pateiktų finansinių laikotarpių lentelė"><table><thead><tr><th>Fiskalinis laikotarpis</th><th>Pajamos</th><th>Pelnas prieš apmokestinimą</th><th>Ataskaita įregistruota</th></tr></thead><tbody>${rows}</tbody></table></div><p data-financial-history-source><strong>Šaltinis:</strong> <a href="${OFFICIAL_FINANCIAL_SOURCE_URL}" rel="noopener noreferrer">${OFFICIAL_FINANCIAL_SOURCE_NAME}</a>.</p></div>`;
}

function formatEuro(amount, locale = 'lt-LT') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function formatPercent(count, total, locale = 'lt-LT') {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(total ? count / total : 0);
}

function formatSignedEuro(amount, locale = 'lt-LT') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, signDisplay: 'exceptZero' }).format(amount);
}

function formatSignedPercent(ratio, locale = 'lt-LT') {
  return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(ratio);
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function filedFinancialYearGroups(records, minimumYear = 2019) {
  const groups = new Map();
  for (const record of records) {
    const usedYears = new Set();
    for (const entry of filedFinancialHistory(record)) {
      const year = Number(entry.periodEnd.slice(0, 4));
      if (!Number.isInteger(year) || year < minimumYear || usedYears.has(year)) continue;
      usedYears.add(year);
      const rows = groups.get(year) ?? [];
      rows.push({ record, entry });
      groups.set(year, rows);
    }
  }
  return [...groups].sort((a, b) => a[0] - b[0]);
}

function countBy(records, valueFor) {
  const counts = new Map();
  for (const record of records) {
    const value = valueFor(record);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'lt'));
}

function siteStructuredData(path) {
  const organization = { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL };
  if (path !== '/') return [organization];
  return [
    organization,
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

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: canonicalUrl(item.path) })),
  };
}

function collectionPageSchema({ name, description, path, itemListId }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: canonicalUrl(path),
    inLanguage: 'en',
    mainEntity: { '@id': itemListId },
  };
}

function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
  };
}

function articleSchema(article, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription ?? article.summary,
    inLanguage: 'lt-LT',
    mainEntityOfPage: canonicalUrl(path),
    dateModified: buildDate,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

function manufacturerSchema(record) {
  const description = record.description_lt?.trim() || record.scope_evidence?.trim();
  const hasLocalBusinessFacts = Boolean(record.legal_entity_known && publishedLocality(record) && (record.website?.trim() || record.public_contact_url?.trim()));
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
  const websiteUrl = publicUrl(record.website);
  if (websiteUrl) data.sameAs = [websiteUrl];
  if (record.public_phone?.trim()) data.telephone = record.public_phone.trim();
  const dateModified = recordVerificationDate(record);
  if (dateModified) data.dateModified = dateModified;
  const address = { '@type': 'PostalAddress' };
  if (record.street_address?.trim()) address.streetAddress = record.street_address.trim();
  if (publishedLocality(record)) address.addressLocality = publishedLocality(record);
  if (record.postcode?.trim()) address.postalCode = record.postcode.trim();
  if (address.streetAddress || address.addressLocality || address.postalCode) {
    address.addressCountry = 'LT';
    data.address = address;
  }
  if (publishedFoundingYear(record.founded_year)) data.foundingDate = String(publishedFoundingYear(record.founded_year));
  if (record.company_code?.trim()) {
    data.identifier = {
      '@type': 'PropertyValue',
      propertyID: 'Lithuanian company code',
      value: record.company_code.trim(),
    };
  }
  return data;
}

function injectPage({ title, description, path, body, type = 'website', robots = 'index, follow', structuredData = [], lang = 'lt', locale = 'lt_LT', alternates = [] }) {
  const canonical = canonicalUrl(path);
  const pageAlternates = alternates.length ? alternates : [{ hreflang: lang, href: canonical }];
  let html = baseHtml
    .replace(/<html\b[^>]*\blang=(['"])[^'"]*\1/i, `<html lang="${escapeHtml(lang)}"`)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace('<div id="app"></div>', `<div id="app">${body}</div>`);
  const head = `
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
${pageAlternates.map((alternate) => `    <link rel="alternate" hreflang="${escapeHtml(alternate.hreflang)}" href="${escapeHtml(alternate.href)}" />`).join('\n')}
    <meta property="og:locale" content="${escapeHtml(locale)}" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
${[...siteStructuredData(path), ...structuredData].map((data) => `    <script type="application/ld+json" data-seo-structured-data>${safeJson(data)}</script>`).join('\n')}`;
  return html.replace(/\s*<\/head>/, `${head}\n  </head>`);
}

function header(active = 'directory', lang = 'lt') {
  if (lang === 'en') {
    const activeLabel = {
      hub: 'Sourcing hub',
      category: 'Furniture category',
      overview: 'Data overview',
      guide: 'Sourcing guide',
      region: 'Region list',
      city: 'City list',
      turnover: 'Turnover data cut',
      request: 'Quote request',
    }[active] ?? 'Sourcing hub';
    return `<header class="site-header site-header--english"><div class="header-inner"><a class="brand" href="/en/" aria-label="Baldininkai.org English sourcing hub"><span class="brand-mark" aria-hidden="true"><img src="${logoAssetUrl}" alt="" width="44" height="44" /></span><span>Custom furniture makers <strong>in Lithuania</strong></span></a><button class="navigation-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Open the main menu. Current section: ${activeLabel}"><span class="navigation-toggle-label">Menu</span><span class="navigation-current">${activeLabel}</span><span class="navigation-toggle-icon" aria-hidden="true"></span></button><nav class="primary-navigation" id="primary-navigation" aria-label="Main navigation"><a href="/en/"${active === 'hub' ? ' aria-current="page"' : ''}>Sourcing hub</a><a href="/en/#categories"${active === 'category' ? ' aria-current="page"' : ''}>Categories</a><a href="/en/quote-request/"${active === 'request' ? ' aria-current="page"' : ''}>Quote request</a><a href="/en/sourcing-guide/"${active === 'guide' ? ' aria-current="page"' : ''}>Sourcing guide</a><a href="/en/lithuanian-furniture-makers-data/"${active === 'overview' ? ' aria-current="page"' : ''}>Data overview</a><a href="/atviri-duomenys/">Open data</a><a href="/" lang="lt">Lietuvių</a></nav></div></header>`;
  }
  const activeLabel = {
    directory: 'Katalogas',
    request: 'Projekto užklausa',
    guide: 'Pirkėjo gidas',
    policy: 'Informacija',
    overview: 'Rinkos apžvalga',
  }[active] ?? 'Katalogas';
  return `<header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Baldai pagal užsakymą Lietuvoje – pradžia"><span class="brand-mark" aria-hidden="true"><img src="${logoAssetUrl}" alt="" width="44" height="44" /></span><span>Baldai pagal užsakymą <strong>Lietuvoje</strong></span></a><button class="navigation-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Atverti pagrindinį meniu. Dabartinis skyrius: ${activeLabel}"><span class="navigation-toggle-label">Meniu</span><span class="navigation-current">${activeLabel}</span><span class="navigation-toggle-icon" aria-hidden="true"></span></button><nav class="primary-navigation" id="primary-navigation" aria-label="Pagrindinė navigacija"><a href="/"${active === 'directory' ? ' aria-current="page"' : ''}>Katalogas</a><a href="/baldu-rinkos-apzvalga"${active === 'overview' ? ' aria-current="page"' : ''}>Rinkos apžvalga</a><a href="/gauti-pasiulymus"${active === 'request' ? ' aria-current="page"' : ''}>Projekto užklausa</a><a href="/gidas"${active === 'guide' ? ' aria-current="page"' : ''}>Pirkėjo gidas</a><a href="/gidas#pirkejo-irankiai">Pirkėjo įrankiai</a><a href="/en/" lang="en">English</a></nav></div></header>`;
}

function footer(lang = 'lt') {
  if (lang === 'en') {
    return '<footer><div class="footer-inner"><div class="footer-summary"><p>A public-source catalogue for independent research. Listings are unverified candidates and are not endorsements, rankings or guarantees.</p><p>Operator: GG Ventures UAB, company code 305442420 · <a href="mailto:info@baldininkai.org">info@baldininkai.org</a></p></div><nav aria-label="Footer navigation"><a href="/en/">Sourcing hub</a><a href="/en/#categories">Furniture categories</a><a href="/en/quote-request/">Quote request</a><a href="/en/sourcing-guide/">Sourcing guide</a><a href="/en/lithuanian-furniture-makers-data/">Data overview</a><a href="/atviri-duomenys/">Open data</a><a href="/baldininkai-org-gamintojai.json">JSON</a><a href="/baldininkai-org-gamintojai.csv">CSV</a><a href="/baldu-rinkos-apzvalga/" lang="lt">Lithuanian overview</a><a href="/baldu-sektoriaus-finansai/" lang="lt">Filed financial history</a><a href="/" lang="lt">Lithuanian catalogue</a></nav></div></footer>';
  }
  return '<footer><div class="footer-inner"><div class="footer-summary"><p>Viešų šaltinių katalogas savarankiškai gamintojų paieškai. Įrašai nepatvirtinti ir nėra kokybės ar prieinamumo garantija.</p><p>Valdytojas: GG Ventures UAB, įmonės kodas 305442420 · <a href="mailto:info@baldininkai.org">info@baldininkai.org</a></p></div><nav aria-label="Poraštės navigacija"><a href="/baldai-pagal-uzsakyma/miestai/">Visi miestai</a><a href="/baldu-rinkos-apzvalga">Rinkos apžvalga</a><a href="/baldu-sektoriaus-finansai/">Metinė finansų suvestinė</a><a href="/baldu-kainos-skaiciuokle">Kainos skaičiuoklė</a><a href="/gauti-pasiulymus">Projekto užklausa</a><a href="/gidas">Pirkėjo gidas</a><a href="/gidas/baldu-pirkimo-sutarties-sablonas">Sutarties šablonas</a><a href="/palyginti-pasiulymus">Pasiūlymų palyginimas</a><a href="/atviri-duomenys">Atviri duomenys</a><a href="/en/" lang="en">English sourcing hub</a><a href="/privatumas">Privatumas</a><a href="/naudojimosi-salygos">Naudojimosi sąlygos</a><a href="/slapukai">Slapukai</a><a href="/atsiliepimu-taisykles">Atsiliepimų taisyklės</a><a href="/irasyti-pataisyma">Įrašo pataisymas</a></nav></div></footer>';
}

function manufacturerCard(record) {
  const description = record.description_lt?.trim() || 'Trumpas aprašymas šaltiniuose nepateiktas.';
  const checkedDate = registryCheckedDate(record.verified_at);
  const registryStatus = isRegistryChecked(record)
    ? `<p class="registry-card-status"><span class="registry-check-mark" aria-hidden="true"></span><strong>Registro duomenys patikrinti</strong>${checkedDate ? ` · <time datetime="${checkedDate.iso}">${escapeHtml(checkedDate.label)}</time>` : ''}</p>`
    : '';
  const locality = publishedLocality(record) ?? publishedLocation(record.location);
  const locationLine = locality ? `<strong>${escapeHtml(locality)}</strong> <span aria-hidden="true"> · </span><span>Regiono grupė: ${escapeHtml(record.region_label)}</span>` : `<span>Regiono grupė: ${escapeHtml(record.region_label)}</span>`;
  return `<article class="manufacturer-card"><div class="card-heading"><h3>${escapeHtml(record.trading_name)}</h3>${record.legal_name ? `<p class="legal-name">${escapeHtml(record.legal_name)}</p>` : ''}</div>${registryStatus}<p class="location-line">${locationLine}</p><p class="description${record.description_lt?.trim() ? '' : ' description--fallback'}">${escapeHtml(description)}</p><ul class="category-list" aria-label="Gaminamų baldų kategorijos">${record.category_labels.map((label) => `<li>${escapeHtml(label)}</li>`).join('')}</ul><a class="profile-link" href="/gamintojas/${record.slug}">Peržiūrėti katalogo įrašą <span aria-hidden="true">→</span></a></article>`;
}

function faqHtml(items) {
  return `<section class="landing-faq" aria-labelledby="landing-faq-title"><div class="section-heading"><h2 id="landing-faq-title">Dažniausi klausimai</h2></div><dl>${items.map((item) => `<div><dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd></div>`).join('')}</dl></section>`;
}

function guidanceHtml(sections) {
  return `<section class="landing-guidance" aria-labelledby="landing-guidance-title"><div class="landing-guidance-heading"><p class="kicker">Pirkėjo atmintinė</p><h2 id="landing-guidance-title">Kaip pasiruošti užsakymui ir palyginti pasiūlymus</h2><p>Praktinės gairės padeda vienodai aprašyti projektą, kainos apimtį, medžiagas, vietos sąlygas ir montavimą.</p></div><div class="landing-guidance-copy">${sections.map((section) => `<section><h3>${escapeHtml(section.heading)}</h3>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>`).join('')}</div></section>`;
}

function validateSections(sections, label) {
  if (!Array.isArray(sections) || !sections.length) throw new Error(`${label} must define guidance sections.`);
  for (const section of sections) {
    if (!section?.heading?.trim() || !Array.isArray(section.paragraphs) || !section.paragraphs.length || !section.paragraphs.every((paragraph) => typeof paragraph === 'string' && paragraph.trim())) {
      throw new Error(`${label} has an invalid guidance section.`);
    }
  }
}

function validateFaq(faq, label) {
  if (!Array.isArray(faq) || faq.length < 3 || faq.length > 5 || !faq.every((item) => item?.question?.trim() && item?.answer?.trim())) {
    throw new Error(`${label} must define 3–5 complete FAQ entries.`);
  }
}

function validateCityContent(content, label) {
  if (!content || typeof content !== 'object') throw new Error(`${label} must be an object.`);
  validateSections(content.guidanceSections, label);
  validateFaq(content.faq, label);
  if (!content.intro?.trim() || !content.buyer_note?.trim()) throw new Error(`${label} must define intro and buyer_note.`);
}

function validateLandingContentModel() {
  if (landingConfig.cityThreshold !== 2) throw new Error('SEO city landing threshold must remain 2 so every locality with several makers gets a page.');
  const shared = landingConfig.guidance?.sharedSections;
  if (!Array.isArray(shared) || shared.length < 3) throw new Error('SEO landing guidance must define at least three shared sections.');
  validateSections(shared, 'Shared SEO landing content');
  for (const category of landingConfig.categories) {
    validateSections(category.guidanceSections, `Category ${category.slug}`);
    validateFaq(category.faq, `Category ${category.slug}`);
  }
  if (!landingConfig.cities || typeof landingConfig.cities !== 'object' || Array.isArray(landingConfig.cities)) {
    throw new Error('SEO landing content must define author-supplied city guidance as an object.');
  }
  for (const [city, content] of Object.entries(landingConfig.cities)) validateCityContent(content, `Author-supplied city ${city}`);
}

validateLandingContentModel();

const recordsByCity = new Map();
for (const record of manufacturers) {
  const city = publishedLocality(record);
  if (!city) continue;
  const records = recordsByCity.get(city) ?? [];
  records.push(record);
  recordsByCity.set(city, records);
}
const allCities = Array.from(recordsByCity, ([city, records]) => ({ city, records, count: records.length, slug: slugifyLithuanian(city) }))
  .sort((a, b) => a.city.localeCompare(b.city, 'lt'));
const cityCounts = new Map(allCities.map((entry) => [entry.city, entry.count]));
const cityCategoryLandings = landingConfig.categories.flatMap((category) => {
  const counts = new Map();
  for (const record of manufacturers) {
    const city = publishedLocality(record);
    if (city && (record.category_codes ?? []).includes(category.code)) counts.set(city, (counts.get(city) ?? 0) + 1);
  }
  return Array.from(counts, ([city, count]) => ({
    category,
    city,
    citySlug: slugifyLithuanian(city),
    count,
    path: `/baldai-pagal-uzsakyma/${category.slug}/miestas/${slugifyLithuanian(city)}`,
  })).filter((entry) => entry.count >= landingConfig.cityCategoryThreshold);
}).sort((a, b) => a.category.title.localeCompare(b.category.title, 'lt') || a.city.localeCompare(b.city, 'lt'));
const landingCities = allCities.filter((entry) => entry.count >= landingConfig.cityThreshold);

function cityCategoryMix(records) {
  const counts = new Map();
  for (const record of records) {
    for (const [index, code] of (record.category_codes ?? []).entries()) {
      const label = record.category_labels?.[index] ?? landingConfig.categories.find((category) => category.code === code)?.title ?? code;
      const current = counts.get(code) ?? { label, count: 0 };
      current.count += 1;
      counts.set(code, current);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'lt'));
}

function cityFacts(records, city) {
  const mix = cityCategoryMix(records);
  const mixText = mix.map((item) => `${item.label} – ${item.count}`).join('; ');
  const registryCount = records.filter(isRegistryChecked).length;
  const addressCount = records.filter((record) => record.street_address?.trim()).length;
  const phoneCount = records.filter((record) => record.public_phone?.trim()).length;
  const contactLinkCount = records.filter((record) => publicUrl(record.website) || publicUrl(record.public_contact_url)).length;
  return {
    mixText,
    leadingCategory: mix[0]?.label ?? 'baldų gamyba pagal užsakymą',
    registryCount,
    addressCount,
    phoneCount,
    contactLinkCount,
    guidance: {
      heading: `Ką katalogo duomenys rodo apie vietovę „${city}“`,
      paragraphs: [
        `${records.length} šios vietovės kandidatų kategorijų žymų pasiskirstymas: ${mixText}. Vienas įrašas gali turėti kelias kategorijų žymas, todėl jų skaičių suma gali būti didesnė už kandidatų skaičių.`,
        registryCount
          ? `${registryCount} iš ${records.length} įrašų turi pažymėtą registro duomenų patikrą. Ši būsena apima tik registro duomenų peržiūrą ir nėra darbų kokybės, užimtumo ar rekomendacijos patvirtinimas.`
          : `Nė vienas iš ${records.length} šios vietovės įrašų šiuo metu neturi pažymėtos registro duomenų patikros. Tai neparodo veiklos kokybės ar teisėtumo; juridinius duomenis prieš susitarimą reikia tikrinti savarankiškai.`,
        `Viešuose įrašuose rasta: gatvės adresas – ${addressCount}, telefono numeris – ${phoneCount}, svetainės arba kita viešo kontakto nuoroda – ${contactLinkCount}. Kontaktai rodomi tik konkrečiame kandidato įraše ir tik tada, kai jie yra šaltinių rinkinyje.`,
        `Žyma „${city}“ šiame kataloge reiškia šaltinyje nurodytą registracijos, bazės ar kontakto vietovę. Ji savaime nepatvirtina, kad kandidatas aptarnauja visą miestą, rajoną ar jūsų objekto adresą.`,
      ],
    },
  };
}

function generatedCityContent(city, records) {
  const facts = cityFacts(records, city);
  return {
    intro: `Vietovėje „${city}“ katalogo šaltiniuose rasti ${records.length} nepatvirtinti baldų gamintojų kandidatai. Dažniausia užfiksuota kryptis – „${facts.leadingCategory}“, o visas kategorijų pasiskirstymas pateiktas žemiau.`,
    buyer_note: `„${city}“ yra šaltinyje nurodyta registracijos, bazės ar kontakto vietovė, o ne patvirtinta paslaugų teritorija. Katalogas kandidatų nereitinguoja ir nerekomenduoja.`,
    guidanceSections: [
      {
        heading: `Kaip lyginti ${city} kandidatų pateikiamą informaciją`,
        paragraphs: [
          `Pirmiausia atverkite abiejų ar daugiau ${city} įrašų šaltinius ir patikrinkite juridinį pavadinimą, aktualią veiklą bei tas kategorijas, kurios svarbios jūsų projektui. Kategorijos žyma parodo tik tai, kas užfiksuota katalogo rinkinyje; ji nepatvirtina dabartinės pasiūlos ar patirties konkrečiam darbui.`,
          `Visiems pasirinktiems kandidatams pateikite tą patį objekto adresą, baldų apimtį ir klausimus apie matavimą, pristatymą, užnešimą bei montavimą. Atsakymą apie išvyką į jūsų vietą gaukite tiesiogiai – jo negalima numanyti vien iš žymos „${city}“.`,
        ],
      },
    ],
    faq: [
      { question: `Kiek kandidatų šiuo metu yra vietovės „${city}“ sąraše?`, answer: `Šiame versijuotame rinkinyje yra ${records.length}. Skaičius gaunamas tik iš įrašų, kurių vietovės lauke nurodyta „${city}“; tai nėra visų veikiančių gamintojų registras.` },
      { question: `Kokia baldų kryptis dažniausia tarp ${city} įrašų?`, answer: `Pagal šaltinių kategorijų žymas dažniausia kryptis yra „${facts.leadingCategory}“. Žyma nėra pažadas, kad kandidatas šiuo metu priima tokį projektą.` },
      { question: `Ar ${city} vietovės žyma garantuoja atvykimą į mano objektą?`, answer: `Ne. Ji nurodo šaltinyje rastą registracijos, bazės ar kontakto vietovę. Aptarnavimo adresą, kelionės kainą, matavimą ir montavimą patvirtinkite tiesiogiai.` },
      { question: `Ar katalogas rekomenduoja šiame ${city} sąraše esančius kandidatus?`, answer: `Ne. Tai viešų šaltinių kandidatai, kurie nėra reitinguojami ar rekomenduojami. Patikrinkite tapatybę, pasiūlymą, sutartį, mokėjimo gavėją ir aktualius kontaktus.` },
    ],
  };
}

const cityContentByName = new Map();
for (const entry of landingCities) {
  const content = landingConfig.cities[entry.city] ?? generatedCityContent(entry.city, entry.records);
  validateCityContent(content, `Resolved city ${entry.city}`);
  cityContentByName.set(entry.city, content);
}
const normalizeContent = (value) => value.toLocaleLowerCase('lt-LT').replace(/\s+/g, ' ').trim();
assertUnique([...cityContentByName.values()].map((content) => normalizeContent(content.intro)), 'city landing intro');
assertUnique([...cityContentByName.values()].map((content) => normalizeContent(content.guidanceSections.map((section) => `${section.heading} ${section.paragraphs.join(' ')}`).join(' '))), 'city-specific guidance');
assertUnique([...cityContentByName.values()].map((content) => normalizeContent(content.faq.map((item) => `${item.question} ${item.answer}`).join(' '))), 'city FAQ');

assertUnique(landingConfig.categories.map((category) => category.slug), 'category slug');
assertUnique(allCities.map((city) => city.slug), 'city slug');
assertUniqueRoutePaths([
  ...landingConfig.categories.map((category) => `/baldai-pagal-uzsakyma/${category.slug}`),
  ...landingCities.map((city) => `/baldai-pagal-uzsakyma/${city.slug}`),
  '/baldai-pagal-uzsakyma/miestai',
  ...cityCategoryLandings.map((entry) => entry.path),
], 'catalogue landing');

function guideRelatedLinks(article) {
  if (!article.categoryCode) return '';
  const category = landingConfig.categories.find((item) => item.code === article.categoryCode);
  const city = landingCities.find((item) => item.slug === article.citySlug) ?? landingCities[0];
  const matching = manufacturers.filter((record) => (record.category_codes ?? []).includes(article.categoryCode));
  const profiles = [...matching, ...manufacturers].filter((record, index, records) => records.findIndex((candidate) => candidate.slug === record.slug) === index).slice(0, 3);
  if (!category || !city || profiles.length < 3) throw new Error(`Guide ${article.slug} needs a category, city and three profile links.`);
  return `<section class="article-related"><h2>Tęskite konkrečia užklausa</h2><p>Peržiūrėkite <a href="/baldai-pagal-uzsakyma/${category.slug}">${escapeHtml(category.title)}</a> ir <a href="/baldai-pagal-uzsakyma/${city.slug}">Baldų gamintojų kandidatus: ${escapeHtml(city.city)}</a>. Vienodą projekto aprašą pateikite <a href="/gauti-pasiulymus">projekto užklausos formoje</a>.</p><h3>Susiję katalogo įrašai</h3><ul>${profiles.map((record) => `<li><a href="/gamintojas/${record.slug}">${escapeHtml(record.trading_name)}</a></li>`).join('')}</ul></section>`;
}

function contextualGuide(record) {
  const codes = new Set(record.category_codes ?? []);
  if (codes.has('W')) return { slug: 'spintos-ir-drabuzines-kaina', label: 'Spintų ir drabužinių kainos bei apimties klausimai' };
  if (codes.has('K')) return { slug: 'kvarcas-ar-akmuo-stalvirsiui', label: 'Stalviršio medžiagos ir apimties klausimai' };
  if (codes.has('OC') || codes.has('HR')) return { slug: 'matavimas-ir-montavimas-kontrole', label: 'Matavimo ir montavimo kontrolinis sąrašas' };
  if (codes.has('SW')) return { slug: 'mdf-faneruote-masyvas-fasadai', label: 'Medžiagų ir apdailos klausimai' };
  return { slug: 'matavimas-ir-montavimas-kontrole', label: 'Matavimo ir montavimo kontrolinis sąrašas' };
}

function profileLandingSection(record) {
  const links = [];
  const city = publishedLocality(record);
  const eligibleCity = city ? landingCities.find((entry) => entry.city === city) : undefined;
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

function staticClaimSection(record) {
  const companyName = escapeHtml(record.trading_name);
  const mailSubject = encodeURIComponent(`Dėl katalogo įrašo: ${record.trading_name}`);
  const mailBody = encodeURIComponent(`Katalogo įrašas: ${canonicalUrl(`/gamintojas/${record.slug}`)}\n\nMano vardas ir pavardė:\nPareigos arba ryšys su įmone:\nKą noriu patvirtinti ar pataisyti:`);
  return `<section class="correction-section" aria-labelledby="correction-title"><div class="section-heading correction-heading"><p class="kicker">Gamintojams ir jų atstovams</p><h2 id="correction-title">Ar tai jūsų įmonė?</h2><p>Patvirtinkite, kad atstovaujate įmonei, arba nurodykite, ką šiame katalogo įraše reikia pataisyti. Prašymas pateks katalogo peržiūrai; viešas pakeitimas nebus atliekamas automatiškai.</p><p class="correction-boundary">Ši forma nėra baldų projekto užklausa ir nėra siunčiama kataloge nurodytai įmonei.</p></div><form class="correction-form correction-form--static" aria-labelledby="correction-title"><p class="form-record-context">Katalogo įrašas: ${companyName}</p><input type="hidden" name="manufacturer_slug" value="${escapeHtml(record.slug)}"><noscript><p class="claim-static-note">Forma pateikiama įjungus JavaScript. Be jo galite parašyti <a href="mailto:info@baldininkai.org?subject=${mailSubject}&amp;body=${mailBody}">info@baldininkai.org</a> ir nurodyti šį įrašą, savo vardą, ryšį su įmone bei norimus pakeitimus.</p></noscript><fieldset disabled><legend class="visually-hidden">Gamintojo įrašo peržiūros formos laukai</legend><div class="form-field form-field--wide"><label for="static-claim-company-name">Įmonės pavadinimas *</label><input id="static-claim-company-name" name="company_name" type="text" value="${companyName}" required></div><div class="form-field"><label for="static-claimant-name">Jūsų vardas ir pavardė *</label><input id="static-claimant-name" name="claimant_name" type="text" required></div><div class="form-field"><label for="static-claimant-role">Pareigos arba ryšys su įmone *</label><input id="static-claimant-role" name="role" type="text" placeholder="Pvz., savininkas, vadovė, darbuotojas" required></div><div class="form-field"><label for="static-claimant-email">Darbinis el. paštas *</label><input id="static-claimant-email" name="email" type="email" placeholder="vardas@imone.lt" required><p class="field-hint">Naudosime tik prašymui patikrinti ir dėl jo susisiekti.</p></div><div class="form-field"><label for="static-claimant-phone">Telefono numeris (nebūtina)</label><input id="static-claimant-phone" name="phone" type="tel"></div><div class="form-field form-field--wide"><label for="static-claim-message">Ką norite patvirtinti ar pataisyti? *</label><p class="field-hint">Trumpai aprašykite savo ryšį su įmone ir konkrečius keitimus. Jei galite, pridėkite viešą informaciją, kuri padėtų juos patikrinti.</p><textarea id="static-claim-message" name="message" rows="7" required></textarea></div><div class="honeypot-field" aria-hidden="true"><label for="static-claim-website">Interneto svetainė</label><input id="static-claim-website" name="honeypot" type="text" tabindex="-1"></div><div class="consent-field form-field--wide"><input id="static-claim-consent" name="consent" type="checkbox" required><label for="static-claim-consent">Patvirtinu, kad pateikta informacija yra teisinga, ir sutinku, kad mano kontaktiniai duomenys būtų naudojami šiam prašymui patikrinti. Kaip tvarkome duomenis, paaiškinta <a href="/privatumas">privatumo pranešime</a>. *</label></div><div class="form-actions"><button class="primary-button" type="button" disabled>Pateikti įrašo peržiūrai</button><p class="form-status">Interaktyvi forma parengiama įkėlus puslapį.</p></div></fieldset></form></section>`;
}

async function writeRoute(path, html) {
  if (generatedRoutes.has(path)) throw new Error(`Refusing to overwrite duplicate generated route: ${path}`);
  generatedRoutes.add(path);
  const output = path === '/' ? join(publicDir, 'index.html') : join(publicDir, path.replace(/^\//, ''), 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

const homeBody = `${header()}<main><section class="intro" aria-labelledby="page-title"><div class="intro-copy"><p class="kicker">Viešas paieškos katalogas</p><h1 id="page-title">Raskite baldų gamintojus pagal poreikį ir vietą</h1><p class="lead">Pradėkite nuo baldų rūšies ir miesto. Rezultatus galėsite tikslinti pagal pavadinimą, įmonės duomenis ir kitus katalogo kriterijus.</p><div class="intro-actions"><a class="primary-button primary-button--light" href="/baldu-kainos-skaiciuokle">Apskaičiuoti preliminarią kainą</a><a class="intro-secondary-link" href="/gauti-pasiulymus">Jau turite projekto aprašymą? Pateikti užklausą →</a><a class="intro-guide-link" href="/gidas">Kaip atrinkti ir palyginti gamintojus →</a></div></div><div class="home-search-panel" aria-labelledby="home-search-title"><div class="home-search-heading"><h2 id="home-search-title">Ko ieškote?</h2><p>Pasirinkite poreikį ir vietą — katalogas atsinaujins iškart.</p></div><div class="request-static-loading" role="status"><p>Paieška ir filtrai parengiami įkėlus katalogą.</p></div><aside id="apie-kataloga"><details class="directory-note"><summary>Ką svarbu žinoti apie katalogą</summary><p>Tai iš viešų šaltinių sudarytas, nepatvirtintų kandidatų katalogas. Įrašai nėra kokybės, užimtumo ar meistrystės garantija, todėl informaciją ir pasiūlymus įvertinkite savarankiškai.</p></details></aside></div></section><section class="browse-section" id="gamintojai" aria-labelledby="browse-results-title"><h2 class="visually-hidden" id="browse-results-title">Gamintojų katalogo rezultatai</h2><div class="results-area"><div class="result-header"><p class="result-count">Kataloge – ${formatCount(manufacturers.length)}.</p></div><div class="manufacturer-list">${manufacturers.map(manufacturerCard).join('')}</div></div></section><section class="landing-directory"><div class="section-heading"><h2>Naršykite pagal baldų rūšį arba miestą</h2></div><div class="landing-link-groups"><div><h3>Pagal baldų rūšį</h3><ul>${landingConfig.categories.map((category) => `<li><a href="/baldai-pagal-uzsakyma/${category.slug}">${escapeHtml(category.title)}</a></li>`).join('')}</ul></div><div><h3>Pagal šaltinyje nurodytą miestą</h3><ul>${landingCities.map((city) => `<li><a href="/baldai-pagal-uzsakyma/${city.slug}">Baldų gamintojų kandidatai: ${escapeHtml(city.city)} (${city.count})</a></li>`).join('')}</ul></div></div></section></main>${footer()}`;
await writeRoute('/', injectPage({
  title: 'Baldai pagal užsakymą Lietuvoje | Gamintojų katalogas',
  description: 'Viešais šaltiniais paremtas nepatvirtintų Lietuvos nestandartinių baldų gamintojų kandidatų katalogas su paieška pagal kategoriją ir vietą.',
  path: '/',
  alternates: [
    { hreflang: 'lt', href: canonicalUrl('/') },
    { hreflang: 'en', href: canonicalUrl('/en') },
    { hreflang: 'x-default', href: canonicalUrl('/') },
  ],
  body: homeBody,
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }])],
}));

const estimatorPath = '/baldu-kainos-skaiciuokle';
const estimatorDescription = 'Orientacinė nestandartinių baldų kainos skaičiuoklė pagal baldų tipą, apimtį, fasadų lygį, stalviršį ir miestą, paremta Baldininkai.org gidais.';
const estimatorBody = `${header('guide')}<main class="buyer-tool-main estimator-main"><nav class="tool-navigation" aria-label="Pirkėjo įrankiai"><strong>Pirkėjo įrankiai</strong><div><a href="${estimatorPath}" aria-current="page">Kainos skaičiuoklė</a><a href="/gauti-pasiulymus">Projekto užklausa</a><a href="/palyginti-pasiulymus">Pasiūlymų palyginimas</a><a href="/gidas/baldu-pirkimo-sutarties-sablonas">Sutarties šablonas</a></div></nav><section class="estimator-intro" aria-labelledby="estimator-title"><div><p class="kicker">Orientacinis biudžeto intervalas</p><h1 id="estimator-title">Patikrinkite kainos ribas prieš siųsdami užklausą</h1><p class="lead">Pasirinkite projekto apimtį ir sprendinius. Skaičiuoklė parodys žemą, tipinę ir aukštą modelio ribą bei perkels duomenis į pasiūlymo užklausą.</p></div><aside class="estimator-intro-note" role="note"><strong>Ne kainoraštis</strong><p>Rezultatas yra orientacinis įvertis, ne pasiūlymas. Galutinę kainą galima nustatyti tik pagal brėžinius, tikslias medžiagas, paslaugų apimtį ir objekto sąlygas.</p></aside></section><div class="estimator-layout"><form class="estimator-form" aria-label="Baldų kainos skaičiuoklė"><fieldset><legend>Projektas</legend><div class="estimator-field"><label for="static-estimator-type">Baldų tipas</label><div class="select-wrap"><select id="static-estimator-type"><option>Virtuvė</option><option>Spinta ar įmontuojami baldai</option><option>Miegamojo ar vonios baldai</option><option>Biuro ar komerciniai baldai</option><option>Kitas nestandartinis projektas</option></select></div></div><div class="estimator-field"><label for="static-estimator-size">Preliminarus baldų ilgis metrais</label><div class="estimator-number-row"><input id="static-estimator-size" type="number" value="4" min="1" max="20" step="0.5"><span>bėginiai metrai</span></div></div><div class="estimator-field"><label for="static-estimator-city">Miestas ar rajonas</label><input id="static-estimator-city" type="text" list="static-estimator-city-options" value="Vilnius"><datalist id="static-estimator-city-options"><option value="Vilnius"></option><option value="Kaunas"></option><option value="Klaipėda"></option><option value="Kitas miestas ar rajonas"></option></datalist></div></fieldset><fieldset><legend>Medžiagos ir stalviršis</legend><div class="estimator-field"><label for="static-estimator-tier">Korpuso ir fasadų lygis</label><div class="select-wrap"><select id="static-estimator-tier"><option>Praktiškas</option><option selected>Subalansuotas</option><option>Sudėtingesnė apdaila</option><option>Natūrali mediena</option></select></div></div><div class="estimator-field"><label for="static-estimator-worktop">Stalviršio pasirinkimas</label><div class="select-wrap"><select id="static-estimator-worktop"><option>Netaikoma arba atskira sąmata</option><option>Laminuotas stalviršis</option><option>Kompaktinis laminatas arba medis</option><option>Kompozicinis kvarcas</option><option>Natūralus akmuo</option></select></div></div></fieldset></form><section class="estimate-result" aria-labelledby="static-estimate-title"><header><p>Orientacinė baldų gamybos dalis</p><h2 id="static-estimate-title">Preliminarus intervalas</h2></header><dl class="estimate-range"><div><dt>Žema riba</dt><dd>1 200 €</dd></div><div class="estimate-range-typical"><dt>Tipinė reikšmė</dt><dd>2 200 €</dd></div><div><dt>Aukšta riba</dt><dd>3 200 €</dd></div></dl><p class="estimate-summary">Virtuvė: 4 bėginiai metrai, medžiagų lygis – subalansuotas, stalviršis vertinamas atskirai, Vilnius.</p><div class="estimate-scope"><div><h3>Modelyje įtraukta</h3><ul><li>korpusų, fasadų ir bazinės furnitūros gamybos apimtis;</li><li>pasirinkto medžiagų lygio intervalo korekcija.</li></ul></div><div><h3>Neįtraukta arba tikslinama atskirai</h3><ul><li>matavimas, projektavimas ir brėžinių korekcijos;</li><li>stalviršio plokštė, išpjovos, transportas ir montavimas;</li><li>technika, komunikacijų darbai, pristatymas ir montavimas.</li></ul></div></div><a class="primary-button estimate-cta" href="/gauti-pasiulymus">Perkelti į pasiūlymo užklausą</a><p class="estimate-cta-note">Interaktyvus perskaičiavimas ir laukų perkėlimas įsijungia įkėlus puslapį.</p></section></div><section class="estimator-method" aria-labelledby="static-method-title"><div><h2 id="static-method-title">Kaip sudaromas intervalas</h2><p>Vienintelis skaitinis atskaitos taškas yra gide <a href="/gidas/virtuves-baldu-kainos/">/gidas/virtuves-baldu-kainos</a> paskelbtas 300–800 €/m intervalas ir 548 €/m vidurkis. Skaičiuoklė jį naudoja kaip bendrą modelio atskaitą, o ne kaip pažadėtą konkretaus projekto €/m kainą.</p><p>Apimties ir neapibrėžtumo korekcijos remiasi tik <a href="/gidas/spintos-ir-drabuzines-kaina/">/gidas/spintos-ir-drabuzines-kaina</a>, <a href="/gidas/mdf-faneruote-masyvas-fasadai/">/gidas/mdf-faneruote-masyvas-fasadai</a> ir <a href="/gidas/kvarcas-ar-akmuo-stalvirsiui/">/gidas/kvarcas-ar-akmuo-stalvirsiui</a> išvardytais veiksniais. Šie gidai nepateikia atskirų universalių tarifų.</p></div><aside role="note"><strong>Orientacinis įvertis, ne pasiūlymas</strong><p>Rezultatas neįpareigoja katalogo ar gamintojo, nepatvirtina PVM, paslaugų komplektacijos ar galutinės kainos.</p></aside></section></main>${footer()}`;
await writeRoute(estimatorPath, injectPage({
  title: 'Baldų kainos skaičiuoklė | Orientacinė sąmata Lietuvoje',
  description: estimatorDescription,
  path: estimatorPath,
  body: estimatorBody,
  structuredData: [
    breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo gidas', path: '/gidas' }, { name: 'Baldų kainos skaičiuoklė', path: estimatorPath }]),
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Baldų kainos skaičiuoklė', url: canonicalUrl(estimatorPath), applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: 'lt-LT', description: 'Orientacinis nestandartinių baldų kainos intervalo skaičiavimas pagal projekto apimtį ir pasirinktus sprendinius.' },
  ],
}));

const requestPath = '/gauti-pasiulymus';
const requestDescription = 'Struktūruota baldų projekto pasiūlymo užklausa operatoriaus peržiūrai, be automatinio siuntimo gamintojams ir su atskiru patvirtinimu prieš išsiuntimą.';
const requestBody = `${header('request')}<main class="request-main rfq-main"><section class="request-intro" aria-labelledby="request-title"><div><p class="kicker">Saugi projekto užklausa</p><h1 id="request-title">Parenkite vienodą baldų projekto pasiūlymo užklausą</h1><p class="lead">Pateikite projekto santrauką operatoriaus peržiūrai. Gamintojai nekontaktuojami automatiškai.</p></div><aside class="request-expectation"><h2>Svarbi proceso riba</h2><p>Formos pateikimas tik sukuria privatų peržiūros įrašą. Siuntimui būtinas atskiras patvirtinimas.</p></aside></section><section class="rfq-process"><div class="section-heading"><h2>Kaip vyksta užklausa</h2></div><ol><li><strong>Pirkėjas pateikia santrauką.</strong><span>Ji perduodama operatoriaus peržiūrai.</span></li><li><strong>Operatorius tikrina projekto aprašymą ir kandidatus.</strong><span>Vertinama informacija ir tinkamumo prielaidos.</span></li><li><strong>Siunčiama tik po atskiro patvirtinimo.</strong><span>Iki jo tiekėjai nekontaktuojami.</span></li><li><strong>Po išsiuntimo skiriamos penkios dienos.</strong><span>Terminas skaičiuojamas nuo faktinio išsiuntimo.</span></li><li><strong>Grąžinami palyginami atsakymai.</strong><span>Gautų pasiūlymų skaičius negarantuojamas.</span></li></ol></section><section aria-labelledby="request-form-title"><div class="section-heading"><h2 id="request-form-title">Projekto ir kontaktiniai duomenys</h2><p>Interaktyvi pasiūlymo užklausos forma ir katalogo kandidatų pasirinkimas parengiami įkėlus puslapį.</p></div><div class="request-static-loading" role="status"><p>Ruošiama saugi pasiūlymo užklausos forma…</p></div></section></main>${footer()}`;
await writeRoute(requestPath, injectPage({
  title: 'Pateikite saugią baldų projekto užklausą | Baldai pagal užsakymą Lietuvoje',
  description: requestDescription,
  path: requestPath,
  body: requestBody,
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Projekto užklausa', path: requestPath }])],
}));

const contractPath = '/gidas/baldu-pirkimo-sutarties-sablonas';
const contractWarning = 'Svarbu prieš naudojant: tai informacinis redaguojamas šablonas, o ne teisinė konsultacija ar teisinis vertinimas. Jis negarantuoja, kad tinka jūsų situacijai, atitinka visus reikalavimus ar bus vykdytinas. Prieš pasirašydami peržiūrėkite visą tekstą ir, kai tinkama, pasitarkite su kvalifikuotu teisininku.';
const contractBody = `${header('guide')}<main class="buyer-tool-main contract-tool-main"><aside class="legal-template-warning"><strong>Perskaitykite prieš pildydami</strong><p>${escapeHtml(contractWarning)}</p></aside><article class="contract-document"><header class="contract-heading"><div><p class="kicker">Redaguojamas dokumento ruošinys</p><h1>Baldų pirkimo sutarties struktūros šablonas</h1><p>Užpildykite tik tai, ką galite patikrinti. Neaiškias sąlygas pažymėkite ir aptarkite prieš pasirašydami.</p></div><dl class="template-version"><div><dt>Šaltinis / versija</dt><dd>Pirkimo-pardavimo sutartis – B2C struktūros šablonas</dd></div><div><dt>Atnaujinta</dt><dd>2026-07-29</dd></div></dl></header><div class="contract-sections">${['Šalys ir kontaktiniai duomenys','Prekės ir specifikacija','Kaina ir PVM','Avansas ir mokėjimo etapai','Matavimas, projektas, brėžiniai ir medžiagos','Pristatymas ir montavimas','Priėmimas, trūkumai ir garantija','Vėlavimas, atšaukimas ir nenugalima jėga','Ginčai, pranešimai, kontaktas ir privatumas','Priedai'].map((title, index) => `<section class="contract-section"><div class="contract-section-heading"><span>${index + 1}</span><div><h2>${escapeHtml(title)}</h2><p>Redaguojamas turinys parengiamas įkėlus puslapį.</p></div></div></section>`).join('')}</div><footer class="contract-print-footer"><p><strong>${escapeHtml(contractWarning)}</strong></p><p>Pirkimo-pardavimo sutartis – B2C struktūros šablonas · atnaujinta 2026-07-29</p></footer></article></main>${footer()}`;
await writeRoute(contractPath, injectPage({
  title: 'Baldų pirkimo sutarties šablonas | Pirkėjo įrankiai',
  description: 'Naršyklėje redaguojamas ir spausdinamas B2C baldų pirkimo sutarties struktūros šablonas su aiškiu teisinės konsultacijos ribojimu.',
  path: contractPath,
  type: 'article',
  body: contractBody,
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo gidas', path: '/gidas' }, { name: 'Baldų pirkimo sutarties šablonas', path: contractPath }])],
}));

const comparisonPath = '/palyginti-pasiulymus';
const comparisonWarning = 'Svarbu: pasiūlymų palyginimo įrankis yra informacinio pobūdžio ir nėra teisinė konsultacija ar teisinis vertinimas.';
const comparisonBody = `${header('guide')}<main class="buyer-tool-main comparison-tool-main"><aside class="legal-template-warning" role="note" aria-label="Svarbus perspėjimas"><strong>Informacinis įrankis</strong><p>${escapeHtml(comparisonWarning)}</p></aside><section class="tool-intro"><div><p class="kicker">Naršyklėje veikiantis palyginimas</p><h1>Palyginkite pasiūlymus nepaslėpdami spragų</h1><p class="lead">Deterministinis 2–5 pasiūlymų palyginimas pagal jūsų svorius, įvestus įrodymus ir aiškią formulę.</p></div><aside class="local-only-note"><strong>Tik jūsų naršyklėje</strong><p>Įrankis nerenka duomenų iš kitų svetainių, nieko nekontaktuoja ir nesiunčia jūsų įrašų.</p></aside></section><section class="comparison-method"><div class="section-heading"><h2>Jūsų prioritetai ir matomi įrodymai</h2><p>Interaktyvūs svoriai, pasiūlymų laukai, trūkstamų duomenų žymos ir rezultatai parengiami įkėlus puslapį. Įrankis automatiškai nepaskelbia laimėtojo.</p></div></section></main>${footer()}`;
await writeRoute(comparisonPath, injectPage({
  title: 'Palyginti baldų pasiūlymus | Pirkėjo įrankiai',
  description: 'Deterministinis 2–5 baldų pasiūlymų palyginimas pagal pirkėjo svorius, aiškią formulę, įrodymus, trūkstamus ir nepalyginamus laukus.',
  path: comparisonPath,
  body: comparisonBody,
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo įrankiai', path: '/gidas' }, { name: 'Pasiūlymų palyginimas', path: comparisonPath }])],
}));

for (const page of policyPages) {
  const body = `${header('policy')}<main class="policy-main"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><article class="policy-document"><header class="policy-header"><p class="kicker">Svetainės informacija</p><h1>${escapeHtml(page.heading)}</h1><p class="lead">${escapeHtml(page.summary)}</p></header><dl class="policy-operator" aria-label="Svetainės valdytojo duomenys"><div><dt>Valdytojas</dt><dd>GG Ventures UAB</dd></div><div><dt>Įmonės kodas</dt><dd>305442420</dd></div><div><dt>Kontaktas</dt><dd><a href="mailto:info@baldininkai.org">info@baldininkai.org</a></dd></div></dl><div class="policy-copy">${page.content}</div></article></main>${footer()}`;
  await writeRoute(page.path, injectPage({
    title: page.title,
    description: page.description,
    path: page.path,
    body,
    structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: page.heading, path: page.path }])],
  }));
}

const publicDataset = manufacturers.map(datasetRecord);
const openDataPath = '/atviri-duomenys';
const datasetJsonFilename = 'baldininkai-org-gamintojai.json';
const datasetCsvFilename = 'baldininkai-org-gamintojai.csv';
const financialDatasetCsvFilename = 'baldininkai-org-gamintoju-finansai.csv';
const openDataUrl = canonicalUrl(openDataPath);
const datasetAttribution = `Šaltinis: Baldininkai.org viešų šaltinių Lietuvos baldų gamintojų kandidatų katalogas, ${openDataUrl}, versija ${buildDate}`;
const datasetDescription = `Viešų šaltinių Lietuvos nestandartinių baldų gamintojų kandidatų katalogas su ${publicDataset.length} profilio, įmonės, vietos, kategorijų, kontaktinio kelio, naujausių finansinių rodiklių ir šaltiniais pagrįstų pateiktų finansinių laikotarpių įrašų.`;
const datasetSchema = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Baldininkai.org viešų šaltinių Lietuvos baldų gamintojų kandidatų katalogas',
  description: datasetDescription,
  url: openDataUrl,
  license: DATASET_LICENSE_URL,
  creator: { '@type': 'Organization', name: 'Baldininkai.org', url: SITE_URL },
  publisher: { '@type': 'Organization', name: 'Baldininkai.org', url: SITE_URL },
  inLanguage: 'lt',
  spatialCoverage: 'Lithuania',
  keywords: ['Lietuvos baldų gamintojai', 'nestandartiniai baldai', 'vieši duomenys', 'gamintojų katalogas', 'pateiktos finansinės ataskaitos'],
  dateModified: buildDate,
  datePublished: buildDate,
  distribution: [
    { '@type': 'DataDownload', contentUrl: `${SITE_URL}/${datasetJsonFilename}`, encodingFormat: 'application/json' },
    { '@type': 'DataDownload', contentUrl: `${SITE_URL}/${datasetCsvFilename}`, encodingFormat: 'text/csv' },
    { '@type': 'DataDownload', contentUrl: `${SITE_URL}/${financialDatasetCsvFilename}`, encodingFormat: 'text/csv' },
  ],
};
const openDataBody = `${header('policy')}<main class="policy-main"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><article class="policy-document open-data-document"><header class="policy-header"><p class="kicker">Viešas katalogo duomenų rinkinys</p><h1>Atviri Baldininkai.org duomenys</h1><p class="lead">Atsisiųskite visus <strong>${publicDataset.length}</strong> šiuo svetainės versijos kūrimu paskelbtus Lietuvos nestandartinių baldų gamintojų kandidatų įrašus JSON ir dviem CSV formatais.</p></header><dl class="policy-operator" aria-label="Duomenų rinkinio suvestinė"><div><dt>Įrašų</dt><dd>${publicDataset.length}</dd></div><div><dt>Atnaujinta</dt><dd><time datetime="${buildDate}">${buildDate}</time></dd></div><div><dt>Formatai</dt><dd>JSON ir du CSV</dd></div></dl><div class="policy-copy open-data-copy"><section aria-labelledby="open-data-download-title"><h2 id="open-data-download-title">Atsisiųsti duomenis</h2><p>Katalogo JSON ir CSV failai sugeneruoti iš to paties šaltinio rinkinio ir turi po vieną objektą ar eilutę kiekvienam iš ${publicDataset.length} šiuo metu kataloge skelbiamų įrašų. Atskiras finansų CSV turi po vieną eilutę kiekvienam galiojančiam pateiktam finansiniam laikotarpiui.</p><p>Šio katalogo įmonių dydžio, apyvartos, veiklos metų, geografijos ir kategorijų suvestines rasite <a href="/baldu-rinkos-apzvalga"><strong>baldų rinkos apžvalgoje</strong></a>, o registrui pateiktų rodiklių laiko eilutes – <a href="/baldu-sektoriaus-finansai/"><strong>metinėje finansų suvestinėje</strong></a>. English readers can use the <a href="/en/lithuanian-furniture-makers-data/"><strong>Lithuanian furniture makers data overview</strong></a>.</p><ul class="open-data-downloads"><li><a href="/${datasetJsonFilename}" download><strong>JSON duomenų rinkinys</strong><span>Metaduomenys ir įrašų masyvas su kategorijų bei šaltinių masyvais</span><span aria-hidden="true">↓</span></a></li><li><a href="/${datasetCsvFilename}" download><strong>Katalogo CSV duomenų rinkinys</strong><span>Metaduomenų komentarai ir stabili lentelė skaičiuoklėms su naujausiais patvirtintais finansiniais laukais</span><span aria-hidden="true">↓</span></a></li><li><a href="/${financialDatasetCsvFilename}" download><strong>Pateiktų finansinių laikotarpių CSV</strong><span>Normalizuota lentelė: viena eilutė vienam galiojančiam įmonės fiskaliniam laikotarpiui</span><span aria-hidden="true">↓</span></a></li></ul></section><section><h2>Kas įtraukta</h2><p>Kiekviename JSON ir katalogo CSV įraše pateikiamas katalogo identifikatorius ir pilnas profilio adresas, viešas ar prekinis bei juridinis pavadinimas, įmonės kodas, miestas, gatvės adresas, pašto kodas, regiono žyma, svetainė, viešas telefono numeris, viešo kontaktinio kelio būsena, baldų kategorijos, viešų šaltinių adresai ir turima patikros data. Kai juos pagrindžia šaltinis, pridedami naujausių pajamų metai ir suma, finansinis šaltinis bei prieinamumo būsena, įkūrimo metai, darbuotojų grupė ir pateiktų finansinių laikotarpių istorija. Finansų CSV kiekvieną šį laikotarpį išskleidžia į atskirą eilutę su fiskalinėmis datomis, pateikimo registravimo data, pajamomis ar pelnu prieš apmokestinimą tik kai jie pateikti, ir šaltinio bei įrodymų identifikatoriais.</p><p>Tušti laukai reiškia, kad atitinkama reikšmė šaltinio rinkinyje nepateikta. Būsena <code>not_published</code> reiškia, kad dabartiniame įraše viešas kontaktinis kelias nepaskelbtas, o <code>no_public_contact_route</code> naudojama tik tada, kai šaltinio įraše aiškiai pažymėta, kad viešo kontaktinio kelio nerasta.</p></section><section><h2>Duomenų kilmė ir atnaujinimas</h2><p>Rinkinys sudarytas iš viešai prieinamų gamintojų svetainių, įmonių ir kitų viešų informacijos šaltinių. Tarp oficialių šaltinių yra <a href="${OFFICIAL_FINANCIAL_SOURCE_URL}" rel="noopener noreferrer"><strong>${OFFICIAL_FINANCIAL_SOURCE_NAME}</strong></a>. Registrui pateikti finansiniai rodikliai iš Lietuvos atvirų duomenų portalo įtraukiami tik tada, kai konkreti pateikta eilutė turi API įrodymą; nepagrįstos sumos ar nuliniai pakaitiniai dydžiai neeksportuojami. Prie kiekvieno katalogo įrašo pateikiamos šaltinių nuorodos, naudotos tapatybei, veiklos krypčiai ar viešiems įmonės duomenims pagrįsti.</p><p>Ši versija sugeneruota <time datetime="${buildDate}">${buildDate}</time> kartu su katalogo puslapiais. Failai atnaujinami iš to paties versijuoto šaltinių rinkinio kiekvieno svetainės kūrimo metu.</p></section><section><h2>Ribotumai</h2><p>Įrašai yra nepatvirtinti viešų šaltinių gamintojų kandidatai. Jų paskelbimas nėra Baldininkai.org rekomendacija, reitingas, kokybės įvertinimas ar tapatybės, informacijos tikslumo, kainos, terminų, užimtumo ir paslaugų prieinamumo garantija.</p><p>Vieši šaltiniai gali būti pasikeitę, neišsamūs ar netikslūs. Prieš priimdami sprendimą savarankiškai patikrinkite juridinius, kontaktinius ir pasiūlymo duomenis su pasirinktu gamintoju ar kitu tinkamu oficialiu šaltiniu.</p></section><section><h2>Licencija ir priskyrimas</h2><p>Duomenų rinkinys licencijuojamas pagal <a href="${DATASET_LICENSE_URL}" rel="license"><strong>${DATASET_LICENSE_NAME} (CC BY ${DATASET_LICENSE_VERSION})</strong></a> licenciją, versija <strong>${DATASET_LICENSE_VERSION}</strong>.</p><p lang="en">This dataset is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).</p><p>Duomenis galite atsisiųsti, analizuoti ir pakartotinai naudoti, jei neiškreipiate jų prasmės, išlaikote aiškias ribotumų pastabas ir nenurodote, kad Baldininkai.org patvirtino ar rekomendavo įrašus.</p><p><strong>Priskyrimas:</strong> <q>${datasetAttribution}</q></p><p>Apie netikslumą ar reikalingą pataisymą praneškite per <a href="/irasyti-pataisyma">įrašo pataisymo tvarką</a>.</p></section></div></article></main>${footer()}`;
await writeRoute(openDataPath, injectPage({
  title: 'Atviri baldų gamintojų katalogo duomenys | Baldininkai.org',
  description: `Atsisiųskite ${publicDataset.length} viešų šaltinių Lietuvos baldų gamintojų kandidatų įrašus JSON arba CSV formatu ir peržiūrėkite naudojimo ribotumus.`,
  path: openDataPath,
  body: openDataBody,
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Atviri duomenys', path: openDataPath }]), datasetSchema],
}));

const marketOverviewPath = '/baldu-rinkos-apzvalga';
const marketOverviewUrl = canonicalUrl(marketOverviewPath);
const marketTurnovers = manufacturers
  .map((record) => ({ record, turnover: publishedTurnover(record) }))
  .filter((entry) => entry.turnover)
  .sort((a, b) => a.turnover.amount - b.turnover.amount);
const turnoverValues = marketTurnovers.map((entry) => entry.turnover.amount);
const lowerTurnoverHalf = turnoverValues.slice(0, Math.floor(turnoverValues.length / 2));
const upperTurnoverHalf = turnoverValues.slice(Math.ceil(turnoverValues.length / 2));
const turnoverTotal = turnoverValues.reduce((total, amount) => total + amount, 0);
const turnoverMedian = median(turnoverValues);
const turnoverQ1 = median(lowerTurnoverHalf);
const turnoverQ3 = median(upperTurnoverHalf);
const turnoverBands = [
  { key: 'lt-100k', label: 'Mažiau nei €100 tūkst.', count: marketTurnovers.filter(({ turnover }) => turnover.amount < 100_000).length },
  { key: '100k-500k', label: '€100 tūkst. – €500 tūkst.', count: marketTurnovers.filter(({ turnover }) => turnover.amount >= 100_000 && turnover.amount < 500_000).length },
  { key: '500k-2m', label: '€500 tūkst. – €2 mln.', count: marketTurnovers.filter(({ turnover }) => turnover.amount >= 500_000 && turnover.amount <= 2_000_000).length },
  { key: 'gt-2m', label: 'Daugiau nei €2 mln.', count: marketTurnovers.filter(({ turnover }) => turnover.amount > 2_000_000).length },
];
const fiscalYears = countBy(marketTurnovers, ({ turnover }) => String(turnover.year));
const employeeRecords = manufacturers.filter((record) => employeeBandOrder.includes(record.employee_count_band));
const employeeDistribution = employeeBandOrder.map((band) => ({
  band,
  label: employeeBandNames.get(band),
  count: employeeRecords.filter((record) => record.employee_count_band === band).length,
}));
const latestValidFoundingYear = Number(buildDate.slice(0, 4));
const foundingRecords = manufacturers.filter((record) => publishedFoundingYear(record.founded_year) !== null);
const foundingCohorts = [
  { key: 'before-1990', label: 'Iki 1990 m.', includes: (year) => year < 1990 },
  { key: '1990s', label: '1990–1999 m.', includes: (year) => year >= 1990 && year < 2000 },
  { key: '2000s', label: '2000–2009 m.', includes: (year) => year >= 2000 && year < 2010 },
  { key: '2010s', label: '2010–2019 m.', includes: (year) => year >= 2010 && year < 2020 },
  { key: '2020s', label: '2020 m. ir vėliau', includes: (year) => year >= 2020 },
].map((cohort) => ({ ...cohort, count: foundingRecords.filter((record) => cohort.includes(record.founded_year)).length }))
  .filter((cohort) => cohort.count > 0);
const oldestFoundingYear = foundingRecords.length ? Math.min(...foundingRecords.map((record) => record.founded_year)) : null;
const newestFoundingYear = foundingRecords.length ? Math.max(...foundingRecords.map((record) => record.founded_year)) : null;
const regionDistribution = countBy(manufacturers, (record) => record.region_label?.trim());
const eligibleCityRoutes = new Map(landingCities.map((city) => [city.city, `/baldai-pagal-uzsakyma/${city.slug}`]));
const leadingCities = countBy(manufacturers, (record) => publishedLocality(record)).slice(0, 10);
const categoryPageCountsByCode = new Map(countBy(landingConfig.categories, (category) => category.code));
function manufacturerMatchesPublishedCategory(record, category) {
  const currentLabel = category.title.replace(/ pagal užsakymą$/, '');
  return record.category_codes.some((code, index) => code === category.code
    && (categoryPageCountsByCode.get(category.code) === 1 || record.category_labels[index] === currentLabel));
}
function publishedCategoryRecords(category) {
  return manufacturers
    .filter((record) => manufacturerMatchesPublishedCategory(record, category))
    .sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'en'));
}
const categoryMix = landingConfig.categories.map((category) => ({
  code: category.code,
  title: category.title,
  slug: category.slug,
  count: publishedCategoryRecords(category).length,
})).sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'lt'));
const topTurnoverMakers = [...marketTurnovers].sort((a, b) => b.turnover.amount - a.turnover.amount).slice(0, 10);
const distributionList = (items, total, metric, { locale = 'lt-LT', labelFor = (item) => item.label } = {}) => `<ul class="market-distribution">${items.map((item) => `<li data-market-${metric}="${escapeHtml(item.key ?? item.band ?? item.label)}" data-count="${item.count}"><div><span>${escapeHtml(labelFor(item))}</span><strong>${item.count} <small>(${formatPercent(item.count, total, locale)})</small></strong></div><span class="market-bar" aria-hidden="true"><span style="--market-share: ${total ? (item.count / total) * 100 : 0}%"></span></span></li>`).join('')}</ul>`;

const marketOverviewDescription = `Baldininkai.org katalogo ${manufacturers.length} gamintojų kandidatų apžvalga: apyvarta, darbuotojų grupės, įkūrimo metai, geografija ir kategorijos.`;
const marketOverviewSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Lietuvos baldų gamintojų katalogo rinkos apžvalga',
  description: marketOverviewDescription,
  url: marketOverviewUrl,
  mainEntityOfPage: marketOverviewUrl,
  inLanguage: 'lt-LT',
  datePublished: buildDate,
  dateModified: buildDate,
  author: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
};
const topTurnoverRows = topTurnoverMakers.map(({ record, turnover }) => `<tr data-market-top-turnover="${escapeHtml(record.slug)}"><th scope="row"><a href="/gamintojas/${escapeHtml(record.slug)}">${escapeHtml(record.trading_name)}</a></th><td>${escapeHtml(publishedLocality(record) ?? '—')}</td><td class="market-number">${escapeHtml(formatEuro(turnover.amount))}</td><td class="market-number">${turnover.year}</td><td><a data-market-source href="${escapeHtml(turnover.sourceUrl)}" rel="noopener noreferrer">Viešas šaltinis ↗</a></td></tr>`).join('');
const regionRows = regionDistribution.map(([label, count]) => `<tr data-market-region="${escapeHtml(label)}" data-count="${count}"><th scope="row">${escapeHtml(label)}</th><td class="market-number">${count}</td><td class="market-number">${formatPercent(count, manufacturers.length)}</td></tr>`).join('');
const cityRows = leadingCities.map(([city, count]) => {
  const route = eligibleCityRoutes.get(city);
  return `<tr data-market-city="${escapeHtml(city)}" data-count="${count}"><th scope="row">${route ? `<a href="${route}">${escapeHtml(city)}</a>` : escapeHtml(city)}</th><td class="market-number">${count}</td><td class="market-number">${formatPercent(count, manufacturers.length)}</td></tr>`;
}).join('');
const categoryRows = categoryMix.map((category) => `<tr data-market-category="${escapeHtml(category.slug)}" data-code="${escapeHtml(category.code)}" data-count="${category.count}"><th scope="row"><a href="/baldai-pagal-uzsakyma/${escapeHtml(category.slug)}">${escapeHtml(category.title)}</a></th><td class="market-number">${category.count}</td><td class="market-number">${formatPercent(category.count, manufacturers.length)}</td></tr>`).join('');
const marketOverviewBody = `${header('overview')}<main class="market-overview-main"><div class="market-top-links"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><nav class="language-links" aria-label="Kalbos pasirinkimas"><a href="/baldu-rinkos-apzvalga/" lang="lt" aria-current="page">Lietuvių</a><a href="/en/lithuanian-furniture-makers-data/" lang="en">English</a></nav></div><article class="market-overview-article"><header class="market-overview-hero"><div><p class="kicker">Katalogo duomenų pjūvis</p><h1>Lietuvos baldų gamintojų katalogo rinkos apžvalga</h1><p class="lead">Faktinė ${manufacturers.length} šiame kataloge skelbiamų gamintojų kandidatų suvestinė pagal viešuose šaltiniuose turimus įmonių duomenis.</p></div><p class="market-overview-date">Duomenų versija <time datetime="${buildDate}">${buildDate}</time></p></header><section class="market-section market-coverage-section" aria-labelledby="market-coverage-title"><div class="market-section-heading"><div><h2 id="market-coverage-title">Katalogo aprėptis</h2><p>Skaičiai rodo, kiek iš visų katalogo įrašų turi kiekvienai suvestinei tinkamą reikšmę.</p></div></div><dl class="market-coverage"><div data-market-coverage="total" data-count="${manufacturers.length}"><dt>Visi katalogo kandidatai</dt><dd>${manufacturers.length}</dd><small>100,0 %</small></div><div data-market-coverage="turnover" data-count="${marketTurnovers.length}"><dt>Galiojanti paskelbta apyvarta</dt><dd>${marketTurnovers.length}</dd><small>${formatPercent(marketTurnovers.length, manufacturers.length)}</small></div><div data-market-coverage="employees" data-count="${employeeRecords.length}"><dt>Darbuotojų skaičiaus grupė</dt><dd>${employeeRecords.length}</dd><small>${formatPercent(employeeRecords.length, manufacturers.length)}</small></div><div data-market-coverage="founded" data-count="${foundingRecords.length}"><dt>Galiojantys įkūrimo metai</dt><dd>${foundingRecords.length}</dd><small>${formatPercent(foundingRecords.length, manufacturers.length)}</small></div></dl></section><section class="market-section" aria-labelledby="market-turnover-title"><div class="market-section-heading"><div><h2 id="market-turnover-title">Paskelbta apyvarta</h2><p>Suvestinė apima tik ${marketTurnovers.length} įrašus, kurie atitinka kataloge jau taikomą paskelbtos apyvartos taisyklę: teigiama suma, finansiniai metai ir tiesioginė viešo šaltinio nuoroda.</p></div><p class="market-scope-note">Skirtingų finansinių metų reikšmės pateikiamos kartu.</p></div><dl class="market-headline-stats"><div data-market-turnover-stat="total"><dt>Bendra paskelbta apyvarta</dt><dd>${escapeHtml(formatEuro(turnoverTotal))}</dd></div><div data-market-turnover-stat="median"><dt>Mediana</dt><dd>${escapeHtml(formatEuro(turnoverMedian))}</dd></div><div data-market-turnover-stat="q1"><dt>Pirmasis kvartilis (Q1)</dt><dd>${escapeHtml(formatEuro(turnoverQ1))}</dd></div><div data-market-turnover-stat="q3"><dt>Trečiasis kvartilis (Q3)</dt><dd>${escapeHtml(formatEuro(turnoverQ3))}</dd></div></dl><div class="market-split"><div><h3>Apyvartos intervalai</h3>${distributionList(turnoverBands, marketTurnovers.length, 'turnover-band')}<p class="market-definition">Intervalai nepersidengia: €100 tūkst. įtraukiami į antrą, €500 tūkst. – į trečią intervalą.</p></div><div><h3>Finansinių metų pasiskirstymas</h3><ul class="market-year-list">${fiscalYears.map(([year, count]) => `<li data-market-fiscal-year="${year}" data-count="${count}"><span>${year} m.</span><strong>${count} <small>(${formatPercent(count, marketTurnovers.length)})</small></strong></li>`).join('')}</ul></div></div></section><section class="market-section" aria-labelledby="market-top-title"><div class="market-section-heading"><div><h2 id="market-top-title">Didžiausios paskelbtos apyvartos įrašai</h2><p>Dešimt didžiausių galiojančių reikšmių šiame kataloge. Lentelė yra faktinis duomenų pjūvis, ne įmonių reitingas ar rekomendacija.</p></div></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Didžiausios paskelbtos apyvartos įrašų lentelė"><table><thead><tr><th>Įmonė</th><th>Miestas</th><th>Apyvarta</th><th>Finansiniai metai</th><th>Šaltinis</th></tr></thead><tbody>${topTurnoverRows}</tbody></table></div></section><section class="market-section" aria-labelledby="market-employment-title"><div class="market-section-heading"><div><h2 id="market-employment-title">Darbuotojų grupės</h2><p>Pasiskirstymas skaičiuojamas tik iš ${employeeRecords.length} įrašų su faktine <code>employee_count_band</code> reikšme; tušti laukai nepriskiriami jokiai grupei.</p></div></div>${distributionList(employeeDistribution, employeeRecords.length, 'employee-band')}</section><section class="market-section" aria-labelledby="market-founded-title"><div class="market-section-heading"><div><h2 id="market-founded-title">Įkūrimo metų grupės</h2><p>Galiojantys metai žinomi ${foundingRecords.length} įrašams. Seniausi kataloge nurodyti metai – <strong data-market-founding-edge="oldest">${oldestFoundingYear}</strong>, naujausi – <strong data-market-founding-edge="newest">${newestFoundingYear}</strong>.</p></div></div>${distributionList(foundingCohorts, foundingRecords.length, 'founding-cohort')}</section><section class="market-section" aria-labelledby="market-geography-title"><div class="market-section-heading"><div><h2 id="market-geography-title">Geografija</h2><p>Regionai rodomi pagal dabartines katalogo <code>region_label</code> reikšmes. Miestas reiškia šaltinyje nurodytą registracijos, bazės ar kontakto vietą, ne garantuotą paslaugų teritoriją.</p></div></div><div class="market-split market-split--tables"><div><h3>Regionų žymos</h3><div class="market-table-wrap" tabindex="0" role="region" aria-label="Kandidatų pasiskirstymas pagal regiono žymą"><table><thead><tr><th>Regiono žyma</th><th>Įrašų</th><th>Katalogo dalis</th></tr></thead><tbody>${regionRows}</tbody></table></div></div><div><h3>Pirmaujantys miestai</h3><div class="market-table-wrap" tabindex="0" role="region" aria-label="Daugiausia katalogo įrašų turintys miestai"><table><thead><tr><th>Miestas</th><th>Įrašų</th><th>Katalogo dalis</th></tr></thead><tbody>${cityRows}</tbody></table></div></div></div></section><section class="market-section" aria-labelledby="market-category-title"><div class="market-section-heading"><div><h2 id="market-category-title">Kategorijų pjūvis</h2><p>Vienas kandidatas gali turėti kelias kategorijas, todėl eilučių skaičiai nesumuojami iki ${manufacturers.length}. Nuorodos veda į dabar skelbiamus kategorijų puslapius.</p></div></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Katalogo kandidatų pasiskirstymas pagal baldų kategoriją"><table><thead><tr><th>Kategorija</th><th>Įrašų</th><th>Katalogo dalis</th></tr></thead><tbody>${categoryRows}</tbody></table></div></section><section class="market-section market-methodology" aria-labelledby="market-method-title"><div class="market-section-heading"><div><h2 id="market-method-title">Metodika ir ribotumai</h2><p>Kaip sudarytos suvestinės ir ko iš jų negalima spręsti.</p></div></div><div class="market-method-grid"><div><h3>Šaltinis ir skaičiavimas</h3><p>Visi rodomi agregatai kūrimo metu apskaičiuoti tik iš versijuoto Baldininkai.org katalogo failo. Duomenų kilmė – vieši registrai ir vieši įmonių puslapiai. Kvartiliai skaičiuojami medianos padalytų pusių metodu.</p><p>Katalogo įrašai yra nepatvirtinti viešų šaltinių kandidatai. Tai šio katalogo aprėptis, o ne oficiali Lietuvos baldų rinkos ar nacionalinė statistika.</p></div><div><h3>Palyginimo ribos</h3><p>Apyvartos įrašų finansiniai metai yra mišrūs, todėl bendros sumos ir įmonių eilės negalima laikyti vieno laikotarpio rinkos rezultatu. Šis puslapis nėra reitingas ar rekomendacija ir nevertina kokybės, pajėgumo, užimtumo ar tinkamumo projektui.</p><p>Regionų bei miestų žymos perimamos iš katalogo ir gali neatitikti oficialaus administracinio skirstymo.</p></div></div><div class="market-data-links"><h3>Duomenys ir licencija</h3><p>Registrui pateiktų pajamų, pelno prieš apmokestinimą ir tų pačių įmonių metinių pokyčių eilutes rasite <a href="/baldu-sektoriaus-finansai/"><strong>metinėje finansų suvestinėje</strong></a>.</p><p>Atverkite <a href="/atviri-duomenys/">atvirų duomenų aprašą</a> arba atsisiųskite <a href="/baldininkai-org-gamintojai.json">JSON</a> ir <a href="/baldininkai-org-gamintojai.csv">CSV</a> failus. Duomenų rinkinys skelbiamas pagal <a href="${DATASET_LICENSE_URL}" rel="license">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>.</p><p><strong>Priskyrimas:</strong> <q>${datasetAttribution}</q></p></div></section></article></main>${footer()}`;
await writeRoute(marketOverviewPath, injectPage({
  title: 'Baldų rinkos apžvalga | Baldininkai.org katalogo duomenys',
  description: marketOverviewDescription,
  path: marketOverviewPath,
  type: 'article',
  body: marketOverviewBody,
  alternates: [
    { hreflang: 'lt', href: marketOverviewUrl },
    { hreflang: 'en', href: canonicalUrl('/en/lithuanian-furniture-makers-data') },
    { hreflang: 'x-default', href: canonicalUrl('/en/lithuanian-furniture-makers-data') },
  ],
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Baldų rinkos apžvalga', path: marketOverviewPath }]), marketOverviewSchema],
}));

const filedFinancePath = '/baldu-sektoriaus-finansai';
const filedFinanceUrl = canonicalUrl(filedFinancePath);
const filedFinanceDescription = 'Nuo 2019 m. katalogo įmonių registrui pateiktų pajamų, kvartilių, pelno prieš apmokestinimą aprėpties ir tų pačių įmonių metinių pokyčių suvestinė.';
const filedFinanceYears = filedFinancialYearGroups(manufacturers).map(([year, rows]) => {
  const revenueRows = rows.filter(({ entry }) => entry.revenue);
  const revenues = revenueRows.map(({ entry }) => entry.revenue.amount).sort((a, b) => a - b);
  const lowerHalf = revenues.slice(0, Math.floor(revenues.length / 2));
  const upperHalf = revenues.slice(Math.ceil(revenues.length / 2));
  const pbtRows = rows.filter(({ entry }) => entry.profitBeforeTax);
  const pbtValues = pbtRows.map(({ entry }) => entry.profitBeforeTax.amount);
  return {
    year,
    rows,
    revenueRows,
    revenueCount: revenues.length,
    revenueTotal: revenues.reduce((total, amount) => total + amount, 0),
    revenueMedian: median(revenues),
    revenueQ1: median(lowerHalf),
    revenueQ3: median(upperHalf),
    revenueBands: [
      { key: 'lt-100k', count: revenues.filter((amount) => amount < 100_000).length },
      { key: '100k-500k', count: revenues.filter((amount) => amount >= 100_000 && amount < 500_000).length },
      { key: '500k-2m', count: revenues.filter((amount) => amount >= 500_000 && amount <= 2_000_000).length },
      { key: 'gt-2m', count: revenues.filter((amount) => amount > 2_000_000).length },
    ],
    pbtCount: pbtValues.length,
    pbtPositive: pbtValues.filter((amount) => amount > 0).length,
    pbtZero: pbtValues.filter((amount) => amount === 0).length,
    pbtNegative: pbtValues.filter((amount) => amount < 0).length,
  };
}).filter((summary) => summary.revenueCount > 0);
const filedFinanceComparisons = filedFinanceYears.flatMap((current, index) => {
  const previous = filedFinanceYears[index - 1];
  if (!previous || current.year !== previous.year + 1) return [];
  const previousRevenueBySlug = new Map(previous.revenueRows.map(({ record, entry }) => [record.slug, entry.revenue.amount]));
  const cohort = current.revenueRows
    .filter(({ record }) => previousRevenueBySlug.has(record.slug))
    .map(({ record, entry }) => ({ slug: record.slug, previous: previousRevenueBySlug.get(record.slug), current: entry.revenue.amount }));
  const previousTotal = cohort.reduce((total, item) => total + item.previous, 0);
  const currentTotal = cohort.reduce((total, item) => total + item.current, 0);
  const change = currentTotal - previousTotal;
  return [{
    fromYear: previous.year,
    toYear: current.year,
    count: cohort.length,
    previousTotal,
    currentTotal,
    change,
    changeRatio: previousTotal !== 0 ? change / previousTotal : null,
    grew: cohort.filter((item) => item.current > item.previous).length,
    held: cohort.filter((item) => item.current === item.previous).length,
    declined: cohort.filter((item) => item.current < item.previous).length,
  }];
});
const filedFinanceYearRows = filedFinanceYears.map((summary) => `<tr data-filed-finance-year="${summary.year}" data-record-count="${summary.rows.length}" data-revenue-count="${summary.revenueCount}" data-revenue-total="${summary.revenueTotal}" data-revenue-median="${summary.revenueMedian}" data-revenue-q1="${summary.revenueQ1}" data-revenue-q3="${summary.revenueQ3}"><th scope="row">${summary.year} m.</th><td class="market-number">${summary.revenueCount}</td><td class="market-number">${escapeHtml(formatEuro(summary.revenueTotal))}</td><td class="market-number">${escapeHtml(formatEuro(summary.revenueMedian))}</td><td class="market-number">${escapeHtml(formatEuro(summary.revenueQ1))}</td><td class="market-number">${escapeHtml(formatEuro(summary.revenueQ3))}</td></tr>`).join('');
const filedFinanceBandRows = filedFinanceYears.map((summary) => `<tr data-filed-band-year="${summary.year}"><th scope="row">${summary.year} m.</th>${summary.revenueBands.map((band) => `<td class="market-number" data-filed-revenue-band="${band.key}" data-count="${band.count}">${band.count} (${formatPercent(band.count, summary.revenueCount)})</td>`).join('')}</tr>`).join('');
const filedFinanceComparisonRows = filedFinanceComparisons.map((comparison) => `<tr data-filed-cohort-from="${comparison.fromYear}" data-filed-cohort-to="${comparison.toYear}" data-count="${comparison.count}" data-previous-total="${comparison.previousTotal}" data-current-total="${comparison.currentTotal}" data-change="${comparison.change}"${comparison.changeRatio == null ? '' : ` data-change-ratio="${comparison.changeRatio}"`} data-grew="${comparison.grew}" data-held="${comparison.held}" data-declined="${comparison.declined}"><th scope="row">${comparison.fromYear}–${comparison.toYear}</th><td class="market-number">${comparison.count}</td><td class="market-number">${escapeHtml(formatEuro(comparison.previousTotal))} → ${escapeHtml(formatEuro(comparison.currentTotal))}</td><td class="market-number">${escapeHtml(formatSignedEuro(comparison.change))}${comparison.changeRatio == null ? '' : ` (${formatSignedPercent(comparison.changeRatio)})`}</td><td class="market-number">${comparison.grew} (${formatPercent(comparison.grew, comparison.count)})</td><td class="market-number">${comparison.held} (${formatPercent(comparison.held, comparison.count)})</td><td class="market-number">${comparison.declined} (${formatPercent(comparison.declined, comparison.count)})</td></tr>`).join('');
const filedFinancePbtRows = filedFinanceYears.map((summary) => `<tr data-filed-pbt-year="${summary.year}" data-record-count="${summary.rows.length}" data-pbt-count="${summary.pbtCount}" data-positive="${summary.pbtPositive}" data-zero="${summary.pbtZero}" data-negative="${summary.pbtNegative}"><th scope="row">${summary.year} m.</th><td class="market-number">${summary.pbtCount} iš ${summary.rows.length} (${formatPercent(summary.pbtCount, summary.rows.length)})</td><td class="market-number">${summary.pbtPositive} (${formatPercent(summary.pbtPositive, summary.pbtCount)})</td><td class="market-number">${summary.pbtZero} (${formatPercent(summary.pbtZero, summary.pbtCount)})</td><td class="market-number">${summary.pbtNegative} (${formatPercent(summary.pbtNegative, summary.pbtCount)})</td></tr>`).join('');
const filedFinanceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Baldų sektoriaus finansai: registrui pateiktų duomenų metinė suvestinė',
  description: filedFinanceDescription,
  url: filedFinanceUrl,
  mainEntityOfPage: filedFinanceUrl,
  inLanguage: 'lt-LT',
  datePublished: buildDate,
  dateModified: buildDate,
  author: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
};
const filedFinanceBody = `${header('overview')}<main class="market-overview-main"><div class="market-top-links"><a class="back-link" href="/baldu-rinkos-apzvalga/">← Grįžti į rinkos apžvalgą</a></div><article class="market-overview-article"><header class="market-overview-hero"><div><p class="kicker">Registrui pateiktų duomenų laiko eilutė</p><h1>Baldų sektoriaus finansai pagal katalogo įmonių ataskaitas</h1><p class="lead">Metinė tik šio katalogo įmonių galiojančių, API įrodymu pagrįstų pajamų ir pelno prieš apmokestinimą suvestinė.</p></div><p class="market-overview-date">Duomenų versija <time datetime="${buildDate}">${buildDate}</time></p></header><section class="market-section" aria-labelledby="filed-finance-revenue-title"><div class="market-section-heading"><div><h2 id="filed-finance-revenue-title">Registrui pateiktos pajamos pagal metus</h2><p>Metai nustatomi pagal fiskalinio laikotarpio pabaigos datą. Kiekvienai įmonei per vienus pabaigos metus naudojamas vienas naujausias galiojantis laikotarpis iš <code>filed_financial_history</code>.</p></div><p class="market-scope-note">Rodomi ${filedFinanceYears[0]?.year}–${filedFinanceYears.at(-1)?.year} m. įrašai, kuriuose yra pateikta pajamų eilutė.</p></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Registrui pateiktų pajamų metinė suvestinė"><table><thead><tr><th>Fiskalinio laikotarpio pabaigos metai</th><th>Įmonių su pajamomis</th><th>Bendra pateikta suma</th><th>Mediana</th><th>Q1</th><th>Q3</th></tr></thead><tbody>${filedFinanceYearRows}</tbody></table></div><p class="market-definition">Q1 ir Q3 apskaičiuoti medianos padalytų pusių metodu: kai reikšmių skaičius nelyginis, bendra mediana neįtraukiama nei į apatinę, nei į viršutinę pusę.</p></section><section class="market-section" aria-labelledby="filed-finance-bands-title"><div class="market-section-heading"><div><h2 id="filed-finance-bands-title">Pajamų intervalai</h2><p>Skaičius ir dalis skaičiuojami tik tarp tų metų įmonių su galiojančia registrui pateiktų pajamų eilute.</p></div></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Registrui pateiktų pajamų intervalai pagal metus"><table><thead><tr><th>Metai</th><th>Mažiau nei 100 tūkst. €</th><th>Nuo 100 tūkst. € iki mažiau nei 500 tūkst. €</th><th>Nuo 500 tūkst. € iki 2 mln. € imtinai</th><th>Daugiau nei 2 mln. €</th></tr></thead><tbody>${filedFinanceBandRows}</tbody></table></div><p class="market-definition">Intervalai nepersidengia: 100 000 € patenka į antrą intervalą, 500 000 € – į trečią, o 2 000 000 € dar lieka trečiame.</p></section><section class="market-section" aria-labelledby="filed-finance-cohort-title"><div class="market-section-heading"><div><h2 id="filed-finance-cohort-title">Tų pačių įmonių pokytis tarp gretimų metų</h2><p>Kiekviena pora apribota įmonėmis, turinčiomis galiojančią pateiktų pajamų eilutę abiem metais. Skirtingų įmonių metinės bendros sumos nėra lyginamos kaip augimas.</p></div><p class="market-scope-note">„Nepakito“ reiškia tiksliai tokią pačią sumą eurais abiem metais.</p></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Tų pačių įmonių pajamų pokytis tarp gretimų metų"><table><thead><tr><th>Metų pora</th><th>Kohortos įmonių</th><th>Bendra suma</th><th>Pokytis</th><th>Augo</th><th>Nepakito</th><th>Mažėjo</th></tr></thead><tbody>${filedFinanceComparisonRows}</tbody></table></div></section><section class="market-section" aria-labelledby="filed-finance-pbt-title"><div class="market-section-heading"><div><h2 id="filed-finance-pbt-title">Pelno prieš apmokestinimą aprėptis</h2><p>Aprėpties vardiklis – tų metų katalogo įmonės, turinčios bent vieną galiojančią finansinę eilutę. Teigiamos, nulinės ir neigiamos PBT reikšmės skaičiuojamos tik tarp faktiškai pateiktų PBT eilučių.</p></div><p class="market-scope-note">Trūkstama PBT reikšmė nėra laikoma nuliu ir nėra numanoma.</p></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Pelno prieš apmokestinimą aprėptis pagal metus"><table><thead><tr><th>Metai</th><th>PBT pateikta</th><th>Teigiama</th><th>Lygi nuliui</th><th>Neigiama</th></tr></thead><tbody>${filedFinancePbtRows}</tbody></table></div></section><section class="market-section market-methodology" aria-labelledby="filed-finance-method-title"><div class="market-section-heading"><div><h2 id="filed-finance-method-title">Metodika ir ribotumai</h2><p>Ką ši laiko eilutė apima ir ko iš jos negalima spręsti.</p></div></div><div class="market-method-grid"><div><h3>Šaltinis ir validavimo riba</h3><p>Visi skaičiai apskaičiuoti statinio svetainės kūrimo metu tik iš versijuoto <code>data/manufacturers.json</code> failo ir tik iš jo galiojančių <code>filed_financial_history</code> reikšmių.</p><p>Finansinės sumos įtraukiamos tik kai konkreti Juridinių asmenų registrui pateikta eilutė Lietuvos atvirų duomenų portale turi API įrodymą. Šaltinis: <a href="${OFFICIAL_FINANCIAL_SOURCE_URL}" rel="noopener noreferrer">${OFFICIAL_FINANCIAL_SOURCE_NAME}</a>.</p></div><div><h3>Kaip skaityti rezultatus</h3><p><strong>Tai katalogo aprėpties suvestinė, o ne Lietuvos nacionalinė ar baldų rinkos statistika.</strong> Katalogas neapima visų Lietuvos įmonių, o šaltinio įrašai naudoja mišrias finansinių ataskaitų formas ir fiskalinius laikotarpius.</p><p>Ši suvestinė nėra įmonių reitingas, rekomendacija ar darbų kokybės, pajėgumo, užimtumo bei tinkamumo konkrečiam projektui vertinimas. Ji neleidžia spręsti apie visos rinkos dydį ar atskiros įmonės paslaugų kokybę.</p></div></div><div class="market-data-links"><h3>Susiję puslapiai ir duomenys</h3><p>Platesnį katalogo dydžio, geografijos ir kategorijų pjūvį rasite <a href="/baldu-rinkos-apzvalga/"><strong>baldų rinkos apžvalgoje</strong></a>. Laukų aprašus, licenciją ir atsisiuntimus rasite <a href="/atviri-duomenys/"><strong>atvirų duomenų puslapyje</strong></a>.</p><p>Normalizuotas laikotarpių eilutes galima atsisiųsti <a href="/${financialDatasetCsvFilename}">pateiktų finansinių laikotarpių CSV</a>.</p></div></section></article></main>${footer()}`;
await writeRoute(filedFinancePath, injectPage({
  title: 'Baldų sektoriaus finansai pagal metus | Baldininkai.org',
  description: filedFinanceDescription,
  path: filedFinancePath,
  type: 'article',
  body: filedFinanceBody,
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Baldų rinkos apžvalga', path: marketOverviewPath }, { name: 'Metinė finansų suvestinė', path: filedFinancePath }]), filedFinanceSchema],
}));

const englishMarketOverviewPath = '/en/lithuanian-furniture-makers-data';
const englishMarketOverviewUrl = canonicalUrl(englishMarketOverviewPath);
const englishMarketOverviewDescription = `Catalogue-derived data for ${manufacturers.length} Lithuanian furniture-maker candidates, covering published turnover, employees, founding years, regions and categories.`;
const englishTurnoverBandLabels = new Map([
  ['lt-100k', 'Below €100,000'],
  ['100k-500k', '€100,000 to €500,000'],
  ['500k-2m', '€500,000 to €2 million'],
  ['gt-2m', 'Above €2 million'],
]);
const englishEmployeeBandLabels = new Map([
  ['0', '0 employees'],
  ['1-9', '1–9 employees'],
  ['10-49', '10–49 employees'],
  ['50-249', '50–249 employees'],
  ['250+', '250 or more employees'],
]);
const englishFoundingCohortLabels = new Map([
  ['before-1990', 'Before 1990'],
  ['1990s', '1990–1999'],
  ['2000s', '2000–2009'],
  ['2010s', '2010–2019'],
  ['2020s', '2020 or later'],
]);
const englishRegionLabels = new Map([
  ['Vilnius, rytų ir pietų Lietuva', 'Vilnius, eastern and southern Lithuania'],
  ['Kaunas ir šiaurės Lietuva', 'Kaunas and northern Lithuania'],
  ['Klaipėda, Panevėžys, vakarų ir centrinė Lietuva', 'Klaipėda, Panevėžys, western and central Lithuania'],
  ['Klaipėda, Panevėžys, vakarų ir vidurio Lietuva', 'Klaipėda, Panevėžys, western and mid-Lithuania'],
  ['Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)', 'All Lithuania (no city stated in the official source)'],
]);
const englishCategoryLabels = new Map([
  ['virtuves-baldai', 'Custom kitchen furniture'],
  ['spintos-ir-imontuojami-baldai', 'Custom wardrobes and fitted furniture'],
  ['miegamojo-ir-vonios-baldai', 'Custom bedroom and bathroom furniture'],
  ['biuro-ir-komerciniai-baldai', 'Custom office and commercial furniture'],
  ['horeca-ir-prekybos-baldai', 'Custom HoReCa and retail furniture'],
  ['minksti-baldai', 'Custom upholstered furniture'],
  ['medzio-darbai-ir-masyvo-baldai', 'Woodwork and solid-wood furniture'],
  ['metalo-ir-misriu-medziagu-baldai', 'Custom metal and mixed-material furniture'],
  ['kiti-nestandartiniai-baldai', 'Other custom furniture'],
  ['kiti-baldai', 'Other furniture'],
]);
const englishHubPath = '/en';
const englishQuoteRequestPath = '/en/quote-request';
const englishSourcingGuidePath = '/en/sourcing-guide';
const englishCityMinimum = 10;
const notPublishedEnglish = 'Not published in this catalogue';
const englishRegionSlugs = new Map([
  ['Vilnius, rytų ir pietų Lietuva', 'vilnius-east-south-lithuania'],
  ['Kaunas ir šiaurės Lietuva', 'kaunas-north-lithuania'],
  ['Klaipėda, Panevėžys, vakarų ir centrinė Lietuva', 'klaipeda-panevezys-west-central-lithuania'],
  ['Klaipėda, Panevėžys, vakarų ir vidurio Lietuva', 'klaipeda-panevezys-west-mid-lithuania'],
  ['Visa Lietuva (miestas nenurodytas oficialiame šaltinyje)', 'all-lithuania-city-not-stated'],
]);
const knownEnglishRegionLabels = new Set(englishRegionLabels.keys());
const englishRegionGroups = regionDistribution
  .filter(([sourceLabel]) => knownEnglishRegionLabels.has(sourceLabel))
  .map(([sourceLabel, count]) => {
    const slug = englishRegionSlugs.get(sourceLabel);
    const label = englishRegionLabels.get(sourceLabel);
    return {
      sourceLabel,
      label,
      slug,
      count,
      path: `/en/regions/${slug}`,
      records: manufacturers.filter((record) => record.region_label?.trim() === sourceLabel),
    };
  });
const officialLocationRecords = manufacturers.filter((record) => !knownEnglishRegionLabels.has(record.region_label?.trim()));
if (officialLocationRecords.length) {
  englishRegionGroups.push({
    sourceLabel: 'Oficialaus šaltinio vietovės be katalogo regiono grupės',
    label: 'Official-source locations without a catalogue region group',
    slug: 'official-source-locations-unassigned-region',
    count: officialLocationRecords.length,
    path: '/en/regions/official-source-locations-unassigned-region',
    records: officialLocationRecords,
  });
}
const englishCityGroups = allCities
  .filter((entry) => entry.count >= englishCityMinimum)
  .map((entry) => ({ ...entry, path: `/en/cities/${entry.slug}` }));
const englishTurnoverBands = [
  {
    key: 'lt-100k',
    slug: 'under-eur-100k',
    label: 'Under €100,000',
    title: 'Furniture makers with published turnover under €100,000',
    boundary: 'Published turnover is below €100,000.',
    includes: (amount) => amount < 100_000,
  },
  {
    key: '100k-500k',
    slug: 'eur-100k-to-500k',
    label: '€100,000 to under €500,000',
    title: 'Furniture makers with published turnover from €100,000 to under €500,000',
    boundary: 'Published turnover is at least €100,000 and below €500,000.',
    includes: (amount) => amount >= 100_000 && amount < 500_000,
  },
  {
    key: '500k-2m',
    slug: 'eur-500k-to-2m',
    label: '€500,000 to €2 million',
    title: 'Furniture makers with published turnover from €500,000 to €2 million',
    boundary: 'Published turnover is at least €500,000 and at most €2 million.',
    includes: (amount) => amount >= 500_000 && amount <= 2_000_000,
  },
  {
    key: 'gt-2m',
    slug: 'over-eur-2m',
    label: 'Over €2 million',
    title: 'Furniture makers with published turnover over €2 million',
    boundary: 'Published turnover is above €2 million.',
    includes: (amount) => amount > 2_000_000,
  },
].map((band) => ({
  ...band,
  path: `/en/turnover/${band.slug}`,
  records: marketTurnovers.filter(({ turnover }) => band.includes(turnover.amount)).map(({ record }) => record),
}));
const englishCategoryBasePath = '/en/furniture-makers';
const englishCategoryEntries = landingConfig.categories.map((category) => ({
  category,
  label: englishCategoryLabels.get(category.slug) ?? category.title,
  path: `${englishCategoryBasePath}/${category.slug}`,
  records: publishedCategoryRecords(category),
}));
const englishHubCategoryRows = englishCategoryEntries.map((entry) => `<tr data-en-hub-category="${escapeHtml(entry.category.slug)}" data-count="${entry.records.length}"><th scope="row"><a href="${entry.path}/">${escapeHtml(entry.label)}</a></th><td class="market-number">${entry.records.length}</td><td class="market-number">${formatPercent(entry.records.length, manufacturers.length, 'en-GB')}</td></tr>`).join('');

function englishEmployeeBand(record) {
  return englishEmployeeBandLabels.get(record.employee_count_band) ?? '';
}

function englishFoundingYear(record) {
  return publishedFoundingYear(record.founded_year);
}

function englishMakerRows(records) {
  return [...records]
    .sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'en'))
    .map((record) => {
      const employeeBand = englishEmployeeBand(record);
      const turnover = publishedTurnover(record);
      const foundingYear = englishFoundingYear(record);
      const employeeCell = employeeBand
        ? `<span data-en-employee="published" data-band="${escapeHtml(record.employee_count_band)}">${escapeHtml(employeeBand)}</span>`
        : `<span data-en-employee="not-published">${notPublishedEnglish}</span>`;
      const turnoverCell = turnover
        ? `<span data-en-turnover="published" data-amount="${turnover.amount}" data-year="${turnover.year}"><strong>${escapeHtml(formatEuro(turnover.amount, 'en-GB'))}</strong> (${turnover.year} fiscal year)<br><a data-en-financial-source href="${escapeHtml(turnover.sourceUrl)}" rel="noopener noreferrer">Direct financial source ↗</a></span>`
        : `<span data-en-turnover="not-published">${notPublishedEnglish}</span>`;
      const foundingCell = foundingYear
        ? `<span data-en-founded="published">${foundingYear}</span>`
        : `<span data-en-founded="not-published">${notPublishedEnglish}</span>`;
      return `<tr data-en-maker-row="${escapeHtml(record.slug)}"><th scope="row"><a data-en-profile-link href="/gamintojas/${escapeHtml(record.slug)}/">${escapeHtml(record.trading_name)}</a></th><td data-en-city>${escapeHtml(publishedLocality(record) ?? notPublishedEnglish)}</td><td>${employeeCell}</td><td>${turnoverCell}</td><td>${foundingCell}</td></tr>`;
    }).join('');
}

function englishMakerItemList(records, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${canonicalUrl(path)}#makers`,
    numberOfItems: records.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: [...records]
      .sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'en'))
      .map((record, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: record.trading_name,
        url: canonicalUrl(`/gamintojas/${record.slug}`),
      })),
  };
}

function englishCollectionPage(title, description, path, itemListId = `${canonicalUrl(path)}#makers`) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: canonicalUrl(path),
    inLanguage: 'en',
    mainEntity: { '@id': itemListId },
  };
}

function englishRouteItemList(items, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${canonicalUrl(path)}#sections`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: canonicalUrl(item.path),
    })),
  };
}

function englishSelfAlternates(path) {
  const url = canonicalUrl(path);
  return [
    { hreflang: 'en', href: url },
    { hreflang: 'x-default', href: url },
  ];
}

function englishSuiteLinks(currentPath) {
  const links = [
    { path: englishHubPath, label: 'English sourcing hub' },
    { path: englishQuoteRequestPath, label: 'Quote request' },
    { path: englishSourcingGuidePath, label: 'Sourcing guide' },
    { path: englishMarketOverviewPath, label: 'Catalogue data overview' },
  ];
  return `<nav class="article-next" aria-label="English sourcing pages">${links.map((link) => `<a href="${link.path}/"${link.path === currentPath ? ' aria-current="page"' : ''}>${escapeHtml(link.label)}</a>`).join('')}</nav>`;
}

async function writeEnglishMakerListPage({ path, title, description, heading, summary, records, kind, context, alternates = englishSelfAlternates(path) }) {
  const rows = englishMakerRows(records);
  const body = `${header(kind, 'en')}<main class="market-overview-main"><div class="market-top-links"><a class="back-link" href="/en/">← English sourcing hub</a></div><article class="market-overview-article"><header class="market-overview-hero"><div><p class="kicker">Catalogue data cut</p><h1>${escapeHtml(heading)}</h1><p class="lead">${escapeHtml(summary)}</p></div><p class="market-overview-date">Data version <time datetime="${buildDate}">${buildDate}</time></p></header><section class="market-section" aria-labelledby="en-list-context-title"><div class="market-section-heading"><div><h2 id="en-list-context-title">How to read this list</h2><p>${escapeHtml(context)}</p><p>This is a factual data cut from the current catalogue, not a ranking, endorsement or recommendation. Listings are unverified public-source candidates and do not establish quality, capacity, price, lead time, availability or service coverage.</p></div><p class="market-scope-note">${records.length} catalogue entr${records.length === 1 ? 'y' : 'ies'}.</p></div></section><section class="market-section" aria-labelledby="en-maker-table-title"><div class="market-section-heading"><div><h2 id="en-maker-table-title">Makers in this data cut</h2><p>Rows are alphabetical by maker name. “${notPublishedEnglish}” means the current versioned catalogue has no value that passes the display rule for that field.</p></div></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(heading)} factual table"><table><thead><tr><th>Maker</th><th>City</th><th>Employee band</th><th>Published turnover</th><th>Founding year</th></tr></thead><tbody>${rows}</tbody></table></div></section><section class="market-section market-methodology" aria-labelledby="en-list-method-title"><div class="market-section-heading"><div><h2 id="en-list-method-title">Data rules and next steps</h2><p>Turnover appears only when a positive amount, fiscal year and direct financial source link are all present. Employee bands and founding years are shown only when the catalogue contains a usable value.</p></div></div><div class="market-data-links"><p>Use the <a href="/en/sourcing-guide/">English sourcing guide</a> to interpret the fields and prepare questions. Review the <a href="/en/lithuanian-furniture-makers-data/">catalogue data overview</a> for scope and mixed-year limitations, or the <a href="/atviri-duomenys/">open-data documentation</a> for downloads and licence terms.</p></div></section>${englishSuiteLinks(path)}</article></main>${footer('en')}`;
  await writeRoute(path, injectPage({
    title,
    description,
    path,
    lang: 'en',
    locale: 'en_GB',
    alternates,
    body,
    structuredData: [
      breadcrumb([{ name: 'English sourcing hub', path: englishHubPath }, { name: heading, path }]),
      englishCollectionPage(heading, description, path),
      englishMakerItemList(records, path),
    ],
  }));
}

const englishHubDescription = `Source ${manufacturers.length} candidate Lithuanian furniture makers by published furniture category, catalogue region, larger city group and published-turnover band, with clear verification limits.`;
const englishHubItems = [
  ...englishCategoryEntries.map((entry) => ({ name: `Category: ${entry.label}`, path: entry.path })),
  ...englishRegionGroups.map((group) => ({ name: `Region: ${group.label}`, path: group.path })),
  ...englishCityGroups.map((group) => ({ name: `City: ${group.city}`, path: group.path })),
  ...englishTurnoverBands.map((band) => ({ name: `Turnover: ${band.label}`, path: band.path })),
  { name: 'English quote request', path: englishQuoteRequestPath },
  { name: 'English sourcing guide', path: englishSourcingGuidePath },
  { name: 'Catalogue data overview', path: englishMarketOverviewPath },
];
const englishHubBody = `${header('hub', 'en')}<main class="market-overview-main"><div class="market-top-links"><a class="back-link" href="/" lang="lt">← Open the Lithuanian catalogue</a><nav class="language-links" aria-label="Language selection"><a href="/" lang="lt">Lietuvių</a><a href="/en/" lang="en" aria-current="page">English</a></nav></div><article class="market-overview-article"><header class="market-overview-hero"><div><p class="kicker">Public-source sourcing hub</p><h1>Lithuanian furniture makers by category and published data cuts</h1><p class="lead">Source Lithuanian furniture makers from published catalogue data. Browse ${manufacturers.length} candidate makers by the source taxonomy, existing region labels, larger city groups and four non-overlapping published-turnover bands.</p></div><p class="market-overview-date">Data version <time datetime="${buildDate}">${buildDate}</time></p></header><section class="market-section market-coverage-section" aria-labelledby="en-hub-coverage-title"><div class="market-section-heading"><div><h2 id="en-hub-coverage-title">Catalogue coverage</h2><p>Coverage shows how many current records contain a usable public value. Missing values remain explicitly unpublished on category and factual data-cut pages.</p></div></div><dl class="market-coverage"><div data-en-hub-coverage="total" data-count="${manufacturers.length}"><dt>Published candidate records</dt><dd>${manufacturers.length}</dd><small>100.0%</small></div><div data-en-hub-coverage="turnover" data-count="${marketTurnovers.length}"><dt>Valid published turnover</dt><dd>${marketTurnovers.length}</dd><small>${formatPercent(marketTurnovers.length, manufacturers.length, 'en-GB')}</small></div><div data-en-hub-coverage="employees" data-count="${employeeRecords.length}"><dt>Employee count band</dt><dd>${employeeRecords.length}</dd><small>${formatPercent(employeeRecords.length, manufacturers.length, 'en-GB')}</small></div><div data-en-hub-coverage="founded" data-count="${foundingRecords.length}"><dt>Valid founding year</dt><dd>${foundingRecords.length}</dd><small>${formatPercent(foundingRecords.length, manufacturers.length, 'en-GB')}</small></div></dl></section><section class="market-section" id="categories" aria-labelledby="en-hub-categories-title"><div class="market-section-heading"><div><h2 id="en-hub-categories-title">Browse by furniture category</h2><p>Open any category to view its English catalogue page. A maker can appear in more than one category when its public-source record contains several furniture labels.</p></div></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Browse English furniture maker category pages"><table class="en-hub-category-table"><thead><tr><th>Published category</th><th>Makers</th><th>Catalogue share</th></tr></thead><tbody>${englishHubCategoryRows}</tbody></table></div></section><section class="market-section" aria-labelledby="en-hub-scope-title"><div class="market-section-heading"><div><h2 id="en-hub-scope-title">A shortlist starting point, not a supplier verdict</h2><p>These pages organise the current versioned catalogue without creating English maker-profile copies. Maker names lead to the existing Lithuanian catalogue profiles and factual source links remain attached to published turnover.</p><p>Listings are unverified public-source candidates. Publication is not an endorsement or ranking, and the catalogue does not guarantee identity, accuracy, quality, capacity, pricing, timing, availability, service coverage or suitability for a project.</p></div></div></section><section class="market-section landing-guide-callout" data-en-quote-request-cta aria-labelledby="en-hub-quote-title"><div><h2 id="en-hub-quote-title">Ready to describe a real project?</h2><p>Prepare one structured request for operator review. Catalogue entries remain unverified public-source candidates, submission is not an introduction guarantee, and makers are not contacted automatically.</p></div><a class="primary-button" href="/en/quote-request/">Prepare a quote request</a></section><section class="market-section" id="browse" aria-labelledby="en-regions-title"><div class="market-section-heading"><div><h2 id="en-regions-title">Browse by catalogue region</h2><p>Region pages follow the existing <code>region_label</code> groupings exactly; the labels are catalogue groupings rather than official administrative classifications.</p></div></div><ul class="city-index-list">${englishRegionGroups.map((group) => `<li class="city-index-item"><a href="${group.path}/"><span><strong>${escapeHtml(group.label)}</strong><small>Existing region_label grouping</small></span><span class="city-index-count">${group.count}</span></a></li>`).join('')}</ul></section><section class="market-section" aria-labelledby="en-cities-title"><div class="market-section-heading"><div><h2 id="en-cities-title">Browse larger city groups</h2><p>English city pages are limited to existing city groups with at least ${englishCityMinimum} catalogue entries. Smaller groups remain available through the Lithuanian catalogue without creating an English clone for every maker.</p></div></div><ul class="city-index-list">${englishCityGroups.map((group) => `<li class="city-index-item"><a href="${group.path}/"><span><strong>${escapeHtml(group.city)}</strong><small>Source-stated registration, base or contact location</small></span><span class="city-index-count">${group.count}</span></a></li>`).join('')}</ul></section><section class="market-section" id="turnover-bands" aria-labelledby="en-turnover-bands-title"><div class="market-section-heading"><div><h2 id="en-turnover-bands-title">Browse four published-turnover data cuts</h2><p>The four bands use the same non-overlapping boundaries as the catalogue data overview. Only entries with a positive amount, fiscal year and direct financial source link are included; fiscal years are mixed.</p></div></div><ul class="city-index-list">${englishTurnoverBands.map((band) => `<li class="city-index-item"><a href="${band.path}/"><span><strong>${escapeHtml(band.label)}</strong><small>Published-turnover rule satisfied</small></span><span class="city-index-count">${band.records.length}</span></a></li>`).join('')}</ul></section><section class="market-section market-methodology" aria-labelledby="en-hub-guide-title"><div class="market-section-heading"><div><h2 id="en-hub-guide-title">Interpret the fields before contacting a maker</h2><p>The <a href="/en/sourcing-guide/">English sourcing guide</a> explains catalogue scope, mixed fiscal years, Sodra-derived employee bands, founding year, shortlist checks and CC BY 4.0 reuse.</p></div></div><div class="market-data-links"><p>For aggregate context, open the <a href="/en/lithuanian-furniture-makers-data/">English catalogue data overview</a>. For the versioned downloads, licence and exact attribution, use the <a href="/atviri-duomenys/">open-data page</a>.</p><p>The published dataset is available under the <a href="${DATASET_LICENSE_URL}" rel="license">Creative Commons Attribution 4.0 International (CC BY 4.0)</a> licence.</p></div></section></article></main>${footer('en')}`;
await writeRoute(englishHubPath, injectPage({
  title: 'Lithuanian furniture makers sourcing hub | Baldininkai.org',
  description: englishHubDescription,
  path: englishHubPath,
  lang: 'en',
  locale: 'en_GB',
  alternates: [
    { hreflang: 'lt', href: canonicalUrl('/') },
    { hreflang: 'en', href: canonicalUrl(englishHubPath) },
    { hreflang: 'x-default', href: canonicalUrl('/') },
  ],
  body: englishHubBody,
  structuredData: [
    breadcrumb([{ name: 'English sourcing hub', path: englishHubPath }]),
    englishCollectionPage('Lithuanian furniture makers by category and published data cuts', englishHubDescription, englishHubPath, `${canonicalUrl(englishHubPath)}#sections`),
    englishRouteItemList(englishHubItems, englishHubPath),
  ],
}));

const englishQuoteRequestDescription = 'Prepare a structured furniture-project quote request for review. Catalogue candidates are unverified, makers are not contacted automatically and an introduction is not guaranteed.';
const englishQuoteRequestSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Request furniture quotes in Lithuania',
  description: englishQuoteRequestDescription,
  url: canonicalUrl(englishQuoteRequestPath),
  inLanguage: 'en',
  isPartOf: { '@id': `${SITE_URL}/#website` },
};
const englishQuoteRequestBody = `${header('request', 'en')}<main class="request-main rfq-main" data-en-quote-request-fallback><nav class="tool-navigation" aria-label="English sourcing"><strong>English sourcing</strong><div><a href="/en/">Sourcing hub</a><a href="/en/quote-request/" aria-current="page">Quote request</a><a href="/en/sourcing-guide/">Sourcing guide</a><a href="/en/lithuanian-furniture-makers-data/">Data overview</a></div></nav><section class="request-intro" aria-labelledby="request-title"><div><p class="kicker">Structured project request</p><h1 id="request-title">Prepare one comparable furniture quote request</h1><p class="lead">Describe the project for an operator review. Catalogue entries are unverified public-source candidates, submission does not guarantee an introduction, and makers are not contacted automatically.</p></div><aside class="request-expectation" aria-labelledby="request-expectation-title"><h2 id="request-expectation-title">Important process boundary</h2><p>Submitting the interactive form creates a private quote-request review record. It does not send your details or project to any maker.</p><p>A separate review and decision is required before any possible contact.</p></aside></section><section class="request-form-section" aria-labelledby="quote-form-loading-title"><div class="loading-state" role="status" aria-live="polite"><span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span><div><h2 id="quote-form-loading-title">JavaScript is preparing the quote-request form</h2><p>The page is loading the current catalogue candidate list and will replace this message with the interactive form. If it does not appear, enable JavaScript and reload the page.</p><noscript><p>JavaScript is required to prepare and submit this form. You can still return to the <a href="/en/">English sourcing hub</a> or read the <a href="/en/sourcing-guide/">sourcing guide</a>.</p></noscript></div></div></section></main>${footer('en')}`;
await writeRoute(englishQuoteRequestPath, injectPage({
  title: 'Request furniture quotes in Lithuania | Baldininkai.org',
  description: englishQuoteRequestDescription,
  path: englishQuoteRequestPath,
  lang: 'en',
  locale: 'en_GB',
  alternates: englishSelfAlternates(englishQuoteRequestPath),
  body: englishQuoteRequestBody,
  structuredData: [
    breadcrumb([{ name: 'English sourcing hub', path: englishHubPath }, { name: 'Quote request', path: englishQuoteRequestPath }]),
    englishQuoteRequestSchema,
  ],
}));

for (const group of englishRegionGroups) {
  await writeEnglishMakerListPage({
    path: group.path,
    title: `${group.label} furniture makers | Catalogue data cut`,
    description: `${group.count} Lithuanian furniture-maker candidates in the existing “${group.label}” catalogue region grouping, with factual company fields and source-linked turnover.`,
    heading: `Furniture makers: ${group.label}`,
    summary: `${group.count} candidate records grouped by the source-derived catalogue region label “${group.label}”.`,
    records: group.records,
    kind: 'region',
    context: `Membership follows the exact source-derived region_label value “${group.sourceLabel}”. The grouping may not match an official administrative region and does not establish service coverage.`,
  });
}

for (const group of englishCityGroups) {
  const ltPath = `/baldai-pagal-uzsakyma/${group.slug}`;
  await writeEnglishMakerListPage({
    path: group.path,
    title: `Furniture makers in ${group.city} | Catalogue data cut`,
    description: `${group.count} furniture-maker candidates with ${group.city} stated as their city, base or contact location, with employee, turnover and founding-year fields.`,
    heading: `Furniture makers in ${group.city}`,
    summary: `${group.count} candidate records whose current catalogue city field is ${group.city}.`,
    records: group.records,
    kind: 'city',
    context: `The city field records a registration, base or contact location stated in a source. It is not a promise that a maker serves every project in ${group.city} or outside it.`,
    alternates: [
      { hreflang: 'en', href: canonicalUrl(group.path) },
      { hreflang: 'lt', href: canonicalUrl(ltPath) },
      { hreflang: 'x-default', href: canonicalUrl(group.path) },
    ],
  });
}

for (const band of englishTurnoverBands) {
  await writeEnglishMakerListPage({
    path: band.path,
    title: `${band.title} | Catalogue data cut`,
    description: `${band.records.length} furniture-maker candidates in the ${band.label} published-turnover data cut, using positive amounts with fiscal years and direct sources.`,
    heading: band.title,
    summary: `${band.records.length} catalogue entries satisfy this published-turnover band. ${band.boundary}`,
    records: band.records,
    kind: 'turnover',
    context: `${band.boundary} Only records with a positive amount, fiscal year and direct financial source link are included. This is a data cut, not a ranking. Fiscal years are mixed, so rows are not a single-period comparison.`,
  });
}

const englishSourcingGuideDescription = 'How to interpret the Baldininkai.org catalogue fields, build a furniture-maker shortlist, ask comparable questions and reuse the open data under CC BY 4.0.';
const englishSourcingGuideSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to source Lithuanian furniture makers using the catalogue',
  description: englishSourcingGuideDescription,
  url: canonicalUrl(englishSourcingGuidePath),
  mainEntityOfPage: canonicalUrl(englishSourcingGuidePath),
  inLanguage: 'en',
  datePublished: buildDate,
  dateModified: buildDate,
  author: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
};
const englishSourcingGuideBody = `${header('guide', 'en')}<main class="article-main"><a class="back-link" href="/en/">← English sourcing hub</a><article class="guide-article"><header class="article-header"><p class="kicker">Catalogue sourcing guide</p><h1>How to source Lithuanian furniture makers using the catalogue</h1><p>${englishSourcingGuideDescription}</p></header><div class="guide-copy"><section><h2>Catalogue scope and limits</h2><p>Baldininkai.org is a versioned catalogue of candidate Lithuanian furniture makers assembled from public registers and public business pages. A listing is a research lead, not a verified supplier, endorsement, ranking or recommendation.</p><p>The catalogue does not guarantee identity, current accuracy, product quality, production capacity, price, lead time, availability, service coverage or suitability for a project. Confirm current legal, commercial and technical details directly before relying on them. The <a href="/en/lithuanian-furniture-makers-data/">catalogue data overview</a> explains coverage and aggregate limitations; the <a href="/atviri-duomenys/">open-data page</a> documents the downloadable version.</p></section><section><h2>What the factual fields mean</h2><h3>Published turnover and fiscal year</h3><p>A turnover figure appears in the English lists only when the catalogue has a positive amount, a fiscal year and a direct financial source link. The fiscal year is part of the fact: values from different years are not a like-for-like single-period comparison. Turnover is not evidence of quality, capacity available for your project, price or delivery speed.</p><h3>Sodra-derived employee bands</h3><p>The employee field is a band derived from publicly reported Sodra employment data and stored in the versioned catalogue. It is a broad company-size signal, not a current headcount promise and not proof of production capacity, skills, quality, availability or who would perform your work.</p><h3>Founding year</h3><p>Founding year records the usable year attached to the company entry when one is available. It does not prove continuous operation under the same team, ownership, scope or trading name, and it is not a quality score.</p><p>When a usable value is absent, the English tables state “${notPublishedEnglish}” rather than infer or fill a value.</p></section><section><h2>Build a shortlist without treating the catalogue as a ranking</h2><ol><li>Choose the relevant region or larger city data cut, while remembering that a source-stated location is not a service-area guarantee.</li><li>Use a turnover band only as a transparent data filter. Keep the fiscal year beside every amount and do not compare mixed years as one market period.</li><li>Open each linked Lithuanian catalogue profile and review its public-source links, identity details, categories and verification dates.</li><li>Create a short list based on project fit that you will verify directly, not on catalogue order or one company-size field.</li><li>Send the same project brief and the same questions to every candidate so responses can be compared on equal terms.</li></ol></section><section><h2>Questions to ask a maker</h2><ul><li>Which legal entity will quote, contract, invoice and receive payment?</li><li>Do you currently accept this furniture type, project location and approximate scope?</li><li>Which parts will you measure, design, manufacture, deliver, install or subcontract?</li><li>What exact materials, finishes, hardware models and drawings are included?</li><li>What is excluded from the price, and which assumptions could change it?</li><li>Which milestones define the schedule, and what customer decisions are required before each one?</li><li>Can you provide relevant references and explain your precise role in those projects?</li><li>What written warranty, acceptance and defect-correction terms will form part of the agreement?</li></ul><p>Answers should be confirmed in a written quotation, specification and contract. The catalogue itself does not make these commitments for a maker.</p></section><section><h2>Reuse under CC BY 4.0</h2><p>The downloadable catalogue dataset is licensed under <a href="${DATASET_LICENSE_URL}" rel="license">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>. Follow the scope and limitations on the <a href="/atviri-duomenys/">open-data page</a> and retain this exact attribution line:</p><p><strong>Attribution:</strong> <q>${datasetAttribution}</q></p></section></div>${englishSuiteLinks(englishSourcingGuidePath)}</article></main>${footer('en')}`;
await writeRoute(englishSourcingGuidePath, injectPage({
  title: 'How to source Lithuanian furniture makers | English guide',
  description: englishSourcingGuideDescription,
  path: englishSourcingGuidePath,
  type: 'article',
  lang: 'en',
  locale: 'en_GB',
  alternates: englishSelfAlternates(englishSourcingGuidePath),
  body: englishSourcingGuideBody,
  structuredData: [
    breadcrumb([{ name: 'English sourcing hub', path: englishHubPath }, { name: 'Sourcing guide', path: englishSourcingGuidePath }]),
    englishSourcingGuideSchema,
  ],
}));

const topTurnoverRowsEnglish = topTurnoverMakers.map(({ record, turnover }) => `<tr data-market-top-turnover="${escapeHtml(record.slug)}"><th scope="row"><a href="/gamintojas/${escapeHtml(record.slug)}">${escapeHtml(record.trading_name)}</a></th><td>${escapeHtml(publishedLocality(record) ?? notPublishedEnglish)}</td><td class="market-number">${escapeHtml(formatEuro(turnover.amount, 'en-GB'))}</td><td class="market-number">${turnover.year}</td><td><a data-market-source href="${escapeHtml(turnover.sourceUrl)}" rel="noopener noreferrer">Published source ↗</a></td></tr>`).join('');
const fallbackEnglishRegionGroup = englishRegionGroups.find((entry) => entry.path === '/en/regions/official-source-locations-unassigned-region');
const regionRowsEnglish = regionDistribution.map(([label, count]) => {
  const group = englishRegionGroups.find((entry) => entry.sourceLabel === label) ?? fallbackEnglishRegionGroup;
  if (!group) throw new Error(`Missing English data-cut route for region_label: ${label}`);
  return `<tr data-market-region="${escapeHtml(label)}" data-count="${count}"><th scope="row"><a href="${group.path}/">${escapeHtml(group.label)}</a></th><td class="market-number">${count}</td><td class="market-number">${formatPercent(count, manufacturers.length, 'en-GB')}</td></tr>`;
}).join('');
const cityRowsEnglish = leadingCities.map(([city, count]) => {
  const group = englishCityGroups.find((entry) => entry.city === city);
  return `<tr data-market-city="${escapeHtml(city)}" data-count="${count}"><th scope="row">${group ? `<a href="${group.path}/">${escapeHtml(city)}</a>` : escapeHtml(city)}</th><td class="market-number">${count}</td><td class="market-number">${formatPercent(count, manufacturers.length, 'en-GB')}</td></tr>`;
}).join('');
const categoryRowsEnglish = categoryMix.map((category) => `<tr data-market-category="${escapeHtml(category.slug)}" data-code="${escapeHtml(category.code)}" data-count="${category.count}"><th scope="row"><a href="/en/furniture-makers/${escapeHtml(category.slug)}/">${escapeHtml(englishCategoryLabels.get(category.slug) ?? category.title)}</a></th><td class="market-number">${category.count}</td><td class="market-number">${formatPercent(category.count, manufacturers.length, 'en-GB')}</td></tr>`).join('');
const englishMarketOverviewSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Lithuanian furniture makers: catalogue data overview',
  description: englishMarketOverviewDescription,
  url: englishMarketOverviewUrl,
  mainEntityOfPage: englishMarketOverviewUrl,
  inLanguage: 'en',
  datePublished: buildDate,
  dateModified: buildDate,
  author: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
};
const englishMarketOverviewBody = `${header('overview', 'en')}<main class="market-overview-main"><div class="market-top-links"><a class="back-link" href="/en/">← English sourcing hub</a><nav class="language-links" aria-label="Language selection"><a href="/baldu-rinkos-apzvalga/" lang="lt">Lietuvių</a><a href="/en/lithuanian-furniture-makers-data/" lang="en" aria-current="page">English</a></nav></div><article class="market-overview-article"><header class="market-overview-hero"><div><p class="kicker">Catalogue data, clearly scoped</p><h1>Lithuanian furniture makers: catalogue data overview</h1><p class="lead">A factual summary of ${manufacturers.length} candidate furniture makers currently published in the Baldininkai.org catalogue, using company information available from public sources.</p></div><p class="market-overview-date">Data version <time datetime="${buildDate}">${buildDate}</time></p></header><section class="market-section" aria-labelledby="english-sourcing-routes-title"><div class="market-section-heading"><div><h2 id="english-sourcing-routes-title">Browse the English sourcing pages</h2><p>Open the <a href="/en/">English sourcing hub</a> for factual region pages, larger-city pages and all four published-turnover data cuts, or use the <a href="/en/sourcing-guide/">sourcing guide</a> to interpret the fields before building a shortlist.</p></div></div></section><section class="market-section market-coverage-section" aria-labelledby="market-coverage-title"><div class="market-section-heading"><div><h2 id="market-coverage-title">Catalogue coverage</h2><p>The catalogue is constructed from public registers and public business pages. These figures show how many catalogue entries contain a usable value for each measure.</p></div></div><dl class="market-coverage"><div data-market-coverage="total" data-count="${manufacturers.length}"><dt>All catalogue candidates</dt><dd>${manufacturers.length}</dd><small>100.0%</small></div><div data-market-coverage="turnover" data-count="${marketTurnovers.length}"><dt>Valid published turnover</dt><dd>${marketTurnovers.length}</dd><small>${formatPercent(marketTurnovers.length, manufacturers.length, 'en-GB')}</small></div><div data-market-coverage="employees" data-count="${employeeRecords.length}"><dt>Employee count band</dt><dd>${employeeRecords.length}</dd><small>${formatPercent(employeeRecords.length, manufacturers.length, 'en-GB')}</small></div><div data-market-coverage="founded" data-count="${foundingRecords.length}"><dt>Valid founding year</dt><dd>${foundingRecords.length}</dd><small>${formatPercent(foundingRecords.length, manufacturers.length, 'en-GB')}</small></div></dl></section><section class="market-section" aria-labelledby="market-turnover-title"><div class="market-section-heading"><div><h2 id="market-turnover-title">Published turnover</h2><p>This summary includes only the ${marketTurnovers.length} entries that satisfy the catalogue’s existing published-turnover rule: a positive amount, a fiscal year and a direct public source link.</p></div><p class="market-scope-note">The figures combine different fiscal years.</p></div><dl class="market-headline-stats"><div data-market-turnover-stat="total"><dt>Combined published turnover</dt><dd>${escapeHtml(formatEuro(turnoverTotal, 'en-GB'))}</dd></div><div data-market-turnover-stat="median"><dt>Median</dt><dd>${escapeHtml(formatEuro(turnoverMedian, 'en-GB'))}</dd></div><div data-market-turnover-stat="q1"><dt>First quartile (Q1)</dt><dd>${escapeHtml(formatEuro(turnoverQ1, 'en-GB'))}</dd></div><div data-market-turnover-stat="q3"><dt>Third quartile (Q3)</dt><dd>${escapeHtml(formatEuro(turnoverQ3, 'en-GB'))}</dd></div></dl><div class="market-split"><div><h3>Turnover size bands</h3>${distributionList(turnoverBands, marketTurnovers.length, 'turnover-band', { locale: 'en-GB', labelFor: (item) => englishTurnoverBandLabels.get(item.key) ?? item.label })}<p class="market-definition">Bands do not overlap: €100,000 enters the second band and €500,000 enters the third.</p></div><div><h3>Fiscal-year mix</h3><ul class="market-year-list">${fiscalYears.map(([year, count]) => `<li data-market-fiscal-year="${year}" data-count="${count}"><span>${year}</span><strong>${count} <small>(${formatPercent(count, marketTurnovers.length, 'en-GB')})</small></strong></li>`).join('')}</ul></div></div></section><section class="market-section" aria-labelledby="market-top-title"><div class="market-section-heading"><div><h2 id="market-top-title">Top makers by published turnover</h2><p>The ten largest valid values in this catalogue are shown as a factual table with their fiscal year and direct published source. This is not a company ranking or recommendation.</p></div></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Top makers by published turnover"><table><thead><tr><th>Maker</th><th>City</th><th>Published turnover</th><th>Fiscal year</th><th>Source</th></tr></thead><tbody>${topTurnoverRowsEnglish}</tbody></table></div></section><section class="market-section" aria-labelledby="market-employment-title"><div class="market-section-heading"><div><h2 id="market-employment-title">Employee distribution</h2><p>The distribution uses only the ${employeeRecords.length} entries with an actual <code>employee_count_band</code> value. Empty fields are not assigned to a band.</p></div></div>${distributionList(employeeDistribution, employeeRecords.length, 'employee-band', { locale: 'en-GB', labelFor: (item) => englishEmployeeBandLabels.get(item.band) ?? item.label })}</section><section class="market-section" aria-labelledby="market-founded-title"><div class="market-section-heading"><div><h2 id="market-founded-title">Founding-year distribution</h2><p>Valid founding years are available for ${foundingRecords.length} entries. The oldest year in the catalogue is <strong data-market-founding-edge="oldest">${oldestFoundingYear}</strong> and the newest is <strong data-market-founding-edge="newest">${newestFoundingYear}</strong>.</p></div></div>${distributionList(foundingCohorts, foundingRecords.length, 'founding-cohort', { locale: 'en-GB', labelFor: (item) => englishFoundingCohortLabels.get(item.key) ?? item.label })}</section><section class="market-section" aria-labelledby="market-geography-title"><div class="market-section-heading"><div><h2 id="market-geography-title">Regional split</h2><p>Regions use the catalogue’s current <code>region_label</code> values. City means a registration, base or contact location stated in a source, not a guaranteed service area.</p></div></div><div class="market-split market-split--tables"><div><h3>Region labels</h3><div class="market-table-wrap" tabindex="0" role="region" aria-label="Catalogue candidates by region label"><table><thead><tr><th>Region label</th><th>Entries</th><th>Catalogue share</th></tr></thead><tbody>${regionRowsEnglish}</tbody></table></div></div><div><h3>Leading cities</h3><div class="market-table-wrap" tabindex="0" role="region" aria-label="Cities with the most catalogue entries"><table><thead><tr><th>City</th><th>Entries</th><th>Catalogue share</th></tr></thead><tbody>${cityRowsEnglish}</tbody></table></div></div></div></section><section class="market-section" aria-labelledby="market-category-title"><div class="market-section-heading"><div><h2 id="market-category-title">Category split</h2><p>A candidate can appear in several categories, so the rows do not sum to ${manufacturers.length}. Links open the currently published catalogue category pages.</p></div></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="Catalogue candidates by furniture category"><table><thead><tr><th>Category</th><th>Entries</th><th>Catalogue share</th></tr></thead><tbody>${categoryRowsEnglish}</tbody></table></div></section><section class="market-section market-methodology" aria-labelledby="market-method-title"><div class="market-section-heading"><div><h2 id="market-method-title">Method and limitations</h2><p>How the aggregates are constructed and what they do not establish.</p></div></div><div class="market-method-grid"><div><h3>Sources and calculation</h3><p>Every aggregate is computed at build time from the same versioned Baldininkai.org catalogue file used by the Lithuanian overview. The catalogue is constructed from public registers and public business pages. Quartiles use the median-of-halves method.</p><p><strong>This is catalogue coverage, not official Lithuanian national or furniture-market statistics.</strong></p></div><div><h3>Limits on interpretation</h3><p>Listings are unverified public-source candidates. Publication is not an endorsement, ranking or guarantee of identity, accuracy, quality, capacity, price, timing, availability, service coverage or suitability for a project.</p><p>Turnover values cover a mix of fiscal years, so the combined total and table order are not a single-period market result. Region and city labels may not match official administrative classifications.</p></div></div><div class="market-data-links"><h3>Data, licence and related pages</h3><p>Read the <a href="/atviri-duomenys/">open-data documentation</a>, download the <a href="/baldininkai-org-gamintojai.json">JSON dataset</a> or <a href="/baldininkai-org-gamintojai.csv">CSV dataset</a>, or open the <a href="/baldu-rinkos-apzvalga/" lang="lt">Lithuanian market overview</a>.</p><p>The dataset is published under the <a href="${DATASET_LICENSE_URL}" rel="license">Creative Commons Attribution 4.0 International (CC BY 4.0)</a> licence.</p><p><strong>Attribution:</strong> <q>${datasetAttribution}</q></p></div></section></article></main>${footer('en')}`;
await writeRoute(englishMarketOverviewPath, injectPage({
  title: 'Lithuanian furniture makers data | Baldininkai.org',
  description: englishMarketOverviewDescription,
  path: englishMarketOverviewPath,
  type: 'article',
  lang: 'en',
  locale: 'en_GB',
  alternates: [
    { hreflang: 'en', href: englishMarketOverviewUrl },
    { hreflang: 'lt', href: marketOverviewUrl },
    { hreflang: 'x-default', href: englishMarketOverviewUrl },
  ],
  body: englishMarketOverviewBody,
  structuredData: [breadcrumb([{ name: 'Furniture makers catalogue', path: '/' }, { name: 'Lithuanian furniture makers data', path: englishMarketOverviewPath }]), englishMarketOverviewSchema],
}));

function englishCategoryMakerRow(record) {
  const turnover = publishedTurnover(record);
  const employeeBand = englishEmployeeBand(record);
  const foundingYear = englishFoundingYear(record);
  const region = record.region_label?.trim();
  const locality = publishedLocality(record);
  const location = `${locality ? `<strong>${escapeHtml(locality)}</strong><br />` : ''}<span>${region ? escapeHtml(englishRegionLabels.get(region) ?? region) : 'Region not published'}</span>`;
  const employees = employeeBand
    ? `<span data-en-employee-status="published" data-band="${escapeHtml(record.employee_count_band)}">${escapeHtml(employeeBand)}</span>`
    : '<span data-en-employee-status="not-published">Not published</span>';
  const turnoverCell = turnover
    ? `<span data-en-turnover-status="published" data-amount="${turnover.amount}" data-year="${turnover.year}"><strong>${escapeHtml(formatEuro(turnover.amount, 'en-GB'))}</strong><br /><small>Fiscal year ${turnover.year}</small><br /><a data-en-turnover-source href="${escapeHtml(turnover.sourceUrl)}" rel="noopener noreferrer">Published source ↗</a></span>`
    : '<span data-en-turnover-status="not-published">Not published</span>';
  const founded = foundingYear
    ? `<span data-en-founding-status="published" data-year="${foundingYear}">${foundingYear}</span>`
    : '<span data-en-founding-status="not-published">Not published</span>';
  return `<tr data-en-category-maker="${escapeHtml(record.slug)}"><th scope="row"><a href="/gamintojas/${escapeHtml(record.slug)}/">${escapeHtml(record.trading_name)}</a><br /><small><a data-en-maker-quote-link href="/en/quote-request/?maker=${encodeURIComponent(record.slug)}">Include in quote request</a></small></th><td class="en-maker-location">${location}</td><td>${employees}</td><td class="en-maker-turnover">${turnoverCell}</td><td class="market-number">${founded}</td></tr>`;
}

for (const entry of englishCategoryEntries) {
  const { category, label, path, records } = entry;
  const lithuanianPath = `/baldai-pagal-uzsakyma/${category.slug}`;
  const description = `${label} in Lithuania: ${records.length} public-source candidate makers with city or region, employee band, published turnover sources and founding year where available.`;
  const itemListId = `${canonicalUrl(path)}#makers`;
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': itemListId,
    numberOfItems: records.length,
    itemListElement: records.map((record, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: record.trading_name,
      url: canonicalUrl(`/gamintojas/${record.slug}`),
    })),
  };
  const rows = records.map(englishCategoryMakerRow).join('');
  const body = `${header('category', 'en')}<main class="market-overview-main"><div class="market-top-links"><a class="back-link" href="/en/">← All furniture categories</a><nav class="language-links" aria-label="Language selection"><a href="${lithuanianPath}/" lang="lt">Lietuvių</a><a href="${path}/" lang="en" aria-current="page">English</a></nav></div><article class="market-overview-article"><header class="market-overview-hero"><div><p class="kicker">Furniture maker category</p><h1>${escapeHtml(label)} makers in Lithuania</h1><p class="lead">${records.length} candidate makers whose current public-source catalogue records match this published furniture category.</p></div><p class="market-overview-date">Data version <time datetime="${buildDate}">${buildDate}</time></p></header><section class="market-section" aria-labelledby="en-category-makers-title"><div class="market-section-heading"><div><h2 id="en-category-makers-title">Published candidate makers</h2><p>Company names open the existing Lithuanian catalogue profile. “Not published” means the current source record has no usable value for that field.</p></div><p class="market-scope-note">Alphabetical by company name; not ranked.</p></div><div class="market-table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(label)} candidate makers"><table><thead><tr><th>Company</th><th>City / region</th><th>Employee band</th><th>Published turnover</th><th>Founded</th></tr></thead><tbody>${rows}</tbody></table></div></section><section class="market-section landing-guide-callout" data-en-quote-request-cta aria-labelledby="en-category-quote-title"><div><h2 id="en-category-quote-title">Turn this category search into a project brief</h2><p>Use the same structured request fields for scope, dimensions, materials, budget, timing and installation access. Selecting a catalogue candidate is a review preference only and does not contact the maker automatically.</p></div><a class="primary-button" href="/en/quote-request/">Prepare a quote request</a></section><section class="market-section market-methodology" aria-labelledby="en-category-limits-title"><div class="market-section-heading"><div><h2 id="en-category-limits-title">How to use this list</h2><p>This page is a factual public-source category view, not supplier verification.</p></div></div><div class="market-method-grid"><div><h3>What is shown</h3><p>Turnover appears only when the catalogue’s existing published-turnover rule returns a positive amount, fiscal year and direct public source link. Employee band and founding year are shown only when valid values exist in the current record.</p><p>View the <a href="${lithuanianPath}/" lang="lt">matching Lithuanian category page</a> or return to the <a href="/en/">English sourcing hub</a>.</p></div><div><h3>Limitations</h3><p>Listings are unverified public-source candidates. Inclusion is not an endorsement or ranking and does not guarantee identity, accuracy, quality, capacity, price, timing, availability, service coverage or suitability.</p><p>Verify every candidate independently before making a commercial decision.</p></div></div><div class="market-data-links"><h3>Data and licence</h3><p>Read the <a href="/atviri-duomenys/">open-data documentation</a>. The published dataset is licensed under <a href="${DATASET_LICENSE_URL}" rel="license">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>.</p></div></section></article></main>${footer('en')}`;
  await writeRoute(path, injectPage({
    title: `${label} makers in Lithuania | Baldininkai.org`,
    description,
    path,
    lang: 'en',
    locale: 'en_GB',
    alternates: [
      { hreflang: 'en', href: canonicalUrl(path) },
      { hreflang: 'lt', href: canonicalUrl(lithuanianPath) },
      { hreflang: 'x-default', href: canonicalUrl(lithuanianPath) },
    ],
    body,
    structuredData: [
      breadcrumb([{ name: 'Lithuanian furniture makers', path: englishHubPath }, { name: label, path }]),
      collectionPageSchema({ name: `${label} makers in Lithuania`, description, path, itemListId }),
      itemList,
    ],
  }));
}

for (const record of manufacturers) {
  const path = `/gamintojas/${record.slug}`;
  const sources = [...new Set([...(record.source_urls ?? []), record.source_artifact_url, ...(record.public_details_source_urls ?? [])].map(publicUrl).filter(Boolean))];
  const facts = [
    ['Viešas / prekinis pavadinimas', record.trading_name],
    ['Juridinis pavadinimas', record.legal_name || 'Viešame šaltinyje juridinis pavadinimas nenurodytas.'],
    ['Šaltinyje pateikta tapatybė', record.source_identity],
    ['Vietovė šaltinyje', publishedLocation(record.location)],
    ['Miestas ar vietovė', publishedLocality(record)],
    ['Šaltinio regiono grupė', record.region_label],
    ['Kategorijos', record.category_labels.join(', ')],
    ['Aprašymas', record.description_lt?.trim() || 'Trumpas aprašymas šaltiniuose nepateiktas.'],
    ['Šaltinyje aprašyta veiklos apimtis', record.scope_evidence?.trim() || 'Papildomas veiklos apimties aprašymas šaltinyje nepateiktas.'],
  ].filter(([, value]) => value);
  const linkFacts = [
    ['Svetainė', publicUrl(record.website)],
    ['Viešai nurodytas kontaktinis adresas', publicUrl(record.public_contact_url)],
  ].filter(([, value]) => value);
  const publicFacts = [
    ['Įmonės kodas', record.company_code?.trim()],
    ['Registracijos adresas', record.street_address?.trim()],
    ['Pašto kodas', record.postcode?.trim()],
    ['Įkurta', publishedFoundingYear(record.founded_year) ? String(publishedFoundingYear(record.founded_year)) : ''],
  ].filter(([, value]) => value);
  const financialHistory = filedFinancialHistory(record);
  const financialHistoryHtml = filedFinancialHistoryBlock(financialHistory);
  const turnover = financialHistory.length ? null : publishedTurnover(record);
  const turnoverFact = turnover
    ? `<div><dt>Apyvarta (${turnover.year} m.)</dt><dd><strong>${escapeHtml(formatEuro(turnover.amount))}</strong><p class="fact-explanation">Tai viešame įmonės įraše paskelbta apyvarta už nurodytus finansinius metus. Ji nepatvirtina gamintojo kokybės, dabartinio užimtumo ar galimybės priimti jūsų projektą.</p><a href="${escapeHtml(turnover.sourceUrl)}" rel="noopener noreferrer">Atverti apyvartos šaltinį</a></dd></div>`
    : '';
  const employeeCountBand = record.employee_count_band?.trim();
  const employeeSourceLinks = (record.public_details_source_urls ?? []).map(publicUrl).filter((url) => url?.includes('rekvizitai.vz.lt'));
  const employeeSizeFact = employeeCountBand
    ? `<div><dt>Įmonės dydžio signalas</dt><dd><strong>${escapeHtml(employeeBandLabel(employeeCountBand))}</strong><p class="fact-explanation">Tai viešame įmonės įraše nurodyta darbuotojų skaičiaus grupė. Ji neparodo darbų kokybės, dabartinio užimtumo ar galimybės priimti jūsų projektą.</p>${employeeSourceLinks.length ? `<ul class="fact-source-list">${employeeSourceLinks.map((url, index) => `<li><a href="${escapeHtml(url)}" rel="noopener noreferrer">${employeeSourceLinks.length === 1 ? 'Atverti viešą darbuotojų skaičiaus šaltinį' : `Atverti viešą šaltinį ${index + 1}`}</a></li>`).join('')}</ul>` : ''}</dd></div>`
    : '';
  const publicPhone = record.public_phone?.trim();
  const telephoneHref = publicPhone ? `tel:${publicPhone.replace(/[^+\d]/g, '').replace(/(?!^)\+/g, '')}` : '';
  const noPublicContactRoute = record.no_public_contact_route === true && !publicPhone && !linkFacts.length;
  const contactCheckedDate = registryCheckedDate(record.public_contact_checked_date);
  const noPublicContactFact = noPublicContactRoute
    ? `<div><dt>Viešas kontaktas</dt><dd>Viešo kontaktinio kelio nerasta${contactCheckedDate ? ` per <time datetime="${contactCheckedDate.iso}">${escapeHtml(contactCheckedDate.label)}</time> atliktą viešų šaltinių patikrą` : ' per viešų šaltinių patikrą'}.</dd></div>`
    : '';
  const publicDetails = publicFacts.length || financialHistory.length || turnover || employeeCountBand || publicPhone || noPublicContactRoute
    ? `<section class="profile-details profile-public-details" aria-labelledby="profile-public-details-title"><div class="section-heading"><p class="kicker">Viešuose šaltiniuose patikrinti faktai</p><h2 id="profile-public-details-title">Vieši įmonės duomenys</h2><p>Rodomi tik tie įmonės duomenys, kuriems katalogo rinkinyje yra nurodytas viešas šaltinis. Registrui pateikta finansinė istorija rodoma tik su galiojančiu oficialaus duomenų portalo API įrodymu; ji ir darbuotojų skaičiaus grupė nėra gamintojo kokybės ar prieinamumo įvertinimas.</p></div><dl class="profile-facts">${publicFacts.map(([term, detail]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(detail)}</dd></div>`).join('')}${turnoverFact}${employeeSizeFact}${publicPhone ? `<div><dt>Viešas telefono numeris</dt><dd><a href="${escapeHtml(telephoneHref)}">${escapeHtml(publicPhone)}</a></dd></div>` : ''}${noPublicContactFact}</dl>${financialHistoryHtml}</section>`
    : '';
  const staticReviews = `<section class="profile-reviews profile-reviews--static" aria-labelledby="profile-reviews-title"><div class="section-heading"><p class="kicker">Pirkėjų patirtys</p><h2 id="profile-reviews-title">Atsiliepimai apie šį gamintoją</h2><p>Skelbiami tik moderavimo metu patvirtinti atsiliepimai. Jie nėra katalogo patvirtinimas, kokybės sertifikatas ar rekomendacija. Atsiliepimų sąrašas ir pateikimo forma įkeliami įjungus JavaScript; suvestinė rodoma tik tada, kai yra bent vienas patvirtintas atsiliepimas.</p></div><noscript><p class="review-empty">Norėdami peržiūrėti patvirtintus atsiliepimus arba pateikti naują atsiliepimą moderavimui, įjunkite JavaScript.</p></noscript></section>`;
  const checkedDate = registryCheckedDate(record.verified_at);
  const registryStatus = isRegistryChecked(record)
    ? `<section class="profile-registry-status" aria-labelledby="profile-registry-status-title"><span class="registry-check-mark registry-check-mark--large" aria-hidden="true"></span><div><h2 id="profile-registry-status-title">Registro duomenys patikrinti</h2><p>${checkedDate ? `Paskutinė registro duomenų patikra: <time datetime="${checkedDate.iso}">${escapeHtml(checkedDate.label)}</time>. ` : 'Paskutinės patikros data viešame įraše nenurodyta. '}Ši žyma nurodo tik registro duomenų peržiūros būseną; ji nepatvirtina darbų kokybės, užimtumo ar paslaugų prieinamumo.</p></div></section>`
    : '';
  const body = `${header()}<main class="profile-main"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><article class="profile-sheet"><header class="profile-hero"><div class="profile-heading-group"><p class="record-status">Nepatvirtintas viešų šaltinių įrašas</p><h1>${escapeHtml(record.trading_name)}</h1><p class="profile-identity">${escapeHtml(record.source_identity)}</p></div><div class="profile-actions"><a class="primary-button" href="/gauti-pasiulymus?gamintojas=${encodeURIComponent(record.slug)}">Įtraukti į projekto užklausą</a><a class="profile-guide-link" href="/gidas">Prieš kreipdamiesi peržiūrėkite pirkėjo gidą →</a><a class="profile-guide-link" href="/gidas/${contextualGuide(record).slug}">${escapeHtml(contextualGuide(record).label)} →</a></div></header>${registryStatus}<div class="profile-note"><strong>Duomenys nėra garantija.</strong><span>Šis įrašas nepatvirtina gamintojo tapatybės, kokybės, užimtumo, kainos, terminų ar tinkamumo jūsų projektui.</span></div><section class="profile-details"><div class="section-heading"><h2>Tapatybė, vieta ir veiklos kryptys</h2></div><dl class="profile-facts">${facts.map(([term, detail]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(detail)}</dd></div>`).join('')}${linkFacts.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd><a href="${escapeHtml(value)}" rel="noopener noreferrer">${escapeHtml(value)}</a></dd></div>`).join('')}</dl></section>${publicDetails}${profileLandingSection(record)}${staticReviews}<section class="provenance-section"><h2>Šaltiniai ir duomenų kilmė</h2><p>Įrašas sudarytas iš viešai prieinamų šaltinių. Katalogas šių duomenų netvirtino su gamintoju ir negarantuoja jų tikslumo, aktualumo, darbų kokybės ar paslaugų prieinamumo.</p><ul class="source-list">${sources.map((source, index) => `<li><span>${index === 0 ? 'Viešas šaltinis' : `Papildomas šaltinis ${index + 1}`}</span><a href="${escapeHtml(source)}" rel="noopener noreferrer">${escapeHtml(source)}</a></li>`).join('')}</ul><p class="collection-date">Šaltinių surinkimo data: <time datetime="${record.source_collection_date}">${record.source_collection_date}</time></p></section>${staticClaimSection(record)}</article></main>${footer()}`;
  await writeRoute(path, injectPage({
    title: `${record.trading_name} | Baldų gamintojo įrašas`,
    description: `${record.trading_name}: viešais šaltiniais paremtas, nepatvirtintas gamintojo kandidato įrašas su vieta, kategorijomis ir šaltinių nuorodomis.`,
    path,
    type: 'profile',
    body,
    structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: record.trading_name, path }]), manufacturerSchema(record)],
  }));
}

const landingSnapshotNote = 'Skaičiai paremti viešais šaltiniais, apima skirtingus finansinius metus ir tik šiuo metu kataloge skelbiamus gamintojų kandidatus.';
const landingSnapshotTurnoverMinimum = 3;

function landingMakerSnapshot(records, kind) {
  const total = records.length;
  const turnoverRecords = records
    .map((record) => ({ record, turnover: publishedTurnover(record) }))
    .filter((entry) => entry.turnover);
  const turnoverValues = turnoverRecords.map(({ turnover }) => turnover.amount);
  const fiscalYearMix = countBy(turnoverRecords, ({ turnover }) => String(turnover.year));
  const employeeRecords = records.filter((record) => employeeBandOrder.includes(record.employee_count_band));
  const employeeDistribution = employeeBandOrder
    .map((band) => ({ band, label: employeeBandNames.get(band), count: employeeRecords.filter((record) => record.employee_count_band === band).length }))
    .filter(({ count }) => count > 0);
  const foundingRecords = records.filter((record) => publishedFoundingYear(record.founded_year) !== null);
  const oldestFoundingYear = foundingRecords.length ? Math.min(...foundingRecords.map((record) => record.founded_year)) : null;
  const newestFoundingYear = foundingRecords.length ? Math.max(...foundingRecords.map((record) => record.founded_year)) : null;
  const enoughTurnover = turnoverRecords.length >= landingSnapshotTurnoverMinimum;
  const topTurnover = enoughTurnover
    ? [...turnoverRecords].sort((a, b) => b.turnover.amount - a.turnover.amount
      || a.record.trading_name.localeCompare(b.record.trading_name, 'lt'))[0]
    : null;
  const turnoverStats = enoughTurnover
    ? `<dl class="snapshot-turnover-stats"><div data-snapshot-turnover-stat="total" data-value="${turnoverValues.reduce((sum, amount) => sum + amount, 0)}"><dt>Bendra paskelbta apyvarta</dt><dd>${escapeHtml(formatEuro(turnoverValues.reduce((sum, amount) => sum + amount, 0)))}</dd></div><div data-snapshot-turnover-stat="median" data-value="${median(turnoverValues)}"><dt>Mediana</dt><dd>${escapeHtml(formatEuro(median(turnoverValues)))}</dd></div></dl>`
    : `<p class="snapshot-insufficient" data-snapshot-turnover-insufficient data-count="${turnoverRecords.length}" data-minimum="${landingSnapshotTurnoverMinimum}">Apyvartos suvestinei duomenų nepakanka: galiojančią paskelbtą apyvartą turi ${turnoverRecords.length} iš ${total} įrašų, o bendrai sumai, medianai ir didžiausios apyvartos gamintojui parodyti reikia bent ${landingSnapshotTurnoverMinimum}. Šie dydžiai nerodomi.</p>`;
  const fiscalYears = fiscalYearMix.length
    ? `<ul class="snapshot-distribution snapshot-year-mix" aria-label="Paskelbtos apyvartos finansinių metų pasiskirstymas">${fiscalYearMix.map(([year, count]) => `<li data-snapshot-fiscal-year="${year}" data-count="${count}"><span>${year} m.</span><strong>${count} <small>(${formatPercent(count, turnoverRecords.length)})</small></strong></li>`).join('')}</ul>`
    : '<p class="snapshot-empty" data-snapshot-fiscal-year-insufficient>Finansinių metų mišinio nėra, nes šiame sąraše nėra galiojančių paskelbtos apyvartos reikšmių.</p>';
  const employeeBands = employeeDistribution.length
    ? `<ul class="snapshot-distribution" aria-label="Darbuotojų grupių pasiskirstymas">${employeeDistribution.map(({ band, label, count }) => `<li data-snapshot-employee-band="${escapeHtml(band)}" data-count="${count}"><span>${escapeHtml(label)}</span><strong>${count} <small>(${formatPercent(count, employeeRecords.length)})</small></strong></li>`).join('')}</ul>`
    : '<p class="snapshot-empty" data-snapshot-employee-insufficient>Darbuotojų grupių pasiskirstymo parodyti negalima, nes šiame sąraše nėra galiojančių grupės reikšmių.</p>';
  const foundingRange = foundingRecords.length
    ? `<p class="snapshot-range" data-snapshot-founding-range data-oldest="${oldestFoundingYear}" data-newest="${newestFoundingYear}"><span>Įkūrimo metų intervalas</span><strong>${oldestFoundingYear === newestFoundingYear ? `${oldestFoundingYear} m. (vienintelė reikšmė)` : `${oldestFoundingYear}–${newestFoundingYear} m.`}</strong></p>`
    : '<p class="snapshot-empty" data-snapshot-founding-insufficient>Įkūrimo metų intervalo parodyti negalima, nes šiame sąraše nėra galiojančių įkūrimo metų.</p>';
  const topMaker = topTurnover
    ? `<div class="snapshot-top-maker" data-snapshot-top-maker="${escapeHtml(topTurnover.record.slug)}" data-amount="${topTurnover.turnover.amount}" data-year="${topTurnover.turnover.year}"><h3>Didžiausia paskelbta apyvarta šiame sąraše</h3><p><a href="/gamintojas/${escapeHtml(topTurnover.record.slug)}">${escapeHtml(topTurnover.record.trading_name)}</a> — <strong>${escapeHtml(formatEuro(topTurnover.turnover.amount))}</strong> (${topTurnover.turnover.year} finansiniai metai). <a data-snapshot-top-source href="${escapeHtml(topTurnover.turnover.sourceUrl)}" rel="noopener noreferrer">Atverti tiesioginį viešą šaltinį ↗</a></p></div>`
    : '';

  return `<section class="landing-snapshot" data-maker-snapshot data-snapshot-scope="${kind}" data-record-count="${total}" aria-labelledby="maker-snapshot-title"><div class="snapshot-heading"><div><p class="kicker">Šio sąrašo duomenys</p><h2 id="maker-snapshot-title">Gamintojų duomenų pjūvis</h2><p>Rodoma tik tai, ką galima apskaičiuoti iš šiame puslapyje pateiktų katalogo įrašų.</p></div><p class="snapshot-version">Duomenų versija <time datetime="${buildDate}">${buildDate}</time></p></div><dl class="snapshot-coverage"><div data-snapshot-coverage="total" data-count="${total}" data-total="${total}"><dt>Gamintojų kandidatų</dt><dd>${total}</dd><small>100,0 %</small></div><div data-snapshot-coverage="turnover" data-count="${turnoverRecords.length}" data-total="${total}"><dt>Su paskelbta apyvarta</dt><dd>${turnoverRecords.length}</dd><small>${formatPercent(turnoverRecords.length, total)}</small></div><div data-snapshot-coverage="employees" data-count="${employeeRecords.length}" data-total="${total}"><dt>Su darbuotojų grupe</dt><dd>${employeeRecords.length}</dd><small>${formatPercent(employeeRecords.length, total)}</small></div><div data-snapshot-coverage="founded" data-count="${foundingRecords.length}" data-total="${total}"><dt>Su įkūrimo metais</dt><dd>${foundingRecords.length}</dd><small>${formatPercent(foundingRecords.length, total)}</small></div></dl><div class="snapshot-detail-grid"><section aria-labelledby="snapshot-turnover-title"><div class="snapshot-subheading"><h3 id="snapshot-turnover-title">Paskelbta apyvarta</h3><p>Galioja tik teigiama suma su finansiniais metais ir tiesioginiu viešu šaltiniu.</p></div>${turnoverStats}<h4>Finansinių metų mišinys</h4>${fiscalYears}</section><section aria-labelledby="snapshot-company-title"><div class="snapshot-subheading"><h3 id="snapshot-company-title">Darbuotojai ir įkūrimo metai</h3><p>Tušti ar negaliojantys laukai į pasiskirstymą ir intervalą neįtraukiami.</p></div><h4>Darbuotojų grupės</h4>${employeeBands}${foundingRange}</section></div>${topMaker}<p class="snapshot-note">${landingSnapshotNote} Metodiką rasite <a href="/baldu-rinkos-apzvalga/">baldų rinkos apžvalgoje</a>, o šaltinių rinkinį – <a href="/atviri-duomenys/">atvirų duomenų puslapyje</a>.</p></section>`;
}

function landingItemList(records) {
  return { '@context': 'https://schema.org', '@type': 'ItemList', numberOfItems: records.length, itemListElement: records.map((record, index) => ({ '@type': 'ListItem', position: index + 1, url: canonicalUrl(`/gamintojas/${record.slug}`), name: record.trading_name })) };
}

async function writeLanding({ slug, title, intro, buyerNote, records, related, faq, guidance, kind }) {
  const path = `/baldai-pagal-uzsakyma/${slug}`;
  const englishCityCounterpart = kind === 'city' ? englishCityGroups.find((group) => group.slug === slug) : null;
  const description = kind === 'category'
    ? `${title}: ${records.length} viešais šaltiniais paremti nepatvirtinti Lietuvos gamintojų kandidatai, miestai ir atrankos gairės.`
    : `${title.replace('Baldų gamintojų kandidatai: ', '')}: ${records.length} viešuose šaltiniuose šiame mieste registruoti baldų gamintojų kandidatai. Sąrašas nėra paslaugų teritorijos ar kokybės garantija.`;
  const relatedTitle = kind === 'category' ? 'Šios baldų rūšies miestų puslapiai' : 'Šio miesto baldų rūšių puslapiai';
  const relatedSection = related.length
    ? `<section class="landing-related"><div class="section-heading"><h2>${relatedTitle}</h2><p>Nuorodos rodomos tik toms baldų rūšies ir miesto sankirtoms, kuriose yra bent trys katalogo įrašai.</p></div><ul class="landing-related-links">${related.map((item) => `<li><a href="${item.path}">${escapeHtml(item.label)} <span>(${item.count})</span></a></li>`).join('')}</ul></section>`
    : '';
  const englishCategoryCounterpart = kind === 'category' ? `${englishCategoryBasePath}/${slug}` : null;
  let topLinks = '<a class="back-link" href="/">← Grįžti į gamintojų katalogą</a>';
  let alternates = [];
  if (englishCategoryCounterpart) {
    topLinks = `<div class="market-top-links"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><nav class="language-links" aria-label="Kalbos pasirinkimas"><a href="${path}/" lang="lt" aria-current="page">Lietuvių</a><a href="${englishCategoryCounterpart}/" lang="en">English</a></nav></div>`;
    alternates = [
      { hreflang: 'lt', href: canonicalUrl(path) },
      { hreflang: 'en', href: canonicalUrl(englishCategoryCounterpart) },
      { hreflang: 'x-default', href: canonicalUrl(path) },
    ];
  } else if (englishCityCounterpart) {
    topLinks = `<div class="market-top-links"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><nav class="language-links" aria-label="Kalbos pasirinkimas"><a href="${path}/" lang="lt" aria-current="page">Lietuvių</a><a href="${englishCityCounterpart.path}/" lang="en">English</a></nav></div>`;
    alternates = [
      { hreflang: 'lt', href: canonicalUrl(path) },
      { hreflang: 'en', href: canonicalUrl(englishCityCounterpart.path) },
      { hreflang: 'x-default', href: canonicalUrl(englishCityCounterpart.path) },
    ];
  }
  const body = `${header()}<main class="landing-main">${topLinks}<section class="landing-hero"><div><p class="kicker">${kind === 'category' ? 'Baldų kategorija' : 'Šaltinyje nurodyta vietovė'}</p><h1>${escapeHtml(title)}</h1><p class="lead">${escapeHtml(intro)}</p></div><aside class="landing-summary"><strong>${formatCount(records.length)}</strong><p>${escapeHtml(buyerNote)}</p></aside></section>${landingMakerSnapshot(records, kind)}${guidanceHtml(guidance)}${relatedSection}<section class="landing-results"><div class="section-heading"><h2>Kandidatai iš versijuoto šaltinių rinkinio</h2><p>Įrašai pateikiami abėcėlės tvarka. Sąrašą galite siaurinti pagal įmonės dydį, įkūrimo laikotarpį ir patikrintų registro duomenų būseną.</p></div><div class="landing-filter-controls" id="landing-filter-controls"></div><div class="manufacturer-list" id="landing-manufacturer-list">${records.map(manufacturerCard).join('')}</div></section>${faqHtml(faq)}<section class="landing-guide-callout"><div><h2>Atranką tęskite vienoda užklausa</h2><p>Pirkėjo gide rasite klausimus trumpajam sąrašui, pasiūlymų apimčiai ir realistiškam grafikui palyginti.</p></div><a class="primary-button" href="/gidas">Atverti pirkėjo gidą</a></section></main>${footer()}`;
  await writeRoute(path, injectPage({
    title: `${title} | Gamintojų katalogas`,
    description,
    path,
    body,
    alternates,
    structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: title, path }]), faqSchema(faq), landingItemList(records)],
  }));
}

async function writeCityCategoryLanding(combination) {
  const { category, city, path } = combination;
  const records = manufacturers
    .filter((record) => publishedLocality(record) === city && (record.category_codes ?? []).includes(category.code))
    .sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'lt'));
  const cityLanding = landingCities.find((entry) => entry.city === city);
  if (!cityLanding || records.length < landingConfig.cityCategoryThreshold) {
    throw new Error(`City/category landing prerequisites missing: ${category.slug}/${combination.citySlug}`);
  }
  const cityContent = cityContentByName.get(city);
  if (!cityContent) throw new Error(`Missing resolved city landing content for ${city}.`);
  const title = `${category.title} – ${city}`;
  const intro = `Šiame puslapyje pateikiami ${records.length} nepatvirtinti kandidatų įrašai, kurių viešuose šaltiniuose nurodyta baldų rūšis „${category.title}“ ir bazės miestas ar vietovė „${city}“.`;
  const buyerNote = `Kategorijos ir vietovės „${city}“ sutapimas nepatvirtina darbų kokybės, užimtumo ar paslaugų teritorijos. Matavimo, pristatymo ir montavimo sąlygas tikrinkite tiesiogiai.`;
  const faq = [...category.faq.slice(0, 2), ...cityContent.faq.slice(0, 2)];
  const guidance = [
    ...landingConfig.guidance.sharedSections,
    ...category.guidanceSections,
    ...cityContent.guidanceSections,
    { heading: landingConfig.guidance.combinationHeading, paragraphs: [landingConfig.guidance.combinationParagraph] },
  ];
  const description = `${category.title}, ${city}: ${records.length} viešais šaltiniais paremti nepatvirtinti gamintojų kandidatai. Sąrašas nėra kokybės, prieinamumo ar paslaugų teritorijos garantija.`;
  const categoryCount = manufacturers.filter((record) => (record.category_codes ?? []).includes(category.code)).length;
  const related = [
    { path: `/baldai-pagal-uzsakyma/${category.slug}`, label: category.title, count: categoryCount },
    { path: `/baldai-pagal-uzsakyma/${cityLanding.slug}`, label: `Baldų gamintojų kandidatai: ${city}`, count: cityLanding.count },
  ];
  const body = `${header()}<main class="landing-main"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><section class="landing-hero"><div><p class="kicker">Baldų rūšis ir vietovė</p><h1>${escapeHtml(title)}</h1><p class="lead">${escapeHtml(intro)}</p></div><aside class="landing-summary"><strong>${formatCount(records.length)}</strong><p>${escapeHtml(buyerNote)}</p></aside></section>${guidanceHtml(guidance)}<section class="landing-related"><div class="section-heading"><h2>Naršykite platesnius sąrašus</h2><p>Grįžkite į visos baldų rūšies arba visos vietovės kandidatų sąrašą.</p></div><ul class="landing-related-links">${related.map((item) => `<li><a href="${item.path}">${escapeHtml(item.label)} <span>(${item.count})</span></a></li>`).join('')}</ul></section><section class="landing-results"><div class="section-heading"><h2>Kandidatai iš versijuoto šaltinių rinkinio</h2><p>Įrašai pateikiami abėcėlės tvarka. Sąrašą galite siaurinti pagal įmonės dydį, įkūrimo laikotarpį ir patikrintų registro duomenų būseną.</p></div><div class="landing-filter-controls" id="landing-filter-controls"></div><div class="manufacturer-list" id="landing-manufacturer-list">${records.map(manufacturerCard).join('')}</div></section>${faqHtml(faq)}<section class="landing-guide-callout"><div><h2>Atranką tęskite vienoda užklausa</h2><p>Pirkėjo gide rasite klausimus trumpajam sąrašui, pasiūlymų apimčiai ir realistiškam grafikui palyginti.</p></div><a class="primary-button" href="/gidas">Atverti pirkėjo gidą</a></section></main>${footer()}`;
  await writeRoute(path, injectPage({
    title: `${title} | Gamintojų katalogas`,
    description,
    path,
    body,
    structuredData: [
      breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: category.title, path: `/baldai-pagal-uzsakyma/${category.slug}` }, { name: title, path }]),
      faqSchema(faq),
      landingItemList(records),
    ],
  }));
}

for (const category of landingConfig.categories) {
  const records = manufacturers.filter((record) => record.category_codes.includes(category.code)).sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'lt'));
  const related = cityCategoryLandings
    .filter((entry) => entry.category.code === category.code)
    .map((entry) => ({ path: entry.path, label: entry.city, count: entry.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'lt'));
  await writeLanding({ slug: category.slug, title: category.title, intro: category.intro, buyerNote: category.buyer_note, records, related, faq: category.faq, guidance: [...landingConfig.guidance.sharedSections, ...category.guidanceSections], kind: 'category' });
}

const cityIndexPath = '/baldai-pagal-uzsakyma/miestai';
const cityIndexGroups = new Map();
for (const entry of allCities) {
  const letter = entry.city[0].toLocaleUpperCase('lt-LT');
  cityIndexGroups.set(letter, [...(cityIndexGroups.get(letter) ?? []), entry]);
}
const cityIndexList = [...cityIndexGroups].map(([letter, entries], groupIndex) => `<section class="city-index-group" aria-labelledby="city-index-letter-${groupIndex}"><h2 id="city-index-letter-${groupIndex}">${escapeHtml(letter)}</h2><ul>${entries.map((entry) => {
  const href = entry.count >= 2 ? `/baldai-pagal-uzsakyma/${entry.slug}/` : `/gamintojas/${entry.records[0].slug}/`;
  const destination = entry.count >= 2 ? 'Atverti vietovės kandidatų sąrašą' : `Atverti vienintelį įrašą: ${entry.records[0].trading_name}`;
  return `<li class="city-index-item" data-city-count="${entry.count}"><a href="${href}"><span><strong>${escapeHtml(entry.city)}</strong><small>${escapeHtml(destination)}</small></span><span class="city-index-count">${entry.count}</span></a></li>`;
}).join('')}</ul></section>`).join('');
const cityIndexItemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  numberOfItems: allCities.length,
  itemListElement: allCities.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: entry.city,
    url: canonicalUrl(entry.count >= 2 ? `/baldai-pagal-uzsakyma/${entry.slug}` : `/gamintojas/${entry.records[0].slug}`),
  })),
};
const cityIndexBody = `${header()}<main class="city-index-main"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><header class="city-index-hero"><div><p class="kicker">Vietovių rodyklė</p><h1>Gamintojų kandidatai pagal vietovę</h1></div><div class="city-index-intro"><p>Rodyklėje pateikiamos visos ${allCities.length} vietovės, kurios šiuo metu nurodytos viešų šaltinių katalogo įrašuose. Skaičius prie pavadinimo rodo kandidatų kiekį versijuotame rinkinyje.</p><p>Vietovė, turinti bent du įrašus, veda į atskirą kandidatų puslapį. Kai įrašas vienas, nuoroda atveria jo profilį. Vietovės žyma nusako registracijos, bazės ar kontakto vietą ir negarantuoja paslaugų teritorijos.</p></div></header><section class="city-index-directory" aria-label="Visos katalogo vietovės">${cityIndexList}</section><aside class="city-index-disclaimer"><h2>Kaip skaityti šią rodyklę</h2><p>Įrašai sudaryti iš viešų šaltinių, nėra katalogo patvirtinti, reitinguojami ar rekomenduojami. Prieš susitarimą savarankiškai patikrinkite juridinius ir kontaktinius duomenis, aktualią veiklą, pasiūlymo apimtį bei tai, ar kandidatas aptarnauja jūsų objekto adresą.</p></aside></main>${footer()}`;
await writeRoute(cityIndexPath, injectPage({
  title: 'Baldų gamintojai pagal miestą ir vietovę | Katalogo rodyklė',
  description: `Visų ${allCities.length} katalogo vietovių rodyklė su gamintojų kandidatų skaičiumi ir nuoroda į vietovės sąrašą arba vienintelį gamintojo įrašą.`,
  path: cityIndexPath,
  body: cityIndexBody,
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Miestai ir vietovės', path: cityIndexPath }]), cityIndexItemList],
}));

for (const city of landingCities) {
  const records = [...city.records].sort((a, b) => a.trading_name.localeCompare(b.trading_name, 'lt'));
  const related = cityCategoryLandings
    .filter((entry) => entry.city === city.city)
    .map((entry) => ({ path: entry.path, label: entry.category.title, count: entry.count }));
  const cityContent = cityContentByName.get(city.city);
  if (!cityContent) throw new Error(`Missing resolved city landing content for ${city.city}.`);
  const facts = cityFacts(records, city.city);
  await writeLanding({ slug: city.slug, title: `Baldų gamintojų kandidatai: ${city.city}`, intro: cityContent.intro, buyerNote: cityContent.buyer_note, records, related, faq: cityContent.faq, guidance: [...landingConfig.guidance.sharedSections, facts.guidance, ...cityContent.guidanceSections], kind: 'city' });
}

for (const combination of cityCategoryLandings) {
  await writeCityCategoryLanding(combination);
}

const guideFaq = [
  { question: 'Ar katalogo įrašas yra gamintojo rekomendacija?', answer: 'Ne. Katalogas pateikia viešuose šaltiniuose rastus nepatvirtintus kandidatus ir palieka tapatybės, apimties bei pasiūlymo patikrą pirkėjui.' },
  { question: 'Ar galima lyginti tik galutinę pasiūlymo kainą?', answer: 'Ne. Kainą reikia lyginti kartu su medžiagomis, furnitūra, matavimu, projektavimu, pristatymu, montavimu, terminais ir aiškiai nurodytomis išimtimis.' },
  { question: 'Kaip patikrinti siūlomą gamybos terminą?', answer: 'Paprašykite grafiko etapais ir raštu patvirtinkite, nuo kokio įvykio terminas skaičiuojamas, kokios jo prielaidos ir kas nutinka pasikeitus apimčiai.' },
];
const featuredGuides = guideArticles.filter((article) => article.featured && !article.buyerIntent);
const buyerIntentGuides = guideArticles.filter((article) => article.buyerIntent);
const conciseGuides = guideArticles.filter((article) => !article.featured);
const guideRouteList = (articles) => `<ul class="guide-route-list">${articles.map((article) => `<li><div><p>${escapeHtml(article.hubLabel)}</p><h3><a href="/gidas/${article.slug}/">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.summary)}</p></div><span class="route-arrow" aria-hidden="true">→</span></li>`).join('')}</ul>`;
const guideStart = `<section class="guide-start" aria-labelledby="guide-start-title"><div class="guide-hub-heading"><h2 id="guide-start-title">Pradėkite nuo sprendimo, kurį turite priimti</h2><p>Nereikia išmanyti baldų gamybos. Pasirinkite artimiausią klausimą ir pasižymėkite, ką paprašysite įrašyti į pasiūlymą.</p></div><ul class="guide-start-links"><li><a href="/gidas/medziagos-sutartis-avansas-garantija/">Suprasti LMDP, MDF, medieną, stalviršius, furnitūrą ir briaunas <span aria-hidden="true">→</span></a></li><li><a href="/gidas/virtuves-baldu-kainos/">Patikrinti, ką iš tiesų apima vieši kainų orientyrai <span aria-hidden="true">→</span></a></li><li><a href="/gidas/kaip-pasirinkti-baldu-gamintoja/">Palyginti tiekėjus pagal tą pačią apimtį ir dokumentus <span aria-hidden="true">→</span></a></li><li><a href="https://vvtat.lrv.lt/lt/veiklos-sritys-54/ne-maisto-produktai-55/vartotoju-teises-ir-garantijos-714/" rel="noopener noreferrer">Atverti oficialią VVTAT informaciją apie vartotojų teises ir garantijas <span aria-hidden="true">↗</span></a></li></ul></section>`;
const buyerToolsHub = `<section class="buyer-tools-hub" id="pirkejo-irankiai"><div class="guide-hub-heading"><p class="kicker">Pirkėjo įrankiai</p><h2>Įvertinkite, parenkite, palyginkite ir užfiksuokite</h2><p>Keturi atskiri įrankiai padeda išlaikyti vienodą projekto informaciją nuo pirmojo biudžeto orientyro iki pasiūlymų ir sutarties peržiūros.</p></div><ul class="buyer-tool-links"><li><a href="/baldu-kainos-skaiciuokle"><strong>Apskaičiuoti preliminarų kainos intervalą</strong><span>Žema, tipinė ir aukšta riba pagal projekto apimtį bei pasirinktus sprendinius.</span></a></li><li><a href="/gauti-pasiulymus"><strong>Pateikti saugią projekto pasiūlymo užklausą</strong><span>Operatoriaus peržiūra ir jokių automatinių kontaktų su gamintojais.</span></a></li><li><a href="/palyginti-pasiulymus"><strong>Palyginti 2–5 pasiūlymus</strong><span>Aiški formulė, jūsų svoriai, įrodymai ir matomos spragos.</span></a></li><li><a href="/gidas/baldu-pirkimo-sutarties-sablonas"><strong>Redaguoti sutarties struktūros šabloną</strong><span>Naršyklėje pildomas ir spausdinamas informacinis B2C ruošinys.</span></a></li></ul></section>`;
const guideHubBody = `${header('guide')}<main><section class="guide-intro"><div><p class="kicker">Pirkėjo gidas</p><h1>Sprendimą grįskite palyginama informacija, ne vien pažadu</h1></div><p>Katalogas padeda rasti viešuose šaltiniuose matomus kandidatus. Gidas padeda išversti techninius terminus į palyginamus klausimus apie medžiagas, kainos apimtį, projekto eigą ir pirkimo dokumentus.</p></section>${guideStart}${buyerToolsHub}<section class="guide-hub"><div class="guide-hub-heading"><h2>Keturi išsamūs gidai svarbiausiems sprendimams</h2><p>Pradėkite nuo kandidato patikros, kainos, projekto eigos arba susitarimo detalių.</p></div>${guideRouteList(featuredGuides)}</section><section class="guide-hub" aria-labelledby="buyer-intent-guides-title"><div class="guide-hub-heading"><h2 id="buyer-intent-guides-title">Pirkėjo klausimai prieš užsakant</h2><p>Rinkitės temą pagal sprendinį, medžiagą, objekto parengtį arba aptarnavimo situaciją.</p></div>${guideRouteList(buyerIntentGuides)}</section><section class="guide-hub guide-hub--secondary"><div class="guide-hub-heading"><h2>Trumpi praktiniai straipsniai</h2><p>Anksčiau publikuoti gidai lieka pasiekiami tais pačiais adresais.</p></div>${guideRouteList(conciseGuides)}</section>${faqHtml(guideFaq)}</main>${footer()}`;
await writeRoute('/gidas', injectPage({ title: 'Pirkėjo gidas | Baldai pagal užsakymą Lietuvoje', description: 'Lietuviški pirkėjo gidai apie baldų gamintojo pasirinkimą, realistiškas kainų nuorodas, projekto etapus, medžiagas, sutartį, avansą ir garantiją.', path: '/gidas', body: guideHubBody, structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo gidas', path: '/gidas' }]), faqSchema(guideFaq)] }));

function renderArticleFaq(items) {
  if (!items?.length) return '';
  return `<section class="article-faq" aria-labelledby="article-faq-title"><h2 id="article-faq-title">Dažniausi klausimai</h2><dl>${items.map((item) => `<div><dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd></div>`).join('')}</dl></section>`;
}

for (const article of guideArticles) {
  const path = `/gidas/${article.slug}`;
  const guideContent = article.content ?? article.sections.map(([heading, copy]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(copy)}</p></section>`).join('');
  const body = `${header('guide')}<main class="article-main"><a class="back-link" href="/gidas">← Grįžti į pirkėjo gidą</a><article class="guide-article"><header class="article-header"><p class="kicker">Pirkėjo gidas</p><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.summary)}</p></header><div class="guide-copy">${guideContent}${guideRelatedLinks(article)}${renderArticleFaq(article.faq)}</div><nav class="article-next" aria-label="Toliau"><a href="/gidas">Visi pirkėjo gidai</a><a href="/gauti-pasiulymus">Parengti projekto užklausą →</a></nav></article></main>${footer()}`;
  const structuredData = [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo gidas', path: '/gidas' }, { name: article.title, path }]), articleSchema(article, path)];
  if (article.faq?.length) structuredData.push(faqSchema(article.faq));
  await writeRoute(path, injectPage({ title: `${article.title} | Pirkėjo gidas`, description: article.metaDescription ?? article.summary, path, type: 'article', body, structuredData }));
}

const datasetHeaders = [
  'slug',
  'profile_url',
  'trading_name',
  'legal_name',
  'company_code',
  'city',
  'street_address',
  'postcode',
  'region_label',
  'website',
  'public_phone',
  'contact_route_status',
  'categories',
  'public_source_urls',
  'verification_date',
  'revenue_eur_latest',
  'revenue_year',
  'financial_source_url',
  'revenue_availability',
  'founded_year',
  'employee_count_band',
];
const financialDatasetHeaders = [
  'slug',
  'profile_url',
  'trading_name',
  'legal_name',
  'company_code',
  'fiscal_period_start',
  'fiscal_period_end',
  'filing_registration_date',
  'revenue_eur',
  'profit_before_tax_eur',
  'financial_source_url',
  'financial_api_model_path',
  'jar_entity_id',
  'revenue_api_record_id',
  'revenue_line_name',
  'revenue_evidence_registration_date',
  'profit_before_tax_api_record_id',
  'profit_before_tax_line_name',
  'profit_before_tax_evidence_registration_date',
  'standard_names',
  'template_names',
];
const financialDatasetRows = manufacturers.flatMap((record) => exportedFiledFinancialHistory(record).map((period) => ({
  slug: record.slug,
  profile_url: canonicalUrl(`/gamintojas/${record.slug}`),
  trading_name: record.trading_name?.trim() || null,
  legal_name: record.legal_name?.trim() || null,
  company_code: record.company_code?.trim() || null,
  fiscal_period_start: period.fiscal_period_start,
  fiscal_period_end: period.fiscal_period_end,
  filing_registration_date: period.filing_registration_date,
  revenue_eur: period.revenue_eur,
  profit_before_tax_eur: period.profit_before_tax_eur,
  financial_source_url: period.source.data_portal_url,
  financial_api_model_path: period.source.api_model_path,
  jar_entity_id: period.source.jar_entity_id,
  revenue_api_record_id: period.revenue_evidence?.api_record_id,
  revenue_line_name: period.revenue_evidence?.line_name,
  revenue_evidence_registration_date: period.revenue_evidence?.registration_date,
  profit_before_tax_api_record_id: period.profit_before_tax_evidence?.api_record_id,
  profit_before_tax_line_name: period.profit_before_tax_evidence?.line_name,
  profit_before_tax_evidence_registration_date: period.profit_before_tax_evidence?.registration_date,
  standard_names: period.standard_names,
  template_names: period.template_names,
})));
const datasetMetadata = {
  license: {
    name: DATASET_LICENSE_NAME,
    version: DATASET_LICENSE_VERSION,
    url: DATASET_LICENSE_URL,
  },
  attribution: datasetAttribution,
  generated_date: buildDate,
  version: buildDate,
  record_count: publicDataset.length,
  source: 'Baldininkai.org',
  source_url: SITE_URL,
  open_data_url: openDataUrl,
  official_sources: [
    {
      name: OFFICIAL_FINANCIAL_SOURCE_NAME,
      url: OFFICIAL_FINANCIAL_SOURCE_URL,
      api_model_path: OFFICIAL_FINANCIAL_API_MODEL_PATH,
    },
  ],
};
const datasetCsvMetadata = [
  `# Licence: ${DATASET_LICENSE_NAME} (CC BY ${DATASET_LICENSE_VERSION}) - ${DATASET_LICENSE_URL}`,
  `# Attribution: ${datasetAttribution}`,
  `# Generated: ${buildDate}`,
  `# Version: ${buildDate}`,
  `# Source: Baldininkai.org - ${SITE_URL} - open data: ${openDataUrl}`,
  `# Records: ${publicDataset.length}`,
  `# Official source: ${OFFICIAL_FINANCIAL_SOURCE_NAME} - ${OFFICIAL_FINANCIAL_SOURCE_URL} - API model: ${OFFICIAL_FINANCIAL_API_MODEL_PATH}`,
];
const datasetCsv = [
  ...datasetCsvMetadata,
  datasetHeaders.map(csvCell).join(','),
  ...publicDataset.map((record) => datasetHeaders.map((headerName) => csvCell(record[headerName])).join(',')),
].join('\n') + '\n';
const financialDatasetCsv = [
  ...datasetCsvMetadata,
  `# Financial periods: ${financialDatasetRows.length}`,
  financialDatasetHeaders.map(csvCell).join(','),
  ...financialDatasetRows.map((record) => financialDatasetHeaders.map((headerName) => csvCell(record[headerName])).join(',')),
].join('\n') + '\n';
await writeFile(join(publicDir, datasetJsonFilename), `${JSON.stringify({ metadata: datasetMetadata, records: publicDataset }, null, 2)}\n`);
await writeFile(join(publicDir, datasetCsvFilename), datasetCsv);
await writeFile(join(publicDir, financialDatasetCsvFilename), financialDatasetCsv);

const llmsText = `# Baldininkai.org

## Apie katalogą
Baldininkai.org yra viešais šaltiniais paremtas Lietuvos nestandartinių baldų gamintojų kandidatų katalogas. Jis padeda pirkėjams rasti ir savarankiškai palyginti kandidatus pagal baldų kategoriją, miestą ir viešai nurodytus įmonės duomenis.

Katalogo įrašai yra nepatvirtinti viešų šaltinių kandidatai. Jie nėra Baldininkai.org rekomendacijos, reitingai ar darbų kokybės, tapatybės, informacijos tikslumo, kainos, terminų, užimtumo arba paslaugų prieinamumo garantijos.

## Duomenų aprėptis ir kilmė
Kiekviename įraše, kai šaltinyje yra atitinkama reikšmė, pateikiamas viešas ar prekinis ir juridinis pavadinimas, įmonės kodas, miestas, adresas, pašto kodas, regiono žyma, svetainė, viešas telefono numeris, viešo kontaktinio kelio būsena, baldų kategorijos, viešų šaltinių nuorodos ir turima patikros data. Kai šaltinis tai pagrindžia, JSON bei katalogo CSV papildomi naujausių pajamų, įkūrimo metų, darbuotojų grupės ir registrui pateiktų finansinių laikotarpių duomenimis; atskiras finansų CSV pateikia vieną eilutę vienam galiojančiam laikotarpiui. Finansinės sumos pateikiamos tik tada, kai konkreti pateikta eilutė turi API įrodymą. Duomenys renkami iš viešai prieinamų gamintojų svetainių, įmonių ir kitų viešų informacijos šaltinių. Oficialus finansinių ataskaitų šaltinis: ${OFFICIAL_FINANCIAL_SOURCE_NAME} (${OFFICIAL_FINANCIAL_SOURCE_URL}). Ši versija sugeneruota ${buildDate}; joje yra tiksliai ${publicDataset.length} katalogo įrašų ir ${financialDatasetRows.length} galiojantys pateikti finansiniai laikotarpiai.

## Pagrindinės nuorodos
- Katalogas: ${SITE_URL}/
- Pirkėjo gidas: ${SITE_URL}/gidas/
- Baldų gamintojo pasirinkimo gidas: ${SITE_URL}/gidas/kaip-pasirinkti-baldu-gamintoja/
- Virtuvės baldų kainų gidas: ${SITE_URL}/gidas/virtuves-baldu-kainos/
- Kainos skaičiuoklė: ${SITE_URL}/baldu-kainos-skaiciuokle/
- Projekto pasiūlymo užklausa: ${SITE_URL}/gauti-pasiulymus/
- Baldų rinkos apžvalga: ${marketOverviewUrl}
- Registrui pateiktų finansų metinė suvestinė: ${filedFinanceUrl}
- English sourcing hub: ${canonicalUrl(englishHubPath)}
- English quote request: ${canonicalUrl(englishQuoteRequestPath)}
- Lithuanian furniture makers data (English): ${englishMarketOverviewUrl}
- English sourcing guide: ${canonicalUrl(englishSourcingGuidePath)}
- English region data cuts:
${englishRegionGroups.map((group) => `  - ${group.label}: ${canonicalUrl(group.path)}`).join('\n')}
- English larger-city data cuts:
${englishCityGroups.map((group) => `  - ${group.city}: ${canonicalUrl(group.path)}`).join('\n')}
- English published-turnover data cuts:
${englishTurnoverBands.map((band) => `  - ${band.label}: ${canonicalUrl(band.path)}`).join('\n')}
- Atviri duomenys ir naudojimo sąlygos: ${SITE_URL}/atviri-duomenys/
- JSON duomenys: ${SITE_URL}/${datasetJsonFilename}
- Katalogo CSV duomenys: ${SITE_URL}/${datasetCsvFilename}
- Pateiktų finansinių laikotarpių CSV: ${SITE_URL}/${financialDatasetCsvFilename}
- Svetainės žemėlapis: ${SITE_URL}/sitemap.xml

## Kategorijų puslapiai
${landingConfig.categories.map((category) => `- ${category.title}: ${canonicalUrl(`/baldai-pagal-uzsakyma/${category.slug}`)}`).join('\n')}

## English category pages
${englishCategoryEntries.map((entry) => `- ${entry.label}: ${canonicalUrl(entry.path)}`).join('\n')}

## Miestų puslapiai
${landingCities.map((city) => `- ${city.city}: ${canonicalUrl(`/baldai-pagal-uzsakyma/${city.slug}`)}`).join('\n')}

## Licencija
Duomenų rinkinys licencijuojamas pagal Creative Commons Attribution 4.0 International (CC BY 4.0), versija 4.0: ${DATASET_LICENSE_URL}

## Priskyrimas
${datasetAttribution}

## English summary
Baldininkai.org is a public-source directory of candidate Lithuanian custom-furniture makers. Listings are unverified public-source candidates, not endorsements, rankings, or guarantees of identity, accuracy, quality, capacity, price, availability, timing, or service coverage. Start at the English sourcing hub ${canonicalUrl(englishHubPath)}, browse the English category pages, prepare a structured project request at ${canonicalUrl(englishQuoteRequestPath)} with no automatic maker contact or introduction guarantee, read the catalogue-data overview at ${englishMarketOverviewUrl}, use the sourcing guide at ${canonicalUrl(englishSourcingGuidePath)}, browse region, larger-city and published-turnover data cuts linked from the hub, and use the documented JSON/CSV downloads at ${SITE_URL}/atviri-duomenys/.
`;
await writeFile(join(publicDir, 'llms.txt'), llmsText);

const sitemapPaths = [
  '/',
  openDataPath,
  marketOverviewPath,
  filedFinancePath,
  englishHubPath,
  englishQuoteRequestPath,
  englishMarketOverviewPath,
  ...englishCategoryEntries.map((entry) => entry.path),
  englishSourcingGuidePath,
  ...englishRegionGroups.map((group) => group.path),
  ...englishCityGroups.map((group) => group.path),
  ...englishTurnoverBands.map((band) => band.path),
  '/baldu-kainos-skaiciuokle',
  '/gauti-pasiulymus',
  '/palyginti-pasiulymus',
  ...policyPages.map((page) => page.path),
  '/gidas',
  '/gidas/baldu-pirkimo-sutarties-sablonas',
  ...guideArticles.map((article) => `/gidas/${article.slug}`),
  ...manufacturers.map((record) => `/gamintojas/${record.slug}`),
  ...landingConfig.categories.map((category) => `/baldai-pagal-uzsakyma/${category.slug}`),
  cityIndexPath,
  ...landingCities.map((city) => `/baldai-pagal-uzsakyma/${city.slug}`),
  ...cityCategoryLandings.map((entry) => entry.path),
];
assertUniqueRoutePaths(sitemapPaths, 'sitemap');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map((path) => `  <url><loc>${escapeXml(canonicalUrl(path))}</loc><lastmod>${escapeXml(buildDate)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
await writeFile(join(publicDir, 'sitemap.xml'), sitemap);
await writeFile(join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\nAllow: /en/\nAllow: /llms.txt\nAllow: /atviri-duomenys/\nAllow: ${marketOverviewPath}/\nAllow: ${filedFinancePath}/\nAllow: ${englishMarketOverviewPath}/\nAllow: /${datasetJsonFilename}\nAllow: /${datasetCsvFilename}\nAllow: /${financialDatasetCsvFilename}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
await writeFile(join(publicDir, INDEXNOW_KEY_FILENAME), INDEXNOW_KEY);

console.log(`Generated ${manufacturers.length} profile routes, ${landingConfig.categories.length} Lithuanian category routes, ${landingCities.length} city routes, 1 all-cities index (${allCities.length} localities), ${cityCategoryLandings.length} city/category routes, 1 price estimator route, 1 Lithuanian buyer request route, 1 English quote-request route, 1 comparison route, 1 open-data route, 2 market-overview routes, 1 Lithuanian filed-finance route, 1 English sourcing hub, ${englishCategoryEntries.length} English category routes, ${englishRegionGroups.length} English region routes, ${englishCityGroups.length} English larger-city routes, ${englishTurnoverBands.length} English turnover routes, 1 English sourcing guide, ${policyPages.length} policy routes, ${guideArticles.length + 2} Lithuanian guide routes, llms.txt, ${datasetJsonFilename}, ${datasetCsvFilename}, ${financialDatasetCsvFilename}, sitemap.xml, robots.txt and ${INDEXNOW_KEY_FILENAME}.`);
