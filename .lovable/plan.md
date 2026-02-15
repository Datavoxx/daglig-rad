
## Fix: Budgetöversikt i assistenten visar 0 kr istället för korrekt data

### Problem
När du frågar assistenten om ekonomisk översikt för "tony-test" visar den Budget: 0 kr och Offert totalt: 0 kr, trots att projektvyn visar 461 438 kr.

**Rotorsak:** Offerten är kopplad till projektet via `projects.estimate_id` (projektet pekar på offerten), men edge-funktionen söker offerten via `project_estimates.project_id` (offerten pekar på projektet). I det här fallet är `project_estimates.project_id` tomt/null, så inget hittas.

Projektvyn fungerar korrekt eftersom den hämtar offerten via `projects.estimate_id` och skickar den som prop.

### Lösning

**Fil: `supabase/functions/global-assistant/index.ts`**

Uppdatera `get_project_economy` (och `get_project_overview`) så att offerthämtningen har en fallback:

1. Först försöka hämta via `project_estimates.project_id` (nuvarande logik)
2. Om det inte hittas, hämta via `projects.estimate_id` och sedan slå upp den offerten direkt via dess `id`

Samma fix appliceras på båda ställena (`get_project_economy` runt rad 1572 och `get_project_overview` runt rad 1647).

### Teknisk detalj

Nuvarande kod (rad 1572-1577):
```ts
const { data: estimate } = await supabase
  .from("project_estimates")
  .select("total_excl_vat, total_incl_vat, labor_cost, material_cost")
  .eq("project_id", project_id)
  .single();
```

Ny kod:
```ts
// Try by project_id first
let estimate = null;
const { data: estByProject } = await supabase
  .from("project_estimates")
  .select("total_excl_vat, total_incl_vat, labor_cost, material_cost")
  .eq("project_id", project_id)
  .single();

if (estByProject) {
  estimate = estByProject;
} else if (project?.estimate_id) {
  // Fallback: lookup via projects.estimate_id
  const { data: estById } = await supabase
    .from("project_estimates")
    .select("total_excl_vat, total_incl_vat, labor_cost, material_cost")
    .eq("id", project.estimate_id)
    .single();
  estimate = estById;
}
```

Dessutom behöver `projects`-queryn inkludera `estimate_id`:
```ts
.select("id, name, budget, estimate_id")
```

### Resultat
- Offertbeloppet (461 438 kr) visas korrekt i assistentens ekonomikort
- Arbete/material-uppdelningen visas korrekt
- ÄTA och timmar visas redan korrekt (5 500 kr resp. 7h)
- Samma fix säkerställer att `get_project_overview` också visar rätt data
