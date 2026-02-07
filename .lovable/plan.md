

# Plan: Fixa automatisk projekt-kontext i Byggio AI

## Problemanalys

Byggio AI frågar om projekt-ID även när ett projekt redan är valt i konversationen. Detta beror på tre saker:

### 1. Systemprompt saknar tydliga instruktioner
Kontexten skrivs ut i systemprompt men AI:n får ingen explicit instruktion att **använda den automatiskt**.

### 2. Tool-anrop ignorerar context
När AI:n anropar verktyg som `create_work_order` eller `get_project_economy` måste den ha `project_id`. Men även om context innehåller `selectedProjectId` så används det inte automatiskt.

### 3. Historik saknar strukturerad info
Bara `msg.content` (texten) skickas - inte metadata om vilket projekt som diskuterats.

## Teknisk lösning

### Ändring 1: Förtydliga systemprompt

Lägg till explicit instruktion:

```text
VIKTIGAST - AUTOMATISK KONTEXT:
Om ett projekt-ID finns i KONTEXT-sektionen nedan, ANVÄND DET AUTOMATISKT 
för alla projektrelaterade operationer utan att fråga användaren.

Om en kund-ID finns i KONTEXT, ANVÄND DET för kundrelaterade operationer.

FRÅGA ALDRIG om projekt-ID eller kund-ID om det redan finns i kontexten!
```

### Ändring 2: Auto-inject project_id i tool-anrop

När AI:n anropar ett verktyg som behöver `project_id` men inte anger det, fyll i det automatiskt från context:

```typescript
// Innan: toolArgs kommer direkt från AI:n
const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

// Efter: Fyll i saknade IDs från context
const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

// Auto-inject project_id om det saknas men finns i context
if (!toolArgs.project_id && context?.selectedProjectId && 
    PROJECT_TOOLS.includes(toolName)) {
  toolArgs.project_id = context.selectedProjectId;
}

// Auto-inject customer_id om det saknas men finns i context  
if (!toolArgs.customer_id && context?.selectedCustomerId &&
    CUSTOMER_TOOLS.includes(toolName)) {
  toolArgs.customer_id = context.selectedCustomerId;
}
```

### Ändring 3: Förbättra historik-meddelanden

Inkludera projektnamn/kundnamn i historiken så AI:n "ser" kontexten:

```typescript
for (const msg of history) {
  if (msg.role === "user" || msg.role === "assistant") {
    let content = msg.content || "";
    
    // Lägg till kontext-info från tidigare meddelanden
    if (msg.data?.project_name) {
      content += ` [Projekt: ${msg.data.project_name}]`;
    }
    if (msg.data?.customer_name) {
      content += ` [Kund: ${msg.data.customer_name}]`;
    }
    
    conversationMessages.push({ role: msg.role, content });
  }
}
```

## Fil att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | 1. Förtydliga systemprompt med auto-kontext instruktioner |
| | 2. Auto-inject project_id/customer_id i tool-anrop |
| | 3. Berika historik-meddelanden med kontext-info |

## Lista över verktyg som behöver auto-inject

**Projekt-relaterade (project_id):**
- create_work_order
- search_work_orders  
- create_ata
- search_ata
- get_project_plan
- create_plan
- update_plan
- list_project_files
- generate_attendance_qr
- get_attendance_qr
- check_in
- check_out
- get_active_attendance
- get_project_economy
- search_daily_reports
- search_inspections
- create_inspection

**Kund-relaterade (customer_id):**
- create_estimate
- create_project

## Resultat

| Före | Efter |
|------|-------|
| "Visa ekonomin" → "Vilket projekt vill du se ekonomin för?" | "Visa ekonomin" → Visar automatiskt för valt projekt |
| "Skapa arbetsorder" → "Ange projekt-ID" | "Skapa arbetsorder" → Skapar på aktuellt projekt |
| AI "glömmer" projektet mellan meddelanden | AI minns och använder valt projekt automatiskt |

