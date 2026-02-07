
Målet är att lösa två saker du visar i screenshots:
1) **Antal (t.ex. 10) syns inte i själva offerten/estimatvyn**, trots att summan räknas som om det vore 10×.
2) **“Ta bort rad 1” bekräftas i chatten men raden ligger kvar** när du sen “visar offerten”.

Jag har hittat sannolik rotorsak för båda, och hur vi fixar det.

---

## 1) Varför “Antal” blir tomt i offerten (men summan stämmer)

### Vad som händer i datan
I databasen finns dina rader och **quantity är ifyllt**:
- OFF-2026-0039 har t.ex. rader med `quantity = 10` och `quantity = 5`
- men `hours` är **null**

Det här är exakt varför du ser:
- **Summa visar 8 500 (10×850)** → subtotal är redan uträknad och sparad
- men **Antal-kolumnen är tom** → UI visar fel fält

### Varför UI visar fel fält
I offert-/estimatkomponenterna används logiken:
- om `item.type === "labor"` ⇒ visa `item.hours`
- annars ⇒ visa `item.quantity`

Det gäller både:
- `src/components/estimates/EstimateTable.tsx` (tabellen i /estimates)
- `src/components/estimates/QuotePreviewSheet.tsx` (förhandsgranskningen)

Eftersom dina “labor”-rader råkar ha quantity ifyllt men hours = null blir antal tomt.

### Fix-strategi (robust + bakåtkompatibel)
Vi gör appen tolerant:
- För “labor”-rader: **använd `hours` om den finns, annars fall back till `quantity`**
- När vi laddar data: om en “labor”-rad har `hours = null` men `quantity` finns ⇒ **sätt hours = quantity** i state (så all beräkning + UI blir konsekvent)

Detta gör att både gamla och nya offerter visar antal korrekt utan att du behöver ändra hur du matar in data.

---

## 2) Varför “ta bort rad 1” inte faktiskt tar bort något

Jag ser att backend (server-funktionen) saknar ett riktigt “delete estimate row”-verktyg för offertposter:
- Det finns verktyg för att skapa offert och lägga till rader (`add_estimate_items`)
- Men det finns **ingen tool** som tar bort en rad ur `estimate_items`

Det betyder att chatten kan “låta som” den tog bort raden (text-svar), men inget kan faktiskt raderas i databasen.

### Fix-strategi
Vi implementerar riktig radering med bekräftelseflöde:

1) Lägg till ett nytt backend-verktyg:
   - `delete_estimate_item`
   - Tar emot `estimate_id` + `row_number` (1-baserad) eller `item_id`
   - Hämtar raderna sorterade på `sort_order`
   - Hittar rätt rad och `DELETE` på `estimate_items.id`
   - Räknar om totalsummor (som `add_estimate_items` redan gör)

2) Lägg till ett “confirm”-flöde i backend via `context.pendingAction`/`context.pendingData`:
   - När användaren skriver “ta bort rad 1 …” svarar AI:n med ett **proposal**: “Bekräfta att jag ska ta bort rad 1 (10 tim) …”
   - Om användaren svarar “Ja, kör på!” → backend kör `delete_estimate_item`
   - Om användaren svarar “Avbryt/nej” → backend rensar pendingAction

3) Uppdatera “Visa offert” så att den visar uppdaterad lista (den gör redan det, men nu kommer datan faktiskt vara borttagen).

---

## Exakta ändringar (filer)

### A) Visa “antal” korrekt i offert/estimat UI
1) `src/hooks/useEstimate.ts`
   - När items mappas in i state:
     - Om `item.type === "labor"` och `item.hours` är null men `item.quantity` finns:
       - sätt `hours = Number(item.quantity)`
       - (valfritt) lämna quantity kvar, men hours blir “source of truth” i UI

2) `src/components/estimates/EstimateTable.tsx`
   - I desktop-rendern där “Antal” input/value sätts:
     - ändra från: `labor ? hours : quantity`
     - till: `labor ? (hours ?? quantity) : quantity`
   - I `updateItem` subtotal-logiken för labor:
     - använd “effectiveHours = updated.hours ?? updated.quantity ?? 0”
   - I onChange för “Antal” när type = labor:
     - skriv till `hours` (och ev. spegla till quantity om vi vill vara extra konsekventa)

3) `src/components/estimates/QuotePreviewSheet.tsx`
   - I tabellen:
     - ändra antal-cell från `labor ? item.hours : item.quantity`
     - till `labor ? (item.hours ?? item.quantity) : item.quantity`
   - Enhet-cell:
     - idag visas “h” för labor; det är ok. Men om ni vill visa “tim” kan vi göra det också.

Resultat: “10” syns i “Antal” på offerten även när hours råkar vara null.

---

### B) Implementera riktig radering av offertpost från chatten
1) `supabase/functions/global-assistant/index.ts` (backend-funktionen)
   - Lägg till tool definition:
     - `delete_estimate_item` med parametrar:
       - `estimate_id: string` (required)
       - `row_number: number` (optional)
       - `item_id: string` (optional)
   - Lägg till executeTool-case:
     - Validera att offerten tillhör användaren (samma mönster som övriga estimate-tools)
     - Om `item_id` finns: delete direkt
     - Om `row_number` finns:
       - select items order by sort_order
       - hitta index = row_number - 1
       - delete på item.id
     - Efter delete: räkna om totals + uppdatera `project_estimates` (labor/material/subcontractor/total)
     - Returnera `items_deleted: 1` och gärna vilken rad som togs bort

   - Lägg till “pendingAction confirm handler” i request-flödet:
     - Om `context.pendingAction === "delete_estimate_item"`:
       - vid “ja/kör/ok” → kör tool med `context.pendingData`
       - vid “avbryt/nej” → rensa pendingAction

   - Lägg till parsing av användartext:
     - Matcha fraser som “ta bort rad 1”, “ta bort första raden”, “delete row 1”
     - Om vi hittar radnummer + estimateId (från text eller context.selectedEstimateId):
       - returnera `type: "proposal"` + `context: { pendingAction: "delete_estimate_item", pendingData: {...} }`

2) (Valfritt) `src/types/global-assistant.ts`
   - Om vi vill typa pendingAction/pendingData bättre (inte nödvändigt, men gör det tydligare)

Resultat: när chatten säger att den tagit bort raden så är den faktiskt raderad i databasen och “visa offerten” visar uppdaterad lista.

---

## Tester (end-to-end) vi kör efteråt
1) Öppna en offert med en “labor”-rad som har quantity men hours null (som i OFF-2026-0039).
   - Verifiera att “Antal” visar 10 och 5 i /estimates och i förhandsgranskning.

2) I chatten:
   - “visa offerten”
   - “ta bort rad 1”
   - klicka bekräfta (proposal → Ja, kör på!)
   - “visa offerten” igen
   - Verifiera att raden verkligen är borta och totalsummor uppdaterade.

3) Edge case:
   - Försök ta bort rad 99 (för stort nummer) → få tydligt felmeddelande (“Hittar ingen rad 99”)

---

## Varför detta är rätt fix för dina screenshots
- Dina rader **har quantity sparat** men UI tittar på hours för labor → därför blir “Antal” tomt.
- Chat-borttagning har inget riktigt delete-verktyg → därför kan den säga “borttagen” men inget ändras.

När vi har gjort ovanstående kommer:
- **Antal** synas som du förväntar dig (t.ex. “10”)
- **Ta bort rad** fungerar på riktigt och syns direkt vid “visa offert”
