

## Plan: Korta svar + fullhöjdschatt

### Problem identifierade

| Problem | Nuvarande | Lösning |
|---------|-----------|---------|
| Långa AI-svar | Prompten säger bara "koncis" | Lägga till strikt instruktion: max 2-3 meningar |
| Chatten täcker inte hela höjden | `h-[500px] max-h-[80vh]` | Ändra till `h-[calc(100vh-6rem)]` |

---

## Tekniska ändringar

### Fil 1: `supabase/functions/agent-chat/index.ts`

**Uppdatera Sagas system-prompt (rad 99-109):**

```typescript
// Lägg till i slutet av instruktionerna:
"VIKTIGT: Ge KORTA svar. Max 2-3 meningar. Gå direkt på sak utan onödiga förklaringar."
```

**Uppdatera Bos system-prompt (rad 178-188):**

```typescript
// Lägg till i slutet av instruktionerna:
"VIKTIGT: Ge KORTA svar. Max 2-3 meningar. Gå direkt på sak utan onödiga förklaringar."
```

---

### Fil 2: `src/components/shared/AgentChatBubble.tsx`

**Ändra chatt-panelens höjd (rad 241-242):**

```typescript
// FEL:
"fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh]",

// RÄTT:
"fixed top-4 bottom-4 right-4 z-50 w-80 sm:w-96",
```

Detta gör att chatten:
- Sträcker sig från 1rem (16px) från toppen till 1rem från botten
- Tar upp hela höger sida utan att scrolla

---

## Sammanfattning

| Fil | Ändring |
|-----|---------|
| `agent-chat/index.ts` | Lägg till "Max 2-3 meningar" i båda prompts |
| `AgentChatBubble.tsx` | Fullhöjd: `top-4 bottom-4 right-4` istället för `bottom-6 right-6 h-[500px]` |

