

## Problem

Felet `ReferenceError: context is not defined` inträffar när man försöker skapa en dagrapport via AI-assistenten.

### Rotorsak

| Plats | Problem |
|-------|---------|
| `executeTool` (rad 917-922) | Tar endast 4 parametrar: `supabase`, `userId`, `toolName`, `args` |
| `create_daily_report` (rad 1977) | Refererar till `context?.pendingData` |
| Anrop (rad 4146) | `executeTool(supabase, userId, toolName, toolArgs)` - **skickar inte context** |

Variabeln `context` är definierad i huvudfunktionen men skickas aldrig till `executeTool`.

---

## Lösning

### 1. Uppdatera `executeTool`-funktionens signatur

Lägg till `context` som en 5:e parameter:

```typescript
// Rad 917-922
async function executeTool(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  toolName: string,
  args: Record<string, unknown>,
  context?: Record<string, unknown>  // <-- NY PARAMETER
): Promise<unknown> {
```

### 2. Uppdatera alla anrop till `executeTool`

Skicka med `context` vid anropen:

**Rad 4146:**
```typescript
const toolResult = await executeTool(supabase, userId, toolName, toolArgs, context);
```

**Rad 3798 (create_estimate):**
```typescript
const result = await executeTool(supabase, userId, "create_estimate", {...}, context);
```

**Rad 3832 (add_estimate_items):**
```typescript
const result = await executeTool(supabase, userId, "add_estimate_items", {...}, context);
```

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Lägg till `context`-parameter till `executeTool` och uppdatera alla anrop |

---

## Teknisk sammanfattning

- `context` innehåller `pendingData` från formuläret
- Utan denna parameter kan backend inte läsa formulärdata
- Efter fix: dagrapporter kan skapas med full formulärdata

