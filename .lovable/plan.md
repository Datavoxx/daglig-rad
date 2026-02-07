

# Plan: Utöka Byggio AI till en "Know-It-All" Agent

## Bakgrund

Din nuvarande Byggio AI har begränsade funktioner. Den kan hantera kunder, projekt, offerter, tid och dagrapporter, men saknar stöd för flera viktiga projektfunktioner.

## Vad som saknas idag

| Funktion | Status |
|----------|--------|
| Arbetsordrar | Saknas helt |
| ÄTA-arbeten | Saknas helt |
| Planering (Gantt) | Kan bara läsa, inte skapa/ändra |
| Ladda upp filer/bilder | Saknas helt |
| QR-koder för närvaro | Saknas helt |
| Ekonomiöversikt | Begränsad info |
| Mer informativ AI | Ger korta svar utan djup |

## Vad jag kommer implementera

### 1. Arbetsordrar (Work Orders)

Nya verktyg:
- `create_work_order` - Skapa arbetsorder för ett projekt
- `search_work_orders` - Sök arbetsordrar
- `get_work_order` - Visa detaljer om en arbetsorder
- `update_work_order` - Uppdatera status/info

Exempel på användning:
- "Skapa arbetsorder för projektet Solvik"
- "Visa arbetsordrar för projekt X"
- "Markera arbetsorder 123 som klar"

### 2. ÄTA-arbeten (Ändrings- och Tilläggsarbeten)

Nya verktyg:
- `create_ata` - Skapa nytt ÄTA-ärende
- `search_ata` - Sök ÄTA-ärenden
- `get_ata` - Visa detaljer om ett ÄTA
- `update_ata` - Uppdatera status/kostnad

Exempel på användning:
- "Lägg till ÄTA för extra elinstallation"
- "Visa alla ÄTA för projekt X"
- "Ändra status på ÄTA till godkänd"

### 3. Planering (Projektplanering/Gantt)

Nya verktyg:
- `create_plan` - Skapa ny projektplanering
- `update_plan` - Uppdatera faser och veckor
- `get_plan` - Visa fullständig planering (finns redan, utökas)

Exempel på användning:
- "Skapa planering för projektet med 4 faser"
- "Visa planeringen för projekt X"
- "Lägg till en ny fas i planeringen"

### 4. Filuppladdning

Nya funktioner i frontend + backend:
- Bilduppladdning i chatten (ny UI-komponent)
- `upload_file` - Ladda upp fil till projekt
- `list_project_files` - Lista filer för ett projekt

Exempel på användning:
- Ladda upp bild direkt i chatten → "Lägg till denna bild på projekt X"
- "Visa bilder för projektet"

### 5. QR-koder för Närvaroregistrering

Nya verktyg:
- `generate_attendance_qr` - Generera QR-kod för ett projekt
- `get_attendance_qr` - Hämta befintlig QR-kod

Exempel på användning:
- "Skapa QR-kod för närvaro på projekt Solvik"
- "Visa QR-koden för projektet"

### 6. Utökad Ekonomiöversikt

Utökade verktyg:
- `get_project_economy` - Fullständig ekonomisk översikt
  - Budget vs faktisk kostnad
  - Registrerade timmar och kostnader
  - ÄTA-summering
  - Fakturerat belopp

Exempel på användning:
- "Hur ligger vi till ekonomiskt på projekt X?"
- "Visa ekonomisk sammanfattning"

### 7. Mer Informativ AI

Uppdatera systemprompt för att:
- Ge längre, mer detaljerade svar när användaren frågar om information
- Förklara begrepp och ge kontext
- Proaktivt föreslå nästa steg
- Svara på frågor om hur saker fungerar

## Teknisk implementation

### Nya verktyg i Edge Function (ca 15 nya tools)

```text
┌─────────────────────────────────────────────────────────┐
│  ARBETSORDRAR                                           │
│  - create_work_order                                    │
│  - search_work_orders                                   │
│  - get_work_order                                       │
│  - update_work_order                                    │
│  - delete_work_order                                    │
├─────────────────────────────────────────────────────────┤
│  ÄTA-ARBETEN                                            │
│  - create_ata                                           │
│  - search_ata                                           │
│  - get_ata                                              │
│  - update_ata                                           │
├─────────────────────────────────────────────────────────┤
│  PLANERING                                              │
│  - create_plan                                          │
│  - update_plan                                          │
│  - add_phase                                            │
├─────────────────────────────────────────────────────────┤
│  FILER                                                  │
│  - list_project_files                                   │
│  - delete_project_file                                  │
├─────────────────────────────────────────────────────────┤
│  NÄRVARO                                                │
│  - generate_attendance_qr                               │
│  - get_attendance_qr                                    │
├─────────────────────────────────────────────────────────┤
│  EKONOMI                                                │
│  - get_project_economy                                  │
└─────────────────────────────────────────────────────────┘
```

### Nya UI-komponenter i Frontend

1. **Bilduppladdning i ChatInput** - Möjlighet att bifoga bilder
2. **FileUploadCard** - Visa uppladdade filer i chatten
3. **QRCodeCard** - Visa genererade QR-koder
4. **EconomyCard** - Visa ekonomisk sammanfattning

### Uppdateringar i systemprompt

- Utöka listan över funktioner AI:n kan utföra
- Instruktioner för att ge mer detaljerade svar vid informationsfrågor
- Bättre hantering av projektrelaterade frågor

## Filer att ändra/skapa

| Fil | Åtgärd |
|-----|--------|
| `supabase/functions/global-assistant/index.ts` | Lägg till 15+ nya verktyg |
| `src/pages/GlobalAssistant.tsx` | Hantera nya meddelandetyper |
| `src/types/global-assistant.ts` | Lägg till nya typer |
| `src/components/global-assistant/ChatInput.tsx` | Bilduppladdning |
| `src/components/global-assistant/MessageList.tsx` | Nya korttyper |
| `src/components/global-assistant/FileUploadCard.tsx` | **Ny** |
| `src/components/global-assistant/QRCodeCard.tsx` | **Ny** |
| `src/components/global-assistant/EconomyCard.tsx` | **Ny** |

## Resultat efter implementation

Användaren kommer kunna:
- "Skapa arbetsorder för projektet Solvik"
- "Lägg till ÄTA för extra målning, 5000 kr"
- "Visa ekonomisk översikt för projektet"
- "Skapa QR-kod för närvaro"
- "Visa alla filer för projektet"
- "Skapa planering med 4 faser"
- Ladda upp bilder direkt i chatten
- Få mer detaljerade och informativa svar

