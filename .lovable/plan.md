

## Fix: Visa planeringformuläret FÖRST vid "Skapa planering"

### Problem
När man klickar "Planering" under "Uppdatera projekt" skickas idag ett textmeddelande direkt till AI:n som skapar en planering med 0 faser. Formuläret (med projekt, startdatum och faser) visas bara om man sedan klickar "Lägg till fas". Man ska inte kunna skapa en planering utan faser.

### Lösning

**Fil: `src/pages/GlobalAssistant.tsx`** (rad 471-473)

Ändra `planning`-grenen i `handleUpdateProjectAction` så att den visar `PlanningFormCard` direkt (samma mönster som ATA och filer) istället för att skicka ett textmeddelande:

```typescript
if (category === "planning") {
  const projects = (messages.find(m => m.type === "update_project_form")?.data?.projects as Array<{id: string; name: string; address?: string}>) || [];
  const planningFormMessage: Message = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    type: "planning_form",
    data: { projects, preselectedProjectId: projectId },
  };
  setMessages(prev => [...prev, planningFormMessage]);
  return;
}
```

Formuläret (`PlanningFormCard`) har redan fält för projekt, startdatum och faser. Vid submit anropas `handlePlanningFormSubmit` som skickar faserna till AI:n. Planeringen skapas alltså bara med faser ifyllda.

### Teknisk sammanfattning

| Ändring | Fil |
|---------|-----|
| Visa formulär istället för att skicka textprompt | `src/pages/GlobalAssistant.tsx` (rad 471-473) |

En ändring, tre rader. PlanningFormCard och MessageList hanterar redan rendering och submit korrekt.
