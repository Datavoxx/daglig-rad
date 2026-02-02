
## Plan: Gör om "Redo?"-texten till en modern knapp

### Ändring

Ersätt den glödande/pulserande texten med en riktig knapp som använder projektets Button-komponent. Texten ändras från "Redo?" till "Starta projekt".

---

### Teknisk implementation

**Fil: `src/components/estimates/EstimateHeader.tsx`**

1. **Importera Button-komponenten:**
```typescript
import { Button } from "@/components/ui/button";
```

2. **Ta bort ChevronRight-import** (behövs inte längre)

3. **Ersätt den gamla prompten (rad 84-92):**

```typescript
// FÖRE
{status === "draft" && onStatusChange && (
  <button
    onClick={handleBadgeClick}
    className="text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5 animate-pulse"
  >
    <span>Redo?</span>
    <ChevronRight className="h-3 w-3" />
  </button>
)}

// EFTER
{status === "draft" && onStatusChange && (
  <Button
    size="sm"
    variant="outline"
    onClick={handleBadgeClick}
    className="h-7 text-xs px-3"
  >
    Starta projekt
  </Button>
)}
```

---

### Visuell jämförelse

| Före | Efter |
|------|-------|
| `Redo? →` (glödande text) | `[ Starta projekt ]` (knapp med ram) |
| Animerad/pulserande | Statisk, modern |
| Svår att identifiera som klickbar | Tydligt en knapp |

---

### Fil som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/estimates/EstimateHeader.tsx` | Byt ut text-prompt mot Button-komponent |

