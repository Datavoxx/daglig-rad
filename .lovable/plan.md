

## Plan: Lägg till spara-knapp i header (alltid synlig)

### Översikt
Lägga till en grön spara-knapp i headersektionen bredvid de befintliga knapparna (tillbaka, förhandsgranska, radera) så att användaren alltid har enkel åtkomst till sparfunktionen oavsett var de scrollat. Den befintliga spara-knappen i StickyTotals längst ner behålls.

---

### Ändring i `src/components/estimates/EstimateBuilder.tsx`

**1. Lägg till import för `Save` och `Loader2` ikoner (rad 12):**
```tsx
import { Eye, EyeOff, FileText, Trash2, ClipboardList, ListChecks, ArrowLeft, Maximize2, Mic, Save, Loader2 } from "lucide-react";
```

**2. Lägg till spara-knapp i header-sektionen (rad 265-300):**

Placera en grön spara-knapp mellan förhandsgranskning-knappen och papperskorgen:

```tsx
<div className="flex items-center gap-2 shrink-0">
  {onBack && (
    <Button variant="ghost" size="sm" onClick={onBack} ...>
      <ArrowLeft ... />
    </Button>
  )}
  {!isMobile && (
    <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} ...>
      {showPreview ? <EyeOff ... /> : <Eye ... />}
    </Button>
  )}
  
  {/* NY: Alltid synlig spara-knapp */}
  <Button
    size="sm"
    onClick={handleSaveAsCompleted}
    disabled={estimate.isSaving}
    className="h-8"
  >
    {estimate.isSaving ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Save className="h-4 w-4" />
    )}
  </Button>

  {estimate.hasExistingEstimate && (
    <Button variant="ghost" size="sm" onClick={() => setDeleteDialogOpen(true)} ...>
      <Trash2 ... />
    </Button>
  )}
</div>
```

---

### Visuell förändring

**Före:**
```
┌─────────────────────────────────────────────────────┐
│ OFFERT                     DRAFT | OFF-DRAFT       │
│ Fasadmålning...                   v1 • datum       │
│                                         [←] [👁] [🗑] │
└─────────────────────────────────────────────────────┘
```

**Efter:**
```
┌─────────────────────────────────────────────────────┐
│ OFFERT                     DRAFT | OFF-DRAFT       │
│ Fasadmålning...                   v1 • datum       │
│                                    [←] [👁] [💾] [🗑] │
└─────────────────────────────────────────────────────┘
```

---

### Teknisk sammanfattning

| Fil | Ändring |
|-----|---------|
| `EstimateBuilder.tsx` rad 12 | Lägg till `Save, Loader2` i lucide-imports |
| `EstimateBuilder.tsx` rad 289-299 | Lägg till ny spara-knapp före papperskorgen |

---

### Resultat

- **Header:** Grön spara-knapp alltid synlig längst upp till höger
- **StickyTotals:** Befintlig spara-knapp med dropdown-meny behålls längst ner
- Användaren kan snabbt spara från båda ställena

