

## Plan: Fixa så att Spara-knappen alltid är synlig i StickyTotals

### Problemanalys
På desktop-vyn när offerten har stora belopp (t.ex. 461 438 kr) växer sifferområdet och trycker ut Spara-knappen utanför den synliga ytan. Detta beror på att:
1. Vänsterkolumnen med kostnadssummor (`Arb`, `Mat`, `UE`, etc.) kan växa obegränsat
2. Det finns ingen prioritering för att alltid visa knapparna

### Lösning
Ändra flex-layouten så att knapparna på höger sida alltid behålls synliga med `shrink-0`, medan vänsterkolumnen krymper vid behov.

---

### Teknisk ändring i `src/components/estimates/StickyTotals.tsx`

**Rad 110:** Lägg till `flex-shrink` och `overflow-hidden` på vänsterkolumnen:
```tsx
<div className="flex items-center gap-4 text-[13px] flex-shrink min-w-0 overflow-hidden">
```

**Rad 139:** Lägg till `flex-shrink-0` på högerkolumnen (knappar):
```tsx
<div className="flex items-center gap-3 flex-shrink-0">
```

---

### Visuell effekt

**Före (problem):**
```
┌────────────────────────────────────────────────────┐
│ Arb: 46 500  Mat: 274 500  UE: 0  Påsl: 48 150...  │
│ Moms: 92 288  │  461 438 kr  │  Ladda ner  [Spa... │ ← Knappen klipps
└────────────────────────────────────────────────────┘
```

**Efter (fix):**
```
┌────────────────────────────────────────────────────┐
│ Arb: 46 500  Mat: 274 500...  │  461 438 kr  │     │
│                               │  Ladda ner [Spara] │ ← Knappen alltid synlig
└────────────────────────────────────────────────────┘
```

---

### Sammanfattning

| Fil | Rad | Ändring |
|-----|-----|---------|
| `StickyTotals.tsx` | 110 | Lägg till `flex-shrink min-w-0 overflow-hidden` |
| `StickyTotals.tsx` | 139 | Lägg till `flex-shrink-0` |

Knapparna kommer alltid att vara synliga oavsett hur stora beloppen blir. Om utrymmet inte räcker döljs istället några av kostnadssummorna på vänster sida.

