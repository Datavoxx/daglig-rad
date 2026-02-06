
# Plan: Global Assistant - ChatGPT/Claude-liknande AI-assistent

## Sammanfattning

Skapa en ny sida `/global-assistant` med en fullständig AI-chattupplevelse inspirerad av ChatGPT och Claude. Assistenten följer "nivå 2"-orchestration från PDF:en med search → proposal → verify → execute → next actions.

## UI-design (baserat på screenshots)

### Huvudlayout
```text
┌─────────────────────────────────────────────────────────┐
│                      [App Header]                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│              "Vad kan jag hjälpa dig med?"              │
│                      [Användarnamn]                      │
│                                                          │
│   ┌──────────────────────────────────────────────────┐  │
│   │  + │ Fråga vad som helst...          🎤  [➤]    │  │
│   └──────────────────────────────────────────────────┘  │
│                                                          │
│           [Snabbförslag-knappar nedan]                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Efter konversation startat
```text
┌─────────────────────────────────────────────────────────┐
│  [Scroll-area med meddelanden]                          │
│                                                          │
│  Användare: "Skapa offert för badrum hos Anders"        │
│                                                          │
│  ┌─ Verifieringskort ─────────────────────────────────┐ │
│  │ Jag hittade 1 matchande kund:                      │ │
│  │ • Anders Karlsson, Göteborg                        │ │
│  │ • 070-123 45 67                                    │ │
│  │                                                     │ │
│  │ [✓ Detta är rätt] [🔍 Sök annan] [+ Skapa ny]     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│   ┌──────────────────────────────────────────────────┐  │
│   │  + │ Skriv ett meddelande...          🎤  [➤]    │  │
│   └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Filer att skapa

### 1. Ny sida: `src/pages/GlobalAssistant.tsx`
- Fullscreen chattvy (ingen sidebar-scroll, tar hela content-arean)
- Centrerad layout med max-width
- Välkomstmeddelande med användarens namn
- Snabbförslag-knappar för vanliga uppgifter
- Meddelandehistorik med scroll
- Fast input-fält längst ner

### 2. UI-komponenter: `src/components/global-assistant/`

**MessageList.tsx**
- Renderar konversationshistorik
- Stödjer olika meddelandetyper (text, proposal, verification, etc.)

**ChatInput.tsx**
- Centrerat inputfält med rounded corners
- Plus-ikon för bilagor (framtida)
- Mikrofon-ikon för röstinput (framtida)
- Skicka-knapp

**ProposalCard.tsx**
- Visar "Jag kommer att..." med detaljer
- Godkänn/Ändra/Avbryt-knappar
- Varningstext för osäkerheter

**VerificationCard.tsx**  
- Visar sökresultat (kunder, projekt, etc.)
- "Detta är rätt" / "Sök annan" / "Skapa ny"
- Stödjer 1-5 kandidater

**NextActionsCard.tsx**
- Max 3 relevanta åtgärder som knappar
- Ikoner för varje action-typ

**QuickSuggestions.tsx**
- Startförslag som knappar under inputfältet
- "Skapa offert", "Hitta projekt", "Ny dagrapport"

### 3. Edge Function: `supabase/functions/global-assistant/index.ts`
- Tar emot meddelande + konversationshistorik
- Router-logik för intent-detection
- Tool-registry för read/write operations
- Returnerar strukturerat svar (text, proposal, verification, next_actions)

### 4. Routing (uppdatera App.tsx)
- Lägg till `/global-assistant` som protected route

### 5. Navigation
- Lägg till "Assistent" i sidomenyn med Sparkles-ikon

## Teknisk implementation

### Meddelandeformat
```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "proposal" | "verification" | "next_actions" | "result";
  data?: {
    // För proposal
    action?: string;
    details?: string[];
    warnings?: string[];
    
    // För verification
    matches?: Array<{
      id: string;
      title: string;
      subtitle: string;
      metadata?: Record<string, string>;
    }>;
    
    // För next_actions
    actions?: Array<{
      label: string;
      icon: string;
      prompt: string;
    }>;
  };
}
```

### Tool Registry (fas 1 - MVP)
```typescript
// Read tools (kräver ingen verifiering)
search_customers(name, city?, email?)
search_projects(query)
search_estimates(query)
get_customer(id)
get_project(id)
get_estimate(id)

// Write tools (kräver alltid verifiering)
create_estimate(customer_id, title, address?)
create_project(customer_id, title, from_estimate_id?)
```

### Flödesexempel

**Användare:** "Skapa offert för badrum hos Anders i Göteborg"

**Systemet (internt):**
1. Parsear intent: `create_estimate`
2. Kör: `search_customers("Anders", "Göteborg")`
3. Hittar 1 träff

**Svar till användare:**
```json
{
  "type": "verification",
  "content": "Jag hittade 1 matchande kund. Verifiera att detta är rätt:",
  "data": {
    "matches": [{
      "id": "abc-123",
      "title": "Anders Karlsson",
      "subtitle": "Göteborg",
      "metadata": {
        "phone": "070-123 45 67",
        "email": "anders@gmail.com"
      }
    }]
  }
}
```

**Användare klickar "Detta är rätt"**

**Systemet:**
```json
{
  "type": "proposal",
  "content": "Jag kommer att:",
  "data": {
    "action": "Skapa en offert för badrumsrenovering",
    "details": [
      "Koppla till kund: Anders Karlsson",
      "Status: Utkast"
    ],
    "warnings": ["Materialval behöver specificeras"]
  }
}
```

## Arbetsordning

### Steg 1: Grundläggande UI
- Skapa sidan `GlobalAssistant.tsx`
- Implementera ChatInput, MessageList
- Lägg till routing och navigation

### Steg 2: Meddelandetyper
- ProposalCard, VerificationCard, NextActionsCard
- QuickSuggestions för startvy

### Steg 3: Backend (Edge Function)
- global-assistant edge function
- Intent-detection med AI
- Tool-registry för search operations

### Steg 4: Verifiering & Execution
- Hantera användarens bekräftelser
- Exekvera write-operations
- Returnera next_actions

## Design-detaljer

### Färger och stil
- Ren, minimalistisk design som Claude/ChatGPT
- Ljus bakgrund med subtila skuggor
- Rounded corners på kort och input
- Primary-färg för skicka-knapp och accenter
- Muted toner för placeholder och sekundär text

### Animationer
- Fade-in för nya meddelanden
- Subtle pulse på skicka-knapp
- Smooth scroll till nya meddelanden

### Responsivitet
- Full-width på mobil
- Max 800px bredd på desktop
- Centrerat innehåll

## Fördelar med denna approach

1. **Enkel att börja** - UI:n är ren och fokuserad
2. **Skalbar** - Tool-registry kan utökas stegvis
3. **Konsekvent** - Samma flöde för alla operationer
4. **Säker** - Alltid verifiering innan write-operations
5. **Guidande** - Next actions hjälper användaren framåt
