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
- `public/` – frontend build išvestis. Ji yra ignoruojama Git ir negali būti redaguojama ranka.

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
| `category_codes`, `category_labels` | Tik viešame šaltinyje aiškiai pagrįstos kategorijų žymos ir lietuviški pavadinimai; abu masyvai gali būti tušti. |
| `website`, `public_contact_url` | Tik šaltinyje esantys vieši URL. |
| `scope_evidence`, `confidence_evidence`, `evidence_source_type` | Šaltinio apimties ir įrodymo kontekstas. |
| `source_urls`, `source_artifact_url`, `source_collection_date` | Kilmės nuorodos ir data. |
| `verification_status` | `nepatvirtinta`. |

Kategorijų kodai: `K` – Virtuvės baldai; `W` – Spintos ir įmontuojami baldai; `BB` – Miegamojo ir vonios baldai; `OC` – Biuro ir komerciniai baldai; `HR` – HoReCa ir prekybos baldai; `U` – Minkšti baldai pagal užsakymą; `SW` – Medžio darbai ir medžio masyvo baldai; `MM` – Metalo ir mišrių medžiagų baldai.

## Įrašo pridėjimas arba taisymas

1. Redaguokite `data/manufacturers.json`.
2. Naujam įrašui parinkite nekintantį ASCII `slug` (`mazosios-raides-ir-bruksneliai`). Taisant esamą įrašą nekeiskite slug be būtinos priežasties, nes jis yra viešo profilio URL.
3. Išsaugokite originalų `source_identity`, viešus `source_urls`, `source_artifact_url`, tikrą `source_collection_date` ir neapibrėžtumą. Svetainę ar kontaktinį URL pildykite tik tada, kai jis yra viešame šaltinyje.
4. Kategorijų kodų ir pavadinimų poras laikykite ta pačia tvarka ir naudokite tik aukščiau aprašytą taksonomiją. Žymą dėkite tik kai viešas šaltinis tiesiogiai įvardija atitinkamą gaminį, medžiagą ar paskirtį. Bendras teiginys apie nestandartinių baldų gamybą nepagrindžia konkrečios kategorijos, todėl tokiu atveju abu kategorijų masyvai teisėtai paliekami tušti.
5. `scope_evidence` įrašykite trumpą šaltinio teiginį ar citatą ir tiesiogiai nurodykite bent vieną to įrašo `source_urls` URL.
6. Paleiskite vietinę validaciją (ji taip pat pateikia aprašymų aprėptį, kategorizuotų ir sąmoningai nekategorizuotų įrašų skaičių bei pasiskirstymą pagal kodą):

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

Statiniuose HTML yra lietuviški title/description, canonical, robots, Open Graph, Twitter ir šaltiniais apriboti JSON-LD duomenys. `public/` yra build išvestis ir nėra committinama; SEO failai turi būti tikrinami po kiekvieno build.

Vietinė peržiūra:

```sh
npm run preview
```

Frontend deploy vykdomas iš `public/` pagal `wrangler.toml`. Šio repo `deploy` skriptas pirmiausia pakartoja build:

```sh
npm run deploy
```

Produkcijos bazinis URL generatoriuje yra `https://lithuanian-eta-app.supernaut.to`; keičiant viešą domeną būtina vienu pakeitimu atnaujinti runtime SEO konfigūraciją ir statinį generatorių, tada perkurti frontend.

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
