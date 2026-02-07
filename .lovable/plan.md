

## Mål

Fixa felet "duplicate key value violates unique constraint" när man försöker skapa en dagrapport för ett projekt som redan har en rapport för dagens datum. Istället för att krascha, ska systemet uppdatera den befintliga rapporten.

---

## Problemanalys

| Problem | Orsak |
|---------|-------|
| Felmeddelande: `duplicate key value violates unique constraint "daily_reports_project_id_report_date_key"` | Databasen förhindrar flera dagrapporter för samma projekt på samma dag |
| Kod (rad 2024): `report_date: new Date().toISOString().split('T')[0]` | Datumet sätts alltid till idag |
| Resultat | Om du redan skapat en dagrapport för projektet idag → krasch |

---

## Lösning: "Upsert" logik

Istället för att bara göra en `INSERT`, kontrollera först om det redan finns en rapport:

1. **Sök efter befintlig rapport** för samma projekt + datum
2. **Om den finns** → Uppdatera (`UPDATE`)
3. **Om den inte finns** → Skapa ny (`INSERT`)

---

## Ändringar i filen

### `supabase/functions/global-assistant/index.ts`

**Nuvarande logik (rad 2009-2030):**
```typescript
const { data, error } = await supabase
  .from("daily_reports")
  .insert({...})
  .select()
  .single();
  
if (error) throw error;
return data;
```

**Ny logik:**
```typescript
const reportDate = new Date().toISOString().split('T')[0];

// Kolla om det redan finns en rapport för detta projekt idag
const { data: existing } = await supabase
  .from("daily_reports")
  .select("id")
  .eq("project_id", project_id)
  .eq("report_date", reportDate)
  .eq("user_id", userId)
  .maybeSingle();

if (existing) {
  // Uppdatera befintlig rapport
  const { data, error } = await supabase
    .from("daily_reports")
    .update({
      work_items: finalWorkItems,
      headcount: finalHeadcount,
      // ... övriga fält
    })
    .eq("id", existing.id)
    .select()
    .single();
    
  if (error) throw error;
  return { ...data, updated: true };
} else {
  // Skapa ny rapport
  const { data, error } = await supabase
    .from("daily_reports")
    .insert({...})
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

### Uppdatera response-hantering (rad 3292-3300)

Lägg till information om att rapporten uppdaterades:

```typescript
case "create_daily_report": {
  const report = results as { id: string; updated?: boolean };
  const action = report.updated ? "uppdaterade" : "skapade";
  return {
    type: "text",
    content: `✅ Jag ${action} din dagrapport! Den innehåller...`,
    // ...
  };
}
```

---

## Sammanfattning

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `supabase/functions/global-assistant/index.ts` | Lägg till upsert-logik i `create_daily_report` (rad ~2009-2030) |
| 2 | `supabase/functions/global-assistant/index.ts` | Uppdatera response-meddelande för att visa om det var uppdatering eller ny (rad ~3292-3300) |

---

## Resultat

1. Användaren kan skapa dagrapporter utan att få felmeddelande
2. Om det redan finns en rapport för samma projekt och dag → den uppdateras
3. Tydligt meddelande om vad som hände: "Jag skapade..." eller "Jag uppdaterade..."
4. Ingen data går förlorad

