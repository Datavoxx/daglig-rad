

## Lagg till `get_dashboard_summary`-verktyg i Global Assistant

### Vad det gor

Ett nytt verktyg som ger Byggio AI en komplett oversikt over anvandardata -- antal projekt, offerter per status, obetalda fakturor, timmar denna vecka, och mer. Nar anvandaren fragar "hur gar det?" eller "hur manga offerter har jag?" kan AI:n svara direkt med ratt siffror.

### Teknisk andring

**Fil:** `supabase/functions/global-assistant/index.ts`

#### 1. Ny verktygsdefinition (i `tools`-arrayen)

```text
{
  name: "get_dashboard_summary",
  description: "Hamta en komplett oversikt: antal projekt per status, offerter per status, obetalda/forsenade fakturor, timmar denna vecka, antal kunder, antal anstallda. Anvand nar anvandaren fragar om sin oversikt, sammanfattning, eller 'hur manga X har jag?'",
  parameters: { type: "object", properties: {}, required: [] }
}
```

#### 2. Ny `executeTool`-case

Gor **6 parallella databasfragar** (med `Promise.all`):

| Fraga | Tabell | Vad den hamtar |
|-------|--------|----------------|
| Projekt per status | `projects` | Antal per status (planning/active/closing/completed) |
| Offerter per status | `project_estimates` | Antal per status (draft/sent/accepted/rejected) + totalt belopp |
| Kundfakturor | `customer_invoices` | Antal draft, sent (obetalda), paid, totalt obetalat belopp |
| Timmar denna vecka | `time_entries` | Summerade timmar for innevarande vecka (mandag-sondag) |
| Antal kunder | `customers` | Totalt antal |
| Antal anstallda | `employees` | Antal aktiva |

Returnerar ett sammanfattningsobjekt med alla siffror.

#### 3. Ny `formatToolResults`-case

Returnerar `type: "text"` med en markdown-formaterad sammanfattning, t.ex.:

```text
## Din oversikt

**Projekt:** 3 aktiva, 1 i planering, 2 avslutade
**Offerter:** 5 utkast, 2 skickade, 3 accepterade (totalt 450 000 kr)
**Fakturor:** 2 obetalda (85 000 kr), 1 forsenad
**Timmar denna vecka:** 32 h
**Kunder:** 12
**Anstallda:** 4 aktiva
```

### Inget nytt UI-kort behovs

Resultatet visas som vanlig markdown-text i chatten -- inget nytt React-kort eller typ behover skapas. AI:n far ratt data och kan sedan svara pa foljdfragor ("hur manga draft-offerter?") direkt fran det den redan vet.

### Filer som andras

| Fil | Andring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Lagg till verktygsdefinition, executeTool-case, formatToolResults-case |

