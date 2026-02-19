

## Forbattra Byggio AI:s offertformular

Malet ar att `EstimateItemsFormCard` (AI-chatten) ska spegla den manuella offertbyggaren battre genom att lagga till fyra saknade funktioner: ROT/RUT-avdrag, paslag (markup), avslutningstext och artikelbibliotek.

### Oversikt av andringar

Alla fyra funktioner laggs till direkt i formularkortets UI och skickas med till backend vid sparning. Databasen stodjer redan alla dessa falt (`rot_enabled`, `rut_enabled`, `closing_text`, `markup_percent`, etc.) sa inga migreringar behovs.

---

### 1. Utoka EstimateItemsFormData-interfacet

**Fil:** `src/components/global-assistant/EstimateItemsFormCard.tsx`

Lagg till nya falt i `EstimateItemsFormData`:

```text
export interface EstimateItemsFormData {
  estimateId: string;
  introduction: string;
  timeline: string;
  items: Array<{ ... }>;  // befintlig
  addons: Array<{ ... }>; // befintlig
  // NYA:
  closingText: string;
  rotEnabled: boolean;
  rutEnabled: boolean;
  markupPercent: number;
}
```

### 2. Lagg till ROT/RUT-toggle i formularet

Lagg till ett kompakt avsnitt efter tillval-sektionen med tva Switch-komponenter:

- **ROT-avdrag (30%)** -- en `Switch` som togglar `rotEnabled`
- **RUT-avdrag (50%)** -- en `Switch` som togglar `rutEnabled`

Enkel design med `Switch` + label, ingen full `TaxDeductionPanel` (den ar for detaljerad for ett chatformular). Visas i en kompakt card-sektion.

### 3. Lagg till paslag (markup) i formularet

Ett enkelt inmatningsfalt for global markup-procent:

- Label: "Paslag (%)"
- Input type number, default 0
- Visas som en rad under ROT/RUT-sektionen

Det per-rad-paslaget fran MarkupPanel ar for komplext for chatformulaet -- anvandaren kan finslipa det i den manuella byggaren. Har racker en global procent.

### 4. Lagg till avslutningstext

Ett `Textarea`-falt med en enkel dropdown for att valja fran standardmallar (samma tre som i `ClosingSection`):

- Standard villkor
- Kort version  
- ROT-villkor

Implementeras som en `Select`-komponent ovanfor textarea for att snabbt fylla i text.

### 5. Lagg till artikelbibliotek (snabbval)

Lagg till en "Valj fran artikelbiblioteket"-knapp som oppnar en enkel lista over anvandardens sparade artiklar fran `articles`-tabellen. Nar en artikel valjs laggs den till som en ny offertrad med forifyllt namn, kategori, enhet och pris.

Implementeras som en `Collapsible`-sektion (liknande den manuella byggaren men enklare) med:
- Sokfalt
- Klickbara artikelrader som gor "lagg till"

### 6. Uppdatera totalberkning

`calculateTotal` uppdateras for att inkludera markup i summan:

```text
const subtotal = itemsTotal + addonsTotal;
const markup = subtotal * (markupPercent / 100);
return subtotal + markup;
```

Visa aven separat rad for paslag i totalsektionen om > 0.

### 7. Uppdatera handleSubmit och handleVoiceData

- `handleSubmit`: Inkludera `closingText`, `rotEnabled`, `rutEnabled`, `markupPercent` i onSubmit-data
- `handleVoiceData`: Hantera aven dessa falt fran rostinmatning

### 8. Uppdatera backend (global-assistant)

**Fil:** `supabase/functions/global-assistant/index.ts`

I `add_estimate_items`-caset, utoka `estimateUpdateData` for att aven spara:

```text
if (closing_text) estimateUpdateData.closing_text = closing_text;
if (rot_enabled !== undefined) estimateUpdateData.rot_enabled = rot_enabled;
if (rut_enabled !== undefined) estimateUpdateData.rut_enabled = rut_enabled;
if (markup_percent !== undefined) estimateUpdateData.markup_percent = markup_percent;
```

Utoka aven `add_estimate_items`-verktygsdefinitionen i `tools`-arrayen med dessa nya parametrar.

### 9. Uppdatera GlobalAssistant.tsx

**Fil:** `src/pages/GlobalAssistant.tsx`

Utoka `handleEstimateItemsFormSubmit` for att inkludera de nya falten i meddelandet och `pendingData`.

---

### Sammanfattning av filandringar

| Fil | Andring |
|-----|---------|
| `src/components/global-assistant/EstimateItemsFormCard.tsx` | Lagg till ROT/RUT-togglar, markup-falt, avslutningstext med mallval, artikelbibliotek-knapp |
| `src/pages/GlobalAssistant.tsx` | Utoka handleEstimateItemsFormSubmit med nya falt |
| `supabase/functions/global-assistant/index.ts` | Utoka add_estimate_items med closing_text, rot_enabled, rut_enabled, markup_percent |

### Designprincip

Formularet i chatten ska vara ett "80%-flode" -- tillrackligt for att skapa en komplett offert, men utan den fulla komplexiteten i per-rad-paslag, ROT-per-rad-markering, och full PDF-forhandsvisning. En "Oppna offert"-knapp finns redan for att navigera till den manuella byggaren for finjusteringar.
