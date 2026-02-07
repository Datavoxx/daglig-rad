
## Mål

1. **Lägga till röstinspelningssektion i varje formulärkort i Global Assistant** - En tydlig ruta/sektion med Byggio AI-loggan som låter användaren spela in ett röstmeddelande
2. **Samma realtidstranskribering** - Använder samma `useVoiceRecorder` hook som redan finns
3. **Kontextberoende AI-bearbetning** - Beroende på formulärtyp (dagrapport, offert, arbetsorder, etc.) används rätt Edge Function och prompt
4. **Automatisk ifyllning** - Efter transkribering processas texten av AI och fyller i formuläret automatiskt
5. **Ta bort mic-knappen från ChatInput** - Den nuvarande röstknappen i chattfältet tas bort

---

## Nuvarande arkitektur

| Komponent | Funktion |
|-----------|----------|
| `useVoiceRecorder` | Hook för röstinspelning med realtids-transkribering (Web Speech API / MediaRecorder) |
| `VoicePromptButton` | Återanvändbar knapp med inspelning → bekräftelse → kör-flöde |
| `generate-report` Edge Function | AI-bearbetning av dagrapporter |
| Formulärkort | `DailyReportFormCard`, `EstimateFormCard`, `WorkOrderFormCard`, etc. |

---

## Ändringar

### 1. Skapa en ny komponent: `VoiceFormSection`

**Fil:** `src/components/global-assistant/VoiceFormSection.tsx`

En återanvändbar sektion som kan läggas till i varje formulär:
- Visar Byggio AI-loggan
- "Spela in röstmeddelande" knapp
- Realtidstranskribering visas
- Bekräftelsevy där användaren kan redigera transkriptet
- Kör AI-bearbetning och returnerar strukturerad data

```text
+--------------------------------------------------+
| [Byggio AI Logo]                                 |
|                                                  |
|  "Låt Byggio AI hjälpa dig"                     |
|  "Spela in ett röstmeddelande"                  |
|                                                  |
|  [ 🎤 Starta inspelning ]                        |
+--------------------------------------------------+
```

Props:
```typescript
interface VoiceFormSectionProps {
  formType: "daily-report" | "estimate" | "work-order" | "customer" | "time";
  onDataExtracted: (data: Record<string, any>) => void;
  projectId?: string;
  disabled?: boolean;
}
```

### 2. Uppdatera formulärkorten

Lägg till `VoiceFormSection` i varje formulärkort:

| Formulär | AI-funktion | Befintlig Edge Function |
|----------|-------------|-------------------------|
| `DailyReportFormCard` | Dagrapport → strukturerad data | `generate-report` |
| `WorkOrderFormCard` | Arbetsorder → titel, beskrivning | Ny funktion behövs |
| `EstimateFormCard` | Offert → titel, adress | Ny funktion behövs |
| `TimeFormCard` | Tid → timmar, beskrivning | Ny funktion behövs |
| `CustomerFormCard` | Kund → namn, kontaktinfo | Ny funktion behövs |

### 3. Skapa generell Edge Function för formulärbearbetning

**Fil:** `supabase/functions/extract-form-data/index.ts`

En generell funktion som tar emot:
- `transcript`: Rösttranskriptet
- `formType`: Typ av formulär
- `context`: Extra kontext (projekt-ID, etc.)

Returnerar strukturerad data baserat på formulärtyp.

### 4. Ta bort mic-knappen från ChatInput

**Fil:** `src/components/global-assistant/ChatInput.tsx`

- Ta bort `useVoiceRecorder` import och användning
- Ta bort mic-knappen från UI
- Behåll plus-knappen och send-knappen

---

## Filer att ändra/skapa

| # | Fil | Åtgärd |
|---|-----|--------|
| 1 | `src/components/global-assistant/VoiceFormSection.tsx` | **Skapa** ny komponent |
| 2 | `supabase/functions/extract-form-data/index.ts` | **Skapa** ny Edge Function |
| 3 | `src/components/global-assistant/DailyReportFormCard.tsx` | **Uppdatera** - lägg till VoiceFormSection |
| 4 | `src/components/global-assistant/WorkOrderFormCard.tsx` | **Uppdatera** - lägg till VoiceFormSection |
| 5 | `src/components/global-assistant/EstimateFormCard.tsx` | **Uppdatera** - lägg till VoiceFormSection |
| 6 | `src/components/global-assistant/TimeFormCard.tsx` | **Uppdatera** - lägg till VoiceFormSection |
| 7 | `src/components/global-assistant/CustomerFormCard.tsx` | **Uppdatera** - lägg till VoiceFormSection |
| 8 | `src/components/global-assistant/ChatInput.tsx` | **Uppdatera** - ta bort mic-knappen |

---

## VoiceFormSection - Designdetaljer

### Idle-läge
```text
┌─────────────────────────────────────────────────┐
│  ┌──────┐                                       │
│  │ 🧠🪜 │  Låt Byggio AI hjälpa dig            │
│  │      │  Spela in ett röstmeddelande         │
│  └──────┘                                       │
│                                                 │
│           [ 🎤 Starta inspelning ]              │
│                                                 │
│  💡 Spara 70% av din tid genom att prata       │
└─────────────────────────────────────────────────┘
```

### Inspelningsläge
```text
┌─────────────────────────────────────────────────┐
│  🔴 Spelar in...                         [ X ] │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ "Idag jobbade vi fem snickare..."      │   │
│  │ (realtidstranskribering)               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│           [ ⏹ Stoppa inspelning ]              │
└─────────────────────────────────────────────────┘
```

### Bekräftelseläge
```text
┌─────────────────────────────────────────────────┐
│  Bekräfta röstmeddelande                 [ X ] │
│                                                 │
│  Redigera vid behov:                           │
│  ┌─────────────────────────────────────────┐   │
│  │ Idag jobbade vi fem snickare, åtta     │   │
│  │ timmar per person. Vi installerade     │   │
│  │ fönster på andra våningen...           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [ Avbryt ]           [ ✓ Fyll i formulär ]    │
└─────────────────────────────────────────────────┘
```

---

## Edge Function: extract-form-data

### Request
```json
{
  "transcript": "Idag jobbade vi fem snickare...",
  "formType": "daily-report",
  "context": {
    "projectId": "uuid-123"
  }
}
```

### Response (dagrapport)
```json
{
  "headcount": 5,
  "hoursPerPerson": 8,
  "roles": ["snickare"],
  "workItems": ["installerade fönster"],
  "materialsDelivered": "",
  "materialsMissing": "",
  "notes": ""
}
```

### Response (arbetsorder)
```json
{
  "title": "Byt fönster på andra våningen",
  "description": "Detaljerad beskrivning..."
}
```

---

## DailyReportFormCard - Integration

Skillnad från nuvarande `InlineDiaryCreator`:
- `InlineDiaryCreator` har ett separat flöde (transkript → generera rapport → granska)
- `DailyReportFormCard` ska ha röstinspelning som **fyller i formulärfälten** så att användaren kan justera innan submit

```tsx
// DailyReportFormCard.tsx

import { VoiceFormSection } from "./VoiceFormSection";

// Inuti komponenten:
const handleVoiceData = (data: any) => {
  if (data.headcount) setHeadcount(String(data.headcount));
  if (data.hoursPerPerson) setHoursPerPerson(String(data.hoursPerPerson));
  if (data.roles) setRoles(data.roles.join(", "));
  if (data.workItems) setWorkItems(data.workItems);
  // ... etc
};

// I JSX, lägg till sektionen högst upp efter header:
<VoiceFormSection
  formType="daily-report"
  projectId={projectId}
  onDataExtracted={handleVoiceData}
  disabled={disabled}
/>
```

---

## Resultat

1. Varje formulär i Global Assistant får en tydlig röstinspelningssektion
2. Byggio AI-loggan visas med uppmaning att spela in
3. Realtidstranskribering visas medan man pratar
4. Efter inspelning kan man redigera transkriptet
5. AI bearbetar transkriptet och fyller i formuläret automatiskt
6. Mic-knappen i chattrutan tas bort (den var "meningslös" enligt dig)
7. Konsekvent upplevelse genom alla formulär
