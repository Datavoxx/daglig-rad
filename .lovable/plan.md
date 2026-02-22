

## Fix: Påslag ska vara 0 när ingen markering är gjord

### Problem
Beräkningslogiken i `useEstimate.ts` (rad 271) har en fallback som använder `state.markupPercent` (globalt påslagsvärde) när inga enskilda artiklar har påslag aktiverat. Gamla offerter sparades med databasens default på 15%, så även om MarkupPanel-toggeln är AV visas fortfarande påslag.

### Lösning
Ändra beräkningslogiken så att markup bara beräknas om:
- Antingen minst en artikel har `markup_enabled = true` (per-artikel-påslag), ELLER
- `state.markupPercent > 0` OCH det finns artiklar med `markup_enabled`

Den enklaste och tydligaste fixen: Om inga artiklar har `markup_enabled`, ska markup alltid vara 0.

### Teknisk ändring

**`src/hooks/useEstimate.ts`** (rad 262-271):

Nuvarande kod:
```typescript
const markupFromItems = state.items.reduce((sum, item) => {
  if (item.markup_enabled && item.markup_percent > 0) {
    return sum + ((item.subtotal || 0) * (item.markup_percent / 100));
  }
  return sum;
}, 0);

const markup = markupFromItems > 0 ? markupFromItems : subtotal * (state.markupPercent / 100);
```

Ny kod:
```typescript
const hasAnyMarkupEnabled = state.items.some(item => item.markup_enabled);

const markupFromItems = state.items.reduce((sum, item) => {
  if (item.markup_enabled && item.markup_percent > 0) {
    return sum + ((item.subtotal || 0) * (item.markup_percent / 100));
  }
  return sum;
}, 0);

const markup = hasAnyMarkupEnabled ? markupFromItems : 0;
```

Logiken: Om ingen artikel har `markup_enabled` (toggeln är av) -> påslag = 0. Om minst en artikel har `markup_enabled` -> summera deras individuella påslag.

Det globala `state.markupPercent`-fältet används inte längre som fallback, vilket matchar den nya designen där påslag styrs per artikel via MarkupPanel.

### Fil som ändras

| Fil | Ändring |
|-----|---------|
| `src/hooks/useEstimate.ts` | Rad 262-271: Ändra markup-beräkning till att kräva `markup_enabled` |
