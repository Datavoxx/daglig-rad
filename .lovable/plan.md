
## Skapa planeringsformulär och "Uppdatera projekt"-flöde i AI-assistenten

### Problem
1. **"Skapa planering"** visar bara rå text med instruktioner istället för ett snyggt formulär
2. **"Uppdatera projekt"** ställer bara en textfråga istället för att visa projektlista och kategoriväljare

### Lösning

#### Del 1: Planeringsformulär (PlanningFormCard)

**Ny fil: `src/components/global-assistant/PlanningFormCard.tsx`**
- Projektväljare (dropdown med aktiva projekt)
- Startdatum (datumfält)
- Faser: dynamisk lista där man lägger till faser med namn + antal veckor
- Knapp "Lägg till fas" och "Skapa planering"
- Röstinput via VoiceFormSection (samma mönster som WorkOrderFormCard)

**Backend: `supabase/functions/global-assistant/index.ts`**
- Ny tool: `get_projects_for_planning` (hämtar aktiva projekt, samma mönster som `get_projects_for_work_order`)
- Ny response-typ i `formatResponse`: returnerar `type: "planning_form"` med projektlista
- Uppdatera form_policy-prompten: `"skapa planering" -> get_projects_for_planning`

**Typ-uppdateringar: `src/types/global-assistant.ts`**
- Lägg till `"planning_form"` i Message type
- Lägg till `"update_project_form"` i Message type

**MessageList.tsx**
- Rendera `PlanningFormCard` när `message.type === "planning_form"`

**GlobalAssistant.tsx**
- `handlePlanningFormSubmit` - skickar meddelande med projektid, startdatum och faser till AI:n
- `handlePlanningFormCancel`

---

#### Del 2: Uppdatera projekt-flöde (UpdateProjectFormCard)

**Ny fil: `src/components/global-assistant/UpdateProjectFormCard.tsx`**
- **Steg 1**: Projektväljare (dropdown med alla aktiva projekt)
- **Steg 2** (visas efter val): Kategoriväljare med knappar/kort:
  - ÄTA
  - Arbetsorder
  - Filer och bilagor
  - Planering
  - Dagbok
- När man väljer kategori skickas ett meddelande till AI:n som triggar rätt flöde, t.ex. "Skapa arbetsorder på projekt med ID X"

**Backend: `supabase/functions/global-assistant/index.ts`**
- Ny tool: `get_projects_for_update` (hämtar aktiva projekt)
- Returnerar `type: "update_project_form"` med projektlista
- Uppdatera form_policy: `"uppdatera projekt" -> get_projects_for_update`

**MessageList.tsx**
- Rendera `UpdateProjectFormCard` när `message.type === "update_project_form"`

**GlobalAssistant.tsx**
- `handleUpdateProjectAction` - när användaren valt projekt + kategori, skicka rätt prompt med projekt-ID i context

---

### Teknisk sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/types/global-assistant.ts` | Lägg till `planning_form` och `update_project_form` typer |
| `src/components/global-assistant/PlanningFormCard.tsx` | Nytt formulärkort för planering |
| `src/components/global-assistant/UpdateProjectFormCard.tsx` | Nytt formulärkort med projekt + kategoriväljare |
| `src/components/global-assistant/MessageList.tsx` | Rendera de två nya korten |
| `src/pages/GlobalAssistant.tsx` | Handlers för submit/cancel |
| `supabase/functions/global-assistant/index.ts` | Två nya tools + formatResponse + prompt-uppdatering |
