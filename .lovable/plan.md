

## Skicka referensnamnet med i meddelandet

### Problem
Referensen (kund/projekt/offert) skickas korrekt som kontext-ID till backend, men **namnet** inkluderas inte i meddelandetexten. Det betyder att AI:n inte direkt ser vad användaren refererar till utan att behöva slå upp ID:t.

### Lösning
Uppdatera `sendMessage` i `GlobalAssistant.tsx` så att om det finns en aktiv referens, prefixas meddelandet med referensnamnet.

### Teknisk ändring

**Fil: `src/pages/GlobalAssistant.tsx`** (rad ~172-178)

Nuvarande:
```typescript
const effectiveContext = { ...context, ...refContext, ...contextOverride };

const userMessage: Message = {
  id: crypto.randomUUID(),
  role: "user",
  content,
  type: "text",
};
```

Ny version:
```typescript
const effectiveContext = { ...context, ...refContext, ...contextOverride };

// Prefix message with reference name so the AI sees it
let enrichedContent = content;
if (activeReference) {
  const typeLabel = activeReference.type === "customer" ? "Kund" 
    : activeReference.type === "project" ? "Projekt" 
    : "Offert";
  enrichedContent = `[${typeLabel}: ${activeReference.name}] ${content}`;
}

const userMessage: Message = {
  id: crypto.randomUUID(),
  role: "user",
  content: enrichedContent,
  type: "text",
};
```

Meddelandet som skickas till `global-assistant` (rad 195) använder redan `content`-variabeln, men vi behöver uppdatera den till `enrichedContent` också:

```typescript
body: {
  message: enrichedContent,
  history: messages.filter((m) => m.type !== "loading"),
  context: effectiveContext,
},
```

### Resultat
- Meddelandet till AI:n blir t.ex.: `[Projekt: Badrumsrenovering Strandvägen] visa ekonomi`
- AI:n ser direkt vilket projekt det gäller
- Referens-ID:t skickas fortfarande som kontext (`selectedProjectId` etc.)

### Filändringar

| Fil | Ändring |
|-----|---------|
| `src/pages/GlobalAssistant.tsx` | Prefixa meddelandet med referensnamn + skicka det till backend |

