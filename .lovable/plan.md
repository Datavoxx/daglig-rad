

## Flerstegs uppdateringsflode for alla entiteter

### Oversikt
Bygga ett 3-stegs uppdateringsflode i chatten som fungerar for: **Arbetsorder**, **ATA**, **Offert**, **Planering** och **Dagbok**. Floden efterliknar hur "Uppdatera projekt" redan fungerar, men med extra steg for att valja och redigera enskilda poster.

### Flodet (4 kort i chatten)

```text
+---------------------------+
| KORT 1: Valj typ + projekt|
| [Uppdatera arbetsorder v] |
| [Valj projekt...       v] |
| -> Klicka "Nasta"         |
+---------------------------+
            |
            v
+---------------------------+
| KORT 2: Valj post         |
| Arbetsorder #1: Elarbete  |
| Arbetsorder #2: Malning   |
| Arbetsorder #3: VVS       |
| (klicka for att valja)    |
|                           |
| ALT: Rod ruta med X       |
| "Inga arbetsordrar"       |
| [Skapa ny]                |
+---------------------------+
            |
            v
+---------------------------+
| KORT 3: Redigera          |
| Titel: [Elarbete      ]   |
| Beskrivning: [...]        |
| Status: [pending       v]  |
| Datum: [2026-03-01     ]   |
| [Avbryt]  [Spara]         |
+---------------------------+
            |
            v
+---------------------------+
| KORT 4: Bekraftelse       |
| (gron checkmark)          |
| "Arbetsorder uppdaterad!" |
+---------------------------+
```

### Entiteter som stods

| Typ | Tabell | Vad visas i listan | Redigerbara falt |
|-----|--------|--------------------|------------------|
| Arbetsorder | project_work_orders | order_number, title, status | title, description, status, assigned_to, due_date |
| ATA | project_ata | ata_number, description, status | description, reason, estimated_cost, estimated_hours, status |
| Offert | project_estimates | offer_number, manual_project_name | Lankar till offertbyggaren istallet |
| Planering | project_plans | start_date, total_weeks | start_date, phases, notes |
| Dagbok | daily_reports | report_date, headcount, total_hours | Lankar till ReportView for redigering |

**Observera:** For Offert och Dagbok ar det mer praktiskt att lanka till den befintliga redigeringsvyn istallet for att bygga en inline-editor, eftersom de ar komplexa formularkort.

### Tekniska andringar

#### 1. Ny komponent: `src/components/global-assistant/UpdateEntityCard.tsx`
En flerstegskort-komponent som hanterar hela flodet internt:
- **Steg 1**: Dropdown for entitetstyp + dropdown for projekt. Knapp "Nasta".
- **Steg 2**: Hamtar poster fran databasen. Visar lista med klickbara kort. Vid tomt resultat: rod bakgrund med X-ikon, text "Inga [arbetsordrar] hittades for detta projekt", knapp "Skapa ny".
- **Steg 3**: Visar redigerbart formulat med alla falt forifylfda. Knappar "Avbryt" och "Spara".
- Sparar direkt till databasen via Supabase-klienten.
- Vid lyckad sparning, anropar `onSuccess` callback som visar bekraftelse-kort (steg 4).

Props:
```typescript
interface UpdateEntityCardProps {
  projects: Array<{ id: string; name: string; address?: string }>;
  onSuccess: (entityType: string, entityName: string) => void;
  onCancel: () => void;
  onCreateNew: (entityType: string, projectId: string) => void;
  onNavigate: (path: string) => void;
  disabled?: boolean;
}
```

Entitetstyper och deras databashamtning:
- **Arbetsorder**: `supabase.from('project_work_orders').select('*').eq('project_id', projectId)`
- **ATA**: `supabase.from('project_ata').select('*').eq('project_id', projectId)`
- **Offert**: `supabase.from('project_estimates').select('*').eq('user_id', userId)` (filtreras pa projekt via `project_id` eller `manual_address`)
- **Planering**: `supabase.from('project_plans').select('*').eq('project_id', projectId)`
- **Dagbok**: `supabase.from('daily_reports').select('*').eq('project_id', projectId)`

Sparlogik:
- **Arbetsorder**: `supabase.from('project_work_orders').update({...}).eq('id', id)`
- **ATA**: `supabase.from('project_ata').update({...}).eq('id', id)`
- **Planering**: `supabase.from('project_plans').update({...}).eq('id', id)`
- **Offert**: Navigerar till `/estimates?estimateId=xxx` istallet
- **Dagbok**: Navigerar till `/reports/xxx` istallet

#### 2. Ny meddelandetyp: `update_entity_form`
Lagg till i `src/types/global-assistant.ts`:
- Ny typ `"update_entity_form"` i Message.type union
- Ingen extra data behover skickas, projekten hamtas av komponenten sjalv

#### 3. Uppdatera `src/components/global-assistant/MessageList.tsx`
- Importera `UpdateEntityCard`
- Rendera den nar `message.type === "update_entity_form"`
- Skicka props for `onSuccess`, `onCancel`, `onCreateNew`, `onNavigate`

#### 4. Uppdatera `src/pages/GlobalAssistant.tsx`
- Byt ut befintliga `handleUpdateProjectAction` logiken
- Lagg till `handleUpdateEntitySuccess` som skapar ett bekraftelse-kort (gron checkmark via `result`-typ meddelande)
- Lagg till `handleUpdateEntityCreateNew` som trigger ratt "skapa"-flode for vald typ och projekt
- Nar AI:n returnerar `update_project_form`-typ, visa istallet `update_entity_form`-typ

#### 5. Modifiera `UpdateProjectFormCard.tsx`
Behalls som backup men ersatts i praktiken av `UpdateEntityCard` for huvudflodet. Alternativt tas bort helt och ersatts.

### Rodt felkort (inga poster hittades)
Designen for tomt resultat i Steg 2:
- Rod bakgrund: `bg-red-50 dark:bg-red-950/30`
- Rod kant: `border-red-200 dark:border-red-800`
- X-ikon i rod cirkel: `XCircle` fran lucide-react
- Text: "Inga [arbetsordrar] hittades for [projektnamn]"
- Knapp: "Skapa ny [arbetsorder]" som triggar skapandeflodet

### Gront bekraftelsekort (Steg 4)
Aterger befintligt monster fran ResultCard:
- Gron bakgrund med CheckCircle2-ikon
- Text: "[Arbetsorder] uppdaterad!"
- Nasta-steg-knappar: "Visa projekt", "Uppdatera en till"

### Filandringar

| Fil | Andring |
|-----|---------|
| `src/components/global-assistant/UpdateEntityCard.tsx` | Ny komponent - flerstegs uppdateringsflode |
| `src/types/global-assistant.ts` | Lagg till `"update_entity_form"` i Message.type |
| `src/components/global-assistant/MessageList.tsx` | Rendera UpdateEntityCard + nya props |
| `src/pages/GlobalAssistant.tsx` | Hantera success/cancel/createNew callbacks, byt fran update_project_form till update_entity_form |

