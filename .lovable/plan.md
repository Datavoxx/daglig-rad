

# Plan: Interaktiv tidsregistreringsruta i Global Assistant

## Vad du vill

Istället för detta flöde:
```
Du: "Registrera tid"
AI: "Vilket projekt vill du registrera tid på?"
Du: "Mahads renovering"
AI: "Hur många timmar?"
Du: "8"
AI: "Klart!"
```

Ska det bli ett **formulärkort** direkt i chatten:
```
Du: "Registrera tid"
AI: [Visar en ruta med:]
    ┌────────────────────────────────────────┐
    │ 🕐 Registrera tid                      │
    │                                        │
    │ Projekt: [Dropdown med aktiva projekt] │
    │ Timmar:  [8      ]                     │
    │ Datum:   [2026-02-07]                  │
    │ Beskr:   [Arbete med...]               │
    │                                        │
    │ [Avbryt]              [Registrera tid] │
    └────────────────────────────────────────┘
```

## Design

Samma stil som de andra korten (ProposalCard, VerificationCard, ListCard), men med interaktiva formulärfält istället för bara knappar.

## Teknisk implementation

### Del 1: Ny meddelandetyp "time_form"

Lägg till i `src/types/global-assistant.ts`:

```typescript
export interface Message {
  // ...
  type: "text" | "proposal" | "verification" | "next_actions" | "result" | "loading" | "list" | "time_form";
  // ...
}

export interface MessageData {
  // ... befintliga fält ...
  
  // For time_form
  projects?: Array<{ id: string; name: string }>;
  defaultDate?: string;
}
```

### Del 2: Ny komponent - TimeFormCard

Skapa `src/components/global-assistant/TimeFormCard.tsx`:

- Dropdown för att välja projekt (hämtar aktiva projekt)
- Input för antal timmar (standard: 8)
- Datumväljare (standard: idag)
- Textfält för beskrivning (valfritt)
- Knappar: Avbryt och Registrera

När användaren klickar "Registrera" skickas ett automatiskt meddelande till chatten, t.ex:
`"Registrera 8 timmar på projekt [projekt-id] för 2026-02-07"`

### Del 3: Uppdatera MessageList

Lägg till rendering av TimeFormCard i `MessageList.tsx`:

```tsx
{message.type === "time_form" && message.data && (
  <TimeFormCard 
    data={message.data}
    onSubmit={onTimeFormSubmit}
    onCancel={onTimeFormCancel}
    disabled={isLoading}
  />
)}
```

### Del 4: Uppdatera GlobalAssistant.tsx

Lägg till handlers:

```typescript
const handleTimeFormSubmit = async (formData: {
  projectId: string;
  hours: number;
  date: string;
  description: string;
}) => {
  // Skicka direkt till register_time via en speciell prompt
  await sendMessage(
    `Registrera ${formData.hours} timmar på projektet med ID ${formData.projectId} för ${formData.date}${formData.description ? `. Beskrivning: ${formData.description}` : ""}`,
    { selectedProjectId: formData.projectId }
  );
};

const handleTimeFormCancel = async () => {
  await sendMessage("Avbryt tidsregistrering");
};
```

### Del 5: Uppdatera Edge Function

Ändra systempromten så att vid `register_time`-intent returneras `type: "time_form"` istället för att ställa frågor.

Ny verktyg `get_active_projects_for_time`:

```typescript
{
  type: "function",
  function: {
    name: "get_active_projects_for_time",
    description: "Get list of active projects for time registration form",
    parameters: { type: "object", properties: {}, required: [] }
  }
}
```

I `formatToolResults` för detta verktyg:

```typescript
case "get_active_projects_for_time": {
  const projects = results as Array<{ id: string; name: string }>;
  return {
    type: "time_form",
    content: "",
    data: {
      projects,
      defaultDate: new Date().toISOString().split('T')[0],
    },
  };
}
```

Uppdatera systempromten:
```
NÄR ANVÄNDAREN VILL REGISTRERA TID:
- Om användaren säger "registrera tid" utan specifikt projekt → anropa get_active_projects_for_time för att visa formuläret
- Om användaren anger projekt och timmar → anropa register_time direkt
```

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `src/types/global-assistant.ts` | ÄNDRA: Lägg till `time_form` typ och nya data-fält |
| `src/components/global-assistant/TimeFormCard.tsx` | SKAPA: Ny komponent med formulär |
| `src/components/global-assistant/MessageList.tsx` | ÄNDRA: Rendera TimeFormCard |
| `src/pages/GlobalAssistant.tsx` | ÄNDRA: Lägg till handlers för formuläret |
| `supabase/functions/global-assistant/index.ts` | ÄNDRA: Nytt verktyg + systemprompt |

## Resultat

| Före | Efter |
|------|-------|
| 3-4 meddelanden fram och tillbaka | 1 meddelande + klick i formulär |
| AI frågar "Vilket projekt?" | Formulär med dropdown direkt |
| Manuell inmatning | Datumväljare och förval |

