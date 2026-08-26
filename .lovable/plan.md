# Offert-PDF: enhetsfel, layoutkrock, referens och villkor

## 1. Fel enhet i PDF (buggfix)
Idag tvingar PDF:en alla arbetsrader till enheten "h" oavsett vad du valt i offertposterna. Alla rader ska visa exakt den enhet du valt (tim, st, m2, m, lpm, kg ...), och antalet ska hämtas från raden på samma sätt som i förhandsvisningen. Ingen tvingad omskrivning kvar.

## 2. Bankgiro och "Att betala" krockar
Summeringsblocket ritas idag på en fast plats efter tabellen, utan hänsyn till hur långt ner tabellen slutar. Med många offertrader hamnar det ovanpå sidfoten med bankgiro.

Åtgärd:
- Tabellen får en fast bottenmarginal så den aldrig går in i sidfotens område.
- Summeringen (inkl. ROT/RUT och "Att betala") mäts innan den ritas; får den inte plats flyttas hela blocket till en ny sida.
- Sidfoten (postadress, telefon, bankgiro, F-skatt) ritas på varje sida och sidnumreringen räknas om efter faktiskt antal sidor.

## 3. Referensnamn på offerten
Idag hämtas "Vår referens" alltid från företagsinställningarna. Nu blir den per offert:
- Rullista med företagets användare/anställda som fyller i namn och telefon automatiskt.
- Möjlighet att skriva över manuellt med fritext.
- Värdet sparas på offerten och används i PDF, förhandsvisning och offerthuvudet. Tomt värde = företagets kontaktperson som tidigare.

## 4. Betalningsvillkor i antal dagar
Under "Villkor & Avslut" läggs ett fält "Betalningsvillkor (dagar netto)" till, förifyllt med 10.
- Sparas på offerten.
- PDF:ens hårdkodade "10 dagar netto" ersätts med det valda värdet, och samma text visas i förhandsvisningen.

## 5. Avancerade inställningar på offerten
En hopfällbar sektion "Avancerade inställningar" i offertbyggaren som samlar det som idag ligger utspritt eller är hårdkodat:
- Momssats
- Giltighetstid i dagar
- Betalningsvillkor i dagar
- Visa/dölj à-pris och antal i PDF
- Avrundning av totalsumma

Sektionen är stängd som standard så den vanliga vyn förblir ren.

## 6. Bygglet-import
Ingen implementation nu — vi återkommer när vi vet vilket format exporten från Bygglet har (Excel/CSV eller PDF). Punkterna ovan görs först.

## Tekniska detaljer
- `src/lib/generateQuotePdf.ts`: ta bort `item.type === "labor" ? "h"`-logiken och `hours`-specialfallet i tabellraderna; lägg `margin.bottom` på autoTable; gör totals-blocket sidbrytningssäkert; dynamisk `drawFooter` med korrekt totalt sidantal; använd `paymentTermsDays` istället för texten "10 dagar netto"; använd `ourReference` från offerten.
- Databas: migration som lägger till `our_reference text`, `our_reference_phone text` och `payment_terms_days integer default 10` på `project_estimates` (RLS oförändrad, tabellen har redan policies).
- `src/hooks/useEstimate.ts`: läs/spara de nya fälten.
- `src/components/estimates/ClosingSection.tsx`: nytt dagar-fält under villkorstexten.
- Ny `src/components/estimates/AdvancedSettingsSection.tsx` som renderas i `EstimateBuilder.tsx`.
- `src/components/estimates/QuoteLivePreview.tsx` och `QuotePreviewSheet.tsx`: samma enhets-, referens- och villkorslogik som PDF:en så förhandsvisning och PDF matchar.
