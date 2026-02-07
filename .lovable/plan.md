

## Mål

Lägga till röstinspelning i "Lägg till offertposter"-kortet (`EstimateItemsFormCard`) så att användaren kan prata in projektbeskrivning, tidsplan och offertposter istället för att fylla i allt manuellt.

---

## Analys

| Komponent | Status | Åtgärd |
|-----------|--------|--------|
| `EstimateItemsFormCard.tsx` | Ingen röstfunktion | Lägg till `VoiceFormSection` |
| `VoiceFormSection.tsx` | Stöder ej `estimate-items` | Lägg till ny formType |
| `extract-form-data/index.ts` | Stöder ej `estimate-items` | Lägg till nytt prompt |

---

## Lösning

### 1. Uppdatera `VoiceFormSection.tsx`

Lägg till ny formType:

```typescript
export type VoiceFormType = 
  | "daily-report" 
  | "estimate" 
  | "work-order" 
  | "customer" 
  | "time"
  | "estimate-items";  // NY
```

Uppdatera `getFormTypeLabel()`:

```typescript
case "estimate-items":
  return "offertposter";
```

### 2. Uppdatera edge-funktionen `extract-form-data`

Lägg till ny case i `getSystemPrompt()`:

```typescript
case "estimate-items":
  return `${basePrompt}

Extrahera offertposter från transkriptet. Returnera JSON med följande struktur:
{
  "introduction": string,    // Projektbeskrivning
  "timeline": string,        // Tidsplan (en punkt per rad)
  "items": [
    {
      "article": string,     // Kategori: Arbete, Bygg, Material, etc.
      "description": string, // Beskrivning av arbetet
      "quantity": number | null,    // Antal
      "unit": string,        // Enhet: tim, st, m, m², etc.
      "unit_price": number   // Pris per enhet
    }
  ],
  "addons": [
    {
      "name": string,        // Namn på tillval
      "price": number        // Pris för tillval
    }
  ]
}

Vanliga kategorier (article): Arbete, Bygg, Deponi, Framkörning, Förbrukning, Förvaltning, Markarbete, Maskin, Material, Målning, Snöröjning, Städ, Trädgårdsskötsel
Vanliga enheter (unit): tim, st, m, m², m³, kg, kpl`;
```

### 3. Integrera röstinspelning i `EstimateItemsFormCard.tsx`

Lägg till import och VoiceFormSection:

```tsx
import { VoiceFormSection } from "./VoiceFormSection";
```

Lägg till handler för extraherad data:

```typescript
const handleVoiceData = (data: Record<string, unknown>) => {
  // Fyll i projektbeskrivning
  if (data.introduction && typeof data.introduction === "string") {
    setIntroduction(data.introduction);
  }
  
  // Fyll i tidsplan
  if (data.timeline && typeof data.timeline === "string") {
    setTimeline(data.timeline);
  }
  
  // Fyll i offertposter
  if (Array.isArray(data.items) && data.items.length > 0) {
    const newItems = data.items.map((item: any) => ({
      id: crypto.randomUUID(),
      article: item.article || "Arbete",
      description: item.description || "",
      quantity: item.quantity || null,
      unit: item.unit || "tim",
      unit_price: item.unit_price || 0,
    }));
    setItems(newItems);
  }
  
  // Fyll i tillval
  if (Array.isArray(data.addons) && data.addons.length > 0) {
    const newAddons = data.addons.map((addon: any) => ({
      id: crypto.randomUUID(),
      name: addon.name || "",
      price: addon.price || 0,
    }));
    setAddons(newAddons);
  }
};
```

Placera `VoiceFormSection` högst upp i CardContent:

```tsx
<CardContent className="space-y-4">
  {/* Voice input section */}
  <VoiceFormSection
    formType="estimate-items"
    onDataExtracted={handleVoiceData}
    disabled={disabled}
  />
  
  {/* Befintliga fält... */}
</CardContent>
```

---

## Filer att ändra

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/components/global-assistant/VoiceFormSection.tsx` | Lägg till `estimate-items` formType och label |
| 2 | `supabase/functions/extract-form-data/index.ts` | Lägg till prompt för `estimate-items` |
| 3 | `src/components/global-assistant/EstimateItemsFormCard.tsx` | Integrera `VoiceFormSection` med data-handler |

---

## Användarflöde efter implementation

1. Användare skapar en offert → får meddelande "Offert skapad! Lägg till offertposter nedan"
2. "Lägg till offertposter"-kortet visas med röstinspelningssektion högst upp
3. Användaren spelar in: *"Projektbeskrivning är renovering av kök. Tidsplan är vecka 12 till vecka 14. Vi behöver 40 timmar arbete för 650 kr per timme, och material för badrum cirka 15 000 kronor."*
4. AI:n extraherar och fyller i:
   - Projektbeskrivning: "Renovering av kök"
   - Tidsplan: "Vecka 12-14"
   - Offertposter: Arbete 40 tim × 650 kr, Material 1 st × 15000 kr
5. Användaren granskar och trycker "Spara offert"

---

## Resultat

- Röstinspelning tillgänglig i "Lägg till offertposter"-kortet
- AI:n förstår byggtermer och mappar till rätt kategorier/enheter
- Konsekvent upplevelse med övriga formulär i appen
- Sparar tid för användaren

