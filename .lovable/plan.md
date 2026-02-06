

# Plan: Förbättra Global Assistant UX

## Problem 1: Ingen knapp för ny chatt
Det finns ingen möjlighet att rensa konversationen och starta om. Användaren fastnar i samma chatthistorik.

## Problem 2: Ineffektiv projektlistning
När användaren säger "Visa mina aktiva projekt" och får en träff, visar assistenten ett verifikationskort som kräver att man trycker på det och bekräftar "Ja, det är Tony Test". Det är onödigt när man bara vill **se** sina projekt.

| Nuvarande flöde | Önskat flöde |
|-----------------|--------------|
| 1. "Visa aktiva projekt" | 1. "Visa aktiva projekt" |
| 2. Visar verifikationskort med "Välj projekt" | 2. Visar projektlista med detaljer direkt |
| 3. Användaren klickar på projekt | - |
| 4. "Ja, det är Tony Test" skickas | - |
| 5. AI bekräftar val | - |

## Lösning

### 1. Lägg till "Ny chatt"-knapp
Placera en knapp i headern (bredvid chattfältet) som rensar `messages` och `context`.

```text
┌─────────────────────────────────────┐
│  [Sparkles]  Global Assistant  [+]  │  <-- "+" knapp för ny chatt
├─────────────────────────────────────┤
│                                     │
│  Chattmeddelanden...                │
│                                     │
└─────────────────────────────────────┘
```

### 2. Ny meddelandetyp: "list" 
Skapa en ny meddelandetyp `list` som visar projekt/offerter/kunder i ett snyggt format utan att kräva interaktion.

**Logik i Edge Function:**
- Om användaren frågar "Visa X" (list intent) → returnera `type: "list"` med detaljerad info
- Om användaren behöver välja för att göra något (t.ex. skapa offert) → fortsätt med `type: "verification"`

## Teknisk implementation

### Fil 1: `src/types/global-assistant.ts`

Lägg till ny meddelandetyp:

```typescript
export interface Message {
  // ...
  type: "text" | "proposal" | "verification" | "next_actions" | "result" | "loading" | "list";
}

export interface MessageData {
  // ... befintliga fält
  
  // För list
  listItems?: ListItem[];
  listType?: "project" | "customer" | "estimate" | "invoice" | "inspection";
}

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusColor?: "green" | "yellow" | "blue" | "gray";
  details?: { label: string; value: string }[];
  link?: string;
}
```

### Fil 2: `src/components/global-assistant/ListCard.tsx` (NY FIL)

Ny komponent för att visa listor:

```typescript
// Visar projekt/offerter/etc i ett rent listformat
// Varje rad har:
// - Ikon baserat på listType
// - Titel + subtitle
// - Status-badge
// - Detaljer (adress, belopp, datum, etc.)
// - "Öppna"-länk
```

### Fil 3: `src/components/global-assistant/MessageList.tsx`

Lägg till rendering för `type === "list"`:

```typescript
{message.type === "list" && message.data && (
  <ListCard data={message.data} />
)}
```

### Fil 4: `src/pages/GlobalAssistant.tsx`

Lägg till:
1. `handleNewChat`-funktion som rensar state
2. Header med ny chatt-knapp

```typescript
const handleNewChat = () => {
  setMessages([]);
  setContext({});
};

// I JSX, lägg till header när hasMessages:
<div className="flex items-center justify-between border-b px-4 py-2">
  <h1>Global Assistant</h1>
  <Button variant="ghost" size="icon" onClick={handleNewChat}>
    <Plus className="h-4 w-4" />
  </Button>
</div>
```

### Fil 5: `supabase/functions/global-assistant/index.ts`

Uppdatera `formatToolResults` för `search_projects`:

```typescript
case "search_projects": {
  const projects = results as Array<{...}>;
  
  // Returnera som list istället för verification
  return {
    type: "list",
    content: `Här är dina ${status || ""} projekt:`,
    data: {
      listType: "project",
      listItems: projects.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.client_name || "Ingen kund",
        status: translateStatus(p.status),
        statusColor: getStatusColor(p.status),
        details: [
          { label: "Adress", value: p.address || "-" },
          { label: "Stad", value: p.city || "-" },
        ],
        link: `/projects/${p.id}`,
      })),
    },
  };
}
```

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/types/global-assistant.ts` | Lägg till `list` type och `ListItem` interface |
| `src/components/global-assistant/ListCard.tsx` | NY: Komponent för listvisning |
| `src/components/global-assistant/MessageList.tsx` | Rendera ListCard för `type === "list"` |
| `src/pages/GlobalAssistant.tsx` | Lägg till header med "Ny chatt"-knapp |
| `supabase/functions/global-assistant/index.ts` | Returnera `list` istället för `verification` vid sökningar |

## Resultat

| Före | Efter |
|------|-------|
| Ingen ny chatt-knapp | [+] knapp i header rensar chatten |
| "Visa aktiva projekt" → verifikationskort → klicka → bekräfta | "Visa aktiva projekt" → projektlista med detaljer |
| Kräver 3+ steg för att se info | Visar info direkt |

