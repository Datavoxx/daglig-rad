
# Plan: Utöka Global Assistant med alla saknade funktioner

## Sammanfattning

Utöka Global Assistant med stöd för alla appens moduler: tidsrapportering, dagrapporter, fakturor, egenkontroller, planering, närvaro, samt redigering/radering och röstinput.

## Omfattning

| Kategori | Nya funktioner |
|----------|---------------|
| **Tidsrapportering** | Registrera tid, visa tidrapporter, summering |
| **Dagrapporter** | Skapa dagrapport, söka/visa rapporter |
| **Fakturor** | Söka kund-/leverantörsfakturor, skapa kundfaktura |
| **Egenkontroller** | Skapa inspektion, visa inspektioner |
| **Planering** | Visa projektplanering |
| **Närvaro** | Checka in/ut, visa aktiva |
| **Redigering** | Uppdatera kund, projekt, offert |
| **Radering** | Ta bort kund, projekt, offert |
| **Röstinput** | Mikrofon-knappen aktiveras |
| **Next Actions** | Aktivera förslag efter varje åtgärd |

## Teknisk implementation

### 1. Utöka Tool Registry (Edge Function)

Lägger till 20+ nya verktyg i `global-assistant/index.ts`:

```typescript
// NYA VERKTYG ATT LÄGGA TILL:

// === TIDSRAPPORTERING ===
{
  name: "register_time",
  description: "Registrera tid för ett projekt",
  parameters: {
    project_id: "string",
    hours: "number",
    date: "string (YYYY-MM-DD)",
    description: "string",
    billing_type_id: "string (optional)",
    salary_type_id: "string (optional)"
  }
}

{
  name: "get_time_summary",
  description: "Visa tidssammanfattning för en period",
  parameters: {
    start_date: "string",
    end_date: "string",
    project_id: "string (optional)"
  }
}

// === DAGRAPPORTER ===
{
  name: "search_daily_reports",
  description: "Sök dagrapporter",
  parameters: {
    project_id: "string (optional)",
    date_from: "string (optional)",
    date_to: "string (optional)"
  }
}

{
  name: "create_daily_report",
  description: "Skapa en ny dagrapport",
  parameters: {
    project_id: "string",
    work_items: "string[]",
    headcount: "number",
    total_hours: "number",
    notes: "string (optional)"
  }
}

// === FAKTUROR ===
{
  name: "search_customer_invoices",
  description: "Sök kundfakturor",
  parameters: {
    query: "string",
    status: "string (optional)"
  }
}

{
  name: "search_vendor_invoices",
  description: "Sök leverantörsfakturor",
  parameters: {
    query: "string",
    status: "string (optional)"
  }
}

{
  name: "create_customer_invoice",
  description: "Skapa kundfaktura för ett projekt",
  parameters: {
    project_id: "string",
    customer_id: "string"
  }
}

// === EGENKONTROLLER ===
{
  name: "search_inspections",
  description: "Sök egenkontroller",
  parameters: {
    project_id: "string (optional)",
    status: "string (optional)"
  }
}

{
  name: "create_inspection",
  description: "Skapa ny egenkontroll",
  parameters: {
    project_id: "string",
    template_id: "string",
    inspector_name: "string (optional)"
  }
}

// === PLANERING ===
{
  name: "get_project_plan",
  description: "Visa projektplanering/Gantt",
  parameters: {
    project_id: "string"
  }
}

// === NÄRVARO ===
{
  name: "check_in",
  description: "Checka in på ett projekt",
  parameters: {
    project_id: "string"
  }
}

{
  name: "check_out",
  description: "Checka ut från ett projekt",
  parameters: {
    project_id: "string"
  }
}

{
  name: "get_active_attendance",
  description: "Visa vem som är incheckad på ett projekt",
  parameters: {
    project_id: "string"
  }
}

// === REDIGERING ===
{
  name: "update_customer",
  description: "Uppdatera kunduppgifter",
  parameters: {
    customer_id: "string",
    name: "string (optional)",
    email: "string (optional)",
    phone: "string (optional)",
    address: "string (optional)",
    city: "string (optional)"
  }
}

{
  name: "update_project",
  description: "Uppdatera projektuppgifter",
  parameters: {
    project_id: "string",
    name: "string (optional)",
    status: "string (optional)",
    address: "string (optional)"
  }
}

{
  name: "update_estimate",
  description: "Uppdatera offertuppgifter",
  parameters: {
    estimate_id: "string",
    manual_project_name: "string (optional)",
    status: "string (optional)"
  }
}

// === RADERING ===
{
  name: "delete_customer",
  description: "Ta bort en kund",
  parameters: {
    customer_id: "string"
  }
}

{
  name: "delete_project",
  description: "Ta bort ett projekt",
  parameters: {
    project_id: "string"
  }
}

{
  name: "delete_estimate",
  description: "Ta bort en offert",
  parameters: {
    estimate_id: "string"
  }
}
```

### 2. Implementera executeTool för nya verktyg

Lägger till hantering för varje nytt verktyg i `executeTool`-funktionen:

```typescript
case "register_time": {
  const { project_id, hours, date, description, billing_type_id, salary_type_id } = args;
  
  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: userId,
      employer_id: userId,
      project_id,
      hours,
      date: date || new Date().toISOString().split('T')[0],
      description,
      billing_type_id,
      salary_type_id,
      status: "pending"
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

case "create_daily_report": {
  const { project_id, work_items, headcount, total_hours, notes } = args;
  
  const { data, error } = await supabase
    .from("daily_reports")
    .insert({
      user_id: userId,
      project_id,
      work_items,
      headcount,
      total_hours,
      notes,
      report_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// ... etc för alla nya verktyg
```

### 3. Utöka formatToolResults

Lägger till formatering för nya resultat:

```typescript
case "register_time": {
  const entry = results as { id: string; hours: number };
  return {
    type: "result",
    content: "",
    data: {
      success: true,
      resultMessage: `${entry.hours} timmar registrerade!`,
      link: {
        label: "Öppna tidsrapportering",
        href: "/time-reporting"
      },
      nextActions: [
        { label: "Registrera mer tid", icon: "plus", prompt: "Registrera mer tid" },
        { label: "Visa veckans tid", icon: "eye", prompt: "Visa veckans tidrapport" }
      ]
    }
  };
}

case "create_daily_report": {
  const report = results as { id: string };
  return {
    type: "result",
    content: "",
    data: {
      success: true,
      resultMessage: "Dagrapport skapad!",
      link: {
        label: "Öppna rapport",
        href: `/reports/${report.id}`
      },
      nextActions: [
        { label: "Skapa till", icon: "plus", prompt: "Skapa en till dagrapport" },
        { label: "Visa projekt", icon: "folder", prompt: "Öppna projektet" }
      ]
    }
  };
}
```

### 4. Aktivera Next Actions i svaren

Uppdatera `formatToolResults` för att alltid returnera `nextActions`:

```typescript
// Lägg till nextActions i alla result-svar:
data: {
  success: true,
  resultMessage: "...",
  link: {...},
  nextActions: [  // NY!
    { label: "...", icon: "...", prompt: "..." },
    { label: "...", icon: "...", prompt: "..." }
  ]
}
```

### 5. Aktivera röstinput i ChatInput

Uppdatera `ChatInput.tsx` för att koppla mikrofon-knappen:

```typescript
// Lägg till i ChatInput.tsx:
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  
  const { 
    isRecording, 
    isTranscribing, 
    startRecording, 
    stopRecording,
    isSupported 
  } = useVoiceRecorder({
    onTranscriptComplete: (transcript) => {
      setInput(transcript);
    }
  });

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="...">
      {/* Mic button - nu aktiverad */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 shrink-0 rounded-full",
          isRecording && "text-red-500 animate-pulse"
        )}
        onClick={handleMicClick}
        disabled={!isSupported || disabled || isTranscribing}
      >
        <Mic className="h-5 w-5" />
      </Button>
    </div>
  );
}
```

### 6. Utöka QuickSuggestions

Lägg till fler snabbförslag:

```typescript
const suggestions = [
  { label: "Skapa offert", icon: FileText, prompt: "Jag vill skapa en ny offert" },
  { label: "Hitta projekt", icon: FolderKanban, prompt: "Visa mina aktiva projekt" },
  { label: "Sök kund", icon: Users, prompt: "Sök efter en kund" },
  { label: "Ny dagrapport", icon: ClipboardList, prompt: "Skapa en ny dagrapport" },
  // NYA:
  { label: "Registrera tid", icon: Clock, prompt: "Registrera tid på ett projekt" },
  { label: "Visa fakturor", icon: Receipt, prompt: "Visa mina kundfakturor" },
  { label: "Checka in", icon: MapPin, prompt: "Checka in på ett projekt" },
];
```

### 7. Uppdatera types

Utöka `ConversationContext` och `MessageData`:

```typescript
// types/global-assistant.ts

export interface ConversationContext {
  selectedCustomerId?: string;
  selectedProjectId?: string;
  selectedEstimateId?: string;
  selectedInvoiceId?: string;      // NY
  selectedInspectionId?: string;   // NY
  selectedTimeEntryId?: string;    // NY
  pendingAction?: string;
  pendingData?: Record<string, unknown>;
}

export interface MessageData {
  // Befintliga...
  
  // För verification - utöka entityType
  entityType?: 
    | "customer" 
    | "project" 
    | "estimate"
    | "invoice"          // NY
    | "inspection"       // NY
    | "daily_report"     // NY
    | "time_entry";      // NY
    
  // För next_actions (redan finns, men behöver användas mer)
  actions?: NextAction[];
}
```

### 8. Uppdatera systemprompt

Förbättra AI:ns instruktioner:

```typescript
const systemPrompt = `Du är en hjälpsam AI-assistent för ett byggföretag. Du hjälper användaren att hantera hela verksamheten.

FUNKTIONER DU KAN UTFÖRA:
- Kunder: Söka, skapa, redigera, ta bort
- Projekt: Söka, skapa, redigera, ta bort  
- Offerter: Söka, skapa, redigera, ta bort
- Tidsrapportering: Registrera tid, visa summeringar
- Dagrapporter: Skapa och söka rapporter
- Fakturor: Söka kund- och leverantörsfakturor, skapa kundfaktura
- Egenkontroller: Skapa och söka inspektioner
- Närvaro: Checka in/ut, visa aktiva på projekt

VIKTIGA REGLER:
1. Svara alltid på svenska
2. Var kortfattad och koncis
3. Vid skrivoperationer, verifiera alltid först (sök efter kunder/projekt)
4. Vid radering, varna alltid användaren och be om bekräftelse
5. Föreslå alltid nästa steg efter en slutförd åtgärd

KONTEXT:
${context?.selectedCustomerId ? `- Vald kund-ID: ${context.selectedCustomerId}` : ""}
${context?.selectedProjectId ? `- Valt projekt-ID: ${context.selectedProjectId}` : ""}
...
`;
```

## Filer att modifiera

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Lägg till 20+ nya verktyg + formatering |
| `src/components/global-assistant/ChatInput.tsx` | Aktivera röstinput |
| `src/components/global-assistant/QuickSuggestions.tsx` | Lägg till fler förslag |
| `src/types/global-assistant.ts` | Utöka typer |
| `src/pages/GlobalAssistant.tsx` | Hantera next_actions-svar |

## Arbetsordning

1. **Edge Function** - Utöka tool registry med alla nya verktyg
2. **Edge Function** - Implementera executeTool för varje verktyg
3. **Edge Function** - Utöka formatToolResults med next actions
4. **Frontend** - Aktivera röstinput i ChatInput
5. **Frontend** - Utöka QuickSuggestions
6. **Frontend** - Uppdatera types
7. **Frontend** - Säkerställ NextActionsCard visas

## Resultat

Efter implementationen kan Global Assistant:

- Registrera tid: "Registrera 8 timmar på projekt Badrum idag"
- Skapa dagrapport: "Skapa dagrapport för Villavägen - 3 snickare, rivning av väggar"
- Söka fakturor: "Visa obetalda kundfakturor"
- Skapa faktura: "Skapa faktura för projektet"
- Egenkontroller: "Skapa egenkontroll för el på projektet"
- Checka in: "Checka in mig på Lindströms projekt"
- Redigera: "Ändra telefonnummer på kund Anders till 070-123 45 67"
- Ta bort: "Ta bort offert OFF-2024-0123"
- Röstkommandon: Prata in meddelanden via mikrofon-knappen

Varje åtgärd avslutas med förslag på nästa steg för att guida användaren framåt.
