

# Plan: Fixa "Skapa projekt"-felet + Lägg till Bakåt/Refresh-knappar

## Problem 1: "Skapa projekt" kraschar appen

### Orsak
Felet är i `ProjectFormCard.tsx` på rad 96:

```tsx
<SelectItem value="">Ingen kund</SelectItem>
```

Radix UI:s Select-komponent tillåter **inte** en tom sträng som `value`. Felet från konsolen:
> "A Select.Item must have a value prop that is not an empty string."

### Lösning
Ändra `value=""` till `value="none"` och uppdatera logiken för att hantera detta:

**Fil:** `src/components/global-assistant/ProjectFormCard.tsx`

```tsx
// FÖRE (rad 96):
<SelectItem value="">Ingen kund</SelectItem>

// EFTER:
<SelectItem value="none">Ingen kund</SelectItem>
```

Och uppdatera `handleSubmit` för att konvertera "none" till tom sträng:

```tsx
// FÖRE (rad 43-50):
const handleSubmit = () => {
  if (!name.trim()) return;
  
  onSubmit({
    name: name.trim(),
    customerId,
    address: address.trim(),
  });
};

// EFTER:
const handleSubmit = () => {
  if (!name.trim()) return;
  
  onSubmit({
    name: name.trim(),
    customerId: customerId === "none" ? "" : customerId,
    address: address.trim(),
  });
};
```

---

## Problem 2: Saknas Bakåt-knapp i topp-vänster

### Nuvarande layout
Global Assistant-headern har för närvarande:
- **Vänster:** Historik-knapp + Sparkles-ikon + "Global Assistant"
- **Höger:** Ny chatt-knapp

### Lösning
Lägg till en **tillbaka-knapp** (ArrowLeft-ikon) längst till vänster som navigerar till föregående sida via `navigate(-1)`.

**Fil:** `src/pages/GlobalAssistant.tsx`

```tsx
// Lägg till import:
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

// I komponenten:
const navigate = useNavigate();

// I header-diven:
<Button
  variant="ghost"
  size="icon"
  onClick={() => navigate(-1)}
  className="h-8 w-8"
  title="Tillbaka"
>
  <ArrowLeft className="h-4 w-4" />
</Button>
```

---

## Problem 3: Saknas Refresh-knapp i topp-höger

### Lösning
Lägg till en **refresh-knapp** (RefreshCw-ikon) bredvid "Ny chatt"-knappen som laddar om sidan.

**Fil:** `src/pages/GlobalAssistant.tsx`

```tsx
// I header-diven, höger sida:
<Button
  variant="ghost"
  size="icon"
  onClick={() => window.location.reload()}
  className="h-8 w-8"
  title="Uppdatera"
>
  <RefreshCw className="h-4 w-4" />
</Button>
```

---

## Ny header-layout

```
┌────────────────────────────────────────────────────────────┐
│ [←] [Historik] ✨ Global Assistant      [Uppdatera] [+]   │
└────────────────────────────────────────────────────────────┘
```

| Position | Element | Funktion |
|----------|---------|----------|
| Vänster 1 | ← (ArrowLeft) | Navigera tillbaka |
| Vänster 2 | Historik-knapp | Öppna sidopanel |
| Vänster 3 | ✨ + text | Branding |
| Höger 1 | ↻ (RefreshCw) | Ladda om sidan |
| Höger 2 | + (Plus) | Ny chatt |

---

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/components/global-assistant/ProjectFormCard.tsx` | Fixa SelectItem value="" → "none" |
| `src/pages/GlobalAssistant.tsx` | Lägg till Bakåt + Refresh knappar |

---

## Teknisk sammanfattning

1. **Bug fix:** SelectItem med tom sträng orsakar krasch - ändra till "none" och hantera i submit
2. **UX förbättring:** Lägg till navigeringsknapp (tillbaka) och refresh-knapp i headern

