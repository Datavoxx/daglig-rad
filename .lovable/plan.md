

## Ändra knappar efter offertskapande

### Vad som ändras
När en offert skapas/uppdateras via AI-assistenten visas idag "Visa offert" och "Skapa ny offert" som åtgärdsknappar. Dessa ska tas bort och ersättas med en "Ladda ner PDF"-knapp.

### Filer som ändras

**1. `supabase/functions/global-assistant/index.ts`**
- I `add_estimate_items`-caset (rad ~3502-3504): Ta bort de två nextActions ("Visa offert" och "Skapa ny offert")
- Lägg till en ny `downloadLink` i data-objektet med href `/estimates?estimateId=${result.id}&download=true`

**2. `src/types/global-assistant.ts`**
- Lägg till ett valfritt `downloadLink`-fält i `MessageData`-interfacet: `downloadLink?: { label: string; href: string; }`

**3. `src/components/global-assistant/ResultCard.tsx`**
- Rendera en "Ladda ner PDF"-knapp (med Download-ikon) om `data.downloadLink` finns, som navigerar till länken

**4. `src/pages/Estimates.tsx`**
- Läs `download`-parametern från URL
- Om `download=true` och offerten laddats, trigga PDF-nedladdning automatiskt via `generateQuotePdf`
- Rensa `download`-parametern efteråt

### Resultat
Efter att en offert skapats via AI visas "Öppna offert" (befintlig länk) samt en ny "Ladda ner PDF"-knapp som direkt laddar ner offerten som PDF.
