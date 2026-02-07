
# Plan: Flerstegsfler för offertskapande i chatten

## Sammanfattning

Du vill att offertflödet i chatten ska vara:
1. Skapa offert (kund, titel, adress) → Bekräftelse
2. **Direkt visa formulär för att lägga till rader** (inte "Skapa ny offert")
3. Efter att rader läggs till → Bekräftelse "Uppdaterat offert"

### Problem idag
- Efter offert skapas visas "Skapa ny offert" som nästa åtgärd
- Ingen möjlighet att lägga till rader direkt i chatten

### Önskat flöde
```text
[Skapa offert formulär]
         ↓
[Offert OFF-2026-0032 skapad!]
         ↓
[Lägg till offertposter formulär]   ← NYTT!
  • Projektbeskrivning (text)
  • Tidsplan (text)
  • Offertpåställ (rader)
  • Tillval (checkbox-lista)
         ↓
[Uppdaterat offert!]                ← NYTT!
```

---

## Teknisk lösning

### 1. Skapa ny komponent: EstimateItemsFormCard.tsx

```text
┌─────────────────────────────────────────┐
│ [📝] Lägg till offertposter             │
│     Offert: OFF-2026-0032               │
│                                         │
│ Projektbeskrivning                      │
│ ┌─────────────────────────────────────┐ │
│ │ Beskriv projektet...              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Tidsplan                                │
│ ┌─────────────────────────────────────┐ │
│ │ Uppskattad tid...                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ───────── Offertposter ─────────        │
│ ┌──────────────────────────────────┐    │
│ │ Arbete   │Beskrivning │Pris     │    │
│ │ + Lägg till rad                  │    │
│ └──────────────────────────────────┘    │
│                                         │
│ ───────── Tillval ─────────             │
│ [+] Lägg till tillval                   │
│                                         │
│         [Avbryt]  [✓ Spara offert]      │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface EstimateItemsFormCardProps {
  estimateId: string;
  offerNumber: string;
  onSubmit: (data: EstimateItemsData) => void;
  onCancel: () => void;
  onOpenEstimate: () => void;  // "Öppna offert" länk
  disabled?: boolean;
}

interface EstimateItemsData {
  estimateId: string;
  introduction: string;      // Projektbeskrivning
  timeline: string;          // Tidsplan
  items: Array<{
    article: string;
    description: string;
    quantity: number | null;
    unit: string;
    unit_price: number;
  }>;
  addons: Array<{
    name: string;
    price: number;
  }>;
}
```

### 2. Uppdatera typer i global-assistant.ts

Lägg till ny meddelandetyp:
```typescript
type: ... | "estimate_items_form"

// I MessageData:
estimateId?: string;
offerNumber?: string;
```

### 3. Ändra create_estimate-resultatet (backend)

**Före:** (rad 2770-2787 i index.ts)
```typescript
case "create_estimate": {
  return {
    type: "result",
    data: {
      resultMessage: `Offert ${estimate.offer_number} har skapats!`,
      nextActions: [
        { label: "Skapa ny offert", ...}  // ❌ Fel!
      ],
    },
  };
}
```

**Efter:**
```typescript
case "create_estimate": {
  return {
    type: "estimate_items_form",  // ← Nytt!
    content: `Offert ${estimate.offer_number} har skapats! Lägg till offertposter nedan.`,
    data: {
      estimateId: estimate.id,
      offerNumber: estimate.offer_number,
    },
    context: {
      selectedEstimateId: estimate.id,
    },
  };
}
```

### 4. Nytt verktyg: add_estimate_items

**Tool definition:**
```typescript
{
  name: "add_estimate_items",
  description: "Add items to an existing estimate",
  parameters: {
    type: "object",
    properties: {
      estimate_id: { type: "string" },
      introduction: { type: "string" },
      timeline: { type: "string" },
      items: { type: "array", items: { ... } },
      addons: { type: "array", items: { ... } },
    },
    required: ["estimate_id"],
  },
}
```

**Resultat:**
```typescript
case "add_estimate_items": {
  return {
    type: "result",
    content: "",
    data: {
      success: true,
      resultMessage: "Offert uppdaterad!",  // ← "Uppdaterat" inte "Skapat"
      link: {
        label: "Öppna offert",
        href: `/estimates?estimateId=${estimate_id}`,
      },
      nextActions: [
        { label: "Visa offert", ... },
        { label: "Skapa ny offert", ... },
      ],
    },
  };
}
```

### 5. Frontend-hantering

**MessageList.tsx:**
```typescript
// Rendera EstimateItemsFormCard för estimate_items_form
{message.type === "estimate_items_form" && (
  <EstimateItemsFormCard
    estimateId={message.data?.estimateId || ""}
    offerNumber={message.data?.offerNumber || ""}
    onSubmit={onEstimateItemsFormSubmit}
    onCancel={onEstimateItemsFormCancel}
    onOpenEstimate={() => navigate(`/estimates?estimateId=${message.data?.estimateId}`)}
  />
)}
```

**GlobalAssistant.tsx:**
```typescript
const handleEstimateItemsFormSubmit = async (data: EstimateItemsData) => {
  // Bygg meddelande och skicka till AI
  await sendMessage(
    `Lägg till poster på offert med ID ${data.estimateId}...`,
    { selectedEstimateId: data.estimateId }
  );
};
```

---

## Filer att skapa/ändra

| Fil | Ändring |
|-----|---------|
| `src/components/global-assistant/EstimateItemsFormCard.tsx` | **NY FIL** - formulär för offertposter |
| `src/types/global-assistant.ts` | Lägg till `estimate_items_form` typ |
| `src/components/global-assistant/MessageList.tsx` | Rendera `EstimateItemsFormCard` |
| `src/pages/GlobalAssistant.tsx` | Hantera submit/cancel |
| `supabase/functions/global-assistant/index.ts` | 1. Ändra `create_estimate` resultat |
| | 2. Lägg till `add_estimate_items` verktyg |
| | 3. Implementera verktyget i `executeTool` |
| | 4. Formatera resultat i `formatToolResults` |

---

## Förväntat resultat

| Steg | Före | Efter |
|------|------|-------|
| 1. Skapa offert | Formulär visas | Formulär visas ✓ |
| 2. Efter skapande | "Skapa ny offert"-knapp | **Poster-formulär visas** |
| 3. Lägga till rader | Ej möjligt i chatten | **Inline i chatten** |
| 4. Efter uppdatering | — | **"Offert uppdaterad!"** |

---

## Tekniska detaljer

### EstimateItemsFormCard struktur:

```typescript
// Förenklad version för MVP
interface EstimateItemsFormCardProps {
  estimateId: string;
  offerNumber: string;
  onSubmit: (data: {
    estimateId: string;
    introduction: string;
    items: Array<{
      article: string;
      description: string;
      quantity: number | null;
      unit: string;
      unit_price: number;
    }>;
  }) => void;
  onCancel: () => void;
  onOpenEstimate: () => void;
  disabled?: boolean;
}
```

**UI-sektioner:**
1. **Header**: Titel + offertnummer
2. **Projektbeskrivning**: Textarea för inledande text
3. **Offertposter**: Tabell med + Lägg till rad
   - Artikel (dropdown: Arbete, Material, etc.)
   - Beskrivning (text)
   - Antal (nummer, valfritt)
   - Enhet (text)
   - Pris (nummer)
4. **Tillval**: Enkel lista med namn + pris
5. **Actions**: Avbryt + Spara

### Backend: add_estimate_items

Verktyget ska:
1. Uppdatera `introduction_text` i `project_estimates`
2. Lägga till rader i `estimate_items`
3. Lägga till tillval i `estimate_addons`
4. Returnera bekräftelse
