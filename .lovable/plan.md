

## Plan: Fixa chattbubbla - API-fel och flytta till höger hörnet

### Problem identifierade

| Problem | Orsak | Lösning |
|---------|-------|---------|
| 404-fel från AI API | Fel API URL i edge function | Ändra till rätt Lovable AI gateway |
| Bubblan i fel hörn | `left-6` istället för `right-6` | Uppdatera positionering |

---

## Tekniska ändringar

### Fil 1: `supabase/functions/agent-chat/index.ts`

**Ändra rad 233:**
```typescript
// FEL:
const response = await fetch("https://api.lovable.dev/v1/chat/completions", {

// RÄTT:
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
```

Detta är samma URL som används i `generate-estimate` och andra fungerande edge functions.

---

### Fil 2: `src/components/shared/AgentChatBubble.tsx`

**Flytta från vänster till höger hörnet:**

1. **Floating button (rad 221):**
```typescript
// FEL:
"fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full",

// RÄTT:
"fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full",
```

2. **Chat panel (rad 242):**
```typescript
// FEL:
"fixed bottom-6 left-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh]",

// RÄTT:
"fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh]",
```

3. **Animation riktning (rad 248):**
```typescript
// FEL (slide från vänster):
: "opacity-0 -translate-x-4 scale-95 pointer-events-none"

// RÄTT (slide från höger):
: "opacity-0 translate-x-4 scale-95 pointer-events-none"
```

---

## Sammanfattning

| Fil | Ändring |
|-----|---------|
| `supabase/functions/agent-chat/index.ts` | Fixa API URL: `api.lovable.dev` → `ai.gateway.lovable.dev` |
| `src/components/shared/AgentChatBubble.tsx` | Flytta position: `left-6` → `right-6`, justera animation |

Efter dessa ändringar kommer:
- Saga och Bo att svara korrekt på frågor
- Chattbubblan att visas i nedre högra hörnet
- Animationen att glida in från höger istället för vänster

