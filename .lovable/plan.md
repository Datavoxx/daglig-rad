
# Plan: Fixa offert deep-linking från Global Assistant

## Problem

När Global Assistant genererar en länk till en offert använder den `/estimates?id=...` men Estimates.tsx letar efter `?estimateId=...` eller `?offerNumber=...`. Detta gör att offerten inte öppnas automatiskt.

| Genererad URL | Förväntad URL |
|---------------|---------------|
| `/estimates?id=e284148f-...` | `/estimates?estimateId=e284148f-...` |

## Lösning

Uppdatera båda ställen för robusthet:

### 1. Edge Function - Ändra query param

Ändra alla `href: /estimates?id=${...}` till `href: /estimates?estimateId=${...}` i `supabase/functions/global-assistant/index.ts`.

```typescript
// FÖRE:
href: `/estimates?id=${estimate.id}`,

// EFTER:
href: `/estimates?estimateId=${estimate.id}`,
```

Detta gäller på minst 3 ställen i filen:
- `search_estimates` formatering (rad ~1266)
- `get_estimate` formatering (rad ~1546)
- `update_estimate` formatering (rad ~1626)

### 2. Estimates.tsx - Stöd även "id" för bakåtkompatibilitet

Uppdatera deep-linking logiken för att även kolla `id` query param:

```typescript
// FÖRE (rad 105):
const estimateIdFromUrl = searchParams.get("estimateId");

// EFTER:
const estimateIdFromUrl = searchParams.get("estimateId") || searchParams.get("id");
```

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `supabase/functions/global-assistant/index.ts` | Ändra `?id=` till `?estimateId=` i alla offertlänkar |
| `src/pages/Estimates.tsx` | Lägg till fallback för `?id=` query param |

## Resultat

| Före | Efter |
|------|-------|
| "Öppna offert" → visar listan | "Öppna offert" → öppnar offerten direkt |
