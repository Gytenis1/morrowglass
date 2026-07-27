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
    summary: 'Atsargus kontrolinis sąrašas Lietuvos pirkėjui prieš patvirtinant medžiagas, mokėjimą ir garantinio aptarnavimo tvarką.',
    metaDescription: 'Praktiniai klausimai apie baldų medžiagų specifikaciją, sutartį, avansą ir garantiją Lietuvoje – be teisinių pažadų ar numanomų sąlygų.',
    hubLabel: 'Dokumentai ir atsakomybės',
    featured: true,
    content: `<section><h2>Specifikacija turi leisti atpažinti pasirinktą medžiagą</h2><p>Bendriniai žodžiai, tokie kaip „kokybiška plokštė“ ar „gera furnitūra“, neleidžia patikrinti, ar pasiūlymai vienodi. Paprašykite identifikatorių, pagal kuriuos sprendinį būtų galima atsekti pasiūlyme, brėžiniuose ir priėmimo metu.</p><div class="checklist-block"><ul><li>gamintojas, kolekcija, dekoras ar spalva ir produkto kodas;</li><li>storis, paviršiaus tipas, briaunos ir matomos bei vidinės pusės;</li><li>fasadų, korpusų, nugarėlių, stalviršio ir sienelės medžiagos atskirai;</li><li>lankstų, stalčių, pakėlimo mechanizmų ir vidaus įrangos modeliai ar klasė;</li><li>patvirtintas pavyzdys ir kas nutinka, jei pasirinkta medžiaga tampa neprieinama;</li><li>priežiūros reikalavimai, kuriuos svarbu žinoti prieš pasirenkant.</li></ul></div></section>
<section><h2>Ką praktiškai sutikrinti sutartyje ir jos prieduose</h2><p>Šis sąrašas nėra teisinė konsultacija. Jo paskirtis – padėti pastebėti trūkstamą projekto informaciją prieš pasirašant ar mokant.</p><ul><li>Kas tiksliai yra sutarties šalys ir ar jų duomenys sutampa su pasiūlymu, sąskaita bei mokėjimo gavėju?</li><li>Kuris brėžinių, specifikacijos ir pasiūlymo variantas yra galutinis, kaip pažymėta jo data ar versija?</li><li>Kokie gaminiai ir darbai įtraukti, o kas aiškiai neįtraukta?</li><li>Ar kaina nurodyta su taikomais mokesčiais ir kada ji gali būti perskaičiuota?</li><li>Nuo kokio įvykio skaičiuojami etapai ir kokių jūsų sprendimų reikia iki konkrečių datų?</li><li>Kaip raštu tvirtinami pakeitimai, papildomi darbai ir jų poveikis kainai bei grafikui?</li><li>Kaip vyks pristatymas, montavimas, darbų patikra, trūkumų užrašymas ir perdavimas?</li><li>Kokia sutarta komunikacijos bei dokumentų saugojimo tvarka?</li></ul></section>
<section><h2>Prieš mokant avansą</h2><div class="checklist-block"><ul><li>patikrinkite, kam tiksliai mokate ir kokiu dokumentu mokėjimas pagrįstas;</li><li>paprašykite nurodyti avanso paskirtį ir su kokiu projekto etapu jis siejamas;</li><li>išsiaiškinkite likusių mokėjimų etapus ir kokį rezultatą patikrinsite prieš kiekvieną mokėjimą;</li><li>raštu aptarkite, kas nutinka projektui sustojus, pasikeitus apimčiai ar medžiagoms;</li><li>išsaugokite pasirašytą versiją, sąskaitas, mokėjimo patvirtinimus, brėžinius ir susirašinėjimą.</li></ul></div><p>Nenumanykite, kad visiems projektams taikoma vienoda avanso, grąžinimo ar atšaukimo tvarka. Vertinkite konkrečius dokumentus ir, jei sąlyga neaiški ar reikšminga, prieš mokėdami kreipkitės į kompetentingą teisininką ar oficialų vartotojų teisių informacijos šaltinį.</p></section>
<section><h2>Klausimai apie garantiją ir aptarnavimą</h2><ul><li>Kokia raštu nurodyta garantijos trukmė ir nuo kokio įvykio ji skaičiuojama?</li><li>Kurioms gaminio dalims, furnitūrai ir darbams taikomos skirtingos sąlygos?</li><li>Kokios naudojimo, priežiūros ar aplinkos sąlygos nurodytos kaip svarbios?</li><li>Kur ir kokia forma pranešti apie problemą, kokius vaizdus ar dokumentus pridėti?</li><li>Kas organizuoja apžiūrą, dalių užsakymą, atvykimą ir pakartotinį reguliavimą?</li><li>Kaip užrašomi montavimo metu pastebėti trūkumai ir sutarti jų taisymo veiksmai?</li></ul><p class="inline-warning"><strong>Atsargi riba:</strong> gidas nežada konkretaus teisinio rezultato ir nepakeičia aktualių teisės aktų, sutarties ar individualios konsultacijos. Ginčo atveju remkitės dokumentais ir oficialia Lietuvos vartotojų teisių informacija.</p></section>
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

function articleSchema(article, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription ?? article.summary,
    inLanguage: 'lt-LT',
    mainEntityOfPage: canonicalUrl(path),
    dateModified: sourceDate,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
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
  return `<header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Baldai pagal užsakymą Lietuvoje – pradžia"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span>Baldai pagal užsakymą <strong>Lietuvoje</strong></span></a><nav aria-label="Pagrindinė navigacija"><a href="/"${active === 'directory' ? ' aria-current="page"' : ''}>Katalogas</a><a href="/gauti-pasiulymus"${active === 'request' ? ' aria-current="page"' : ''}>Projekto užklausa</a><a href="/gidas"${active === 'guide' ? ' aria-current="page"' : ''}>Pirkėjo gidas</a></nav></div></header>`;
}

function footer() {
  return '<footer><div class="footer-inner"><p>Viešų šaltinių katalogas savarankiškai gamintojų paieškai. Įrašai nepatvirtinti ir nėra kokybės ar prieinamumo garantija.</p><nav aria-label="Poraštės navigacija"><a href="/gauti-pasiulymus">Pateikti projekto užklausą</a><a href="/gidas">Pirkėjo gidas</a><a href="/savininkams">Verslo savininkams ir tęstinumui</a></nav></div></footer>';
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

const homeBody = `${header()}<main><section class="intro" aria-labelledby="page-title"><div class="intro-copy"><p class="kicker">Viešas paieškos katalogas</p><h1 id="page-title">Raskite baldų gamintojus pagal poreikį ir vietą</h1><p class="lead">Ieškokite Lietuvos nestandartinių baldų gamintojų kandidatų pagal kategoriją, miestą ir šaltiniuose nurodytą regiono grupę.</p><div class="intro-actions"><a class="primary-button primary-button--light" href="/gauti-pasiulymus">Pateikti projekto užklausą</a><a class="intro-guide-link" href="/gidas">Kaip atrinkti ir palyginti gamintojus →</a></div></div><aside class="directory-note"><h2>Ką svarbu žinoti</h2><p>Tai iš viešų šaltinių sudarytas, nepatvirtintų kandidatų katalogas. Įrašai nėra kokybės, užimtumo ar meistrystės garantija.</p></aside></section><section class="browse-section"><div class="section-heading"><p class="kicker">Versijuotas šaltinių rinkinys</p><h2>${formatCount(manufacturers.length)}</h2><p>Visi įrašai pateikiami kaip savarankiškos paieškos kandidatai.</p></div><div class="manufacturer-list">${manufacturers.map(manufacturerCard).join('')}</div></section><section class="landing-directory"><div class="section-heading"><h2>Naršykite pagal baldų rūšį arba miestą</h2></div><div class="landing-link-groups"><div><h3>Pagal baldų rūšį</h3><ul>${landingConfig.categories.map((category) => `<li><a href="/baldai-pagal-uzsakyma/${category.slug}">${escapeHtml(category.title)}</a></li>`).join('')}</ul></div><div><h3>Pagal šaltinyje nurodytą miestą</h3><ul>${eligibleCities.map((city) => `<li><a href="/baldai-pagal-uzsakyma/${city.slug}">${escapeHtml(city.city)} (${city.count})</a></li>`).join('')}</ul></div></div></section></main>${footer()}`;
await writeRoute('/', injectPage({
  title: 'Baldai pagal užsakymą Lietuvoje | Gamintojų katalogas',
  description: 'Viešais šaltiniais paremtas nepatvirtintų Lietuvos nestandartinių baldų gamintojų kandidatų katalogas su paieška pagal kategoriją ir vietą.',
  path: '/',
  body: homeBody,
}));

const requestPath = '/gauti-pasiulymus';
const requestDescription = 'Aprašykite nestandartinių baldų projektą, biudžetą, vietą ir terminą bei pasirinkite kataloge rastus gamintojų kandidatus.';
const requestBody = `${header('request')}<main class="request-main"><section class="request-intro" aria-labelledby="request-title"><div><p class="kicker">Pirkėjo projekto santrauka</p><h1 id="request-title">Aprašykite baldų projektą vienoje vietoje</h1><p class="lead">Pateikite pagrindinę informaciją, kuri padeda vienodai įvertinti projekto rūšį, vietą, biudžetą ir pageidaujamą laiką.</p></div><aside class="request-expectation" aria-labelledby="request-expectation-title"><h2 id="request-expectation-title">Kas nutinka pateikus?</h2><p>Užklausa išsaugoma katalogo peržiūrai. Katalogas jos automatiškai nepersiunčia pasirinktiems gamintojams ir netikrina gamintojų.</p><p>Pateikimas negarantuoja atsakymo, pasiūlymo, kainos ar projekto priėmimo.</p></aside></section><section aria-labelledby="request-form-title"><div class="section-heading"><h2 id="request-form-title">Projekto duomenys</h2><p>Interaktyvi forma ir katalogo gamintojų pasirinkimas parengiami įkėlus puslapį.</p></div><div class="request-static-loading" role="status"><p>Ruošiama projekto užklausos forma…</p></div></section></main>${footer()}`;
await writeRoute(requestPath, injectPage({
  title: 'Pateikite baldų projekto užklausą | Baldai pagal užsakymą Lietuvoje',
  description: requestDescription,
  path: requestPath,
  body: requestBody,
  structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Projekto užklausa', path: requestPath }])],
}));

const ownerPath = '/savininkams';
const ownerDescription = 'Konfidencialus tiesioginis pokalbis su Lithuanian ETA apie brandaus savininko valdomo verslo tęstinumą, perėmimą ar pardavimo svarstymą Baltijos šalyse.';
const ownerRevenueBands = ['Iki 1 mln. €', '1–3 mln. €', '3–10 mln. €', 'Daugiau nei 10 mln. €', 'Nenoriu nurodyti'];
const ownerEbitdaBands = ['Iki 300 tūkst. €', '300–750 tūkst. €', '750 tūkst.–1,5 mln. €', '1,5–2,5 mln. €', 'Daugiau nei 2,5 mln. €', 'Nenoriu nurodyti'];
const ownerSituations = ['Paveldėjimo ar įpėdinystės planavimas', 'Savininko pasitraukimas iš kasdienės veiklos', 'Dalinio ar visiško pardavimo svarstymas', 'Kita tęstinumo situacija'];
const ownerTimelines = ['Per artimiausius 6 mėn.', 'Per 6–18 mėn.', 'Vėliau nei po 18 mėn.', 'Noriu pradėti be konkretaus termino'];
const valuationOwnerInvolvementOptions = ['Kasdienis operacinis vaidmuo', 'Dalinė operacinė veikla', 'Nedalyvauja kasdienėje veikloje'];
const valuationCustomerConcentrationOptions = ['Nė vienas klientas nesudaro daugiau nei 20 % pajamų', 'Didžiausias klientas sudaro 20–40 % pajamų', 'Didžiausias klientas sudaro daugiau nei 40 % pajamų'];
const valuationOrderBacklogOptions = ['Mažiau nei 3 mėn.', '3–6 mėn.', 'Daugiau nei 6 mėn.'];
const ownerOptions = (items, placeholder) => `<option value="">${escapeHtml(placeholder)}</option>${items.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('')}`;
const ownerBody = `${header('owner')}<main class="owner-main">
<section class="owner-hero" aria-labelledby="owner-title"><div class="owner-hero-copy"><p class="kicker">Lithuanian ETA · privatus tiesioginis pirkėjas</p><h1 id="owner-title">Kai svarbu ne tik parduoti, bet ir tęsti verslą</h1><p class="lead">Lithuanian ETA siekia įsigyti ir toliau auginti brandų, savininko sukurtą verslą. Tai tiesioginis pirkėjas, o ne brokeris, tarpininkas ar įmonių skelbimų svetainė.</p></div><aside class="owner-position" aria-labelledby="owner-position-title"><h2 id="owner-position-title">Pokalbis be katalogo tarpininkavimo</h2><p>Ši savininkams skirta kryptis yra atskira nuo viešo baldų gamintojų katalogo. Pateikta informacija nėra siunčiama kataloge esančioms įmonėms.</p></aside></section>
<section class="owner-profile" aria-labelledby="owner-profile-title"><div class="owner-section-heading"><p class="kicker">Pradinis profilis</p><h2 id="owner-profile-title">Kokį verslą prasminga aptarti</h2><p>Tai orientyras pirmajam pokalbiui, ne pasiūlymas, vertinimas ar pažadas sudaryti sandorį.</p></div><dl class="owner-profile-facts"><div><dt>Veiklos mastas</dt><dd>Paprastai maždaug 300 tūkst.–2,5 mln. € EBITDA.</dd></div><div><dt>Geografija</dt><dd>Lietuva, Latvija arba Estija.</dd></div><div><dt>Situacija</dt><dd>Įpėdinystė, veiklos tęstinumas, savininko atsitraukimas arba dalinio ar visiško pardavimo svarstymas.</dd></div></dl></section>
<section class="owner-valuation" aria-labelledby="valuation-title">
<header class="owner-section-heading owner-valuation-heading"><p class="kicker">Orientacinis scenarijus</p><h2 id="valuation-title">Įmonės vertės intervalo indikatorius</h2><p>Įveskite metines pajamas, normalizuotą EBITDA ir tris veiklos aplinkybes. Skaičiavimas atliekamas tik jūsų naršyklėje ir automatiškai atnaujinamas pakeitus bet kurį lauką.</p></header>
<div class="owner-valuation-layout"><div class="valuation-input-panel" aria-describedby="valuation-method-summary"><div class="valuation-fields">
<div class="form-field"><label for="valuation-revenue">Metinės pajamos, €</label><input id="valuation-revenue" type="number" inputmode="numeric" min="1000" max="1000000000000" step="1000" placeholder="Pvz., 3 000 000" required></div>
<div class="form-field"><label for="valuation-ebitda">Normalizuota metinė EBITDA, €</label><input id="valuation-ebitda" type="number" inputmode="numeric" min="1000" max="1000000000000" step="1000" placeholder="Pvz., 500 000" required></div>
<div class="form-field form-field--wide"><label for="valuation-owner-involvement">Savininko darbas kasdienėje veikloje</label><div class="select-wrap"><select id="valuation-owner-involvement" required>${ownerOptions(valuationOwnerInvolvementOptions, 'Pasirinkite savininko vaidmenį')}</select></div></div>
<div class="form-field form-field--wide"><label for="valuation-customer-concentration">Klientų koncentracija</label><div class="select-wrap"><select id="valuation-customer-concentration" required>${ownerOptions(valuationCustomerConcentrationOptions, 'Pasirinkite didžiausio kliento dalį')}</select></div></div>
<div class="form-field form-field--wide"><label for="valuation-order-backlog">Patvirtintų užsakymų rezervas</label><div class="select-wrap"><select id="valuation-order-backlog" required>${ownerOptions(valuationOrderBacklogOptions, 'Pasirinkite, keliems mėnesiams pakanka užsakymų')}</select></div></div>
</div><p class="valuation-status" id="valuation-status" role="status" aria-live="polite">Užpildykite visus penkis laukus — rezultatas pasirodys automatiškai.</p>
<details class="valuation-method"><summary>Kaip tiksliai skaičiuojamas intervalas</summary><div id="valuation-method-summary"><p>Pradinis scenarijus yra 2,00–4,00× normalizuotos EBITDA. Kiekvienas iš trijų situacijos veiksnių abi ribas pakeičia vienodai: −0,25×, 0 arba +0,25×. Galutinis daugiklis ribojamas iki 1,00–5,00×.</p><ul><li><strong>Savininko vaidmuo:</strong> kasdienis −0,25×; dalinis 0; savininkas kasdien nedalyvauja +0,25×.</li><li><strong>Klientų koncentracija:</strong> nė vienas klientas neviršija 20 % +0,25×; didžiausias sudaro 20–40 % 0; viršija 40 % −0,25×.</li><li><strong>Užsakymų rezervas:</strong> mažiau nei 3 mėn. −0,25×; 3–6 mėn. 0; daugiau nei 6 mėn. +0,25×.</li></ul><p>Rodoma įmonės vertė (EV) visada lygi jūsų įvestai EBITDA, padaugintai iš rodomos apatinės arba viršutinės daugiklio ribos.</p></div></details></div>
<div class="valuation-result-shell"><div class="valuation-placeholder" id="valuation-placeholder"><h3>Rezultatas pasirodys čia</h3><p>Rodysime orientacinį įmonės vertės intervalą, pritaikytus daugiklius ir kiekvieno pasirinkto veiksnio įtaką.</p></div><div class="valuation-result" id="valuation-result" hidden aria-labelledby="valuation-result-title"><p class="valuation-result-label" id="valuation-result-title">Orientacinė įmonės vertė (enterprise value)</p><output class="valuation-ev-range" id="valuation-ev-range"></output><dl class="valuation-result-facts"><div><dt>Naudotas daugiklis</dt><dd id="valuation-multiple-range"></dd></div><div><dt>Pradinis scenarijus</dt><dd>2,00–4,00× EBITDA</dd></div><div><dt>Bendra korekcija</dt><dd id="valuation-adjustment"></dd></div></dl><div class="valuation-explanation"><h3>Kas pakeitė intervalą</h3><ul id="valuation-factor-list"></ul></div><a class="primary-button valuation-enquiry-link" href="#owner-form-title">Tęsti konfidencialią užklausą</a></div></div></div>
<div class="valuation-evidence"><p><strong>Tyrimo ribos.</strong> <a href="https://prod-agent-artifact-engine-production.up.railway.app/render/17738284-ba9a-430f-9574-5a390750fa7d" rel="noopener noreferrer">Ankstesnio viešo Baltijos tyrimo medžiaga</a> nenustato aiškaus, vien Baltijos mažoms ir vidutinėms įmonėms, kurių EBITDA mažesnė nei 5 mln. €, taikomo daugiklio. Todėl 2–4× bazė čia yra konservatyvus įsigijimo scenarijus, o ne stebėta rinkos taisyklė ar tyrimo patvirtintas rinkos daugiklis.</p><p class="valuation-disclaimer"><strong>Svarbu:</strong> šis skaičiavimas skirtas tik edukaciniam ir orientaciniam naudojimui. Tai nėra pasiūlymas pirkti ar parduoti, įsipareigojimas, profesionalus verslo vertinimas, finansinė, teisinė ar mokesčių konsultacija. Faktinė vertė gali iš esmės skirtis atlikus išsamų patikrinimą ir įvertinus skolą, grynuosius pinigus, apyvartinį kapitalą bei kitas aplinkybes.</p></div>
</section>
<section class="owner-process" aria-labelledby="owner-process-title"><div class="owner-section-heading"><h2 id="owner-process-title">Kaip prasideda pirmas pokalbis</h2><p>Pakanka trumpos informacijos, kad būtų galima įvertinti, ar verta kalbėtis toliau.</p></div><ol><li><strong>Pateikite trumpą konfidencialią žinutę.</strong><span>Nurodykite verslo pobūdį, vietą, apytiksles finansines ribas ir savo situaciją.</span></li><li><strong>Lithuanian ETA ją peržiūri.</strong><span>Informacija vertinama tik galimo tiesioginio pokalbio kontekste.</span></li><li><strong>Jei profilis tinkamas, galima sutarti privatų pokalbį.</strong><span>Formos pateikimas savaime nėra pasiūlymas, vertinimas ar tarpininkavimo susitarimas.</span></li></ol></section>
<div class="owner-enquiry-layout"><section class="owner-form-section" aria-labelledby="owner-form-title"><div class="owner-section-heading"><p class="kicker">Konfidenciali užklausa</p><h2 id="owner-form-title">Trumpai papasakokite apie situaciją</h2><p>Žvaigždute pažymėti laukai yra privalomi. Pradiniame etape nepateikite komercinių paslapčių, asmens kodų ar kitų ypač jautrių duomenų.</p></div><form class="owner-enquiry-form" id="owner-enquiry-form">
<div class="form-field"><label for="owner-company-name">Įmonės pavadinimas *</label><input id="owner-company-name" name="company_name" type="text" autocomplete="organization" minlength="2" maxlength="160" required></div>
<div class="form-field"><label for="owner-city">Miestas arba vietovė *</label><input id="owner-city" name="city" type="text" autocomplete="address-level2" minlength="2" maxlength="160" required></div>
<div class="form-field form-field--wide"><label for="owner-sector">Veiklos sektorius *</label><input id="owner-sector" name="sector" type="text" minlength="2" maxlength="160" required placeholder="Pvz., gamyba, verslo paslaugos ar logistika"></div>
<div class="form-field"><label for="owner-revenue-band">Metinės pajamos *</label><div class="select-wrap"><select id="owner-revenue-band" name="revenue_band" required>${ownerOptions(ownerRevenueBands, 'Pasirinkite pajamų ribas')}</select></div></div>
<div class="form-field"><label for="owner-ebitda-band">EBITDA *</label><div class="select-wrap"><select id="owner-ebitda-band" name="ebitda_band" required>${ownerOptions(ownerEbitdaBands, 'Pasirinkite EBITDA ribas')}</select></div></div>
<div class="form-field form-field--wide"><label for="owner-situation">Savininko arba tęstinumo situacija *</label><div class="select-wrap"><select id="owner-situation" name="ownership_succession_situation" required>${ownerOptions(ownerSituations, 'Pasirinkite artimiausią situaciją')}</select></div></div>
<div class="form-field form-field--wide"><label for="owner-timeline">Svarstomas laikas *</label><div class="select-wrap"><select id="owner-timeline" name="timeline" required>${ownerOptions(ownerTimelines, 'Pasirinkite laikotarpį')}</select></div></div>
<div class="form-field form-field--wide"><label for="owner-message">Trumpa konfidenciali žinutė *</label><p class="field-hint" id="owner-message-hint">Bent 40 ženklų. Galite aprašyti verslo istoriją, savo vaidmenį ir ko tikitės iš pirmo pokalbio.</p><textarea id="owner-message" name="message" rows="8" minlength="40" maxlength="3000" required aria-describedby="owner-message-hint"></textarea></div>
<div class="form-field"><label for="owner-contact-name">Jūsų vardas *</label><input id="owner-contact-name" name="contact_name" type="text" autocomplete="name" minlength="2" maxlength="120" required></div>
<div class="form-field"><label for="owner-contact-email">El. paštas *</label><input id="owner-contact-email" name="contact_email" type="email" inputmode="email" autocomplete="email" maxlength="254" required placeholder="vardas@imone.lt"></div>
<div class="form-field form-field--wide"><label for="owner-contact-phone">Telefono numeris (nebūtina)</label><input id="owner-contact-phone" name="contact_phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40"></div>
<input type="hidden" name="valuation_revenue_eur" data-valuation-field disabled><input type="hidden" name="valuation_ebitda_eur" data-valuation-field disabled><input type="hidden" name="valuation_owner_involvement" data-valuation-field disabled><input type="hidden" name="valuation_customer_concentration" data-valuation-field disabled><input type="hidden" name="valuation_order_backlog" data-valuation-field disabled><input type="hidden" name="valuation_ev_low_eur" data-valuation-field disabled><input type="hidden" name="valuation_ev_high_eur" data-valuation-field disabled><input type="hidden" name="valuation_multiple_low" data-valuation-field disabled><input type="hidden" name="valuation_multiple_high" data-valuation-field disabled>
<div class="honeypot-field" aria-hidden="true"><label for="owner-website">Interneto svetainė</label><input id="owner-website" name="honeypot" type="text" autocomplete="off" tabindex="-1" maxlength="200"></div>
<div class="owner-submit form-field--wide"><button class="primary-button" type="submit">Pateikti konfidencialiai peržiūrai</button><p class="form-status" id="owner-enquiry-status" role="status" aria-live="polite" tabindex="-1"></p></div>
</form></section><aside class="owner-confidentiality" aria-labelledby="owner-confidentiality-title"><h2 id="owner-confidentiality-title">Ką reiškia pateikimas</h2><p>Žinutė gaunama konfidencialiai Lithuanian ETA peržiūrai ir nėra persiunčiama kataloge esančioms įmonėms.</p><p>Formos pateikimas nėra pasiūlymas, verslo vertinimas ar brokerio bei tarpininkavimo susitarimas.</p></aside></div></main>${footer()}`;
await writeRoute(ownerPath, injectPage({
  title: 'Verslo tęstinumas ir privatus pardavimo pokalbis | Lithuanian ETA',
  description: ownerDescription,
  path: ownerPath,
  body: ownerBody,
  structuredData: [
    { '@context': 'https://schema.org', '@type': 'ContactPage', '@id': `${SITE_URL}/savininkams/#contact-page`, url: `${SITE_URL}/savininkams/`, name: 'Privatus pokalbis verslo savininkams', description: ownerDescription, inLanguage: 'lt-LT', isPartOf: { '@id': `${SITE_URL}/#website` } },
    breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Verslo savininkams', path: ownerPath }]),
  ],
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
  const body = `${header()}<main class="profile-main"><a class="back-link" href="/">← Grįžti į gamintojų katalogą</a><article class="profile-sheet"><header class="profile-hero"><div class="profile-heading-group"><p class="record-status">Nepatvirtintas viešų šaltinių įrašas</p><h1>${escapeHtml(record.trading_name)}</h1><p class="profile-identity">${escapeHtml(record.source_identity)}</p></div><div class="profile-actions"><a class="primary-button" href="/gauti-pasiulymus?gamintojas=${encodeURIComponent(record.slug)}">Įtraukti į projekto užklausą</a><a class="profile-guide-link" href="/gidas">Prieš kreipdamiesi peržiūrėkite pirkėjo gidą →</a><a class="profile-owner-link" href="/savininkams">Svarstote savo verslo tęstinumą? Privatus pokalbis savininkams →</a></div></header><div class="profile-note"><strong>Duomenys nėra garantija.</strong><span>Šis įrašas nepatvirtina gamintojo tapatybės, kokybės, užimtumo, kainos, terminų ar tinkamumo jūsų projektui.</span></div><section class="profile-details"><div class="section-heading"><h2>Tapatybė, vieta ir veiklos kryptys</h2></div><dl class="profile-facts">${facts.map(([term, detail]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(detail)}</dd></div>`).join('')}${linkFacts.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd><a href="${escapeHtml(value)}" rel="noopener noreferrer">${escapeHtml(value)}</a></dd></div>`).join('')}</dl></section>${profileLandingSection(record)}<section class="provenance-section"><h2>Šaltiniai ir duomenų kilmė</h2><p>Įrašas sudarytas iš viešai prieinamų šaltinių. Katalogas šių duomenų netvirtino su gamintoju.</p><ul class="source-list">${sources.map((source, index) => `<li><span>${index === 0 ? 'Viešas šaltinis' : `Papildomas šaltinis ${index + 1}`}</span><a href="${escapeHtml(source)}" rel="noopener noreferrer">${escapeHtml(source)}</a></li>`).join('')}</ul><p class="collection-date">Šaltinių surinkimo data: <time datetime="${record.source_collection_date}">${record.source_collection_date}</time></p></section></article></main>${footer()}`;
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
const featuredGuides = guideArticles.filter((article) => article.featured);
const conciseGuides = guideArticles.filter((article) => !article.featured);
const guideRouteList = (articles) => `<ul class="guide-route-list">${articles.map((article) => `<li><div><p>${escapeHtml(article.hubLabel)}</p><h3><a href="/gidas/${article.slug}/">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.summary)}</p></div><span class="route-arrow" aria-hidden="true">→</span></li>`).join('')}</ul>`;
const guideHubBody = `${header('guide')}<main><section class="guide-intro"><div><p class="kicker">Pirkėjo gidas</p><h1>Sprendimą grįskite palyginama informacija, ne vien pažadu</h1></div><p>Katalogas padeda rasti viešuose šaltiniuose matomus kandidatus. Gidas padeda patikrinti atranką, suprasti kainos ribas, valdyti projekto etapus ir aiškiai aptarti dokumentus.</p></section><section class="guide-hub"><div class="guide-hub-heading"><h2>Keturi išsamūs gidai svarbiausiems sprendimams</h2><p>Pradėkite nuo klausimo, kurį turite dabar: kandidato patikra, kaina, projekto eiga arba susitarimo detalės.</p></div>${guideRouteList(featuredGuides)}</section><section class="guide-hub guide-hub--secondary"><div class="guide-hub-heading"><h2>Trumpi praktiniai straipsniai</h2><p>Anksčiau publikuoti gidai lieka pasiekiami tais pačiais adresais.</p></div>${guideRouteList(conciseGuides)}</section>${faqHtml(guideFaq)}</main>${footer()}`;
await writeRoute('/gidas', injectPage({ title: 'Pirkėjo gidas | Baldai pagal užsakymą Lietuvoje', description: 'Lietuviški pirkėjo gidai apie baldų gamintojo pasirinkimą, realistiškas kainų nuorodas, projekto etapus, medžiagas, sutartį, avansą ir garantiją.', path: '/gidas', body: guideHubBody, structuredData: [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo gidas', path: '/gidas' }]), faqSchema(guideFaq)] }));

function renderArticleFaq(items) {
  if (!items?.length) return '';
  return `<section class="article-faq" aria-labelledby="article-faq-title"><h2 id="article-faq-title">Dažniausi klausimai</h2><dl>${items.map((item) => `<div><dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd></div>`).join('')}</dl></section>`;
}

for (const article of guideArticles) {
  const path = `/gidas/${article.slug}`;
  const guideContent = article.content ?? article.sections.map(([heading, copy]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(copy)}</p></section>`).join('');
  const body = `${header('guide')}<main class="article-main"><a class="back-link" href="/gidas">← Grįžti į pirkėjo gidą</a><article class="guide-article"><header class="article-header"><p class="kicker">Pirkėjo gidas</p><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.summary)}</p></header><div class="guide-copy">${guideContent}${renderArticleFaq(article.faq)}</div><nav class="article-next" aria-label="Toliau"><a href="/gidas">Visi pirkėjo gidai</a><a href="/gauti-pasiulymus">Parengti projekto užklausą →</a></nav></article></main>${footer()}`;
  const structuredData = [breadcrumb([{ name: 'Gamintojų katalogas', path: '/' }, { name: 'Pirkėjo gidas', path: '/gidas' }, { name: article.title, path }]), articleSchema(article, path)];
  if (article.faq?.length) structuredData.push(faqSchema(article.faq));
  await writeRoute(path, injectPage({ title: `${article.title} | Pirkėjo gidas`, description: article.metaDescription ?? article.summary, path, type: 'article', body, structuredData }));
}

const sitemapPaths = [
  '/',
  '/gauti-pasiulymus',
  '/savininkams',
  '/gidas',
  ...guideArticles.map((article) => `/gidas/${article.slug}`),
  ...manufacturers.map((record) => `/gamintojas/${record.slug}`),
  ...landingConfig.categories.map((category) => `/baldai-pagal-uzsakyma/${category.slug}`),
  ...eligibleCities.map((city) => `/baldai-pagal-uzsakyma/${city.slug}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map((path) => `  <url><loc>${escapeXml(canonicalUrl(path))}</loc>${path.startsWith('/gamintojas/') || path.startsWith('/baldai-pagal-uzsakyma/') ? `<lastmod>${sourceDate}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
await writeFile(join(publicDir, 'sitemap.xml'), sitemap);
await writeFile(join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`Generated ${manufacturers.length} profile routes, ${landingConfig.categories.length} category routes, ${eligibleCities.length} city routes, 1 buyer request route, 1 owner route, ${guideArticles.length + 1} guide routes, sitemap.xml and robots.txt.`);
