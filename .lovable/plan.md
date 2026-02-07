

# Plan: Utöka Global Assistant med fler interaktiva formulärkort

## Sammanfattning

Skapa samma upplevelse som TimeFormCard för flera vanliga åtgärder, så att användaren kan slutföra hela uppgiften i ett enda kort istället för att skicka fram och tillbaka.

## Nya Quick Suggestions-knappar

Lägg till i `QuickSuggestions.tsx`:
- **"Skapa projekt"** - med FolderKanban-ikon
- **"Ny kund"** - med UserPlus-ikon

## Nya interaktiva formulärkort

### 1. EstimateFormCard (Skapa offert)

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| Kund | Dropdown | Lista befintliga kunder |
| Projektnamn | Textfält | Titel på offerten |
| Adress | Textfält | Projektadress (valfritt) |

**Knappar:** Avbryt, Skapa offert

### 2. DailyReportFormCard (Ny dagrapport)

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| Projekt | Dropdown | Aktiva projekt |
| Arbete utfört | Textarea | Vad som gjordes |
| Personal | Nummer | Antal arbetare |
| Timmar | Nummer | Totalt arbetade timmar |

**Knappar:** Avbryt, Spara dagrapport

### 3. CustomerSearchCard (Sök kund)

Visar en scrollbar lista med befintliga kunder + sökfält överst.

| Element | Beskrivning |
|---------|-------------|
| Sökfält | Filtrera kundlistan i realtid |
| Kundlista | Scrollbar med namn, stad, email |
| Klickbar rad | Väljer kunden och frågar "Vad vill du göra med denna kund?" |

**Knappar:** Skapa ny kund (om ingen hittas)

### 4. CustomerFormCard (Ny kund)

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| Namn | Textfält | Kundens namn (obligatoriskt) |
| Email | Textfält | Email (valfritt) |
| Telefon | Textfält | Telefonnummer (valfritt) |
| Adress | Textfält | Adress (valfritt) |
| Stad | Textfält | Stad (valfritt) |

**Knappar:** Avbryt, Skapa kund

### 5. ProjectFormCard (Skapa projekt)

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| Projektnamn | Textfält | Namn på projektet (obligatoriskt) |
| Kund | Dropdown | Välj befintlig kund (valfritt) |
| Adress | Textfält | Projektadress (valfritt) |

**Knappar:** Avbryt, Skapa projekt

## Nya meddelandetyper

Lägg till i `src/types/global-assistant.ts`:

```typescript
type: "text" | "proposal" | "verification" | "next_actions" | "result" 
    | "loading" | "list" | "time_form" 
    | "estimate_form" | "daily_report_form" | "customer_search" 
    | "customer_form" | "project_form";

interface MessageData {
  // Befintliga fält...
  
  // For estimate_form
  customers?: Array<{ id: string; name: string }>;
  
  // For daily_report_form
  projects?: Array<{ id: string; name: string }>;
  
  // For customer_search
  allCustomers?: Array<{ 
    id: string; 
    name: string; 
    city?: string; 
    email?: string;
  }>;
}
```

## Nya verktyg i Edge Function

### get_customers_for_estimate
Hämtar alla kunder för offertformulär.

### get_projects_for_daily_report
Hämtar aktiva projekt för dagrapportformulär.

### get_all_customers
Hämtar alla kunder för sökning/visning.

### get_customer_form
Returnerar tomt formulär för att skapa ny kund.

### get_project_form
Returnerar kunder för projektformulär.

## Uppdaterad systemprompt

```
INTERAKTIVA FORMULÄR:
- "registrera tid" utan projekt/timmar → get_active_projects_for_time
- "skapa offert" utan specifik kund → get_customers_for_estimate  
- "ny dagrapport" / "skapa dagrapport" utan projekt → get_projects_for_daily_report
- "sök kund" → get_all_customers (visar sökbart kort)
- "ny kund" / "skapa kund" → get_customer_form
- "skapa projekt" utan specifik info → get_project_form
```

## Filer att skapa

| Fil | Beskrivning |
|-----|-------------|
| `src/components/global-assistant/EstimateFormCard.tsx` | Offertformulär |
| `src/components/global-assistant/DailyReportFormCard.tsx` | Dagrapportformulär |
| `src/components/global-assistant/CustomerSearchCard.tsx` | Sökkort för kunder |
| `src/components/global-assistant/CustomerFormCard.tsx` | Formulär för ny kund |
| `src/components/global-assistant/ProjectFormCard.tsx` | Formulär för nytt projekt |

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/types/global-assistant.ts` | Nya meddelandetyper och data-fält |
| `src/components/global-assistant/QuickSuggestions.tsx` | Lägg till "Skapa projekt" och "Ny kund" |
| `src/components/global-assistant/MessageList.tsx` | Rendera alla nya kort |
| `src/pages/GlobalAssistant.tsx` | Handlers för alla nya formulär |
| `supabase/functions/global-assistant/index.ts` | Nya verktyg + formatering |

## Visuell design

Alla kort följer samma design som TimeFormCard:
- Rundade hörn (`rounded-xl`)
- Subtil kant (`border-border/60`)
- Ikon i header med bakgrund
- Labels i `text-xs text-muted-foreground`
- Avbryt-knapp till vänster, primär action till höger

## Resultat

| Åtgärd | Före | Efter |
|--------|------|-------|
| Skapa offert | 3-4 meddelanden | 1 formulärkort |
| Ny dagrapport | 4-5 meddelanden | 1 formulärkort |
| Sök kund | Frågar efter namn | Scrollbar lista + sökning |
| Ny kund | Frågar fält för fält | 1 formulärkort |
| Skapa projekt | 2-3 meddelanden | 1 formulärkort |

