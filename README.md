# Lietuvos baldų gamintojų kandidatų katalogas

Viešais šaltiniais paremtas Lietuvos nestandartinių baldų gamintojų kandidatų katalogas. Įrašai yra nepatvirtinti: katalogas neteigia, kad kiekvienas gamintojas šiuo metu veikia, priima užsakymus, aptarnauja konkrečią teritoriją ar yra tinkamas konkrečiam projektui.

Produkcijos frontend adresas: <https://lithuanian-eta-app.supernaut.to>

## Duomenų kilmė ir ribos

Versijuotas katalogo šaltinis yra [`data/manufacturers.json`](data/manufacturers.json). Pradinis 121 įrašo rinkinys normalizuotas tik iš šių viešų artefaktų:

- [pradinis gamintojų rinkinys](https://prod-agent-artifact-engine-production.up.railway.app/render/6041adaa-cd73-4543-b001-1817e66e7987?share=jiqg4Ia8QAXblbyOi9dRsUxXABDzp_d8);
- [kategorijų taksonomija](https://prod-agent-artifact-engine-production.up.railway.app/render/fbab2759-fc97-4ee3-86c7-8823b0e93074?share=ypCVUgQZwo5C8mnOisvZWKa2nc-dKELi).

Pradinio rinkinio šaltinių surinkimo data yra `2026-07-27`, o patikros būsena – `nepatvirtinta`. Naujam ar keičiamam įrašui turi būti palikta jo faktinį šaltinio surinkimą atitinkanti `source_collection_date` reikšmė ir vieša kilmės nuoroda. Nepridėkite išvestinių telefono numerių, adresų, aptarnavimo teritorijų, darbo laiko, reitingų ar kitų šaltinyje nepateiktų teiginių.

## Svarbiausi katalogai

- `data/manufacturers.json` – versijuotas gamintojų duomenų šaltinis.
- `data/seo-landings.json` – kategorijų puslapių URL ir pirkėjui skirta, atsargiai suformuluota kopija; kategorijų kodai privalo atitikti gamintojų rinkinio taksonomiją.
- `src/` – naršyklės UI, maršrutai, metaduomenys ir struktūriniai duomenys.
- `scripts/generate-static-seo.mjs` – po Vite kompiliavimo iš versijuoto rinkinio generuoja statinius HTML, `sitemap.xml` ir `robots.txt`.
- `scripts/import-manufacturers.mjs` – vietinė validacija ir autentifikuotas idempotentinis importas.
- `pb_migrations/` – duomenų bazės schema ir istorinis pradinis seed.
- `pb_hooks/` – serverio kabliai.
- `pb_public/` – pasirenkami backend statiniai failai.
- `public/` – į Git committinama frontend build išvestis, įskaitant generatoriaus sukurtą IndexNow rakto failą. Jos failų neredaguokite ranka; pakeitimus atlikite šaltinyje ir paleiskite build.

## Duomenų modelis

`manufacturers` kolekcijoje yra sistemos `id` ir šie pagrindiniai laukai:

| Laukas | Reikšmė |
| --- | --- |
| `slug` | Unikalus stabilus URL/importo raktas. |
| `legal_name` | Viešas juridinis pavadinimas, jei šaltinyje yra. |
| `trading_name` | Viešas prekinis ar rodomas pavadinimas. |
| `source_identity` | Šaltinyje pateikta tapatybės eilutė. |
| `legal_entity_known` | Ar šaltinyje nustatyta juridinė tapatybė. |
| `description_lt` | Trumpas lietuviškas aprašymas, jei pagrįstas šaltiniu. |
| `location`, `city` | Šaltinyje nurodyta bazės vietovė; tai nėra paslaugų teritorija. |
| `region`, `region_label` | Šaltinio regiono grupė ir jos pavadinimas. |
| `category_codes`, `category_labels` | Viešo šaltinio duomenimis pagrįstos kategorijų žymos ir lietuviški pavadinimai; abu masyvai yra netuštūs. `O` naudojamas, kai patvirtinta nestandartinių baldų veikla, bet nepakanka duomenų siauresnei kategorijai. |
| `website`, `public_contact_url` | Tik šaltinyje esantys vieši URL. |
| `scope_evidence`, `confidence_evidence`, `evidence_source_type` | Šaltinio apimties ir įrodymo kontekstas. |
| `source_urls`, `source_artifact_url`, `source_collection_date` | Kilmės nuorodos ir data. |
| `verification_status` | `nepatvirtinta`. |

Kategorijų kodai: `K` – Virtuvės baldai; `W` – Spintos ir įmontuojami baldai; `BB` – Miegamojo ir vonios baldai; `OC` – Biuro ir komerciniai baldai; `HR` – HoReCa ir prekybos baldai; `U` – Minkšti baldai pagal užsakymą; `SW` – Medžio darbai ir medžio masyvo baldai; `MM` – Metalo ir mišrių medžiagų baldai; `O` – Kiti nestandartiniai baldai.

## Įrašo pridėjimas arba taisymas

1. Redaguokite `data/manufacturers.json`.
2. Naujam įrašui parinkite nekintantį ASCII `slug` (`mazosios-raides-ir-bruksneliai`). Taisant esamą įrašą nekeiskite slug be būtinos priežasties, nes jis yra viešo profilio URL.
3. Išsaugokite originalų `source_identity`, viešus `source_urls`, `source_artifact_url`, tikrą `source_collection_date` ir neapibrėžtumą. Svetainę ar kontaktinį URL pildykite tik tada, kai jis yra viešame šaltinyje.
4. Kategorijų kodų ir pavadinimų poras laikykite ta pačia tvarka ir naudokite tik aukščiau aprašytą taksonomiją. Žymą dėkite tik kai viešas šaltinis tiesiogiai įvardija atitinkamą gaminį, medžiagą ar paskirtį. Jei šaltinis patvirtina nestandartinių baldų gamybą, bet nepateikia pakankamai detalių siauresnei kategorijai, naudokite vienintelę porą `O` / `Kiti nestandartiniai baldai` ir aiškiai nurodykite šią ribą įrodymų laukuose.
5. `scope_evidence` įrašykite trumpą šaltinio teiginį ar citatą ir tiesiogiai nurodykite bent vieną to įrašo `source_urls` URL.
6. Paleiskite vietinę validaciją (ji taip pat pateikia aprašymų aprėptį, pilną kategorijų aprėptį ir pasiskirstymą pagal kodą):

   ```sh
   node scripts/import-manufacturers.mjs --validate
   ```

7. Peržiūrėkite diff, paleiskite `npm ci` bei `npm run build` ir tik tada commitinkite.
8. Jei commit pridėjo naują migraciją, pirmiausia vieną kartą perleiskite backend su nauju atvaizdu ir patikrinkite, kad migracija pritaikyta. Tada atnaujinkite veikiančią kolekciją tuo pačiu autentifikuotu idempotentiniu importu:

   ```sh
   PB_URL="https://backend.example" \
   PB_ADMIN_EMAIL="operator@example.com" \
   PB_ADMIN_PASSWORD="..." \
   node scripts/import-manufacturers.mjs
   ```

Importuotojas ieško pagal unikalų `slug`, sukuria trūkstamus ir atnaujina esamus įrašus. Pakartotinis paleidimas nedubliuoja duomenų, todėl po migracijos ar nutrūkusio operatoriaus paleidimo saugu vykdyti tą pačią komandą dar kartą. `--validate` neatlieka tinklo užklausų. Administratoriaus reikšmes perduokite tik proceso aplinkoje arba patikimoje paslapčių saugykloje; jų nerašykite į komandų failus, `.env` failus ar repo.

## Įrašo pašalinimas

1. Pašalinkite objektą iš `data/manufacturers.json` ir paleiskite `--validate`.
2. Patikrinkite, kad pašalinimas pagrįstas ir kad neliko vidinių nuorodų į tą slug.
3. Paleiskite importą su aiškiai pasirenkama `--prune` parinktimi:

   ```sh
   PB_URL="https://backend.example" \
   PB_ADMIN_EMAIL="operator@example.com" \
   PB_ADMIN_PASSWORD="..." \
   node scripts/import-manufacturers.mjs --prune
   ```

`--prune` po upsert pašalina iš backend kolekcijos tik tuos gamintojų įrašus, kurių slug nebėra versijuotame JSON. Be šios parinkties importas nieko netrina.

Po pridėjimo, taisymo ar pašalinimo būtinas ir naujas frontend build/deploy, nes statiniai profiliai, kategorijų ir miestų sąrašai bei sitemap generuojami iš commitinto JSON.

## Pataisų prašymų eilė

Gamintojo profilio forma sukuria įrašą valdomoje `correction_requests` peržiūros eilėje. Forma nesiunčia žinutės gamintojui ir nesuteikia pateikėjui administracinės prieigos. Operatorius turi peržiūrėti prašymą, patikrinti pateiktą viešą šaltinį, pataisyti versijuotą JSON ir tik tada vykdyti aukščiau aprašytą importo bei frontend build procesą.

## Pirkėjų projektų užklausos

Vieša projekto forma sukuria įrašą privačioje `buyer_requests` operatoriaus eilėje. Anoniminiam lankytojui leidžiama tik sukurti įrašą; viešas sąrašas, atskiro įrašo peržiūra, keitimas ir trynimas yra uždaryti. Kontaktiniai ir anti-abuse laukai pašalinami iš viešo sukūrimo atsakymo, o serverio kabliai normalizuoja būseną į `new`, atmeta užpildytą `honeypot` ir patikrina, kad trumpajame sąraše būtų ne daugiau kaip 12 realių katalogo ASCII `slug` reikšmių.

| Laukas | Reikšmė |
| --- | --- |
| `project_type` | Viena leidžiama nestandartinių baldų projekto rūšis. |
| `city_region` | Pirkėjo nurodytas miestas arba regionas. |
| `budget_band` | Viena leidžiama planuojamo biudžeto riba. |
| `timeline` | Vienas leidžiamas pageidaujamas laikotarpis. |
| `project_brief` | Trumpas projekto aprašas; saugomas operatoriaus peržiūrai, bet visas tekstas nesiunčiamas į dashboard pranešimą. |
| `contact_name`, `contact_email` | Privatūs pirkėjo kontaktai. |
| `shortlisted_manufacturer_slugs` | Pasirenkamas egzistuojančių katalogo gamintojų `slug` masyvas. |
| `status` | Serverio fiksuojama pradinė būsena `new`. |
| `honeypot` | Paprastas neviešas anti-abuse laukas; užpildytas pateikimas atmetamas. |
| `created` | Automatinis pateikimo laikas, naudojamas operatoriaus eilės rikiavimui. |

Po sėkmingo išsaugojimo patvirtinimas siunčiamas tik užklausą pateikusiam pirkėjui. Dashboard gauna tik glaustą projekto suvestinę be viso laisvo teksto aprašo ir be kontaktinių duomenų. El. pašto ar dashboard pranešimo klaida registruojama žurnale, bet jau išsaugotos užklausos neatšaukia.

Pirkėjo užklausa **nėra automatiškai persiunčiama gamintojams ar kitoms trečiosioms šalims**. Ji taip pat nėra gamintojo tapatybės, veiklos, pajėgumo, tinkamumo ar patikimumo patikra ir negarantuoja atsakymo ar pasiūlymo.

`buyer_requests` schema įvedama nauja idempotentine migracija. Backend redeploy metu migracija saugiai sukuria trūkstamą kolekciją arba suvienodina dalinai sukurtą schemą, laukus, taisykles ir eilės indeksą; pakartotinis paleidimas po nutrūkusio bandymo neturi kurti dublikatų. Jau sėkmingai pritaikytos migracijos PocketBase antrą kartą nevykdo, todėl būsimiems schemos pakeitimams būtinas naujas vėlesnio laiko migracijos failas. Pakeitus `pb_migrations/` arba `pb_hooks/`, reikia vieno backend redeploy ir po jo patikrinti gyvą schemą bei realų anoniminio pateikimo kelią; vien frontend deploy šių pakeitimų nepritaiko.

## Savininkų konfidencialios užklausos

`owner_enquiries` yra privati eilė įmonių savininkams, svarstantiems įpėdinystę, veiklos tęstinumą ar pardavimą ir norintiems pradėti tiesioginę privačią diskusiją su pirkėju. Anoniminis lankytojas gali tik sukurti užklausą. Viešas sąrašas, atskiro įrašo peržiūra, keitimas ir trynimas yra uždaryti; ne superuseriui net sukūrimo atsakyme negrąžinami įmonės, finansiniai, situacijos, laisvo teksto, kontaktiniai ar `honeypot` duomenys.

| Laukas | Reikšmė |
| --- | --- |
| `company_name` | Nurodytas įmonės pavadinimas. |
| `city` | Nurodytas miestas. |
| `sector` | Nurodytas veiklos sektorius. |
| `revenue_band` | Viena pasirenkama pajamų riba. |
| `ebitda_band` | Viena pasirenkama EBITDA riba. |
| `ownership_succession_situation` | Viena pasirenkama nuosavybės, įpėdinystės ar tęstinumo situacija. |
| `timeline` | Vienas pasirenkamas pageidaujamas laikotarpis. |
| `message` | Savininko laisvo teksto žinutė operatoriaus peržiūrai. |
| `contact_name`, `contact_email`, `contact_phone` | Privatūs pateikėjo kontaktai; telefonas neprivalomas. |
| `status` | Serverio nustatoma pradinė būsena `new`; naršyklės pateikimas jos nekontroliuoja. |
| `honeypot` | Neviešas anti-abuse laukas; užpildyta reikšmė pateikimą atmeta. |
| `created` | Automatinis pateikimo laikas operatoriaus eilės rikiavimui. |

Serveris apkarpo tekstines reikšmes, mažosiomis raidėmis normalizuoja el. paštą, normalizuoja neprivalomą telefoną ir atmeta per ilgą el. pašto adresą. Užklausos kontaktai, žinutė ir finansiniai duomenys lieka privačioje eilėje. Užklausa **niekada nėra persiunčiama kataloge nurodytam gamintojui, kataloge surastam savininkui ar kitam adresatui**.

Sėkmingai išsaugojus, patvirtinimas siunčiamas tik pateikėjo `contact_email`. Jame nurodoma, kad užklausa gauta Lietuvos ETA, skirta tiesioginei privačiai diskusijai su pirkėju, nebus persiųsta katalogo įmonei ir nėra pasiūlymas ar vertinimas. Dashboard gauna įvykį tik su nekontaktine suvestine (įmonė, miestas, sektorius, pajamų ir EBITDA ribos, situacija bei laikotarpis), be el. pašto, telefono ar žinutės teksto. El. pašto ar dashboard pranešimo klaida registruojama žurnale ir jau išsaugotos užklausos neatšaukia.

`owner_enquiries` schema įvedama idempotentine migracija: ji saugiai sukuria trūkstamą kolekciją arba suvienodina po dalinio paleidimo likusius laukus, taisykles ir būsenos eilės indeksą, išlaikydama esamų laukų identifikatorius. Rollback yra nedestruktyvus ir pateiktų užklausų netrina.

## Frontend build ir statinis SEO

Įdiekite tik lockfile nurodytas priklausomybes ir paleiskite build:

```sh
npm ci
npm run build
```

`npm run build` nuosekliai:

1. patikrina TypeScript;
2. sukompiliuoja Vite frontend į `public/`;
3. be tinklo užklausų ar paslapčių paleidžia `scripts/generate-static-seo.mjs`;
4. iš `data/manufacturers.json` ir `data/seo-landings.json` sugeneruoja:
   - `/gamintojas/<slug>/index.html` kiekvienam realiam profiliui;
   - `/baldai-pagal-uzsakyma/<slug>/index.html` visoms kategorijoms;
   - miesto puslapius tik miestams, turintiems bent penkis rinkinio įrašus;
   - statinius esamus gido maršrutus;
   - `public/sitemap.xml` ir `public/robots.txt`.

Statiniuose HTML yra lietuviški title/description, canonical, robots, Open Graph, Twitter ir šaltiniais apriboti JSON-LD duomenys. `public/` yra build išvestis ir yra committinama; SEO failai turi būti tikrinami po kiekvieno build.

Vietinė peržiūra:

```sh
npm run preview
```

Frontend deploy vykdomas iš `public/` pagal `wrangler.toml`. Šio repo `deploy` skriptas pirmiausia pakartoja build:

```sh
npm run deploy
```

Produkcijos bazinis URL generatoriuje yra `https://lithuanian-eta-app.supernaut.to`; keičiant viešą domeną būtina vienu pakeitimu atnaujinti runtime SEO konfigūraciją ir statinį generatorių, tada perkurti frontend.

## IndexNow sitemap pateikimas

Build metu `scripts/generate-static-seo.mjs` sukuria viešą šakninį IndexNow rakto failą `public/bdbf192043551ef057b872c40309c70792110cbb37b7a8c716b8030741f84397.txt`. Rakto reikšmė yra sąmoningai vieša ir failo turinys turi sutapti su jo pavadinimo dalimi.

Tik **po frontend deploy**, kai gyvai atsidaro <https://www.baldininkai.org/bdbf192043551ef057b872c40309c70792110cbb37b7a8c716b8030741f84397.txt>, pateikite visą sitemap:

```sh
npm run submit:indexnow
```

Komanda paima `https://www.baldininkai.org/sitemap.xml`, patikrina, kad visi `<loc>` URL priklauso tam pačiam viešam hostui, pašalina dublikatus ir siunčia juos į IndexNow paketais iki 10 000 URL. Ji išveda sitemap adresą, URL skaičių, paketų eigą bei kiekvieną HTTP atsakymą. Tik `200` ir `202` laikomi priimtais; tuščias sitemap, netinkamas URL, užklausos ar atsakymo klaida užbaigia komandą su nenuliniu kodu. Komandą saugu kartoti.

Jei reikia pateikti kitą sitemap kelią tame pačiame viešame hoste, galima aiškiai nurodyti HTTPS URL be prisijungimo duomenų ar porto:

```sh
SITEMAP_URL="https://www.baldininkai.org/kitas-sitemap.xml" npm run submit:indexnow
```

Vykdykite šią komandą po reikšmingų sitemap pakeitimų (pavyzdžiui, pridėjus ar pašalinus daug viešų puslapių), bet ne prieš rakto failui tampant pasiekiamam gyvai. Komanda nesaugo ir nenaudoja jokių slaptų duomenų.

## Kada reikia backend redeploy

Vien gamintojo turinio pakeitimui paprastai pakanka autentifikuoto importo ir frontend redeploy. Backend redeploy reikalingas, kai keičiasi:

- naujas failas `pb_migrations/` (schemos ar saugaus duomenų atnaujinimo migracija);
- `pb_hooks/` elgsena;
- `Dockerfile.supernaut-pocketbase` arba į backend atvaizdą kopijuojami failai;
- backend runtime konfigūracija.

Migracijos vykdomos vieną kartą ir jau pritaikytos migracijos redagavimas veikiančios bazės neatnaujina. Schemos ar seed logikos pakeitimui pridėkite naują, idempotentinę, vėlesnio laiko migraciją. Istorinė pradinio 121 įrašo migracija nėra kasdienio turinio sinchronizavimo mechanizmas; turinio pakeitimams naudokite importuotoją.

Po backend redeploy patikrinkite gyvą schemą ir realų duomenų kelią. Nevykdykite backend redeploy vien tam, kad pamatytumėte duomenis.

## Paslaptys ir prieigos

Repo neturi būti jokių administratoriaus slaptažodžių, API raktų, autentifikavimo tokenų ar kitų paslapčių. `PB_URL`, `PB_ADMIN_EMAIL` ir `PB_ADMIN_PASSWORD` perduodami tik proceso aplinkoje importo metu. Frontend naudoja viešam skaitymui skirtą API URL; administratoriaus duomenys niekada negali patekti į `src/`, `data/`, build išvestį ar commit istoriją.

Anoniminis gamintojų sąrašo ir atskiro įrašo skaitymas yra viešas. Viešas gamintojų kūrimas, keitimas ir trynimas uždarytas; vienintelė vieša rašymo eiga yra ribota pataisų prašymų eilė.
