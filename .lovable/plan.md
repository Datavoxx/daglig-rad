

## Mål

Fixa blinknings-buggen där offertlistan visas för en millisekund innan offerten öppnas via "Öppna offert"-knappen.

---

## Rotorsak

Problemet uppstår på grund av renderingsordningen i `Estimates.tsx`:

```
1. Sidan renderas med manualStarted = false
2. → Offertlistan visas (synlig i ~50-200ms)
3. useEffect körs efter renderingen
4. useEffect väntar på savedEstimates från useQuery
5. När data laddats: setManualStarted(true)
6. → EstimateBuilder visas
```

Resultatet är en kort "blixt" av offertlistan innan själva offerten visas.

---

## Lösning

**Initiera state synkront baserat på URL-parametrar** - inte i useEffect.

Vi gör följande ändringar:

1. **Flytta initial state-logik** från `useEffect` till komponentens initiala state
2. **Använd `useMemo` eller lazy initialization** för att direkt detektera om vi har en estimateId i URL:en
3. **Visa loading/skeleton** tills data finns, om vi vet att vi ska öppna en specifik offert
4. **Undvik att rendera offertlistan** när URL-parameter finns

---

## Teknisk implementation

### Före (nuvarande kod):
```tsx
const [manualStarted, setManualStarted] = useState(false);
const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);

// useEffect körs EFTER första renderingen
useEffect(() => {
  const estimateIdFromUrl = searchParams.get("estimateId");
  // ... väntar på savedEstimates ...
  if (estimate) {
    handleSelectEstimate(estimate);  // sätter manualStarted = true
  }
}, [searchParams, savedEstimates]);
```

### Efter (föreslagen fix):
```tsx
// Läs URL-parametrar SYNKRONT vid initialisering
const estimateIdFromUrl = searchParams.get("estimateId") || searchParams.get("id");
const offerNumberFromUrl = searchParams.get("offerNumber");
const hasDeepLink = Boolean(estimateIdFromUrl || offerNumberFromUrl);

// Initiera state baserat på URL-parameter
const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
  estimateIdFromUrl || null
);

// Om vi har en deep-link, börja direkt i "pending builder" läge
const [manualStarted, setManualStarted] = useState(hasDeepLink);
const [manualData, setManualData] = useState<ManualData | null>(
  hasDeepLink ? { projectName: "", clientName: "", address: "" } : null
);
```

### Uppdaterad deep-link effekt:
```tsx
useEffect(() => {
  // Om inga URL-params, inget att göra
  if (!hasDeepLink) return;
  if (deepLinkProcessedRef.current === paramKey) return;
  
  // Vänta på data innan vi kan popula manualData korrekt
  if (!savedEstimates || savedEstimates.length === 0) return;
  
  const estimate = estimateIdFromUrl 
    ? savedEstimates.find(e => e.id === estimateIdFromUrl)
    : offerNumberFromUrl
    ? savedEstimates.find(e => e.offer_number === offerNumberFromUrl)
    : null;
    
  if (estimate) {
    deepLinkProcessedRef.current = paramKey;
    // Uppdatera bara manualData med korrekt info
    setManualData({
      projectName: estimate.manual_project_name || estimate.projects?.name || "",
      clientName: estimate.manual_client_name || estimate.projects?.client_name || "",
      address: "",
    });
    setSelectedEstimateId(estimate.id);
    // manualStarted är redan true!
  } else {
    // Offerten hittades inte - gå tillbaka till listan
    toast({ ... });
    setManualStarted(false);
    setManualData(null);
    setSearchParams({}, { replace: true });
  }
}, [savedEstimates]);
```

### Resultat:
- `manualStarted` initieras till `true` om URL har `estimateId`
- Komponenten renderar direkt EstimateBuilder (med eventuellt tomma placeholder-data)
- EstimateBuilder själv hämtar sin data baserat på `estimateId`
- **Ingen blixt av offertlistan**

---

## Fil att ändra

**`src/pages/Estimates.tsx`**
- Flytta URL-läsning till synkron initialisering
- Initiera state baserat på URL-parametrar
- Uppdatera useEffect att bara hantera data-populering (inte state-byte)

---

## Förväntad beteende efter fix

| Scenario | Före | Efter |
|----------|------|-------|
| Klick på "Öppna offert" | Lista blinkar → Offert | Offert visas direkt |
| Direkt URL med estimateId | Lista blinkar → Offert | Offert visas direkt |
| Navigera till /estimates | Lista visas | Lista visas (ingen ändring) |

