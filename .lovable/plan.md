
## Vad som faktiskt händer (orsak)
Du har rätt i din gissning: det blir **0 poster** eftersom backend just nu **inte kör “add_estimate_items” med dina riktiga rad-data** när du klickar **Spara offert**.

Vi kan se i edge-loggarna att `context.pendingData` faktiskt innehåller allt du fyllde i (projektbeskrivning, tidsplan, items med antal/á-pris osv). Men vi ser **inga loggar** som visar att “Direct pattern matched: add_estimate_items” körs.

Det betyder att vår “direct execution”-regel (regex) för add_estimate_items **inte matchar meddelandet** som frontenden skickar, så backend går vidare till AI-tolkning. AI:n ser bara texten:
> “Lägg till 1 poster på offert med ID … Projektbeskrivning… Tidsplan…”

…men den ser **inte** `items[]` och `addons[]` som ligger i `context.pendingData`. Resultatet blir att tool-anropet (om det ens görs) saknar rad-data ⇒ **0 poster sparas**, och offerten blir 0 överallt.

### Varför regexen missar
Meddelandet börjar med:
> “Lägg till **1** poster på offert med ID …”

Vår nuvarande regex för add-estimate-items förväntar sig att det kommer “poster/items/offert” direkt efter “lägg till”, men här kommer en siffra emellan (”1”). Därför matchar den inte.

---

## Mål
1) När användaren klickar **Spara offert** ska backend alltid köra `add_estimate_items` med datan i `context.pendingData` (inkl. raderna).
2) Projektbeskrivning ska hamna i `scope`, tidsplan i `assumptions[]`, rader i `estimate_items`, tillval i `estimate_addons`.
3) Bekräftelsen “uppdaterad med X poster” ska visa korrekt antal och motsvara det som faktiskt sparats.
4) (Bonus) Meddelandet som skickas från UI kan gärna innehålla en kort sammanfattning av raderna så att det fungerar även om pendingData saknas.

---

## Implementation (vad jag kommer ändra)

### A) Backend: gör direct pattern robust (fixar 0 poster)
**Fil:** `supabase/functions/global-assistant/index.ts`

1) Uppdatera `addItemsPattern` så att den matchar även när det finns en siffra efter “Lägg till”.
   - Nuvarande:
     - `/(?:lägg till|add|spara)\s*(?:poster|items|offert).../`
   - Ny (exempel):
     - Tillåt valfri mängd “antal + ord” efter “lägg till”, t.ex. `Lägg till 1 poster ...`
```ts
const addItemsPattern =
  /(?:lägg till|add|spara)\s*(?:\d+\s*)?(?:poster|rader|offertposter|items|offert)\b.*?(?:offert med ID|estimate_id)\s*[:=]?\s*([a-f0-9-]{36})/i;
```

2) Lägg till en extra “failsafe”-match:
   - Om `context.pendingData` finns och innehåller `items`/`addons` och meddelandet innehåller ett UUID (estimateId), så kör `add_estimate_items` ändå.
   - Detta gör att även om texten ändras lite i framtiden, så sparas datan ändå.

3) Normalisera payload innan `executeTool`:
   - Säkerställ att vi skickar:
     - `estimate_id` = uuid från texten (eller `context.selectedEstimateId`)
     - `introduction`, `timeline`, `items`, `addons` från `context.pendingData`
   - Ignorera extra fält (som `estimateId`) utan att det påverkar.

4) Efter lyckad körning: returnera `context` som rensar `pendingData` så att ett efterföljande “Visa offerten” inte riskerar att trigga en duplicering senare.
```ts
return {
  ...formatted,
  context: {
    pendingData: null,
  },
};
```
(Exakt form beror på hur ni vill representera “tomt”, men idén är att pendingData inte ska ligga kvar.)

---

### B) Frontend: gör användarmeddelandet mer självbärande (valfritt men rekommenderat)
**Fil:** `src/pages/GlobalAssistant.tsx`

Just nu skickas en text som inte nämner raderna, vilket gör att om direct pattern missar så “ser AI:n” aldrig rad-datan.

Jag uppdaterar `handleEstimateItemsFormSubmit` så att meddelandet inkluderar en kort sammanfattning av raderna, t.ex.:
- “Rad 1: Arbete, st, 10 x 650, ‘ddd’”
- “Tillval: …”

Detta är inte primär fix (pendingData är primär), men det ger en extra fallback och gör att chatloggen blir tydligare.

---

### C) Verifiering: bevisa att det sparas på riktigt
När ändringen är på plats testar vi (end-to-end i chatten):
1) Skapa offert via formuläret (som tidigare).
2) Fyll i projektbeskrivning + tidsplan + minst 1 rad.
3) Klicka **Spara offert**.
4) Kontrollera i loggarna att vi får:
   - `Direct pattern matched: add_estimate_items` (eller failsafe-path)
   - att `pendingData.items.length` är 1+
5) Klicka “Öppna offert” och kontrollera:
   - Projektbeskrivning visar texten du skrev (scope)
   - Tidsplan visar punkter (assumptions)
   - Offertposter visar raderna med korrekt antal/á-pris
   - Summor är > 0

Om det fortfarande skulle bli 0, kommer nästa steg vara att kontrollera:
- om insert i `estimate_items` faktiskt sker (och om någon RLS-policy stoppar inserts), men eftersom koden idag skulle kasta error vid insert-fel är det mer sannolikt att det är “regex miss → tool körs utan items”.

---

## Exakt vilka filer jag kommer ändra
1) `supabase/functions/global-assistant/index.ts`
   - Uppdatera addItemsPattern (tillåt “Lägg till 1 …”)
   - Lägg till failsafe baserat på `context.pendingData`
   - Rensa `pendingData` efter lyckad uppdatering
   - (Behåll befintlig create_estimate direct pattern)

2) `src/pages/GlobalAssistant.tsx`
   - Förbättra text-meddelandet på “Spara offert” så att raderna sammanfattas (fallback + tydlighet)

---

## Varför detta löser problemet du ser på screenshots
- Dina inmatade rader **finns redan** i `context.pendingData` (vi har logg som bevisar det).
- Det som saknas är att backend **använder** pendingData för att kalla `add_estimate_items`.
- När regexen börjar matcha “Lägg till 1 poster …” kommer backend att köra `add_estimate_items` med `items[]` och då blir “uppdaterad med 1 poster” och offerten får verkligt innehåll.

