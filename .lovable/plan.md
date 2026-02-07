
# Plan: Fixa så Byggio AI hittar projekt-ID från projektnamn

## Problem identifierat

Användaren skrev: **"hämta qr kod för projekt tony-test"**

AI:n anropade: `get_attendance_qr({ project_id: "tony-test" })`

Men "tony-test" är ett **projektnamn**, inte ett UUID. Databasen kräver UUID för `project_id`-kolumnen, vilket gav felet:
```
invalid input syntax for type uuid: "tony-test"
```

## Varför detta hände

1. **Kontexten var tom** - Inget projekt var valt i sessionen (`Context: {}`)
2. **AI:n antog att "tony-test" var ett ID** istället för att först söka efter projektet
3. **Systemprompt saknar instruktion** om att AI:n måste använda `search_projects` först för att lösa projektnamn till UUID

## Lösning

### Alternativ 1: Förbättra systemprompt (Rekommenderas)

Lägg till explicit instruktion i systemprompt som säger:
- Om användaren anger ett projektnamn (inte UUID), använd ALLTID `search_projects` först
- Ett UUID har formatet `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Allt annat är ett projektnamn som måste slås upp

**Systemprompt-tillägg:**
```text
VIKTIGT OM PROJEKT-ID OCH NAMN:
- Ett projekt-ID (UUID) har formatet: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- Om användaren anger något annat (t.ex. "tony-test", "Solvik", "Projekt 123") 
  är det ett PROJEKTNAMN, inte ett ID!
- Du MÅSTE använda search_projects för att hitta rätt projekt-ID först
- Använd sedan det hittade UUID:t för alla efterföljande operationer
```

### Alternativ 2: Backend-resolver (Mer robust)

Lägg till en hjälpfunktion i edge function som automatiskt löser projektnamn till UUID:

```typescript
async function resolveProjectId(supabase, input: string): Promise<string | null> {
  // Check if input is already a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(input)) {
    return input; // Already a valid UUID
  }
  
  // Search for project by name
  const { data } = await supabase
    .from("projects")
    .select("id")
    .ilike("name", `%${input}%`)
    .limit(1)
    .single();
    
  return data?.id || null;
}
```

Sedan i verktygsanropen:
```typescript
case "get_attendance_qr": {
  let { project_id } = args;
  
  // Resolve name to UUID if needed
  project_id = await resolveProjectId(supabase, project_id);
  if (!project_id) {
    return { error: "Projektet hittades inte" };
  }
  // ... continue with database query
}
```

## Rekommenderad implementation

Jag rekommenderar **både Alternativ 1 och 2** för maximal robusthet:

1. **Systemprompt** - Lär AI:n korrekt beteende
2. **Backend-resolver** - Fångar upp fall där AI:n ändå gör fel

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | 1. Utöka systemprompt med UUID vs namn-instruktioner |
| | 2. Lägg till `resolveProjectId` hjälpfunktion |
| | 3. Använd resolver i alla projekt-relaterade verktyg |

## Lista över verktyg som behöver resolver

Alla verktyg som tar `project_id` som parameter:
- `get_attendance_qr`
- `generate_attendance_qr`
- `create_work_order`
- `search_work_orders`
- `create_ata`
- `search_ata`
- `get_project_plan`
- `create_plan`
- `update_plan`
- `list_project_files`
- `check_in`
- `check_out`
- `get_active_attendance`
- `get_project_economy`
- `search_daily_reports`
- `create_daily_report`

## Förväntat resultat efter fix

| Före | Efter |
|------|-------|
| "hämta qr kod för projekt tony-test" → Krasch (invalid UUID) | "hämta qr kod för projekt tony-test" → Hittar projekt, visar QR-kod |
| AI:n antar att namn är UUID | AI:n söker först, använder sedan UUID |
| Context-beroende | Fungerar även utan context |
